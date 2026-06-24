const db = require('../config/db');

// 1. Lấy danh sách phiếu lương trong tháng/năm
const getReports = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu tháng hoặc năm' });
    }

    const [rows] = await db.query(
      `SELECT bl.*, nv.HoTen, nv.ChucVu, nv.LoaiNhanVien 
       FROM bangluong bl
       JOIN nhanvien nv ON bl.MaNhanVien = nv.MaNhanVien
       WHERE bl.Thang = ? AND bl.Nam = ?`,
      [parseInt(month), parseInt(year)]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy báo cáo lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy báo cáo lương' });
  }
};

// 2. Tính toán lương dựa trên bảng công tháng đã được Manager duyệt (submitted_to_admin)
const calculatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu tháng hoặc năm' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // Lấy tất cả bảng công tháng (bỏ điều kiện TrangThai để tính trực tiếp và loại bỏ Admin)
    const [timesheets] = await db.query(
      `SELECT bc.*, nv.HoTen, nv.ChucVu, nv.LoaiNhanVien, tk.MaVaiTro
       FROM bangcong_thang bc
       JOIN nhanvien nv ON bc.MaNhanVien = nv.MaNhanVien
       LEFT JOIN taikhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
       WHERE bc.Thang = ? AND bc.Nam = ? AND (tk.MaVaiTro IS NULL OR tk.MaVaiTro != 1) AND bc.TrangThai = 'submitted_to_admin'`,
      [m, y]
    );

    if (timesheets.length === 0) {
      return res.json({ 
        success: true, 
        message: `Không tìm thấy bảng công nào để tính lương cho tháng ${m}/${y}.`, 
        data: [] 
      });
    }

    const calculatedList = [];

    for (const bc of timesheets) {
      let baseSalary = 0;
      let khauTru = 0;
      let netSalary = 0;
      const totalShifts = parseFloat(bc.SoCong || 0);

      if (bc.LoaiNhanVien === 'Part-time') {
        // Nhân viên Part-time: 30.000 VNĐ / giờ
        const totalHours = parseFloat(bc.SoGioLam || 0);
        netSalary = totalHours * 30000;
        khauTru = 0;
      } else {
        // Nhân viên Full-time hoặc Quản lý
        // Vai trò: 1 = Admin (15 triệu), 2 = Quản lý (10 triệu), 3 = Nhân viên (6 triệu)
        if (bc.MaVaiTro === 1) {
          baseSalary = 15000000;
        } else if (bc.MaVaiTro === 2) {
          baseSalary = 10000000;
        } else {
          baseSalary = 6000000;
        }

        const daysWorked = parseFloat(bc.SoCong || 0);
        const totalHours = parseFloat(bc.SoGioLam || 0);

        let overtimeHours = totalHours - (daysWorked * 8);
        if (overtimeHours < 0) overtimeHours = 0;
        overtimeHours = Math.round(overtimeHours * 10) / 10;

        const dailyRate = baseSalary / 26;
        const actualWorkPay = Math.round(dailyRate * daysWorked);
        const otRate = (baseSalary / 26 / 8) * 1.5;
        const otPay = Math.round(otRate * overtimeHours);

        const lunchAllowance = daysWorked * 35000;
        const bonusChuyenCan = daysWorked >= 24 ? 500000 : 200000;
        const bhxh = Math.round(baseSalary * 0.08);

        const totalIncome = actualWorkPay + otPay + lunchAllowance + bonusChuyenCan;
        const totalDeductions = bhxh + (totalIncome > 11000000 ? Math.round((totalIncome - 11000000) * 0.05) : 0);
        
        netSalary = totalIncome - totalDeductions;
        khauTru = totalDeductions;
      }

      if (netSalary < 0) netSalary = 0;

      // Tròn số tiền lương
      netSalary = Math.round(netSalary);
      khauTru = Math.round(khauTru);

      // Kiểm tra xem đã tồn tại phiếu lương trong bảng lương chưa
      const [existing] = await db.query(
        'SELECT MaBangLuong FROM bangluong WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
        [bc.MaNhanVien, m, y]
      );

      if (existing.length > 0) {
        const maBangLuong = existing[0].MaBangLuong;
        await db.query(
          `UPDATE bangluong 
           SET TongCaLam = ?, Thuong = 0, KhauTru = ?, TongLuong = ?, TrangThai = 'draft' 
           WHERE MaBangLuong = ?`,
          [totalShifts, khauTru, netSalary, maBangLuong]
        );
        calculatedList.push({
          MaBangLuong: maBangLuong,
          MaNhanVien: bc.MaNhanVien,
          HoTen: bc.HoTen,
          ChucVu: bc.ChucVu,
          LoaiNhanVien: bc.LoaiNhanVien,
          TongCaLam: totalShifts,
          TongLuong: netSalary,
          KhauTru: khauTru
        });
      } else {
        // Lấy MaBangLuong tự tăng tiếp theo
        const [maxIdRes] = await db.query('SELECT COALESCE(MAX(MaBangLuong), 0) + 1 AS nextId FROM bangluong');
        const nextMaBangLuong = maxIdRes[0].nextId;

        await db.query(
          `INSERT INTO bangluong (MaBangLuong, MaNhanVien, Thang, Nam, TongCaLam, Thuong, KhauTru, TongLuong, TrangThai, NgayTao)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'draft', NOW())`,
          [nextMaBangLuong, bc.MaNhanVien, m, y, totalShifts, khauTru, netSalary]
        );
        calculatedList.push({
          MaBangLuong: nextMaBangLuong,
          MaNhanVien: bc.MaNhanVien,
          HoTen: bc.HoTen,
          ChucVu: bc.ChucVu,
          LoaiNhanVien: bc.LoaiNhanVien,
          TongCaLam: totalShifts,
          TongLuong: netSalary,
          KhauTru: khauTru
        });
      }
    }

    res.json({ success: true, message: 'Tính toán lương thành công!', data: calculatedList });
  } catch (error) {
    console.error('Lỗi tính lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tính lương nhân sự' });
  }
};

// 3. Xem bảng lương cá nhân (giữ nguyên gốc)
const getPayslip = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // format: "YYYY-MM"
    
    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên hoặc tháng' });
    }

    const [yearStr, monthStr] = month.split('-');
    const m = parseInt(monthStr);
    const y = parseInt(yearStr);

    const [user] = await db.query('SELECT t.*, v.TenVaiTro FROM taikhoan t LEFT JOIN vaitro v ON t.MaVaiTro = v.MaVaiTro WHERE t.MaTaiKhoan = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }
    const roleId = user[0].MaVaiTro;
    const roleName = user[0].TenVaiTro || 'Nhân viên';

    // Lấy thông tin nhân viên để phân giải MaNhanVien chính xác và lấy LoaiNhanVien
    const [empRes] = await db.query('SELECT MaNhanVien, LoaiNhanVien FROM nhanvien WHERE MaTaiKhoan = ?', [employeeId]);
    if (empRes.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin nhân viên' });
    }
    const realMaNhanVien = empRes[0].MaNhanVien;
    const loaiNV = empRes[0].LoaiNhanVien || 'Full-time';

    // 1. Kiểm tra xem đã có bản ghi bảng lương đã duyệt của admin chưa
    const [existing] = await db.query(
      'SELECT * FROM bangluong WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
      [realMaNhanVien, m, y]
    );

    if (existing.length === 0 || existing[0].TrangThai !== 'approved') {
      return res.json({ 
        success: false, 
        message: `Phiếu lương Tháng ${m}/${y} chưa được Admin duyệt và chốt.` 
      });
    }

    const payrollRecord = existing[0];

    // 2. Lấy thông tin chi tiết công thực tế từ bangcong_thang để hiển thị chi tiết phụ lục
    const [timesheetRes] = await db.query(
      'SELECT * FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
      [realMaNhanVien, m, y]
    );

    let daysWorked = payrollRecord.TongCaLam || 0;
    let totalHours = 0;
    
    if (timesheetRes.length > 0) {
      daysWorked = timesheetRes[0].SoCong || payrollRecord.TongCaLam;
      totalHours = timesheetRes[0].SoGioLam || 0;
    }

    // 3. Khớp toán tử tính toán để hiển thị các chi tiết khớp 100% với database

    let actualWorkPay = 0;
    let otPay = 0;
    let lunchAllowance = 0;
    let bonusChuyenCan = 0;
    let bhxh = 0;
    let totalIncome = 0;
    let totalDeductions = payrollRecord.KhauTru || 0;
    let netSalary = payrollRecord.TongLuong || 0;

    if (loaiNV === 'Part-time') {
      actualWorkPay = Math.round(totalHours * 30000);
      totalIncome = actualWorkPay;
    } else {
      let baseSalary = 6000000;
      if (roleId === 1) baseSalary = 15000000;
      else if (roleId === 2) baseSalary = 10000000;
      
      const dailyRate = baseSalary / 26;
      actualWorkPay = Math.round(dailyRate * daysWorked);
      
      let overtimeHours = totalHours - (daysWorked * 8);
      if (overtimeHours < 0) overtimeHours = 0;
      overtimeHours = Math.round(overtimeHours * 10) / 10;
      const otRate = (baseSalary / 26 / 8) * 1.5;
      otPay = Math.round(otRate * overtimeHours);

      lunchAllowance = daysWorked * 35000;
      bonusChuyenCan = daysWorked >= 24 ? 500000 : 200000;
      bhxh = Math.round(baseSalary * 0.08);

      totalIncome = actualWorkPay + otPay + lunchAllowance + bonusChuyenCan;
    }

    res.json({
      success: true,
      data: {
        roleName,
        daysWorked,
        overtimeHours: (totalHours - (daysWorked * 8) > 0) ? Math.round((totalHours - (daysWorked * 8)) * 10) / 10 : 0,
        actualWorkPay,
        otPay,
        lunchAllowance,
        bonusChuyenCan,
        bhxh,
        totalIncome,
        totalDeductions,
        netSalary
      }
    });
  } catch (error) {
    console.error('Lỗi tính lương cá nhân:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy bảng lương cá nhân' });
  }
};

// 4. Admin chốt và duyệt lương tháng để gửi về cho nhân viên
const approvePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu tháng hoặc năm' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // 1. Kiểm tra xem đã tính lương chưa
    const [existing] = await db.query(
      'SELECT MaBangLuong FROM bangluong WHERE Thang = ? AND Nam = ?',
      [m, y]
    );

    if (existing.length === 0) {
      return res.status(400).json({ success: false, message: 'Chưa có dữ liệu tính lương tháng này. Vui lòng bấm Tính Lương trước.' });
    }

    // 2. Cập nhật TrangThai thành 'approved' cho tất cả phiếu lương trong tháng
    await db.query(
      "UPDATE bangluong SET TrangThai = 'approved' WHERE Thang = ? AND Nam = ?",
      [m, y]
    );

    // 3. Tạo thông báo gửi cho nhân viên nhận được phiếu lương
    await db.query(
      `INSERT INTO thongbao (TieuDe, NoiDung, Loai)
       VALUES (?, ?, ?)`,
      [
        'Có phiếu lương mới',
        `Admin đã duyệt và chốt phiếu lương Tháng ${m}/${y}. Vui lòng vào kiểm tra!`,
        'info'
      ]
    );

    res.json({ success: true, message: 'Đã duyệt và gửi phiếu lương cho toàn bộ nhân viên thành công!' });
  } catch (error) {
    console.error('Lỗi duyệt lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt lương nhân sự' });
  }
};

module.exports = {
  getReports,
  calculatePayroll,
  getPayslip,
  approvePayroll
};

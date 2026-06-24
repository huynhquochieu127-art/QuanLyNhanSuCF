const db = require('../config/db');

// 1. Lấy hoặc tự động tạo bảng công tháng cho nhân sự
const getTimesheets = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu tháng hoặc năm' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    if (employeeId) {
      // Lấy bảng công của 1 nhân viên cụ thể
      const [rows] = await db.query(
        `SELECT bc.*, nv.HoTen, nv.LoaiNhanVien, nv.ChucVu 
         FROM bangcong_thang bc
         JOIN nhanvien nv ON bc.MaNhanVien = nv.MaNhanVien
         WHERE bc.MaNhanVien = ? AND bc.Thang = ? AND bc.Nam = ?`,
        [parseInt(employeeId), m, y]
      );
      
      if (rows.length > 0) {
        return res.json({ success: true, data: rows[0] });
      } else {
        // Tự tạo bản nháp cho nhân viên này nếu chưa có
        const generated = await autoGenerateTimesheet(parseInt(employeeId), m, y);
        return res.json({ success: true, data: generated });
      }
    }

    // Manager lấy toàn bộ nhân sự đang làm việc
    const [employees] = await db.query(
      "SELECT MaNhanVien, HoTen, LoaiNhanVien, ChucVu FROM nhanvien WHERE TrangThai = N'Đang làm việc'"
    );

    const timesheets = [];
    for (const emp of employees) {
      const [bcRow] = await db.query(
        "SELECT * FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?",
        [emp.MaNhanVien, m, y]
      );

      if (bcRow.length > 0) {
        timesheets.push({
          ...bcRow[0],
          HoTen: emp.HoTen,
          LoaiNhanVien: emp.LoaiNhanVien,
          ChucVu: emp.ChucVu
        });
      } else {
        try {
          // Tự động tạo bản nháp (draft) từ dữ liệu chấm công thực tế
          const generated = await autoGenerateTimesheet(emp.MaNhanVien, m, y);
          timesheets.push({
            ...generated,
            HoTen: emp.HoTen,
            LoaiNhanVien: emp.LoaiNhanVien,
            ChucVu: emp.ChucVu
          });
        } catch (e) {
          // Nếu có lỗi do trùng lặp (Unique Key) hoặc lỗi đồng thời, SELECT lại bảng ghi vừa được luồng khác tạo
          const [retryRow] = await db.query(
            "SELECT * FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?",
            [emp.MaNhanVien, m, y]
          );
          if (retryRow.length > 0) {
            timesheets.push({
              ...retryRow[0],
              HoTen: emp.HoTen,
              LoaiNhanVien: emp.LoaiNhanVien,
              ChucVu: emp.ChucVu
            });
          }
        }
      }
    }

    res.json({ success: true, data: timesheets });
  } catch (error) {
    console.error('Lỗi lấy bảng công tháng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Hàm tự động tính toán và tạo bản nháp bảng công từ chamcong và don_xin_nghi
async function autoGenerateTimesheet(maNhanVien, month, year) {
  // 1. Tính tổng số giờ làm và số ngày làm thực tế từ bảng chamcong
  const [attRes] = await db.query(
    `SELECT SUM(SoGioLam) as totalHours, COUNT(DISTINCT NgayLam) as daysWorked 
     FROM chamcong 
     WHERE MaNhanVien = ? AND MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? AND GioCheckOut IS NOT NULL`,
    [maNhanVien, month, year]
  );
  
  const totalHours = parseFloat(attRes[0].totalHours || 0);
  const daysWorked = parseFloat(attRes[0].daysWorked || 0);

  // 2. Tính số ngày nghỉ từ bảng don_xin_nghi
  let leaves = 0;
  try {
    const [leaveRes] = await db.query(
      `SELECT COUNT(*) as leaves 
       FROM don_xin_nghi 
       WHERE MaNhanVien = ? AND MONTH(NgayNghi) = ? AND YEAR(NgayNghi) = ? AND TrangThai = 'approved'`,
      [maNhanVien, month, year]
    );
    leaves = parseInt(leaveRes[0].leaves || 0, 10);
  } catch (e) { leaves = 0; }

  // 3. Tính số ngày đi trễ
  let lateDays = 0;
  try {
    const [lateRes] = await db.query(
      `SELECT COUNT(*) as lateDays 
       FROM chamcong 
       WHERE MaNhanVien = ? AND MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? AND DiTre > 0`,
      [maNhanVien, month, year]
    );
    lateDays = parseInt(lateRes[0].lateDays || 0, 10);
  } catch (e) { lateDays = 0; }

  // INSERT - MaBangCong là identity tự tăng, NgayTao có default GETDATE()
  await db.query(
    `INSERT INTO bangcong_thang 
     (MaNhanVien, Thang, Nam, SoCong, SoGioLam, SoNgayNghi, SoNgayTre, GhiChuQL, PhanHoiNV, TrangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, '', '', 'draft')`,
    [maNhanVien, month, year, daysWorked, totalHours, leaves, lateDays]
  );

  // Lấy ID vừa tạo
  const [idRes] = await db.query(
    'SELECT MAX(MaBangCong) as newId FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
    [maNhanVien, month, year]
  );
  const newId = idRes[0].newId;

  return {
    MaBangCong: newId,
    MaNhanVien: maNhanVien,
    Thang: month,
    Nam: year,
    SoCong: daysWorked,
    SoGioLam: totalHours,
    SoNgayNghi: leaves,
    SoNgayTre: lateDays,
    GhiChuQL: '',
    PhanHoiNV: '',
    TrangThai: 'draft'
  };
}

// 1b. Manager cập nhật thủ công số liệu bảng công
const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { SoCong, SoGioLam, SoNgayNghi, SoNgayTre, GhiChuQL } = req.body;
    
    // Lấy thông tin tháng, năm và nhân viên của bảng công này
    const [bcRows] = await db.query(
      'SELECT MaNhanVien, Thang, Nam FROM bangcong_thang WHERE MaBangCong = ?',
      [id]
    );
    
    if (bcRows.length > 0) {
      const { MaNhanVien, Thang, Nam } = bcRows[0];
      // Kiểm tra xem bảng lương đã được duyệt (chốt) chưa
      const [blRows] = await db.query(
        "SELECT * FROM bangluong WHERE MaNhanVien = ? AND Thang = ? AND Nam = ? AND TrangThai = 'approved'",
        [MaNhanVien, Thang, Nam]
      );
      if (blRows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bảng công đã được chốt và duyệt lương, không thể chỉnh sửa!' 
        });
      }
    }

    await db.query(
      `UPDATE bangcong_thang SET SoCong=?, SoGioLam=?, SoNgayNghi=?, SoNgayTre=?, GhiChuQL=? WHERE MaBangCong=?`,
      [SoCong, SoGioLam, SoNgayNghi, SoNgayTre, GhiChuQL || '', id]
    );
    res.json({ success: true, message: 'Cập nhật bảng công thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật bảng công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Manager gửi bảng công cho nhân viên kiểm tra
const sendToEmployee = async (req, res) => {
  try {
    const { maBangCong, ghiChu } = req.body;
    if (!maBangCong) {
      return res.status(400).json({ success: false, message: 'Thiếu mã bảng công' });
    }

    await db.query(
      "UPDATE bangcong_thang SET TrangThai = 'sent_to_emp', GhiChuQL = ?, NgayGui = NOW() WHERE MaBangCong = ?",
      [ghiChu || '', maBangCong]
    );

    // Gửi thông báo cho nhân viên
    const [bcRows] = await db.query(
      'SELECT bc.MaNhanVien, bc.Thang, bc.Nam FROM bangcong_thang bc WHERE bc.MaBangCong = ?',
      [maBangCong]
    );
    if (bcRows.length > 0) {
      const { Thang, Nam, MaNhanVien } = bcRows[0];
      await db.query(
        "INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro, NgayTao) VALUES (?, ?, 'info', ?, NULL, NOW())",
        ['Bảng công tháng cần xác nhận', `Quản lý đã gửi bảng công Tháng ${Thang}/${Nam} cho bạn kiểm tra.`, MaNhanVien]
      );
    }

    res.json({ success: true, message: 'Đã gửi bảng công cho nhân viên kiểm tra.' });
  } catch (error) {
    console.error('Lỗi gửi bảng công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. Nhân viên phản hồi (Xác nhận hoặc Ý kiến)
const employeeReply = async (req, res) => {
  try {
    const { maBangCong, phanHoi, isAgree } = req.body;
    if (!maBangCong) {
      return res.status(400).json({ success: false, message: 'Thiếu mã bảng công' });
    }

    const nextStatus = isAgree ? 'emp_replied' : 'emp_replied'; // Đều chuyển trạng thái để quản lý biết đã phản hồi
    await db.query(
      "UPDATE bangcong_thang SET TrangThai = ?, PhanHoiNV = ? WHERE MaBangCong = ?",
      [nextStatus, phanHoi || 'Đồng ý', maBangCong]
    );

    res.json({ success: true, message: 'Đã gửi phản hồi thành công.' });
  } catch (error) {
    console.error('Lỗi phản hồi bảng công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 4. Quản lý duyệt và gửi cho Admin để tính lương
const submitToAdmin = async (req, res) => {
  try {
    const { maBangCong } = req.body;
    if (!maBangCong) {
      return res.status(400).json({ success: false, message: 'Thiếu mã bảng công' });
    }

    await db.query(
      "UPDATE bangcong_thang SET TrangThai = 'submitted_to_admin', NgayXacNhan = NOW() WHERE MaBangCong = ?",
      [maBangCong]
    );

    res.json({ success: true, message: 'Đã duyệt và gửi bảng công cho Admin tính lương.' });
  } catch (error) {
    console.error('Lỗi gửi admin:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getTimesheets,
  updateTimesheet,
  sendToEmployee,
  employeeReply,
  submitToAdmin
};

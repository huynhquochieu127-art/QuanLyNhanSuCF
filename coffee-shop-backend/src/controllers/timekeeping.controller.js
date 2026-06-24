const db = require('../config/db');

// Lấy lịch sử chấm công của nhân viên
const getAttendanceHistory = async (req, res) => {
  try {
    // Nếu có query param employeeId thì lấy của người đó, không thì lấy tất cả
    const { employeeId } = req.query;
    let query = `
      SELECT c.*, t.HoTen as EmployeeName 
      FROM chamcong c 
      LEFT JOIN taikhoan t ON c.MaNhanVien = t.MaTaiKhoan 
      ORDER BY c.NgayLam DESC, c.GioCheckIn DESC
    `;
    let params = [];

    if (employeeId) {
      query = `
        SELECT c.*, t.HoTen as EmployeeName 
        FROM chamcong c 
        LEFT JOIN taikhoan t ON c.MaNhanVien = t.MaTaiKhoan 
        WHERE c.MaNhanVien = ? 
        ORDER BY c.NgayLam DESC, c.GioCheckIn DESC
      `;
      params = [employeeId];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy lịch sử chấm công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Check-in
const checkIn = async (req, res) => {
  try {
    const { MaNhanVien } = req.body;
    if (!MaNhanVien) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Kiểm tra xem hôm nay đã check-in chưa
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [MaNhanVien, today]);
    
    if (check.length > 0) {
      return res.status(400).json({ success: false, message: 'Bạn đã check-in hôm nay rồi' });
    }

    const now = new Date();
    const query = `
      INSERT INTO chamcong (MaNhanVien, NgayLam, GioCheckIn, TrangThai)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [MaNhanVien, today, now, 'IN']);

    res.status(201).json({ success: true, message: 'Check-in thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi check-in:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Check-out
const checkOut = async (req, res) => {
  try {
    const { MaNhanVien } = req.body;
    if (!MaNhanVien) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Kiểm tra xem hôm nay đã check-in chưa
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [MaNhanVien, today]);
    
    if (check.length === 0) {
      return res.status(400).json({ success: false, message: 'Bạn chưa check-in hôm nay' });
    }

    if (check[0].GioCheckOut) {
      return res.status(400).json({ success: false, message: 'Bạn đã check-out hôm nay rồi' });
    }

    const now = new Date();
    const checkInTime = new Date(check[0].GioCheckIn);
    
    // Tính số giờ làm (đơn giản)
    const diffMs = now - checkInTime;
    const soGioLam = (diffMs / (1000 * 60 * 60)).toFixed(2);

    const query = `
      UPDATE chamcong 
      SET GioCheckOut = ?, SoGioLam = ?, TrangThai = ?
      WHERE MaChamCong = ?
    `;
    await db.query(query, [now, soGioLam, 'OUT', check[0].MaChamCong]);

    res.json({ success: true, message: 'Check-out thành công', data: { soGioLam } });
  } catch (error) {
    console.error('Lỗi check-out:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy trạng thái điểm danh hôm nay
const getTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });

    const today = new Date().toISOString().split('T')[0];
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [employeeId, today]);

    if (check.length === 0) {
      return res.json({ success: true, data: { isCheckedIn: false, checkInTime: null, totalHours: 0 } });
    }

    const isCheckedIn = !check[0].GioCheckOut;
    const checkInTime = new Date(check[0].GioCheckIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const totalHours = check[0].SoGioLam || 0;

    res.json({ success: true, data: { isCheckedIn, checkInTime, totalHours } });
  } catch (error) {
    console.error('Lỗi lấy trạng thái hôm nay:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy danh sách yêu cầu bổ sung
const getRequests = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = `
      SELECT r.*, t.HoTen as EmployeeName 
      FROM yeucau_chamcong r 
      LEFT JOIN taikhoan t ON r.MaNhanVien = t.MaTaiKhoan 
      ORDER BY r.NgayTao DESC
    `;
    let params = [];

    if (employeeId) {
      query = `
        SELECT r.*, t.HoTen as EmployeeName 
        FROM yeucau_chamcong r 
        LEFT JOIN taikhoan t ON r.MaNhanVien = t.MaTaiKhoan 
        WHERE r.MaNhanVien = ? 
        ORDER BY r.NgayTao DESC
      `;
      params = [employeeId];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Gửi yêu cầu bổ sung điểm danh
const submitRequest = async (req, res) => {
  try {
    const { MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo } = req.body;
    if (!MaNhanVien || !Ngay || !Loai) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const query = `
      INSERT INTO yeucau_chamcong (MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(query, [MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo]);

    // Lấy tên nhân viên để hiển thị trong thông báo
    const [empRows] = await db.query('SELECT HoTen FROM nhanvien WHERE MaNhanVien = ?', [MaNhanVien]);
    const empName = empRows[0]?.HoTen || 'Nhân viên';

    const cleanDate = new Date(Ngay).toLocaleDateString('vi-VN');

    // Phân loại thông báo người nhận
    const typeLower = Loai.toLowerCase();
    if (typeLower.includes('full-time') || typeLower.includes('fulltime') || typeLower.includes('chuyển full')) {
      // Chỉ gửi cho Admin (MaVaiTro = 1)
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 1)',
        [
          'Yêu cầu chuyển Full-time',
          `Nhân viên ${empName} đã nộp đơn xin đổi sang chế độ Full-time kể từ ngày ${cleanDate}.`,
          'request'
        ]
      );
    } else {
      // Gửi cho cả Quản lý (MaVaiTro = 2) và Admin (MaVaiTro = 1)
      const title = `Yêu cầu mới: ${Loai}`;
      const content = `Nhân viên ${empName} đã gửi đơn ${Loai.toLowerCase()} cho ngày ${cleanDate}${CaLam ? ` (Ca: ${CaLam})` : ''}.`;
      
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 1)',
        [title, content, 'request']
      );
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 2)',
        [title, content, 'request']
      );
    }

    res.status(201).json({ success: true, message: 'Gửi yêu cầu thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi gửi yêu cầu bổ sung:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái yêu cầu (Duyệt / Từ chối)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // Lấy thông tin chi tiết yêu cầu
    const [reqRows] = await db.query('SELECT * FROM yeucau_chamcong WHERE MaYeuCau = ?', [id]);
    if (reqRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }
    const request = reqRows[0];

    // Cập nhật trạng thái yêu cầu
    const query = 'UPDATE yeucau_chamcong SET TrangThai = ? WHERE MaYeuCau = ?';
    await db.query(query, [status, id]);

    // Gửi thông báo phản hồi về cho nhân viên tạo đơn
    const cleanDate = new Date(request.Ngay).toLocaleDateString('vi-VN');
    const resultText = status === 'approved' ? 'ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
    const notifyTitle = `Kết quả duyệt yêu cầu: ${request.Loai}`;
    const notifyContent = `Yêu cầu "${request.Loai}" ngày ${cleanDate} của bạn đã ${resultText.toLowerCase()}.`;
    
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, ?, NULL)',
      [notifyTitle, notifyContent, 'approval', request.MaNhanVien]
    );

    // Xử lý tự động khi đơn được duyệt (approved)
    if (status === 'approved') {
      const typeLower = request.Loai.toLowerCase();
      
      // 1. Chuyển sang Full-time
      if (typeLower.includes('full-time') || typeLower.includes('fulltime') || typeLower.includes('chuyển full')) {
        await db.query(
          "UPDATE nhanvien SET LoaiNhanVien = N'Full-time' WHERE MaNhanVien = ?",
          [request.MaNhanVien]
        );
      }
      
      // 2. Xin nghỉ việc luôn
      else if (typeLower.includes('nghỉ việc') || typeLower.includes('nghỉ luôn') || typeLower.includes('thôi việc')) {
        await db.query(
          "UPDATE nhanvien SET TrangThai = N'Đã nghỉ việc' WHERE MaNhanVien = ?",
          [request.MaNhanVien]
        );
        await db.query(
          "UPDATE taikhoan SET TrangThaiHoatDong = 0 WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM nhanvien WHERE MaNhanVien = ?)",
          [request.MaNhanVien]
        );
      }
      
      // 3. Bổ sung điểm danh
      else if (typeLower.includes('bổ sung') || typeLower.includes('điểm danh') || typeLower.includes('công')) {
        let checkInTime = null;
        let checkOutTime = null;
        let hours = 8.0;
        
        const dateStr = new Date(request.Ngay).toISOString().split('T')[0];
        const timeParts = request.ThoiGian ? request.ThoiGian.split('-') : [];
        
        if (timeParts.length === 2) {
          const inStr = timeParts[0].trim();
          const outStr = timeParts[1].trim();
          checkInTime = `${dateStr} ${inStr}:00`;
          checkOutTime = `${dateStr} ${outStr}:00`;
          
          const [inH, inM] = inStr.split(':').map(Number);
          const [outH, outM] = outStr.split(':').map(Number);
          if (!isNaN(inH) && !isNaN(outH)) {
            hours = outH - inH + (outM - inM) / 60;
            if (hours < 0) hours += 24;
          }
        } else if (timeParts.length === 1 && timeParts[0].trim()) {
          const timeStr = timeParts[0].trim();
          if (typeLower.includes('in') || typeLower.includes('vào')) {
            checkInTime = `${dateStr} ${timeStr}:00`;
            checkOutTime = null;
            hours = null;
          } else {
            checkInTime = null;
            checkOutTime = `${dateStr} ${timeStr}:00`;
            hours = null;
          }
        } else {
          checkInTime = `${dateStr} 08:00:00`;
          checkOutTime = `${dateStr} 17:00:00`;
          hours = 8.0;
        }

        // Định danh mã ca làm tương đối dựa theo tên ca làm trong đơn
        let maCaLam = 1;
        const caLamLower = request.CaLam ? request.CaLam.toLowerCase() : '';
        if (caLamLower.includes('sáng')) maCaLam = 2;
        else if (caLamLower.includes('chiều')) maCaLam = 3;
        else if (caLamLower.includes('tối')) maCaLam = 4;
        
        // Kiểm tra xem đã có bản ghi chấm công cho ngày này của nhân viên chưa
        const [existingAttendance] = await db.query(
          'SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?',
          [request.MaNhanVien, dateStr]
        );
        
        if (existingAttendance.length > 0) {
          // Cập nhật bản ghi chấm công đã tồn tại
          await db.query(
            `UPDATE chamcong 
             SET GioCheckIn = COALESCE(?, GioCheckIn), 
                 GioCheckOut = COALESCE(?, GioCheckOut), 
                 SoGioLam = COALESCE(?, SoGioLam), 
                 TrangThai = 'OUT',
                 GhiChu = N'Bổ sung điểm danh' 
             WHERE MaNhanVien = ? AND NgayLam = ?`,
            [checkInTime, checkOutTime, hours, request.MaNhanVien, dateStr]
          );
        } else {
          // Thêm mới bản ghi chấm công
          await db.query(
            `INSERT INTO chamcong (MaNhanVien, MaCaLam, NgayLam, GioCheckIn, GioCheckOut, SoGioLam, TrangThai, GhiChu) 
             VALUES (?, ?, ?, ?, ?, ?, 'OUT', N'Bổ sung điểm danh')`,
            [request.MaNhanVien, maCaLam, dateStr, checkInTime, checkOutTime, hours]
          );
        }
      }
    }

    res.json({ success: true, message: 'Đã cập nhật trạng thái yêu cầu' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getAttendanceHistory,
  checkIn,
  checkOut,
  getTodayStatus,
  submitRequest,
  getRequests,
  updateRequestStatus
};

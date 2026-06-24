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

    const query = 'UPDATE yeucau_chamcong SET TrangThai = ? WHERE MaYeuCau = ?';
    await db.query(query, [status, id]);

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

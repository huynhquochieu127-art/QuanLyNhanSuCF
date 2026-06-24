const db = require('../config/db');

// Helper function to format time values to HH:mm
const formatTime = (timeVal) => {
  if (!timeVal) return '';
  if (timeVal instanceof Date) {
    const hours = String(timeVal.getUTCHours()).padStart(2, '0');
    const minutes = String(timeVal.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (typeof timeVal === 'string') {
    if (timeVal.includes('T')) {
      const timePart = timeVal.split('T')[1];
      const [h, m] = timePart.split(':');
      return `${h}:${m}`;
    }
    const parts = timeVal.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
  }
  return timeVal;
};

// ============================================================
// CA LÀM (calam) - CRUD
// ============================================================

const getShifts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM calam ORDER BY GioBatDau ASC');
    const formatted = rows.map(r => ({
      ...r,
      GioBatDau: formatTime(r.GioBatDau),
      GioKetThuc: formatTime(r.GioKetThuc)
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ca làm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const createShift = async (req, res) => {
  try {
    const { TenCaLam, GioBatDau, GioKetThuc, MoTa } = req.body;
    if (!TenCaLam || !GioBatDau || !GioKetThuc) {
      return res.status(400).json({ success: false, message: 'Tên ca, giờ bắt đầu và giờ kết thúc là bắt buộc' });
    }
    const [result] = await db.query(
      'INSERT INTO calam (TenCaLam, GioBatDau, GioKetThuc, MoTa) VALUES (?, ?, ?, ?)',
      [TenCaLam, GioBatDau, GioKetThuc, MoTa || null]
    );
    res.status(201).json({
      success: true,
      message: 'Tạo ca làm thành công',
      data: {
        MaCaLam: result.insertId,
        TenCaLam,
        GioBatDau: formatTime(GioBatDau),
        GioKetThuc: formatTime(GioKetThuc),
        MoTa
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo ca làm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenCaLam, GioBatDau, GioKetThuc, MoTa } = req.body;
    const [check] = await db.query('SELECT * FROM calam WHERE MaCaLam = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ca làm' });
    }
    await db.query(
      'UPDATE calam SET TenCaLam = ?, GioBatDau = ?, GioKetThuc = ?, MoTa = ? WHERE MaCaLam = ?',
      [TenCaLam || check[0].TenCaLam, GioBatDau || check[0].GioBatDau, GioKetThuc || check[0].GioKetThuc, MoTa || check[0].MoTa, id]
    );
    res.json({ success: true, message: 'Cập nhật ca làm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.query('SELECT * FROM calam WHERE MaCaLam = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ca làm' });
    }
    await db.query('DELETE FROM phancanhanvien WHERE MaCaLam = ?', [id]);
    await db.query('DELETE FROM calam WHERE MaCaLam = ?', [id]);
    res.json({ success: true, message: 'Xóa ca làm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================================
// PHÂN CA (phancanhanvien) - Quản lý phân ca cho nhân viên
// ============================================================

const getSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT p.*, n.HoTen, n.MaNhanVienCode, n.LoaiNhanVien, c.TenCaLam, c.GioBatDau, c.GioKetThuc 
      FROM phancanhanvien p
      JOIN nhanvien n ON p.MaNhanVien = n.MaNhanVien
      JOIN calam c ON p.MaCaLam = c.MaCaLam
    `;
    const params = [];
    if (startDate && endDate) {
      query += ' WHERE p.NgayLam >= ? AND p.NgayLam <= ?';
      params.push(startDate, endDate);
    }
    query += ' ORDER BY p.NgayLam ASC, c.GioBatDau ASC';
    const [rows] = await db.query(query, params);
    const formatted = rows.map(r => ({
      ...r,
      GioBatDau: formatTime(r.GioBatDau),
      GioKetThuc: formatTime(r.GioKetThuc)
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const assignShift = async (req, res) => {
  try {
    const { MaNhanVien, MaCaLam, NgayLam, GhiChu } = req.body;
    if (!MaNhanVien || !MaCaLam || !NgayLam) {
      return res.status(400).json({ success: false, message: 'Mã nhân viên, mã ca làm và ngày làm là bắt buộc' });
    }
    const [check] = await db.query(
      'SELECT * FROM phancanhanvien WHERE MaNhanVien = ? AND MaCaLam = ? AND NgayLam = ?',
      [MaNhanVien, MaCaLam, NgayLam]
    );
    if (check.length > 0) {
      return res.status(400).json({ success: false, message: 'Nhân viên này đã được phân vào ca này trong ngày hôm nay' });
    }
    const [result] = await db.query(
      'INSERT INTO phancanhanvien (MaNhanVien, MaCaLam, NgayLam, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)',
      [MaNhanVien, MaCaLam, NgayLam, 'Chưa làm', GhiChu || '']
    );
    res.status(201).json({
      success: true,
      message: 'Phân ca thành công',
      data: { MaPhanCa: result.insertId, MaNhanVien, MaCaLam, NgayLam }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM phancanhanvien WHERE MaPhanCa = ?', [id]);
    res.json({ success: true, message: 'Xóa phân ca thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================================
// ĐĂNG KÝ CA (dangky_ca) - Nhân viên tự đăng ký
// ============================================================

// Lấy danh sách đăng ký ca (theo tuần hoặc tất cả)
const getShiftRegistrations = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    let query = `
      SELECT d.*, n.HoTen, n.MaNhanVienCode, n.LoaiNhanVien,
             c.TenCaLam, c.GioBatDau, c.GioKetThuc
      FROM dangky_ca d
      JOIN nhanvien n ON d.MaNhanVien = n.MaNhanVien
      JOIN calam c ON d.MaCaLam = c.MaCaLam
      WHERE 1=1
    `;
    const params = [];
    if (startDate && endDate) {
      query += ' AND d.NgayLam >= ? AND d.NgayLam <= ?';
      params.push(startDate, endDate);
    }
    if (employeeId) {
      query += ' AND d.MaNhanVien = ?';
      params.push(employeeId);
    }
    query += ' ORDER BY d.NgayLam ASC, c.GioBatDau ASC';
    const [rows] = await db.query(query, params);
    const formatted = rows.map(r => ({
      ...r,
      GioBatDau: formatTime(r.GioBatDau),
      GioKetThuc: formatTime(r.GioKetThuc)
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Lỗi lấy đăng ký ca:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Nhân viên đăng ký ca
const registerShift = async (req, res) => {
  try {
    const { MaNhanVien, MaCaLam, NgayLam, GhiChu } = req.body;
    if (!MaNhanVien || !MaCaLam || !NgayLam) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra đã đăng ký chưa
    const [existing] = await db.query(
      'SELECT * FROM dangky_ca WHERE MaNhanVien = ? AND MaCaLam = ? AND NgayLam = ?',
      [MaNhanVien, MaCaLam, NgayLam]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Bạn đã đăng ký ca này rồi' });
    }

    const [result] = await db.query(
      'INSERT INTO dangky_ca (MaNhanVien, MaCaLam, NgayLam, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)',
      [MaNhanVien, MaCaLam, NgayLam, 'pending', GhiChu || '']
    );

    // Gửi thông báo đến cho Quản lý (MaVaiTro = 2)
    try {
      const [empRows] = await db.query('SELECT HoTen FROM nhanvien WHERE MaNhanVien = ?', [MaNhanVien]);
      const empName = empRows[0]?.HoTen || 'Nhân viên';
      const [caRows] = await db.query('SELECT TenCaLam FROM calam WHERE MaCaLam = ?', [MaCaLam]);
      const caName = caRows[0]?.TenCaLam || '';
      const formattedDate = new Date(NgayLam).toLocaleDateString('vi-VN');

      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaVaiTro) VALUES (?, ?, ?, 2)',
        ['Yêu cầu đăng ký ca mới', `${empName} đã đăng ký ca làm mới: ${caName} ngày ${formattedDate}.`, 'info']
      );
    } catch (errNotif) {
      console.error('Lỗi tạo thông báo đăng ký ca:', errNotif.message);
    }

    res.status(201).json({ success: true, message: 'Đăng ký ca thành công, chờ quản lý xác nhận', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi đăng ký ca:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Nhân viên hủy đăng ký ca (chỉ khi pending)
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.query('SELECT * FROM dangky_ca WHERE MaDangKy = ?', [id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });

    if (check[0].TrangThai !== 'pending') {
      // Tính toán ngày thứ Hai đầu tuần của ngày làm việc
      const dateVal = new Date(check[0].NgayLam);
      const day = dateVal.getDay();
      const diff = dateVal.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateVal.setDate(diff));
      const weekStr = monday.toISOString().split('T')[0];

      // Lấy trạng thái của tuần đó
      const [weekStatusRows] = await db.query('SELECT TrangThai FROM trangthai_tuan WHERE MaTuan = ?', [weekStr]);
      const weekStatus = weekStatusRows[0]?.TrangThai;

      if (weekStatus !== 'reopened') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể hủy đăng ký đang chờ duyệt hoặc khi tuần được mở lại đăng ký'
        });
      }
    }

    await db.query('DELETE FROM dangky_ca WHERE MaDangKy = ?', [id]);
    res.json({ success: true, message: 'Đã hủy đăng ký ca' });
  } catch (error) {
    console.error('Lỗi hủy đăng ký ca:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Quản lý duyệt/từ chối đăng ký ca
const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body.status || req.body.TrangThai; // Accept both status and TrangThai keys
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ: ' + status });
    }

    // Lấy thông tin đăng ký để tạo thông báo trước khi update hoặc sau
    const [regRows] = await db.query(
      `SELECT r.MaNhanVien, r.NgayLam, c.TenCaLam 
       FROM dangky_ca r
       JOIN calam c ON r.MaCaLam = c.MaCaLam
       WHERE r.MaDangKy = ?`,
      [id]
    );

    await db.query('UPDATE dangky_ca SET TrangThai = ? WHERE MaDangKy = ?', [status, id]);

    // Tạo thông báo cho nhân viên
    if (regRows.length > 0) {
      try {
        const reg = regRows[0];
        const formattedDate = new Date(reg.NgayLam).toLocaleDateString('vi-VN');
        const statusText = status === 'approved' ? 'duyệt' : 'từ chối';
        const type = status === 'approved' ? 'success' : 'warning';

        await db.query(
          'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan) VALUES (?, ?, ?, ?)',
          [
            'Kết quả duyệt đăng ký ca',
            `Đăng ký ca làm ${reg.TenCaLam} ngày ${formattedDate} của bạn đã được Quản lý ${statusText}.`,
            type,
            reg.MaNhanVien
          ]
        );
      } catch (errNotif) {
        console.error('Lỗi gửi thông báo duyệt ca:', errNotif.message);
      }
    }

    res.json({ success: true, message: status === 'approved' ? 'Đã duyệt đăng ký ca' : 'Đã từ chối đăng ký ca' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================================
// CÀI ĐẶT (cauhinh)
// ============================================================

const getSettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cauhinh');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy cài đặt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Thiếu key' });

    const [existing] = await db.query('SELECT * FROM cauhinh WHERE Khoa = ?', [key]);
    if (existing.length > 0) {
      await db.query('UPDATE cauhinh SET GiaTri = ? WHERE Khoa = ?', [value, key]);
    } else {
      await db.query('INSERT INTO cauhinh (Khoa, GiaTri) VALUES (?, ?)', [key, value]);
    }
    res.json({ success: true, message: 'Cập nhật cài đặt thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật cài đặt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
// ============================================================
// TRẠNG THÁI TUẦN & CHỐT TUẦN (trangthai_tuan)
// ============================================================

const getWeekStatus = async (req, res) => {
  try {
    const { week } = req.params;
    if (!week) return res.status(400).json({ success: false, message: 'Thiếu mã tuần' });

    const [rows] = await db.query('SELECT * FROM trangthai_tuan WHERE MaTuan = ?', [week]);
    if (rows.length === 0) {
      // Mặc định là pending (chưa mở đăng ký)
      return res.json({ success: true, data: { MaTuan: week, TrangThai: 'pending' } });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Lỗi lấy trạng thái tuần:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateWeekStatus = async (req, res) => {
  try {
    const { week } = req.params;
    const { status } = req.body;
    if (!week || !status) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    // Tạo thông báo nếu trạng thái thay đổi
    let thongBao = '';
    if (status === 'open') {
      thongBao = `Quản lý đã mở đăng ký ca cho tuần ${week}. Hạn đăng ký đến 18h00 Chủ Nhật tuần này. Quá hạn sẽ không thể đăng ký!`;
    } else if (status === 'manager_approved') {
      thongBao = `Quản lý đã duyệt sơ bộ và gửi bảng đăng ký ca tuần ${week} cho Admin duyệt.`;
    } else if (status === 'reopened') {
      const startDate = new Date(week);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Xóa các phân ca trong tuần đó khi mở lại đăng ký
      await db.query('DELETE FROM phancanhanvien WHERE NgayLam >= ? AND NgayLam <= ?', [startStr, endStr]);

      thongBao = `Quản lý đã mở lại cổng đăng ký lịch làm việc cho tuần ${week}. Nhân viên có thể thực hiện đăng ký và thay đổi ca làm.`;
    }

    const [existing] = await db.query('SELECT * FROM trangthai_tuan WHERE MaTuan = ?', [week]);
    if (existing.length > 0) {
      await db.query('UPDATE trangthai_tuan SET TrangThai = ? WHERE MaTuan = ?', [status, week]);
    } else {
      await db.query('INSERT INTO trangthai_tuan (MaTuan, TrangThai) VALUES (?, ?)', [week, status]);
    }

    if (thongBao) {
      await db.query('INSERT INTO thongbao (TieuDe, NoiDung, Loai) VALUES (?, ?, ?)', [
        'Thông báo đăng ký ca', thongBao, 'info'
      ]);
    }

    res.json({ success: true, message: 'Đã cập nhật trạng thái tuần' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái tuần:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const finalizeWeek = async (req, res) => {
  try {
    const { week } = req.params;
    if (!week) return res.status(400).json({ success: false, message: 'Thiếu mã tuần' });

    // 1. Cập nhật trạng thái tuần thành admin_approved
    const [existingWeek] = await db.query('SELECT * FROM trangthai_tuan WHERE MaTuan = ?', [week]);
    if (existingWeek.length > 0) {
      await db.query('UPDATE trangthai_tuan SET TrangThai = ? WHERE MaTuan = ?', ['admin_approved', week]);
    } else {
      await db.query('INSERT INTO trangthai_tuan (MaTuan, TrangThai) VALUES (?, ?)', [week, 'admin_approved']);
    }

    // Tính ngày bắt đầu và kết thúc của tuần dựa vào mã tuần (VD: '2026-06-22')
    const startDate = new Date(week);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Format YYYY-MM-DD
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // 2. Lấy tất cả đăng ký ca đã được "approved" (bởi Manager) trong tuần này
    const [approvedRegistrations] = await db.query(
      'SELECT * FROM dangky_ca WHERE TrangThai = ? AND NgayLam >= ? AND NgayLam <= ?',
      ['approved', startStr, endStr]
    );

    // 3. Xóa các phân ca cũ trong tuần đó (để tránh trùng lặp)
    await db.query('DELETE FROM phancanhanvien WHERE NgayLam >= ? AND NgayLam <= ?', [startStr, endStr]);

    // 4. Insert vào phancanhanvien
    if (approvedRegistrations.length > 0) {
      for (const r of approvedRegistrations) {
        await db.query(
          'INSERT INTO phancanhanvien (MaNhanVien, MaCaLam, NgayLam, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)',
          [r.MaNhanVien, r.MaCaLam, r.NgayLam, 'Chưa làm', r.GhiChu || '']
        );
      }
    }

    // 5. Gửi thông báo chốt lịch
    const thongBao = `Lịch làm tuần này của bạn đã được duyệt. Vui lòng vào kiểm tra! (Tuần ${week})`;
    await db.query('INSERT INTO thongbao (TieuDe, NoiDung, Loai) VALUES (?, ?, ?)', [
      'Lịch làm việc chính thức', thongBao, 'success'
    ]);

    res.json({ success: true, message: 'Đã chốt lịch thành công và đẩy dữ liệu sang Phân Ca' });
  } catch (error) {
    console.error('Lỗi chốt lịch tuần:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getSchedule,
  assignShift,
  removeAssignment,
  // Cài đặt
  getSettings,
  updateSetting,
  // Đăng ký ca
  getShiftRegistrations,
  registerShift,
  cancelRegistration,
  updateRegistrationStatus,
  // Trạng thái tuần
  getWeekStatus,
  updateWeekStatus,
  finalizeWeek,
};

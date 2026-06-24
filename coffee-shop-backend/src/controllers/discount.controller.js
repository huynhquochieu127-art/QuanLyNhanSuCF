const db = require('../config/db');

// Lấy danh sách mã giảm giá
const getDiscounts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM mamgiamgia ORDER BY NgayTao DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy mã giảm giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Kiểm tra mã giảm giá (dùng trong POS)
const validateDiscount = async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await db.query('SELECT * FROM mamgiamgia WHERE MaCode = ?', [code]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }
    const discount = rows[0];
    if (discount.TrangThai === 0) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã bị vô hiệu hóa' });
    }
    const today = new Date().toISOString().split('T')[0];
    if (discount.NgayHetHan && today > discount.NgayHetHan) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
    }
    if (discount.GioiHanDung !== null && discount.SoLanDung >= discount.GioiHanDung) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    res.json({ success: true, data: discount, message: 'Mã hợp lệ' });
  } catch (error) {
    console.error('Lỗi kiểm tra mã giảm giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Tạo mã giảm giá mới
const createDiscount = async (req, res) => {
  try {
    const { MaCode, TenMG, LoaiGiam, GiaTriGiam, GiaTriToiDa, GioiHanDung, NgayBatDau, NgayHetHan } = req.body;
    if (!MaCode || !GiaTriGiam) {
      return res.status(400).json({ success: false, message: 'Mã code và giá trị giảm là bắt buộc' });
    }
    const [result] = await db.query(
      'INSERT INTO mamgiamgia (MaCode, TenMG, LoaiGiam, GiaTriGiam, GiaTriToiDa, GioiHanDung, NgayBatDau, NgayHetHan, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [MaCode.toUpperCase(), TenMG || '', LoaiGiam || 'percent', GiaTriGiam, GiaTriToiDa || null, GioiHanDung || null, NgayBatDau || null, NgayHetHan || null]
    );
    res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Mã code đã tồn tại trong hệ thống' });
    }
    console.error('Lỗi tạo mã giảm giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật mã giảm giá
const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenMG, LoaiGiam, GiaTriGiam, GiaTriToiDa, GioiHanDung, NgayBatDau, NgayHetHan, TrangThai } = req.body;
    const [check] = await db.query('SELECT * FROM mamgiamgia WHERE MaMG = ?', [id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    const d = check[0];
    await db.query(
      'UPDATE mamgiamgia SET TenMG=?, LoaiGiam=?, GiaTriGiam=?, GiaTriToiDa=?, GioiHanDung=?, NgayBatDau=?, NgayHetHan=?, TrangThai=? WHERE MaMG=?',
      [
        TenMG ?? d.TenMG, LoaiGiam ?? d.LoaiGiam, GiaTriGiam ?? d.GiaTriGiam,
        GiaTriToiDa ?? d.GiaTriToiDa, GioiHanDung ?? d.GioiHanDung,
        NgayBatDau ?? d.NgayBatDau, NgayHetHan ?? d.NgayHetHan,
        TrangThai !== undefined ? TrangThai : d.TrangThai, id
      ]
    );
    res.json({ success: true, message: 'Cập nhật mã giảm giá thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật mã giảm giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Bật/tắt mã giảm giá
const toggleDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.query('SELECT * FROM mamgiamgia WHERE MaMG = ?', [id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    const newStatus = check[0].TrangThai === 1 ? 0 : 1;
    await db.query('UPDATE mamgiamgia SET TrangThai = ? WHERE MaMG = ?', [newStatus, id]);
    res.json({ success: true, message: newStatus === 1 ? 'Đã bật mã giảm giá' : 'Đã tắt mã giảm giá', data: { TrangThai: newStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa mã giảm giá
const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM mamgiamgia WHERE MaMG = ?', [id]);
    res.json({ success: true, message: 'Đã xóa mã giảm giá' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getDiscounts,
  validateDiscount,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount,
};

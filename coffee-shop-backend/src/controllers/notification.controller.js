const db = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const { userId, roleId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    const query = `
      SELECT * FROM thongbao 
      WHERE MaTaiKhoan = ? OR MaVaiTro = ? OR (MaTaiKhoan IS NULL AND MaVaiTro IS NULL)
      ORDER BY NgayTao DESC
    `;
    const [rows] = await db.query(query, [userId, roleId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE thongbao SET TrangThaiDoc = 1 WHERE MaThongBao = ?', [id]);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Lỗi đánh dấu đã đọc:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro } = req.body;
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro, TrangThaiDoc) VALUES (?, ?, ?, ?, ?, 0)',
      [TieuDe, NoiDung, Loai || 'info', MaTaiKhoan || null, MaVaiTro || null]
    );
    res.json({ success: true, message: 'Đã tạo thông báo' });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Helper function to create notifications from other controllers
exports.createNotificationInternal = async (title, content, type, userId, roleId) => {
  try {
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro, TrangThaiDoc) VALUES (?, ?, ?, ?, ?, 0)',
      [title, content, type || 'info', userId || null, roleId || null]
    );
    return true;
  } catch (error) {
    console.error('Lỗi tạo thông báo nội bộ:', error);
    return false;
  }
};

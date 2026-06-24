const db = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT TOP 10 * FROM thongbao ORDER BY NgayTao DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { TieuDe, NoiDung, Loai } = req.body;
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai) VALUES (?, ?, ?)',
      [TieuDe, NoiDung, Loai || 'info']
    );
    res.json({ success: true, message: 'Đã gửi thông báo' });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

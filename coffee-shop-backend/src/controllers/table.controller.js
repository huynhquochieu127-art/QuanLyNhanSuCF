const db = require('../config/db');

// Lấy danh sách bàn
const getTables = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bancafe ORDER BY MaBan ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách bàn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái bàn
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrangThai } = req.body; // 'ON' hoặc 'OFF' hoặc 'Có khách'/'Trống'

    await db.query('UPDATE bancafe SET TrangThai = ? WHERE MaBan = ?', [TrangThai, id]);
    res.json({ success: true, message: 'Cập nhật trạng thái bàn thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái bàn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getTables,
  updateTableStatus
};

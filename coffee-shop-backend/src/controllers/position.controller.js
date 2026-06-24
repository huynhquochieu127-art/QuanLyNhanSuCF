const db = require('../config/db');

// Lấy danh sách chức vụ
const getPositions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM chucvu ORDER BY MaChucVu ASC');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chức vụ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu chức vụ' });
  }
};

module.exports = {
  getPositions
};

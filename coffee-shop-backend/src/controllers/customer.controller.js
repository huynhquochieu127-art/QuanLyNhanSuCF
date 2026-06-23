const db = require('../config/db');

// Lấy danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM khachhang ORDER BY MaKhachHang DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Thêm khách hàng
const createCustomer = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, Email } = req.body;
    if (!HoTen || !SoDienThoai) {
      return res.status(400).json({ success: false, message: 'Tên và số điện thoại là bắt buộc' });
    }

    const [maxId] = await db.query('SELECT MAX(MaKhachHang) as maxId FROM khachhang');
    const newId = (maxId[0].maxId || 0) + 1;

    const query = 'INSERT INTO khachhang (MaKhachHang, HoTen, SoDienThoai, Email) VALUES (?, ?, ?, ?)';
    await db.query(query, [newId, HoTen, SoDienThoai, Email || null]);

    res.status(201).json({ success: true, message: 'Thêm khách hàng thành công', data: { id: newId } });
  } catch (error) {
    console.error('Lỗi thêm khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật khách hàng
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { HoTen, SoDienThoai, Email } = req.body;

    const [check] = await db.query('SELECT * FROM khachhang WHERE MaKhachHang = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }

    const query = 'UPDATE khachhang SET HoTen = ?, SoDienThoai = ?, Email = ? WHERE MaKhachHang = ?';
    await db.query(query, [
      HoTen || check[0].HoTen,
      SoDienThoai || check[0].SoDienThoai,
      Email || check[0].Email,
      id
    ]);

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa khách hàng
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [check] = await db.query('SELECT * FROM khachhang WHERE MaKhachHang = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }

    await db.query('DELETE FROM khachhang WHERE MaKhachHang = ?', [id]);

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Tìm hoặc tạo khách hàng bằng số điện thoại
const findOrCreateCustomer = async (req, res) => {
  try {
    const { SoDienThoai } = req.body;
    if (!SoDienThoai) {
      return res.status(400).json({ success: false, message: 'Số điện thoại là bắt buộc' });
    }

    const [check] = await db.query('SELECT * FROM khachhang WHERE SoDienThoai = ?', [SoDienThoai]);
    
    if (check.length > 0) {
      return res.json({ success: true, data: check[0] });
    }

    // Nếu chưa có thì tạo mới với tên mặc định
    const [maxId] = await db.query('SELECT MAX(MaKhachHang) as maxId FROM khachhang');
    const newId = (maxId[0].maxId || 0) + 1;

    await db.query(
      'INSERT INTO khachhang (MaKhachHang, HoTen, SoDienThoai) VALUES (?, ?, ?)',
      [newId, 'Khách hàng lẻ', SoDienThoai]
    );

    res.json({ success: true, data: { MaKhachHang: newId, HoTen: 'Khách hàng lẻ', SoDienThoai } });
  } catch (error) {
    console.error('Lỗi tìm/tạo khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  findOrCreateCustomer
};

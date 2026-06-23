const db = require('../config/db');

// Lấy danh sách sản phẩm
const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sanpham ORDER BY MaSanPham DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Thêm sản phẩm
const createProduct = async (req, res) => {
  try {
    const { TenSanPham, Gia, MoTa, MaDanhMuc } = req.body;
    if (!TenSanPham || !Gia) {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm và Giá là bắt buộc' });
    }

    const query = 'INSERT INTO sanpham (TenSanPham, Gia, MoTa, CoBan, MaDanhMuc) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [TenSanPham, Gia, MoTa || null, 1, MaDanhMuc || null]);

    res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi thêm sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenSanPham, Gia, MoTa, CoBan, MaDanhMuc } = req.body;

    const [check] = await db.query('SELECT * FROM sanpham WHERE MaSanPham = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const query = 'UPDATE sanpham SET TenSanPham = ?, Gia = ?, MoTa = ?, CoBan = ?, MaDanhMuc = ? WHERE MaSanPham = ?';
    await db.query(query, [
      TenSanPham || check[0].TenSanPham,
      Gia !== undefined ? Gia : check[0].Gia,
      MoTa || check[0].MoTa,
      CoBan !== undefined ? CoBan : check[0].CoBan,
      MaDanhMuc || check[0].MaDanhMuc,
      id
    ]);

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.query('SELECT * FROM sanpham WHERE MaSanPham = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    await db.query('DELETE FROM sanpham WHERE MaSanPham = ?', [id]);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};

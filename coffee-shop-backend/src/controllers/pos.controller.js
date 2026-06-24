const db = require('../config/db');

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const { MaBan, MaNhanVien, MaKhachHang, TongTien, GiamGia, ThanhTien, PhuongThucThanhToan, TrangThai, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng trống' });
    }

    const now = new Date();

    // Lấy ID hóa đơn
    const [maxOrder] = await db.query('SELECT MAX(MaDonHang) as maxId FROM donhang');
    const newOrderId = (maxOrder[0].maxId || 0) + 1;

    // Insert donhang
    await db.query(
      `INSERT INTO donhang (MaDonHang, MaBan, MaNhanVien, MaKhachHang, NgayDat, TongTien, GiamGia, ThanhTien, PhuongThucThanhToan, TrangThai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newOrderId, MaBan || null, MaNhanVien || null, MaKhachHang || null, now, TongTien, GiamGia, ThanhTien, PhuongThucThanhToan, TrangThai || 'Đã thanh toán']
    );

    // Lấy ID chi tiết hóa đơn
    const [maxDetail] = await db.query('SELECT MAX(MaChiTietDonHang) as maxId FROM chitietdonhang');
    let newDetailId = (maxDetail[0].maxId || 0) + 1;

    // Insert chitietdonhang
    for (const item of items) {
      await db.query(
        `INSERT INTO chitietdonhang (MaChiTietDonHang, MaDonHang, MaSanPham, SoLuong, DonGia, ThanhTien)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newDetailId, newOrderId, item.MaSanPham, item.SoLuong, item.DonGia, item.SoLuong * item.DonGia]
      );
      newDetailId++;
    }

    res.status(201).json({ success: true, message: 'Thanh toán thành công', data: { MaDonHang: newOrderId } });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  createOrder
};

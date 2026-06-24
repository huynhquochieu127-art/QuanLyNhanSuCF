const db = require('./src/config/db');

(async () => {
  try {
    console.log('--- TAIKHOAN ---');
    const [tk] = await db.query('SELECT MaTaiKhoan, Email, MaVaiTro, HoTen FROM taikhoan');
    console.log(tk);

    console.log('--- NHANVIEN ---');
    const [nv] = await db.query('SELECT MaNhanVien, HoTen, LoaiNhanVien, ChucVu, LuongCoBan, MaTaiKhoan FROM nhanvien');
    console.log(nv);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();

const db = require('./src/config/db');
(async () => {
  try {
    const q1 = "SELECT MaNhanVien, HoTen, LoaiNhanVien, ChucVu, TrangThai FROM nhanvien WHERE TrangThai = N'Đang làm việc'";
    console.log('Query:', q1);
    const [res] = await db.query(q1);
    console.log('Result length:', res.length);
    console.log('Result:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
})();

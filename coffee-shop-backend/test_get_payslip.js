const db = require('./src/config/db');

async function test() {
  try {
    const employeeId = 5;
    const month = '2026-05';

    const [yearStr, monthStr] = month.split('-');
    const m = parseInt(monthStr);
    const y = parseInt(yearStr);

    console.log('Parameters m:', m, 'y:', y);

    const [user] = await db.query('SELECT t.*, v.TenVaiTro FROM taikhoan t LEFT JOIN vaitro v ON t.MaVaiTro = v.MaVaiTro WHERE t.MaTaiKhoan = ?', [employeeId]);
    console.log('User found:', user);

    const [empRes] = await db.query('SELECT MaNhanVien, LoaiNhanVien FROM nhanvien WHERE MaTaiKhoan = ?', [employeeId]);
    console.log('Employee found:', empRes);

    if (empRes.length > 0) {
      const realMaNhanVien = empRes[0].MaNhanVien;
      const [existing] = await db.query(
        'SELECT * FROM bangluong WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
        [realMaNhanVien, m, y]
      );
      console.log('Bangluong existing:', existing);
      if (existing.length > 0) {
        console.log('TrangThai check:', existing[0].TrangThai === 'approved');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

test();

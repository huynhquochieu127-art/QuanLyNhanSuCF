const db = require('./src/config/db');
(async () => {
  try {
    // Test: giả sử MaTaiKhoan = 4 (Nguyễn Văn Staff), ngày 2026-06-22
    const employeeId = 4;
    const date = '2026-06-22';

    const [nvRows] = await db.query('SELECT MaNhanVien FROM nhanvien WHERE MaTaiKhoan = ?', [employeeId]);
    const maNhanVien = nvRows.length > 0 ? nvRows[0].MaNhanVien : employeeId;
    console.log('MaTaiKhoan:', employeeId, '-> MaNhanVien:', maNhanVien);

    const query = `
      SELECT DISTINCT c.MaCaLam, c.TenCaLam, c.GioBatDau, c.GioKetThuc
      FROM calam c
      WHERE c.MaCaLam IN (
        SELECT p.MaCaLam FROM phancanhanvien p
        WHERE p.MaNhanVien = ? AND p.NgayLam = ?
        UNION
        SELECT d.MaCaLam FROM dangky_ca d
        WHERE d.MaNhanVien = ? AND d.NgayLam = ? AND d.TrangThai = 'approved'
      )
      ORDER BY c.GioBatDau
    `;
    const [rows] = await db.query(query, [maNhanVien, date, maNhanVien, date]);
    console.log(`Kết quả scheduled shifts cho NV ${maNhanVien} ngày ${date}:`);
    console.log(rows);

    // Cũng kiểm tra raw data trong dangky_ca cho ngày này
    const [dk] = await db.query('SELECT * FROM dangky_ca WHERE MaNhanVien = ? AND NgayLam = ?', [maNhanVien, date]);
    console.log('dangky_ca raw:', dk);

    const [pc] = await db.query('SELECT * FROM phancanhanvien WHERE MaNhanVien = ? AND NgayLam = ?', [maNhanVien, date]);
    console.log('phancanhanvien raw:', pc);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();

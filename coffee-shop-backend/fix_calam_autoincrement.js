const mysql = require('mysql2/promise');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', port: 3307, user: 'root',
    password: 'anhdoandm5', database: 'dacnpm'
  });

  try {
    // Kiểm tra FK hiện tại
    const [fks] = await db.query(
      "SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='dacnpm' AND REFERENCED_TABLE_NAME='calam'"
    );
    console.log('FK hiện tại:', fks);

    // Tạo lại FK nếu chưa có
    const hasChamcong = fks.some(f => f.TABLE_NAME === 'chamcong');
    const hasPhanCa = fks.some(f => f.TABLE_NAME === 'phancanhanvien');

    if (!hasChamcong) {
      await db.query(
        'ALTER TABLE chamcong ADD CONSTRAINT chamcong_ibfk_2 FOREIGN KEY (MaCaLam) REFERENCES calam(MaCaLam) ON DELETE CASCADE'
      );
      console.log('✅ Tạo lại FK chamcong_ibfk_2');
    } else {
      console.log('FK chamcong_ibfk_2 đã tồn tại');
    }

    if (!hasPhanCa) {
      await db.query(
        'ALTER TABLE phancanhanvien ADD CONSTRAINT phancanhanvien_ibfk_2 FOREIGN KEY (MaCaLam) REFERENCES calam(MaCaLam) ON DELETE CASCADE'
      );
      console.log('✅ Tạo lại FK phancanhanvien_ibfk_2');
    } else {
      console.log('FK phancanhanvien_ibfk_2 đã tồn tại');
    }

    // Test thêm ca làm
    const [result] = await db.query(
      "INSERT INTO calam (TenCaLam, GioBatDau, GioKetThuc, MoTa) VALUES ('Test Ca', '06:00:00', '14:00:00', 'Test')"
    );
    console.log('✅ Test INSERT thành công, MaCaLam mới:', result.insertId);

    // Xóa test
    await db.query('DELETE FROM calam WHERE MaCaLam = ?', [result.insertId]);
    console.log('✅ Đã xóa test record. Mọi thứ hoạt động tốt!');

  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await db.end();
  }
})();

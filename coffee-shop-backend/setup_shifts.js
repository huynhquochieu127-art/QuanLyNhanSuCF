const mysql = require('mysql2/promise');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', port: 3307, user: 'root',
    password: 'anhdoandm5', database: 'dacnpm'
  });

  try {
    console.log('Bắt đầu cập nhật CSDL...');
    
    // 1. Vô hiệu hóa FK
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 2. Xóa dữ liệu cũ
    await db.query('TRUNCATE TABLE dangky_ca');
    await db.query('TRUNCATE TABLE phancanhanvien');
    await db.query('TRUNCATE TABLE calam');
    
    // 3. Thêm 5 ca cố định
    const shifts = [
      ['Ca A', '06:30:00', '15:00:00', 'Ca Full-time sáng'],
      ['Ca B', '15:00:00', '23:00:00', 'Ca Full-time tối'],
      ['Ca 1', '06:30:00', '12:00:00', 'Ca Part-time sáng'],
      ['Ca 2', '12:00:00', '17:30:00', 'Ca Part-time trưa'],
      ['Ca 3', '17:30:00', '23:00:00', 'Ca Part-time tối']
    ];
    
    for (const shift of shifts) {
      await db.query('INSERT INTO calam (TenCaLam, GioBatDau, GioKetThuc, MoTa) VALUES (?, ?, ?, ?)', shift);
    }
    console.log('✅ Đã tạo 5 ca làm cố định (Ca A, Ca B, Ca 1, Ca 2, Ca 3)');

    // 4. Tạo bảng thongbao
    await db.query(`
      CREATE TABLE IF NOT EXISTS thongbao (
        MaTB INT AUTO_INCREMENT PRIMARY KEY,
        TieuDe VARCHAR(255) NOT NULL,
        NoiDung TEXT,
        Loai VARCHAR(50) DEFAULT 'info',
        NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Đã tạo bảng thongbao');

    // Mở lại FK
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Hoàn thành cập nhật CSDL!');

  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await db.end();
  }
})();

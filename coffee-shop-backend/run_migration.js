const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', port: 3307, user: 'root',
    password: 'anhdoandm5', database: 'dacnpm',
    multipleStatements: true
  });

  try {
    // 1. Xem bảng hiện có
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📋 Bảng hiện có:', tableNames.join(', '));

    // 2. Kiểm tra từng bảng mới cần tạo
    const needed = ['dangky_ca', 'don_xin_nghi', 'bangcong_thang', 'mamgiamgia'];
    const missing = needed.filter(n => !tableNames.includes(n));
    console.log('⚠️  Chưa có:', missing.length ? missing.join(', ') : 'Tất cả đã tồn tại');

    // 3. Chạy migration
    const sql = fs.readFileSync('./migration_new_features.sql', 'utf8');
    await db.query(sql);
    console.log('✅ Migration chạy thành công!');

    // 4. Kiểm tra lại
    const [tables2] = await db.query('SHOW TABLES');
    const tableNames2 = tables2.map(t => Object.values(t)[0]);
    const created = needed.filter(n => tableNames2.includes(n));
    console.log('✅ Đã tạo xong:', created.join(', '));

    // 5. Kiểm tra cau truc timekeeping routes
    console.log('\n🔍 Kiểm tra routes timekeeping...');
    const routeContent = fs.readFileSync('./src/routes/timekeeping.routes.js', 'utf8');
    console.log(routeContent);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    if (err.sql) console.error('SQL:', err.sql.substring(0, 200));
  } finally {
    await db.end();
  }
})();

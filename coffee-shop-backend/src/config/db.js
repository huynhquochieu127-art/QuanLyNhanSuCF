const mysql = require('mysql2');
require('dotenv').config();

// Tạo một pool kết nối để quản lý hiệu suất tốt hơn
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Chuyển sang dạng Promise để dễ dùng async/await
const promisePool = pool.promise();

// Test kết nối khi khởi động
promisePool.getConnection()
  .then(connection => {
    console.log(`✅ Kết nối MySQL thành công tới database: ${process.env.DB_NAME}!`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MySQL:', err.message);
  });

module.exports = promisePool;

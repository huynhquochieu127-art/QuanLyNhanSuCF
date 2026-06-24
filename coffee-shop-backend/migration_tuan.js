const db = require('./src/config/db.js');
async function run() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS trangthai_tuan (
      MaTuan VARCHAR(20) PRIMARY KEY,
      TrangThai VARCHAR(30) DEFAULT 'pending',
      NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log("Table trangthai_tuan created successfully");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

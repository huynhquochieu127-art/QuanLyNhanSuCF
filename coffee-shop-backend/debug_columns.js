const db = require('./src/config/db');
(async () => {
  try {
    const [rows] = await db.query('SELECT TOP 5 * FROM thongbao');
    console.log('thongbao rows:', rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
})();

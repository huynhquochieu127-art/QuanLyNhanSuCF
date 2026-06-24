const db = require('./src/config/db');
(async () => {
  try {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'thongbao'
    `);
    console.log('Columns of thongbao:', cols);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();

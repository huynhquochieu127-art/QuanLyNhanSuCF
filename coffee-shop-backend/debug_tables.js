const db = require('./src/config/db');

(async () => {
  try {
    const [tables] = await db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    console.log('Tables:', tables.map(t => t.TABLE_NAME));
    
    for (const t of tables) {
      const [cols] = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
      `, [t.TABLE_NAME]);
      console.log(`Columns of ${t.TABLE_NAME}:`, cols.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();

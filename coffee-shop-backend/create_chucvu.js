const db = require('./src/config/db');

async function createChucVuTable() {
  try {
    console.log('Creating chucvu table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chucvu (
        MaChucVu INT AUTO_INCREMENT PRIMARY KEY,
        TenChucVu VARCHAR(255) NOT NULL,
        MoTa TEXT NULL
      )
    `;
    await db.query(createTableQuery);

    console.log('Inserting default positions...');
    const positions = ['Thu ngân', 'Phục vụ', 'Pha chế', 'Quản lý'];
    for (const pos of positions) {
      // Ignore insert if exists
      const [existing] = await db.query('SELECT * FROM chucvu WHERE TenChucVu = ?', [pos]);
      if (existing.length === 0) {
        await db.query('INSERT INTO chucvu (TenChucVu) VALUES (?)', [pos]);
      }
    }

    console.log('Successfully created chucvu table and defaults.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

createChucVuTable();

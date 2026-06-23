const db = require('./src/config/db');

async function addLoaiNhanVienColumn() {
  try {
    console.log('Adding LoaiNhanVien column...');
    const query = `
      ALTER TABLE nhanvien 
      ADD COLUMN LoaiNhanVien VARCHAR(50) DEFAULT 'Full-time' AFTER ChucVu;
    `;
    await db.query(query);
    console.log('Column LoaiNhanVien added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column LoaiNhanVien already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    process.exit(0);
  }
}

addLoaiNhanVienColumn();

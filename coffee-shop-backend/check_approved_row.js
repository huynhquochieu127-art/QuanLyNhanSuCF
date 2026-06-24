const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function run() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    const result = await pool.request().query(`
      SELECT MaBangLuong, MaNhanVien, Thang, Nam, TrangThai 
      FROM bangluong 
      WHERE MaNhanVien = 5 AND Thang = 5 AND Nam = 2026
    `);
    
    if (result.recordset.length === 0) {
      console.log('No record found for employee 5, month 5, year 2026');
    } else {
      const row = result.recordset[0];
      console.log('Row found:', row);
      console.log('TrangThai value:', JSON.stringify(row.TrangThai));
      console.log('TrangThai type:', typeof row.TrangThai);
      if (row.TrangThai) {
        console.log('TrangThai length:', row.TrangThai.length);
        console.log('Trimmed value match:', row.TrangThai.trim() === 'approved');
      }
    }

    await sql.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();

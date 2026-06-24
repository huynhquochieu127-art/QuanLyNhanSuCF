const db = require('./src/config/db');

(async () => {
  try {
    console.log('Checking thongbao table...');
    
    // 1. Drop existing table
    try {
      await db.query('DROP TABLE thongbao');
      console.log('✅ Dropped existing thongbao table');
    } catch (e) {
      console.log('Note (could not drop):', e.message);
    }

    // 2. Recreate with correct schema
    const createSchema = `
      CREATE TABLE thongbao (
        MaThongBao INT IDENTITY(1,1) PRIMARY KEY,
        TieuDe NVARCHAR(255) NOT NULL,
        NoiDung NVARCHAR(MAX) NULL,
        Loai NVARCHAR(50) DEFAULT 'info',
        MaTaiKhoan INT NULL,
        MaVaiTro INT NULL,
        TrangThaiDoc TINYINT DEFAULT 0,
        NgayTao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaTaiKhoan) REFERENCES taikhoan(MaTaiKhoan) ON DELETE CASCADE
      )
    `;
    await db.query(createSchema);
    console.log('✅ Recreated thongbao table successfully with correct columns');

  } catch (err) {
    console.error('❌ Error fixing thongbao table:', err.message);
  }
  process.exit(0);
})();

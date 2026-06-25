const db = require('./src/config/db');

async function checkAndSeedDonHang() {
  try {
    console.log('Ket noi database Somee...\n');

    // 1. Kiem tra cac bang hien co
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log('=== DANH SACH BANG HIEN CO ===');
    tables.forEach(t => console.log(' -', t.TABLE_NAME));

    // 2. Kiem tra bang donhang co ton tai khong
    const donhangExists = tables.some(t => t.TABLE_NAME.toLowerCase() === 'donhang');
    console.log('\n=== KIEM TRA BANG donhang ===');
    console.log('Bang donhang ton tai:', donhangExists ? 'CO' : 'KHONG');

    if (donhangExists) {
      // Kiem tra du lieu hien co
      const [rows] = await db.query('SELECT COUNT(*) as total FROM donhang');
      console.log('So ban ghi hien co:', rows[0].total);

      // Xem cau truc bang
      const [cols] = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'donhang'
        ORDER BY ORDINAL_POSITION
      `);
      console.log('\nCau truc bang donhang:');
      cols.forEach(c => console.log(` - ${c.COLUMN_NAME}: ${c.DATA_TYPE} (nullable: ${c.IS_NULLABLE})`));

      // Xem du lieu mau
      const [sample] = await db.query('SELECT TOP 5 * FROM donhang ORDER BY MaDon DESC');
      console.log('\nDu lieu mau (top 5):');
      console.log(JSON.stringify(sample, null, 2));

    } else {
      console.log('\nBang donhang CHUA TON TAI. Kiem tra bang tuong duong...');
      // Kiem tra cac bang lien quan den don hang / POS
      const posTables = tables.filter(t => 
        t.TABLE_NAME.toLowerCase().includes('don') || 
        t.TABLE_NAME.toLowerCase().includes('order') ||
        t.TABLE_NAME.toLowerCase().includes('hoadon') ||
        t.TABLE_NAME.toLowerCase().includes('pos')
      );
      console.log('Cac bang lien quan POS/DonHang:');
      posTables.forEach(t => console.log(' -', t.TABLE_NAME));
    }

    // 3. Kiem tra bang chitietdonhang
    const ctdhExists = tables.some(t => t.TABLE_NAME.toLowerCase() === 'chitietdonhang');
    console.log('\n=== KIEM TRA BANG chitietdonhang ===');
    console.log('Bang chitietdonhang ton tai:', ctdhExists ? 'CO' : 'KHONG');

    if (ctdhExists) {
      const [cols2] = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'chitietdonhang'
        ORDER BY ORDINAL_POSITION
      `);
      console.log('Cau truc bang chitietdonhang:');
      cols2.forEach(c => console.log(` - ${c.COLUMN_NAME}: ${c.DATA_TYPE}`));
    }

  } catch (err) {
    console.error('Loi:', err.message);
  }
  process.exit(0);
}

checkAndSeedDonHang();

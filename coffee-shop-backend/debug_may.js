const db = require('./src/config/db');
(async () => {
  try {
    console.log('=== Testing direct autoGenerateTimesheet ===');
    const timesheetController = require('./src/controllers/timesheet.controller');
    
    // Let's call the API's internal logic or test query manually:
    // First, let's select to see if there is any data
    const [attRes] = await db.query(
      `SELECT SUM(SoGioLam) as totalHours, COUNT(*) as daysWorked 
       FROM chamcong 
       WHERE MaNhanVien = ? AND MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? AND GioCheckOut IS NOT NULL`,
      [2, 5, 2026]
    );
    console.log('Attendance:', attRes);

    console.log('Inserting draft...');
    const insertRes = await db.query(
      `INSERT INTO bangcong_thang 
       (MaNhanVien, Thang, Nam, SoCong, SoGioLam, SoNgayNghi, SoNgayTre, GhiChuQL, PhanHoiNV, TrangThai)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', '', 'draft')`,
      [2, 5, 2026, attRes[0].daysWorked || 0, attRes[0].totalHours || 0, 0, 3]
    );
    console.log('Insert Result:', insertRes);

    const [idRes] = await db.query(
      'SELECT MAX(MaBangCong) as newId FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?',
      [2, 5, 2026]
    );
    console.log('New ID:', idRes[0].newId);

  } catch (err) {
    console.error('ERROR:', err.stack || err.message);
  }
  process.exit(0);
})();

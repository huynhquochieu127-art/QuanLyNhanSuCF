const db = require('./src/config/db');
(async () => {
  try {
    const month = 5;
    const year = 2026;
    
    // Call the same logic in backend getTimesheets
    const [employees] = await db.query(
      "SELECT MaNhanVien, HoTen, LoaiNhanVien, ChucVu FROM nhanvien WHERE TrangThai = 'Đang làm việc'"
    );
    console.log(`Found ${employees.length} working employees.`);
    
    for (const emp of employees) {
      console.log(`Checking timesheet for ${emp.HoTen} (ID: ${emp.MaNhanVien})`);
      const [bcRow] = await db.query(
        "SELECT * FROM bangcong_thang WHERE MaNhanVien = ? AND Thang = ? AND Nam = ?",
        [emp.MaNhanVien, month, year]
      );
      if (bcRow.length > 0) {
        console.log(`-> Found in DB:`, bcRow[0]);
      } else {
        console.log(`-> Not found. Simulating autoGenerateTimesheet...`);
        const [attRes] = await db.query(
          `SELECT SUM(SoGioLam) as totalHours, COUNT(*) as daysWorked 
           FROM chamcong 
           WHERE MaNhanVien = ? AND MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? AND GioCheckOut IS NOT NULL`,
          [emp.MaNhanVien, month, year]
        );
        console.log(`   Attendance data:`, attRes);
      }
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
})();

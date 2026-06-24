const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 200) }); }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const tests = [
      ['/api/discounts', 'Discounts'],
      ['/api/shifts/registrations', 'Shift Registrations'],
      ['/api/timekeeping/leave', 'Leave Requests'],
      ['/api/timesheets?month=6&year=2026', 'Monthly Sheets'],
      ['/api/shifts', 'Shifts'],
      ['/api/employees', 'Employees'],
    ];

    for (const [path, name] of tests) {
      try {
        const r = await get(path);
        if (r.success) {
          console.log(`✅ ${name}: ${r.data.length} records`);
        } else {
          console.log(`⚠️  ${name}: success=false, msg=${r.message}`);
        }
      } catch(e) {
        console.log(`❌ ${name}: ${e.message}`);
      }
    }
    console.log('\n🎉 Kiểm tra xong!');
  } catch(e) {
    console.error('Lỗi tổng:', e.message);
  }
})();

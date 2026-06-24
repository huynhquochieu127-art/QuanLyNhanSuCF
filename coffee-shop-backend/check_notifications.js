const db = require('./src/config/db');
async function run() {
  try {
    const [trangthai] = await db.query('SELECT * FROM trangthai_tuan');
    console.log("--- trangthai_tuan ---");
    console.table(trangthai);
    
    const [dangky] = await db.query(
      "SELECT MaDangKy, MaNhanVien, MaCaLam, NgayLam, TrangThai FROM dangky_ca WHERE NgayLam >= '2026-06-22' AND NgayLam <= '2026-06-28'"
    );
    console.log("--- dangky_ca in week 2026-06-22 ---");
    console.table(dangky);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();

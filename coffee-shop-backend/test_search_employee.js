const db = require('./src/config/db');

async function testSearchEmployee() {
  try {
    console.log('--- TEST TÌM KIẾM NHÂN VIÊN ---');
    
    // Từ khóa tìm kiếm giả định (bạn có thể thay đổi để test)
    const keyword = 'Nguyễn';
    console.log(`Từ khóa tìm kiếm: "${keyword}"\n`);

    // 1. Tìm kiếm theo Tên nhân viên hoặc Mã nhân viên
    const query = `
      SELECT n.MaNhanVien, n.MaNhanVienCode, n.HoTen, n.ChucVu, t.Email
      FROM nhanvien n
      LEFT JOIN taikhoan t ON n.MaNhanVien = t.MaTaiKhoan
      WHERE n.HoTen LIKE ? OR n.MaNhanVienCode LIKE ? OR t.Email LIKE ?
      ORDER BY n.MaNhanVien DESC
    `;
    
    const searchPattern = `%${keyword}%`;
    const [results] = await db.query(query, [searchPattern, searchPattern, searchPattern]);

    if (results.length > 0) {
      console.log(`✅ Tìm thấy ${results.length} kết quả:`);
      console.table(results);
    } else {
      console.log('❌ Không tìm thấy nhân viên nào khớp với từ khóa.');
    }

  } catch (error) {
    console.error('Lỗi khi chạy test tìm kiếm:', error.message);
  } finally {
    process.exit(0);
  }
}

testSearchEmployee();

const db = require('./src/config/db');

async function deleteSpecificAccounts() {
  try {
    const ids = [2, 3];
    console.log('Sẽ xóa các tài khoản có ID:', ids);

    // Xóa từ bảng chamcong và yeucau_chamcong nếu có (Ràng buộc khóa ngoại)
    await db.query('DELETE FROM chamcong WHERE MaNhanVien IN (?)', [ids]);
    await db.query('DELETE FROM yeucau_chamcong WHERE MaNhanVien IN (?)', [ids]);

    // Xóa từ bảng nhanvien
    await db.query('DELETE FROM nhanvien WHERE MaNhanVien IN (?)', [ids]);

    // Xóa từ bảng taikhoan
    await db.query('DELETE FROM taikhoan WHERE MaTaiKhoan IN (?)', [ids]);

    console.log('Xóa thành công 2 tài khoản test!');
  } catch (error) {
    console.error('Lỗi khi xóa:', error);
  } finally {
    process.exit(0);
  }
}

deleteSpecificAccounts();

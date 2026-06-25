const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function testEmployeeCRUD() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: Quản lý nhân viên (Thêm, Sửa, Xóa)...');
  
  // Dữ liệu giả lập
  const testEmail = 'test_nv_auto@gmail.com';
  const testHoTen = 'Nhân viên Test Tự động';
  const newPhone = '0988888888';
  let newId = null;

  try {
    // 1. Dọn dẹp dữ liệu cũ (nếu có)
    await db.query('DELETE FROM nhanvien WHERE HoTen = ?', [testHoTen]);
    await db.query('DELETE FROM taikhoan WHERE Email = ?', [testEmail]);

    // --- TEST 1: THÊM NHÂN VIÊN ---
    console.log('\n🚀 Đang chạy logic: Thêm mới nhân viên hợp lệ...');
    
    // Lấy ID mới cho tài khoản
    const [maxIdResult] = await db.query('SELECT MAX(MaTaiKhoan) as maxId FROM taikhoan');
    newId = (maxIdResult[0].maxId || 0) + 1;
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Insert Tài khoản
    await db.query(
      'INSERT INTO taikhoan (MaTaiKhoan, HoTen, Email, MatKhau, MaVaiTro, TrangThaiHoatDong) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, testHoTen, testEmail, hashedPassword, 3, 1]
    );

    // Insert Nhân viên
    await db.query(
      'INSERT INTO nhanvien (MaNhanVien, MaTaiKhoan, MaNhanVienCode, HoTen, ChucVu, LoaiNhanVien, Luong, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, newId, `NV${String(newId).padStart(3, '0')}`, testHoTen, 'Pha chế', 'Full-time', 5000000, 'Đang làm việc']
    );

    const [checkAdd] = await db.query('SELECT * FROM nhanvien WHERE MaNhanVien = ?', [newId]);
    if (checkAdd.length > 0) {
      console.log('   ✅ ĐẠT: Đã thêm tài khoản và nhân viên thành công vào DB.');
    } else {
      console.log('   ❌ THẤT BẠI: Thêm nhân viên lỗi.');
    }

    // --- TEST 2: CẬP NHẬT NHÂN VIÊN ---
    console.log('\n🚀 Đang chạy logic: Cập nhật thông tin nhân viên...');
    await db.query('UPDATE nhanvien SET SoDienThoai = ? WHERE MaNhanVien = ?', [newPhone, newId]);
    
    const [checkUpdate] = await db.query('SELECT SoDienThoai FROM nhanvien WHERE MaNhanVien = ?', [newId]);
    if (checkUpdate[0].SoDienThoai === newPhone) {
      console.log('   ✅ ĐẠT: Số điện thoại đã cập nhật thành', newPhone);
    } else {
      console.log('   ❌ THẤT BẠI: Cập nhật lỗi.');
    }

    // --- TEST 3: XÓA NHÂN VIÊN (Nghỉ việc) ---
    console.log('\n🚀 Đang chạy logic: Xóa / Vô hiệu hóa nhân viên...');
    await db.query('UPDATE nhanvien SET TrangThai = ? WHERE MaNhanVien = ?', ['Đã nghỉ việc', newId]);
    await db.query('UPDATE taikhoan SET TrangThaiHoatDong = 0 WHERE MaTaiKhoan = ?', [newId]);

    const [checkDelete] = await db.query('SELECT n.TrangThai, t.TrangThaiHoatDong FROM nhanvien n JOIN taikhoan t ON n.MaNhanVien = t.MaTaiKhoan WHERE n.MaNhanVien = ?', [newId]);
    if (checkDelete[0].TrangThai === 'Đã nghỉ việc' && (checkDelete[0].TrangThaiHoatDong === false || checkDelete[0].TrangThaiHoatDong === 0)) {
      console.log('   ✅ ĐẠT: Trạng thái NV chuyển sang "Đã nghỉ việc" và tài khoản đã bị khóa.');
    } else {
      console.log('   ❌ THẤT BẠI: Vô hiệu hóa lỗi.');
    }

  } catch (error) {
    console.error('Lỗi kiểm thử:', error.message);
  } finally {
    // Dọn dẹp DB sau khi test xong
    if (newId) {
       await db.query('DELETE FROM nhanvien WHERE MaNhanVien = ?', [newId]);
       await db.query('DELETE FROM taikhoan WHERE MaTaiKhoan = ?', [newId]);
       console.log('\n🧹 Dọn dẹp dữ liệu test hoàn tất.');
    }
    process.exit(0);
  }
}

testEmployeeCRUD();

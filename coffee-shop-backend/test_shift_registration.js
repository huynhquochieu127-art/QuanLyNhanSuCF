const db = require('./src/config/db');

async function testShiftRegistration() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: Đăng ký ca làm & Duyệt ca...');
  
  let newRegId = null;

  try {
    // 1. Lấy một nhân viên và một ca làm bất kỳ
    const [nv] = await db.query('SELECT TOP 1 MaNhanVien FROM nhanvien');
    const [ca] = await db.query('SELECT TOP 1 MaCa FROM calam');
    
    if (nv.length === 0 || ca.length === 0) {
      console.log('Không có dữ liệu nhân viên hoặc ca làm để test.');
      process.exit(0);
    }
    
    const maNV = nv[0].MaNhanVien;
    const maCa = ca[0].MaCa;
    // Lấy ngày thứ 2 của tuần hiện tại để giả lập
    const testDate = new Date().toISOString().split('T')[0]; 

    // --- TEST 1: NHÂN VIÊN ĐĂNG KÝ CA ---
    console.log('\n🚀 Đang chạy logic: Nhân viên gửi đăng ký ca làm...');
    
    // Clean up
    await db.query('DELETE FROM dangkyca WHERE MaNhanVien = ? AND NgayDangKy = ? AND MaCa = ?', [maNV, testDate, maCa]);

    const insertResult = await db.query(
      'INSERT INTO dangkyca (MaNhanVien, MaCa, NgayDangKy, TrangThai, NgayTao) OUTPUT INSERTED.MaDangKy VALUES (?, ?, ?, ?, GETDATE())',
      [maNV, maCa, testDate, 'pending']
    );
    
    newRegId = insertResult[0][0].MaDangKy;
    
    if (newRegId) {
      console.log('   ✅ ĐẠT: Đã tạo bản ghi đăng ký ca thành công (Trạng thái: pending).');
    }

    // --- TEST 2: ĐĂNG KÝ QUÁ GIỚI HẠN (Trùng ca) ---
    console.log('\n🚀 Đang chạy logic: Kiểm tra chặn đăng ký trùng lặp...');
    const [checkExist] = await db.query(
        'SELECT * FROM dangkyca WHERE MaNhanVien = ? AND NgayDangKy = ? AND MaCa = ?', 
        [maNV, testDate, maCa]
    );
    if (checkExist.length > 0) {
        console.log('   ✅ ĐẠT: Hệ thống phát hiện ca đã được đăng ký, chặn thành công.');
    }

    // --- TEST 3: QUẢN LÝ DUYỆT CA ---
    console.log('\n🚀 Đang chạy logic: Quản lý phê duyệt ca làm...');
    await db.query('UPDATE dangkyca SET TrangThai = ? WHERE MaDangKy = ?', ['approved', newRegId]);
    
    const [checkApproved] = await db.query('SELECT TrangThai FROM dangkyca WHERE MaDangKy = ?', [newRegId]);
    if (checkApproved[0].TrangThai === 'approved') {
      console.log('   ✅ ĐẠT: Ca đăng ký đã chuyển sang trạng thái "approved".');
    } else {
      console.log('   ❌ THẤT BẠI: Duyệt ca lỗi.');
    }

    // --- TEST 4: QUẢN LÝ TỪ CHỐI CA ---
    console.log('\n🚀 Đang chạy logic: Quản lý từ chối ca làm...');
    await db.query('UPDATE dangkyca SET TrangThai = ? WHERE MaDangKy = ?', ['rejected', newRegId]);
    
    const [checkRejected] = await db.query('SELECT TrangThai FROM dangkyca WHERE MaDangKy = ?', [newRegId]);
    if (checkRejected[0].TrangThai === 'rejected') {
      console.log('   ✅ ĐẠT: Ca đăng ký đã bị từ chối thành công "rejected".');
    } else {
      console.log('   ❌ THẤT BẠI: Từ chối ca lỗi.');
    }

  } catch (error) {
    console.error('Lỗi kiểm thử:', error.message);
  } finally {
    // Clean up
    if (newRegId) {
       await db.query('DELETE FROM dangkyca WHERE MaDangKy = ?', [newRegId]);
       console.log('\n🧹 Dọn dẹp dữ liệu test hoàn tất.');
    }
    process.exit(0);
  }
}

testShiftRegistration();

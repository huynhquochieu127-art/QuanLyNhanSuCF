const db = require('./src/config/db');
const { finalizeWeek } = require('./src/controllers/shift.controller');

async function testLogicPhanCa() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: Logic phân ca tuần sau khi chốt lịch...\n');

  const testWeek = '2026-07-06'; // Thứ Hai, 06/07/2026
  const approvedDate = '2026-07-06';
  const pendingDate = '2026-07-07';
  
  const testEmployeeId = 6; // Nhân viên A1
  const caLamApproved = 1;  // Ca 1
  const caLamPending = 2;   // Ca 2

  let backupWeekStatus = null;
  let testRegIds = [];

  try {
    // 1. Sao lưu trạng thái tuần nếu đã tồn tại
    const [existingWeek] = await db.query('SELECT * FROM trangthai_tuan WHERE MaTuan = ?', [testWeek]);
    if (existingWeek.length > 0) {
      backupWeekStatus = existingWeek[0].TrangThai;
      console.log(`ℹ️ Tuần ${testWeek} đã có trạng thái trên DB: "${backupWeekStatus}". Sẽ khôi phục sau kiểm thử.`);
    }

    // 2. Dọn dẹp dữ liệu cũ (nếu có rác)
    await db.query('DELETE FROM dangky_ca WHERE MaNhanVien = ? AND NgayLam IN (?, ?)', [testEmployeeId, approvedDate, pendingDate]);
    await db.query('DELETE FROM phancanhanvien WHERE MaNhanVien = ? AND NgayLam IN (?, ?)', [testEmployeeId, approvedDate, pendingDate]);
    await db.query('DELETE FROM trangthai_tuan WHERE MaTuan = ?', [testWeek]);

    // 3. Setup dữ liệu đăng ký ca kiểm thử:
    // - Ca 1 ngày 06/07: Đã duyệt (approved) -> Phải được chuyển sang Phân Ca
    // - Ca 2 ngày 07/07: Chờ duyệt (pending) -> KHÔNG được chuyển sang Phân Ca
    console.log('📝 Khởi tạo dữ liệu đăng ký ca thử nghiệm...');
    
    await db.query(
      'INSERT INTO dangky_ca (MaNhanVien, MaCaLam, NgayLam, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)',
      [testEmployeeId, caLamApproved, approvedDate, 'approved', 'Ca đã duyệt test']
    );
    await db.query(
      'INSERT INTO dangky_ca (MaNhanVien, MaCaLam, NgayLam, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)',
      [testEmployeeId, caLamPending, pendingDate, 'pending', 'Ca chờ duyệt test']
    );

    // Lấy ID đăng ký để dọn dẹp sau
    const [regs] = await db.query('SELECT MaDangKy FROM dangky_ca WHERE MaNhanVien = ? AND NgayLam IN (?, ?)', [testEmployeeId, approvedDate, pendingDate]);
    testRegIds = regs.map(r => r.MaDangKy);
    console.log(`✅ Khởi tạo thành công ${testRegIds.length} ca đăng ký thử nghiệm.`);

    // 4. Chạy hàm logic Chốt lịch tuần (finalizeWeek) thông qua mock request/response
    console.log('\n🚀 Đang chạy logic chốt lịch tuần (finalizeWeek)...');
    
    let resJsonData = null;
    const req = {
      params: { week: testWeek }
    };
    const res = {
      status: function(code) {
        console.log(`   [HTTP Status]: ${code}`);
        return this;
      },
      json: function(data) {
        resJsonData = data;
        console.log('   [HTTP Response]:', data);
        return this;
      }
    };

    await finalizeWeek(req, res);

    // 5. Kiểm tra kết quả trong Database (ASSERTIONS)
    console.log('\n🔍 Kiểm tra kết quả trong Cơ sở dữ liệu:');

    // 5.1. Kiểm tra trạng thái tuần
    const [weekStatusRows] = await db.query('SELECT * FROM trangthai_tuan WHERE MaTuan = ?', [testWeek]);
    if (weekStatusRows.length > 0 && weekStatusRows[0].TrangThai === 'admin_approved') {
      console.log('   ✅ ĐẠT: Trạng thái tuần được cập nhật thành "admin_approved".');
    } else {
      throw new Error('   ❌ THẤT BẠI: Trạng thái tuần không chuyển sang "admin_approved".');
    }

    // 5.2. Kiểm tra phân ca chính thức (phancanhanvien)
    const [assignmentRows] = await db.query(
      'SELECT * FROM phancanhanvien WHERE MaNhanVien = ? AND NgayLam >= ? AND NgayLam <= ?',
      [testEmployeeId, approvedDate, pendingDate]
    );

    // Phải có đúng 1 phân ca cho ngày đã duyệt
    const approvedAssign = assignmentRows.find(a => a.NgayLam.toISOString().split('T')[0] === approvedDate);
    const pendingAssign = assignmentRows.find(a => a.NgayLam.toISOString().split('T')[0] === pendingDate);

    if (approvedAssign && approvedAssign.MaCaLam === caLamApproved && approvedAssign.TrangThai === 'Chưa làm') {
      console.log('   ✅ ĐẠT: Ca đã duyệt được sao chép chính xác sang phân ca nhân viên.');
    } else {
      throw new Error('   ❌ THẤT BẠI: Ca đã duyệt không được phân ca chính xác.');
    }

    if (!pendingAssign) {
      console.log('   ✅ ĐẠT: Ca chờ duyệt được lọc bỏ chính xác (không phân ca).');
    } else {
      throw new Error('   ❌ THẤT BẠI: Ca chưa duyệt bị phân ca sai lệch.');
    }

    // 5.3. Kiểm tra thông báo chốt lịch
    const [notifRows] = await db.query(
      `SELECT TOP 1 * FROM thongbao WHERE TieuDe = 'Lịch làm việc chính thức' AND NoiDung LIKE '%${testWeek}%' ORDER BY MaThongBao DESC`
    );
    if (notifRows.length > 0) {
      console.log('   ✅ ĐẠT: Đã gửi thông báo chốt lịch thành công.');
    } else {
      throw new Error('   ❌ THẤT BẠI: Không tìm thấy thông báo chốt lịch.');
    }

    console.log('\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐỀU ĐẠT (PASS)! 🎉\n');

  } catch (error) {
    console.error('\n💥 LỖI KIỂM THỬ:', error.message);
  } finally {
    // 6. DỌN DẸP DỮ LIỆU SAU TEST (TEARDOWN)
    console.log('🧹 Đang dọn dẹp dữ liệu kiểm thử...');
    try {
      await db.query('DELETE FROM dangky_ca WHERE MaNhanVien = ? AND NgayLam IN (?, ?)', [testEmployeeId, approvedDate, pendingDate]);
      await db.query('DELETE FROM phancanhanvien WHERE MaNhanVien = ? AND NgayLam IN (?, ?)', [testEmployeeId, approvedDate, pendingDate]);
      await db.query(`DELETE FROM thongbao WHERE TieuDe = 'Lịch làm việc chính thức' AND NoiDung LIKE '%${testWeek}%'`);
      
      if (backupWeekStatus) {
        await db.query('UPDATE trangthai_tuan SET TrangThai = ? WHERE MaTuan = ?', [backupWeekStatus, testWeek]);
      } else {
        await db.query('DELETE FROM trangthai_tuan WHERE MaTuan = ?', [testWeek]);
      }
      console.log('✅ Dọn dẹp dữ liệu thành công.');
    } catch (e) {
      console.error('❌ Lỗi dọn dẹp dữ liệu:', e.message);
    }
    process.exit();
  }
}

testLogicPhanCa();

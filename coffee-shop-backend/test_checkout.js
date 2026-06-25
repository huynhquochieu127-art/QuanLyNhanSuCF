const db = require('./src/config/db');
const { checkIn, checkOut } = require('./src/controllers/timekeeping.controller');

async function testCheckInCheckOut() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: Điểm danh Check-in & Check-out...\n');

  const testEmployeeId = 6; // Nhân viên A1
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Dọn dẹp dữ liệu chấm công cũ của hôm nay để tránh bị trùng lặp/ảnh hưởng kết quả test
    console.log('🧹 Dọn dẹp bản ghi chấm công cũ của hôm nay...');
    await db.query('DELETE FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [testEmployeeId, today]);
    console.log('✅ Dọn dẹp thành công.');

    // 2. Chạy kịch bản Check-in
    console.log('\n🚀 Đang chạy logic Check-in...');
    let checkInResData = null;
    const reqCheckIn = {
      body: { MaNhanVien: testEmployeeId }
    };
    const resCheckIn = {
      status: function(code) {
        console.log(`   [Check-in HTTP Status]: ${code}`);
        if (code !== 201 && code !== 200) {
          throw new Error(`Check-in HTTP status error: ${code}`);
        }
        return this;
      },
      json: function(data) {
        checkInResData = data;
        console.log('   [Check-in HTTP Response]:', data);
        return this;
      }
    };

    await checkIn(reqCheckIn, resCheckIn);

    // 2.1. Đối soát Database sau Check-in
    console.log('🔍 Kiểm tra bản ghi chấm công trong DB sau khi Check-in...');
    const [checkInRows] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [testEmployeeId, today]);
    
    if (checkInRows.length === 1 && checkInRows[0].TrangThai === 'IN' && checkInRows[0].GioCheckIn && !checkInRows[0].GioCheckOut) {
      console.log('   ✅ ĐẠT: Ghi nhận Check-in thành công trong DB (TrangThai = "IN").');
    } else {
      throw new Error('   ❌ THẤT BẠI: Dữ liệu Check-in trong DB không chính xác.');
    }

    // 3. Thử Check-in lại lần nữa (Phải báo lỗi 400 - Đã check-in hôm nay rồi)
    console.log('\n🚀 Thử Check-in lại lần nữa (Kỳ vọng trả về lỗi đã check-in)...');
    let doubleCheckInError = false;
    const resDoubleCheckIn = {
      status: function(code) {
        console.log(`   [Double Check-in HTTP Status]: ${code}`);
        if (code === 400) {
          doubleCheckInError = true;
        }
        return this;
      },
      json: function(data) {
        console.log('   [Double Check-in HTTP Response]:', data);
        return this;
      }
    };
    await checkIn(reqCheckIn, resDoubleCheckIn);
    if (doubleCheckInError) {
      console.log('   ✅ ĐẠT: Hệ thống chặn Check-in trùng lặp thành công.');
    } else {
      throw new Error('   ❌ THẤT BẠI: Hệ thống không chặn Check-in trùng lặp.');
    }

    // 4. Chạy kịch bản Check-out
    console.log('\n🚀 Đang chạy logic Check-out...');
    let checkOutResData = null;
    const reqCheckOut = {
      body: { MaNhanVien: testEmployeeId }
    };
    const resCheckOut = {
      status: function(code) {
        console.log(`   [Check-out HTTP Status]: ${code}`);
        if (code !== 200) {
          throw new Error(`Check-out HTTP status error: ${code}`);
        }
        return this;
      },
      json: function(data) {
        checkOutResData = data;
        console.log('   [Check-out HTTP Response]:', data);
        return this;
      }
    };

    // Đợi 1 giây để tạo khoảng chênh lệch thời gian giữa Check-in và Check-out nhằm kiểm thử số giờ làm việc
    console.log('⏳ Chờ 1 giây để kiểm thử tính toán số giờ làm việc...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await checkOut(reqCheckOut, resCheckOut);

    // 4.1. Đối soát Database sau Check-out
    console.log('🔍 Kiểm tra bản ghi chấm công trong DB sau khi Check-out...');
    const [checkOutRows] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [testEmployeeId, today]);
    
    if (checkOutRows.length === 1 && checkOutRows[0].TrangThai === 'OUT' && checkOutRows[0].GioCheckOut && checkOutRows[0].SoGioLam !== null) {
      console.log(`   ✅ ĐẠT: Ghi nhận Check-out thành công trong DB (TrangThai = "OUT", Số giờ làm = ${checkOutRows[0].SoGioLam} giờ).`);
    } else {
      throw new Error('   ❌ THẤT BẠI: Dữ liệu Check-out trong DB không chính xác.');
    }

    // 5. Thử Check-out lại lần nữa (Phải báo lỗi 400 - Đã check-out hôm nay rồi)
    console.log('\n🚀 Thử Check-out lại lần nữa (Kỳ vọng trả về lỗi đã check-out)...');
    let doubleCheckOutError = false;
    const resDoubleCheckOut = {
      status: function(code) {
        console.log(`   [Double Check-out HTTP Status]: ${code}`);
        if (code === 400) {
          doubleCheckOutError = true;
        }
        return this;
      },
      json: function(data) {
        console.log('   [Double Check-out HTTP Response]:', data);
        return this;
      }
    };
    await checkOut(reqCheckOut, resDoubleCheckOut);
    if (doubleCheckOutError) {
      console.log('   ✅ ĐẠT: Hệ thống chặn Check-out trùng lặp thành công.');
    } else {
      throw new Error('   ❌ THẤT BẠI: Hệ thống không chặn Check-out trùng lặp.');
    }

  } catch (error) {
    console.error('\n❌ KẾT QUẢ KIỂM THỬ: THẤT BẠI!');
    console.error(error.message);
  } finally {
    // 6. Dọn dẹp dữ liệu sau kiểm thử
    console.log('\n🧹 Dọn dẹp dữ liệu chấm công thử nghiệm...');
    await db.query('DELETE FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [testEmployeeId, today]);
    console.log('✅ Dọn dẹp hoàn tất.');
    process.exit(0);
  }
}

testCheckInCheckOut();

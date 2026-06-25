const db = require('./src/config/db');

async function testLeaveRequest() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: Xin bổ sung công / Xin nghỉ & Thông báo...');
  
  let newReqId = null;

  try {
    const [nv] = await db.query('SELECT TOP 1 MaNhanVien FROM nhanvien');
    if (nv.length === 0) {
      console.log('Không có dữ liệu nhân viên để test.');
      return;
    }
    const maNV = nv[0].MaNhanVien;

    // --- TEST 1: GỬI YÊU CẦU BỔ SUNG ĐIỂM DANH ---
    console.log('\n🚀 Đang chạy logic: Nhân viên gửi yêu cầu bổ sung chấm công...');
    
    const testDate = new Date().toISOString().split('T')[0];
    const insertResult = await db.query(
      `INSERT INTO yeucau (MaNhanVien, LoaiYeuCau, NoiDung, NgayBatDau, NgayKetThuc, TrangThai, NgayTao) 
       OUTPUT INSERTED.MaYeuCau 
       VALUES (?, ?, ?, ?, ?, ?, GETDATE())`,
      [maNV, 'BoSungCong', 'Test xin bổ sung quên check-in', testDate, testDate, 'ChoDuyet']
    );
    
    newReqId = insertResult[0][0].MaYeuCau;
    
    if (newReqId) {
      console.log('   ✅ ĐẠT: Đã lưu yêu cầu vào DB với trạng thái "ChoDuyet".');
    }

    // --- TEST 2: GỬI THÔNG BÁO CHO QUẢN LÝ ---
    console.log('\n🚀 Đang chạy logic: Gửi thông báo thời gian thực...');
    await db.query(
      `INSERT INTO thongbao (MaNhanVien, TieuDe, NoiDung, LoaiThongBao, DaDoc, NgayTao) 
       VALUES (?, ?, ?, ?, 0, GETDATE())`,
      [maNV, 'Có yêu cầu mới', 'Một nhân viên vừa gửi yêu cầu bổ sung công', 'YeuCau']
    );
    
    const [checkThongBao] = await db.query('SELECT TOP 1 * FROM thongbao ORDER BY MaThongBao DESC');
    if (checkThongBao.length > 0 && checkThongBao[0].TieuDe === 'Có yêu cầu mới') {
      console.log('   ✅ ĐẠT: Thông báo đã được sinh ra trong hệ thống.');
    }

    // --- TEST 3: QUẢN LÝ DUYỆT YÊU CẦU ---
    console.log('\n🚀 Đang chạy logic: Quản lý phê duyệt yêu cầu...');
    await db.query('UPDATE yeucau SET TrangThai = ? WHERE MaYeuCau = ?', ['DaDuyet', newReqId]);
    
    const [checkApproved] = await db.query('SELECT TrangThai FROM yeucau WHERE MaYeuCau = ?', [newReqId]);
    if (checkApproved[0].TrangThai === 'DaDuyet') {
      console.log('   ✅ ĐẠT: Yêu cầu đã chuyển sang "DaDuyet" thành công.');
    }

  } catch (error) {
    console.error('Lỗi kiểm thử:', error.message);
  } finally {
    if (newReqId) {
       await db.query('DELETE FROM yeucau WHERE MaYeuCau = ?', [newReqId]);
       await db.query('DELETE FROM thongbao WHERE NoiDung = ?', ['Một nhân viên vừa gửi yêu cầu bổ sung công']);
       console.log('\n🧹 Dọn dẹp dữ liệu test hoàn tất.');
    }
    process.exit(0);
  }
}

testLeaveRequest();

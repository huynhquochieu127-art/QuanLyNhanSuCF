const db = require('../config/db');

// Lấy lịch sử chấm công của nhân viên
const getAttendanceHistory = async (req, res) => {
  try {
    // Nếu có query param employeeId thì lấy của người đó, không thì lấy tất cả
    const { employeeId } = req.query;
    let query = `
      SELECT c.*, t.HoTen as EmployeeName 
      FROM chamcong c 
      LEFT JOIN taikhoan t ON c.MaNhanVien = t.MaTaiKhoan 
      ORDER BY c.NgayLam DESC, c.GioCheckIn DESC
    `;
    let params = [];

    if (employeeId) {
      query = `
        SELECT c.*, t.HoTen as EmployeeName 
        FROM chamcong c 
        LEFT JOIN taikhoan t ON c.MaNhanVien = t.MaTaiKhoan 
        WHERE c.MaNhanVien = ? 
        ORDER BY c.NgayLam DESC, c.GioCheckIn DESC
      `;
      params = [employeeId];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy lịch sử chấm công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Check-in
const checkIn = async (req, res) => {
  try {
    const { MaNhanVien } = req.body;
    if (!MaNhanVien) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // Kiểm tra xem hôm nay có ca nào đang check-in dở (chưa check-out) không
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ? AND GioCheckOut IS NULL', [MaNhanVien, today]);
    
    if (check.length > 0) {
      return res.status(400).json({ success: false, message: 'Bạn đang có ca làm việc chưa check-out' });
    }

    // Tìm lịch phân ca hôm nay của nhân viên
    const [schedules] = await db.query(
      `SELECT p.*, c.GioBatDau, c.GioKetThuc 
       FROM phancanhanvien p
       JOIN calam c ON p.MaCaLam = c.MaCaLam
       WHERE p.MaNhanVien = ? AND p.NgayLam = ?`,
      [MaNhanVien, today]
    );

    // Lấy danh sách các ca đã chấm công xong hôm nay
    const [existingCheckins] = await db.query(
      'SELECT MaCaLam FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?',
      [MaNhanVien, today]
    );
    const finishedShiftIds = existingCheckins.map(ec => ec.MaCaLam);

    let maCaLam = 1; // Mặc định ca 1 nếu không có lịch phân ca
    let diTre = 0;
    const now = new Date();

    if (schedules.length > 0) {
      // Lọc các ca chưa chấm công xong
      const eligibleSchedules = schedules.filter(s => !finishedShiftIds.includes(s.MaCaLam));
      const targetSchedules = eligibleSchedules.length > 0 ? eligibleSchedules : schedules;
      
      // Tìm ca có giờ bắt đầu gần nhất với thời gian hiện tại
      let minDiff = Infinity;
      let chosenSchedule = targetSchedules[0];
      
      for (const s of targetSchedules) {
        const startTimeStr = formatTime(s.GioBatDau);
        const [h, m] = startTimeStr.split(':').map(Number);
        
        const shiftStart = new Date(now);
        shiftStart.setHours(h, m, 0, 0);
        
        const diff = Math.abs(now - shiftStart);
        if (diff < minDiff) {
          minDiff = diff;
          chosenSchedule = s;
        }
      }
      
      maCaLam = chosenSchedule.MaCaLam;
      
      // Tính đi trễ
      const startTimeStr = formatTime(chosenSchedule.GioBatDau);
      const [h, m] = startTimeStr.split(':').map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(h, m, 0, 0);
      
      if (now > shiftStart) {
        diTre = Math.round((now - shiftStart) / (1000 * 60));
      }
    }

    const query = `
      INSERT INTO chamcong (MaNhanVien, MaCaLam, NgayLam, GioCheckIn, DiTre, TrangThai)
      VALUES (?, ?, ?, ?, ?, 'IN')
    `;
    const [result] = await db.query(query, [MaNhanVien, maCaLam, today, now, diTre]);

    res.status(201).json({ success: true, message: 'Check-in thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi check-in:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Check-out
const checkOut = async (req, res) => {
  try {
    const { MaNhanVien } = req.body;
    if (!MaNhanVien) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // Tìm bản ghi chấm công hôm nay chưa check-out
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ? AND GioCheckOut IS NULL', [MaNhanVien, today]);
    
    if (check.length === 0) {
      return res.status(400).json({ success: false, message: 'Bạn chưa check-in hoặc các ca hôm nay đã check-out' });
    }

    const now = new Date();
    const checkInTime = new Date(check[0].GioCheckIn);
    
    // Tính số giờ làm
    const diffMs = now - checkInTime;
    const soGioLam = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Tính về sớm (VeSom) dựa vào ca của bản ghi chấm công
    let veSom = 0;
    const [caRows] = await db.query('SELECT GioKetThuc FROM calam WHERE MaCaLam = ?', [check[0].MaCaLam]);
    if (caRows.length > 0 && caRows[0].GioKetThuc) {
      const endTimeStr = formatTime(caRows[0].GioKetThuc);
      const [h, m] = endTimeStr.split(':').map(Number);
      
      const shiftEnd = new Date(now);
      shiftEnd.setHours(h, m, 0, 0);
      
      if (now < shiftEnd) {
        veSom = Math.round((shiftEnd - now) / (1000 * 60));
      }
    }

    const query = `
      UPDATE chamcong 
      SET GioCheckOut = ?, SoGioLam = ?, VeSom = ?, TrangThai = 'OUT'
      WHERE MaChamCong = ?
    `;
    await db.query(query, [now, soGioLam, veSom, check[0].MaChamCong]);

    res.json({ success: true, message: 'Check-out thành công', data: { soGioLam, veSom } });
  } catch (error) {
    console.error('Lỗi check-out:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy trạng thái điểm danh hôm nay
const getTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [check] = await db.query('SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?', [employeeId, today]);

    if (check.length === 0) {
      return res.json({ success: true, data: { isCheckedIn: false, checkInTime: null, totalHours: 0 } });
    }

    const isCheckedIn = !check[0].GioCheckOut;
    const checkInTime = new Date(check[0].GioCheckIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const totalHours = check[0].SoGioLam || 0;

    res.json({ success: true, data: { isCheckedIn, checkInTime, totalHours } });
  } catch (error) {
    console.error('Lỗi lấy trạng thái hôm nay:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy danh sách yêu cầu bổ sung
const getRequests = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = `
      SELECT r.*, t.HoTen as EmployeeName 
      FROM yeucau_chamcong r 
      LEFT JOIN taikhoan t ON r.MaNhanVien = t.MaTaiKhoan 
      ORDER BY r.NgayTao DESC
    `;
    let params = [];

    if (employeeId) {
      query = `
        SELECT r.*, t.HoTen as EmployeeName 
        FROM yeucau_chamcong r 
        LEFT JOIN taikhoan t ON r.MaNhanVien = t.MaTaiKhoan 
        WHERE r.MaNhanVien = ? 
        ORDER BY r.NgayTao DESC
      `;
      params = [employeeId];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Gửi yêu cầu bổ sung điểm danh hoặc xin nghỉ phép
const submitRequest = async (req, res) => {
  try {
    const { MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo } = req.body;
    if (!MaNhanVien || !Ngay || !Loai) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // 1. Chèn yêu cầu vào yeucau_chamcong (để nhân viên quản lý ở tab cá nhân)
    const query = `
      INSERT INTO yeucau_chamcong (MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(query, [MaNhanVien, Ngay, CaLam, Loai, ThoiGian, LyDo]);

    // 2. Nếu là yêu cầu nghỉ phép, đồng thời chèn vào don_xin_nghi ở trạng thái pending
    const typeLower = Loai.toLowerCase();
    if (typeLower.includes('nghỉ')) {
      const loaiNghi = typeLower.includes('ốm') ? 'om' : typeLower.includes('việc riêng') ? 'viec_rieng' : 'phep';
      const cleanDate = new Date(Ngay).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      await db.query(
        `INSERT INTO don_xin_nghi (MaNhanVien, NgayNghi, NgayNghiDen, LyDo, LoaiNghi, TrangThai)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [MaNhanVien, cleanDate, cleanDate, LyDo || 'Xin nghỉ', loaiNghi]
      );
    }

    // Lấy tên nhân viên để hiển thị trong thông báo
    const [empRows] = await db.query('SELECT HoTen FROM nhanvien WHERE MaNhanVien = ?', [MaNhanVien]);
    const empName = empRows[0]?.HoTen || 'Nhân viên';

    const cleanDate = new Date(Ngay).toLocaleDateString('vi-VN');

    // Phân loại thông báo người nhận
    if (typeLower.includes('full-time') || typeLower.includes('fulltime') || typeLower.includes('chuyển full')) {
      // Chỉ gửi cho Admin (MaVaiTro = 1)
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 1)',
        [
          'Yêu cầu chuyển Full-time',
          `Nhân viên ${empName} đã nộp đơn xin đổi sang chế độ Full-time kể từ ngày ${cleanDate}.`,
          'request'
        ]
      );
    } else {
      // Gửi cho cả Quản lý (MaVaiTro = 2) và Admin (MaVaiTro = 1)
      const title = `Yêu cầu mới: ${Loai}`;
      const content = `Nhân viên ${empName} đã gửi đơn ${Loai.toLowerCase()} cho ngày ${cleanDate}${CaLam ? ` (Ca: ${CaLam})` : ''}.`;
      
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 1)',
        [title, content, 'request']
      );
      await db.query(
        'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, NULL, 2)',
        [title, content, 'request']
      );
    }

    res.status(201).json({ success: true, message: 'Gửi yêu cầu thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Lỗi gửi yêu cầu bổ sung:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái yêu cầu (Duyệt / Từ chối)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // Lấy thông tin chi tiết yêu cầu
    const [reqRows] = await db.query('SELECT * FROM yeucau_chamcong WHERE MaYeuCau = ?', [id]);
    if (reqRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }
    const request = reqRows[0];

    // Cập nhật trạng thái yêu cầu
    const query = 'UPDATE yeucau_chamcong SET TrangThai = ? WHERE MaYeuCau = ?';
    await db.query(query, [status, id]);

    // Gửi thông báo phản hồi về cho nhân viên tạo đơn
    const cleanDate = new Date(request.Ngay).toLocaleDateString('vi-VN');
    const resultText = status === 'approved' ? 'ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
    const notifyTitle = `Kết quả duyệt yêu cầu: ${request.Loai}`;
    const notifyContent = `Yêu cầu "${request.Loai}" ngày ${cleanDate} của bạn đã ${resultText.toLowerCase()}.`;
    
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, ?, NULL)',
      [notifyTitle, notifyContent, 'approval', request.MaNhanVien]
    );

    // Xử lý tự động khi đơn được duyệt (approved)
    if (status === 'approved') {
      const typeLower = request.Loai.toLowerCase();
      
      // 1. Chuyển sang Full-time
      if (typeLower.includes('full-time') || typeLower.includes('fulltime') || typeLower.includes('chuyển full')) {
        await db.query(
          "UPDATE nhanvien SET LoaiNhanVien = N'Full-time' WHERE MaNhanVien = ?",
          [request.MaNhanVien]
        );
      }
      
      // 2. Xin nghỉ việc luôn
      else if (typeLower.includes('nghỉ việc') || typeLower.includes('nghỉ luôn') || typeLower.includes('thôi việc')) {
        await db.query(
          "UPDATE nhanvien SET TrangThai = N'Đã nghỉ việc' WHERE MaNhanVien = ?",
          [request.MaNhanVien]
        );
        await db.query(
          "UPDATE taikhoan SET TrangThaiHoatDong = 0 WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM nhanvien WHERE MaNhanVien = ?)",
          [request.MaNhanVien]
        );
      }
      
      // 3. Bổ sung điểm danh
      else if (typeLower.includes('bổ sung') || typeLower.includes('điểm danh') || typeLower.includes('công')) {
        let checkInTime = null;
        let checkOutTime = null;
        let hours = null;
        
        const dateStr = new Date(request.Ngay).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
        const timeParts = request.ThoiGian ? request.ThoiGian.split('-') : [];
        
        if (timeParts.length === 2) {
          const inStr = timeParts[0].trim();
          const outStr = timeParts[1].trim();
          checkInTime = `${dateStr} ${inStr}:00`;
          checkOutTime = `${dateStr} ${outStr}:00`;
          
          const [inH, inM] = inStr.split(':').map(Number);
          const [outH, outM] = outStr.split(':').map(Number);
          if (!isNaN(inH) && !isNaN(outH)) {
            hours = outH - inH + (outM - inM) / 60;
            if (hours < 0) hours += 24;
            hours = parseFloat(hours.toFixed(2));
          }
        } else if (timeParts.length === 1 && timeParts[0].trim()) {
          const timeStr = timeParts[0].trim();
          if (typeLower.includes('in') || typeLower.includes('vào')) {
            checkInTime = `${dateStr} ${timeStr}:00`;
            checkOutTime = null;
          } else {
            checkInTime = null;
            checkOutTime = `${dateStr} ${timeStr}:00`;
          }
        } else {
          checkInTime = `${dateStr} 08:00:00`;
          checkOutTime = `${dateStr} 17:00:00`;
          hours = 8.0;
        }

        // Định danh mã ca làm tương đối dựa theo tên ca làm trong đơn
        let maCaLam = 1;
        const caLamLower = request.CaLam ? request.CaLam.toLowerCase() : '';
        if (caLamLower.includes('sáng')) maCaLam = 2;
        else if (caLamLower.includes('chiều')) maCaLam = 3;
        else if (caLamLower.includes('tối')) maCaLam = 4;
        
        // Kiểm tra xem đã có bản ghi chấm công cho ngày này của nhân viên chưa
        const [existingAttendance] = await db.query(
          'SELECT * FROM chamcong WHERE MaNhanVien = ? AND NgayLam = ?',
          [request.MaNhanVien, dateStr]
        );
        
        let finalCheckIn = checkInTime;
        let finalCheckOut = checkOutTime;
        let finalHours = hours;

        if (existingAttendance.length > 0) {
          const existing = existingAttendance[0];
          if (!finalCheckIn && existing.GioCheckIn) {
            finalCheckIn = existing.GioCheckIn;
          }
          if (!finalCheckOut && existing.GioCheckOut) {
            finalCheckOut = existing.GioCheckOut;
          }
          
          if (finalCheckIn && finalCheckOut) {
            const parseDateTime = (dt) => {
              if (dt instanceof Date) return dt.getTime();
              if (typeof dt === 'string') {
                const isoStr = dt.replace(' ', 'T');
                const parsed = Date.parse(isoStr);
                if (!isNaN(parsed)) return parsed;
                return new Date(dt).getTime();
              }
              return NaN;
            };
            const inMs = parseDateTime(finalCheckIn);
            const outMs = parseDateTime(finalCheckOut);
            if (!isNaN(inMs) && !isNaN(outMs)) {
              let computedHours = (outMs - inMs) / (1000 * 60 * 60);
              if (computedHours < 0) computedHours += 24;
              finalHours = parseFloat(computedHours.toFixed(2));
            }
          }
          
          await db.query(
            `UPDATE chamcong 
             SET GioCheckIn = ?, 
                 GioCheckOut = ?, 
                 SoGioLam = ?, 
                 TrangThai = 'OUT',
                 GhiChu = N'Bổ sung điểm danh' 
             WHERE MaNhanVien = ? AND NgayLam = ?`,
            [finalCheckIn, finalCheckOut, finalHours, request.MaNhanVien, dateStr]
          );
        } else {
          // Thêm mới bản ghi chấm công
          await db.query(
            `INSERT INTO chamcong (MaNhanVien, MaCaLam, NgayLam, GioCheckIn, GioCheckOut, SoGioLam, TrangThai, GhiChu) 
             VALUES (?, ?, ?, ?, ?, ?, 'OUT', N'Bổ sung điểm danh')`,
            [request.MaNhanVien, maCaLam, dateStr, checkInTime, checkOutTime, hours]
          );
        }
      }
      
      // 4. Xin nghỉ ca
      else if (typeLower.includes('nghỉ ca')) {
        const dateStr = new Date(request.Ngay).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        // Trích xuất mã ca làm từ tên ca làm trong yêu cầu
        const caLamLower = request.CaLam ? request.CaLam.toLowerCase() : '';
        let maCaLam = null;
        
        const [shifts] = await db.query('SELECT MaCaLam, TenCaLam FROM calam');
        for (const s of shifts) {
          if (caLamLower.includes(s.TenCaLam.toLowerCase())) {
            maCaLam = s.MaCaLam;
            break;
          }
        }
        
        if (maCaLam) {
          await db.query(
            "UPDATE phancanhanvien SET TrangThai = N'Nghỉ' WHERE MaNhanVien = ? AND NgayLam = ? AND MaCaLam = ?",
            [request.MaNhanVien, dateStr, maCaLam]
          );
        }
        
        await db.query(
          "INSERT INTO don_xin_nghi (MaNhanVien, NgayNghi, NgayNghiDen, LyDo, LoaiNghi, TrangThai, NgayTao) VALUES (?, ?, ?, ?, 'phep', 'approved', GETDATE())",
          [request.MaNhanVien, dateStr, dateStr, request.LyDo || 'Xin nghỉ ca']
        );
      }
      
      // 5. Xin đổi ca
      else if (typeLower.includes('đổi ca')) {
        const dateStr = new Date(request.Ngay).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
        const swapInfo = request.ThoiGian;
        
        if (swapInfo && swapInfo.includes('|')) {
          const parts = swapInfo.split('|');
          const mode = parts[0];
          
          if (mode === 'self_swap') {
            const sourceCa = parseInt(parts[1], 10);
            const targetCa = parseInt(parts[2], 10);
            
            if (!isNaN(sourceCa) && !isNaN(targetCa)) {
              await db.query(
                "UPDATE phancanhanvien SET MaCaLam = ? WHERE MaNhanVien = ? AND NgayLam = ? AND MaCaLam = ?",
                [targetCa, request.MaNhanVien, dateStr, sourceCa]
              );
            }
          } else if (mode === 'peer_swap') {
            const sourceCa = parseInt(parts[1], 10);
            const targetCa = parseInt(parts[2], 10);
            const targetEmp = parseInt(parts[3], 10);
            
            if (!isNaN(sourceCa) && !isNaN(targetCa) && !isNaN(targetEmp)) {
              await db.query(
                "UPDATE phancanhanvien SET MaNhanVien = ? WHERE MaNhanVien = ? AND NgayLam = ? AND MaCaLam = ?",
                [targetEmp, request.MaNhanVien, dateStr, sourceCa]
              );
              await db.query(
                "UPDATE phancanhanvien SET MaNhanVien = ? WHERE MaNhanVien = ? AND NgayLam = ? AND MaCaLam = ?",
                [request.MaNhanVien, targetEmp, dateStr, targetCa]
              );
            }
          }
        }
      }
    }

    res.json({ success: true, message: 'Đã cập nhật trạng thái yêu cầu' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy lịch phân ca của một nhân viên trong ngày
const getScheduledShifts = async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    if (!employeeId || !date) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên hoặc ngày' });
    }

    // Resolve MaNhanVien từ MaTaiKhoan (frontend truyền MaTaiKhoan)
    const [nvRows] = await db.query('SELECT MaNhanVien FROM nhanvien WHERE MaTaiKhoan = ?', [employeeId]);
    const maNhanVien = nvRows.length > 0 ? nvRows[0].MaNhanVien : employeeId;

    // Query kết hợp phancanhanvien VÀ dangky_ca (approved) để đồng bộ với bảng lịch chính thức.
    // Dùng UNION để gộp hai nguồn mà không bị trùng lặp.
    const query = `
      SELECT DISTINCT c.MaCaLam, c.TenCaLam, c.GioBatDau, c.GioKetThuc
      FROM calam c
      WHERE c.MaCaLam IN (
        SELECT p.MaCaLam FROM phancanhanvien p
        WHERE p.MaNhanVien = ? AND p.NgayLam = ?
        UNION
        SELECT d.MaCaLam FROM dangky_ca d
        WHERE d.MaNhanVien = ? AND d.NgayLam = ? AND d.TrangThai = 'approved'
      )
      ORDER BY c.GioBatDau
    `;
    const [rows] = await db.query(query, [maNhanVien, date, maNhanVien, date]);
    const formatted = rows.map(r => ({
      MaCaLam: r.MaCaLam,
      TenCaLam: r.TenCaLam,
      GioBatDau: formatTime(r.GioBatDau),
      GioKetThuc: formatTime(r.GioKetThuc)
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Lỗi lấy lịch phân ca:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Helper format time
const formatTime = (timeVal) => {
  if (!timeVal) return '';
  if (timeVal instanceof Date) {
    const hh = String(timeVal.getUTCHours()).padStart(2, '0');
    const mm = String(timeVal.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (typeof timeVal === 'string') {
    if (timeVal.includes('T')) {
      const parts = timeVal.split('T')[1].split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeVal.substring(0, 5);
  }
  return String(timeVal);
};

// Lấy danh sách đơn xin nghỉ phép từ bảng don_xin_nghi
const getLeaveRequests = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = `
      SELECT d.*, t.HoTen as EmployeeName 
      FROM don_xin_nghi d
      LEFT JOIN taikhoan t ON d.MaNhanVien = t.MaTaiKhoan
      ORDER BY d.NgayTao DESC
    `;
    let params = [];

    if (employeeId) {
      query = `
        SELECT d.*, t.HoTen as EmployeeName 
        FROM don_xin_nghi d
        LEFT JOIN taikhoan t ON d.MaNhanVien = t.MaTaiKhoan
        WHERE d.MaNhanVien = ?
        ORDER BY d.NgayTao DESC
      `;
      params = [employeeId];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn nghỉ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái đơn nghỉ phép (Duyệt / Từ chối)
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { id } = req.params; // MaDon
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // 1. Lấy thông tin đơn nghỉ
    const [leaveRows] = await db.query('SELECT * FROM don_xin_nghi WHERE MaDon = ?', [id]);
    if (leaveRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn nghỉ' });
    }
    const leaveReq = leaveRows[0];

    // 2. Cập nhật trạng thái don_xin_nghi
    await db.query('UPDATE don_xin_nghi SET TrangThai = ?, GhiChuQL = ? WHERE MaDon = ?', [status, '', id]);

    // 3. Đồng bộ hóa sang yeucau_chamcong
    const cleanDate = new Date(leaveReq.NgayNghi).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [ycRows] = await db.query(
      `SELECT MaYeuCau FROM yeucau_chamcong 
       WHERE MaNhanVien = ? AND CAST(Ngay AS DATE) = ? AND Loai LIKE '%nghỉ%' AND TrangThai = 'pending'`,
      [leaveReq.MaNhanVien, cleanDate]
    );

    if (ycRows.length > 0) {
      const ycId = ycRows[0].MaYeuCau;
      await db.query('UPDATE yeucau_chamcong SET TrangThai = ? WHERE MaYeuCau = ?', [status, ycId]);

      // Áp dụng các thay đổi phụ trợ nếu được duyệt
      if (status === 'approved') {
        // Kiểm tra xem là xin nghỉ việc hay nghỉ ca
        const [ycDetail] = await db.query('SELECT Loai FROM yeucau_chamcong WHERE MaYeuCau = ?', [ycId]);
        const isNghiViec = ycDetail.length > 0 && ycDetail[0].Loai.toLowerCase().includes('việc');

        if (isNghiViec) {
          await db.query("UPDATE nhanvien SET TrangThai = N'Đã nghỉ việc' WHERE MaNhanVien = ?", [leaveReq.MaNhanVien]);
          await db.query(
            "UPDATE taikhoan SET TrangThaiHoatDong = 0 WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM nhanvien WHERE MaNhanVien = ?)",
            [leaveReq.MaNhanVien]
          );
        } else {
          // Xin nghỉ ca: chuyển ca làm ngày hôm đó của nhân viên thành trạng thái Nghỉ trong phancanhanvien
          const [ycFull] = await db.query('SELECT CaLam FROM yeucau_chamcong WHERE MaYeuCau = ?', [ycId]);
          const caLamLower = ycFull.length > 0 && ycFull[0].CaLam ? ycFull[0].CaLam.toLowerCase() : '';
          
          let maCaLam = null;
          const [shifts] = await db.query('SELECT MaCaLam, TenCaLam FROM calam');
          for (const s of shifts) {
            if (caLamLower.includes(s.TenCaLam.toLowerCase())) {
              maCaLam = s.MaCaLam;
              break;
            }
          }
          if (maCaLam) {
            await db.query(
              "UPDATE phancanhanvien SET TrangThai = N'Nghỉ' WHERE MaNhanVien = ? AND NgayLam = ? AND MaCaLam = ?",
              [leaveReq.MaNhanVien, cleanDate, maCaLam]
            );
          }
        }
      }
    }

    // 4. Gửi thông báo phản hồi cho nhân viên
    const cleanDateStr = new Date(leaveReq.NgayNghi).toLocaleDateString('vi-VN');
    const resultText = status === 'approved' ? 'ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
    const notifyTitle = `Kết quả duyệt đơn nghỉ`;
    const notifyContent = `Đơn xin nghỉ ngày ${cleanDateStr} của bạn đã ${resultText.toLowerCase()}.`;
    await db.query(
      'INSERT INTO thongbao (TieuDe, NoiDung, Loai, MaTaiKhoan, MaVaiTro) VALUES (?, ?, ?, ?, NULL)',
      [notifyTitle, notifyContent, 'approval', leaveReq.MaNhanVien]
    );

    res.json({ success: true, message: 'Đã cập nhật trạng thái đơn nghỉ' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn nghỉ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Hủy / xóa yêu cầu chấm công ở trạng thái chờ duyệt
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem yêu cầu có tồn tại và đang ở trạng thái chờ duyệt không
    const [reqRows] = await db.query('SELECT * FROM yeucau_chamcong WHERE MaYeuCau = ?', [id]);
    if (reqRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }
    
    const request = reqRows[0];
    if (request.TrangThai !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt' });
    }
    
    // Xóa khỏi bảng yeucau_chamcong
    await db.query('DELETE FROM yeucau_chamcong WHERE MaYeuCau = ?', [id]);
    
    // Nếu là đơn xin nghỉ, đồng thời xóa đơn tương ứng trong don_xin_nghi
    const typeLower = request.Loai.toLowerCase();
    if (typeLower.includes('nghỉ')) {
      const cleanDate = new Date(request.Ngay).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      await db.query(
        "DELETE FROM don_xin_nghi WHERE MaNhanVien = ? AND NgayNghi = ? AND TrangThai = 'pending'",
        [request.MaNhanVien, cleanDate]
      );
    }
    
    res.json({ success: true, message: 'Hủy yêu cầu thành công' });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getAttendanceHistory,
  checkIn,
  checkOut,
  getTodayStatus,
  submitRequest,
  getRequests,
  updateRequestStatus,
  getScheduledShifts,
  getLeaveRequests,
  updateLeaveRequestStatus,
  deleteRequest
};

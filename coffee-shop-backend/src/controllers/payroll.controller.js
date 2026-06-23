const db = require('../config/db');

// Tính lương tháng cho nhân viên
const getPayslip = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // format: "YYYY-MM"
    
    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên hoặc tháng' });
    }

    const [yearStr, monthStr] = month.split('-');
    const m = parseInt(monthStr);
    const y = parseInt(yearStr);

    // 1. Lấy thông tin tài khoản (vai trò, tên)
    const [user] = await db.query('SELECT t.*, v.TenVaiTro FROM taikhoan t LEFT JOIN vaitro v ON t.MaVaiTro = v.MaVaiTro WHERE t.MaTaiKhoan = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }
    const roleId = user[0].MaVaiTro;
    const roleName = user[0].TenVaiTro || 'Nhân viên';

    // 2. Xác định lương cơ bản theo role
    let baseSalary = 6000000;
    if (roleId === 1) baseSalary = 15000000; // Admin
    else if (roleId === 2) baseSalary = 10000000; // Manager
    else if (roleId === 3) baseSalary = 6000000; // Staff

    // 3. Lấy dữ liệu chấm công thực tế trong tháng
    const [attendance] = await db.query(
      'SELECT SUM(SoGioLam) as totalHours, COUNT(*) as daysWorked FROM chamcong WHERE MaNhanVien = ? AND MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? AND GioCheckOut IS NOT NULL',
      [employeeId, m, y]
    );

    const daysWorked = attendance[0].daysWorked || 0;
    const totalHours = attendance[0].totalHours || 0;

    // Giả sử 1 công = 8 tiếng, nếu số giờ làm dư ra thì tính là OT (hoặc tính OT theo ca làm)
    // Để đơn giản, ta tính overtime = totalHours - (daysWorked * 8), nếu > 0 thì là overtime
    let overtimeHours = totalHours - (daysWorked * 8);
    if (overtimeHours < 0) overtimeHours = 0;
    overtimeHours = Math.round(overtimeHours * 10) / 10;

    const dailyRate = baseSalary / 26; // Chuẩn 26 công
    const actualWorkPay = Math.round(dailyRate * daysWorked);
    const otRate = (baseSalary / 26 / 8) * 1.5;
    const otPay = Math.round(otRate * overtimeHours);

    const lunchAllowance = daysWorked * 35000;
    const bonusChuyenCan = daysWorked >= 24 ? 500000 : 200000;
    const bhxh = Math.round(baseSalary * 0.08);

    const totalIncome = actualWorkPay + otPay + lunchAllowance + bonusChuyenCan;
    const totalDeductions = bhxh + (totalIncome > 11000000 ? Math.round((totalIncome - 11000000) * 0.05) : 0);
    const netSalary = totalIncome - totalDeductions;

    res.json({
      success: true,
      data: {
        roleName,
        daysWorked,
        overtimeHours,
        actualWorkPay,
        otPay,
        lunchAllowance,
        bonusChuyenCan,
        bhxh,
        totalIncome,
        totalDeductions,
        netSalary
      }
    });
  } catch (error) {
    console.error('Lỗi tính lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getPayslip
};

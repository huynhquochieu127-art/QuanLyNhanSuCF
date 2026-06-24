const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    // 1. Tổng số nhân viên đang làm việc
    const [empRes] = await db.query("SELECT COUNT(*) as total FROM nhanvien WHERE TrangThai = 'Đang làm việc'");
    const totalEmployees = empRes[0].total || 0;

    // 2. Số nhân viên đang làm việc hôm nay
    const [workingTodayRes] = await db.query("SELECT COUNT(DISTINCT MaNhanVien) as count FROM chamcong WHERE DATE(NgayLam) = CURDATE()");
    const workingToday = workingTodayRes[0].count || 0;

    // 3. Số ca làm hôm nay
    const [shiftsTodayRes] = await db.query("SELECT COUNT(DISTINCT MaCaLam) as count FROM phancanhanvien WHERE DATE(NgayLam) = CURDATE()");
    const shiftsToday = shiftsTodayRes[0].count || 0;

    // 4. Nhân viên đi trễ
    const lateQuery = `
      SELECT COUNT(DISTINCT c.MaChamCong) as lateCount 
      FROM chamcong c 
      JOIN phancanhanvien p ON c.MaNhanVien = p.MaNhanVien AND c.NgayLam = p.NgayLam 
      JOIN calam cl ON p.MaCaLam = cl.MaCaLam 
      WHERE DATE(c.NgayLam) = CURDATE() AND TIME(c.GioCheckIn) > TIME(cl.GioBatDau)
    `;
    const [lateRes] = await db.query(lateQuery);
    const lateEmployees = lateRes[0].lateCount || 0;

    // 5. Yêu cầu nghỉ phép chờ duyệt
    const [pendingRes] = await db.query("SELECT COUNT(*) as count FROM yeucau_chamcong WHERE TrangThai = 'pending' AND Loai LIKE '%nghỉ%'");
    const pendingLeaves = pendingRes[0].count || 0;

    // 6. Biểu đồ giờ làm theo tháng
    const [chartRes] = await db.query(
      "SELECT DAY(NgayLam) as day, SUM(SoGioLam) as hours FROM chamcong WHERE MONTH(NgayLam) = ? AND YEAR(NgayLam) = ? GROUP BY DAY(NgayLam) ORDER BY DAY(NgayLam)",
      [m, y]
    );

    // Format chart data for all days in month
    const daysInMonth = new Date(y, m, 0).getDate();
    const monthlyChart = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const found = chartRes.find(item => item.day === i);
      monthlyChart.push({
        day: `Ngày ${i}`,
        hours: found ? Number(found.hours).toFixed(1) : 0
      });
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        workingToday,
        shiftsToday,
        lateEmployees,
        pendingLeaves,
        monthlyChart
      }
    });
  } catch (error) {
    console.error('Lỗi thống kê:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getDashboardStats
};

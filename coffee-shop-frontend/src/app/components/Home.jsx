import { Link } from "react-router";
import { useState, useEffect } from "react";
import { Coffee, Clock, Calendar, Users, Package, Star, FileText, LogIn, LogOut, TrendingUp, BarChart3, Bell, DollarSign, FileEdit, Printer, Download, X, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { toast } from "sonner";

const salesData = [
  { time: "08:00 AM", sales: 120, orders: 15 },
  { time: "10:00 AM", sales: 340, orders: 42 },
  { time: "12:00 PM", sales: 520, orders: 60 },
  { time: "02:00 PM", sales: 280, orders: 35 },
  { time: "04:00 PM", sales: 390, orders: 48 },
  { time: "06:00 PM", sales: 680, orders: 75 },
  { time: "08:00 PM", sales: 450, orders: 50 },
];

export default function Home() {
  const { t } = useLanguage();

  const categorySales = [
    { name: t("cat_coffee"), value: 1840, color: "#d97706" },
    { name: t("cat_bakery"), value: 920, color: "#ea580c" },
    { name: t("cat_food"), value: 650, color: "#f97316" },
  ];

  // Lọc các module hiển thị dựa theo vai trò tài khoản
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user ? String(user.MaVaiTro) : null;

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const todayStr = today.toISOString().split('T')[0];

  // State quản lý chấm công ngày hôm nay
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("-");
  const [totalHours, setTotalHours] = useState("0");

  // State quản lý Modal Phiếu lương & Bổ sung điểm danh
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showMissingAttendanceModal, setShowMissingAttendanceModal] = useState(false);

  // States của Phiếu lương
  const [payslipMonth, setPayslipMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payslipData, setPayslipData] = useState(null);

  // States của Bổ sung điểm danh / Yêu cầu
  const [requestCategory, setRequestCategory] = useState("bosung"); // bosung, xinnghi, doica, fulltime, nghiviec
  const [missingDate, setMissingDate] = useState(todayStr);
  const [missingShift, setMissingShift] = useState("Ca Hành Chính (08:00 - 17:00)");
  const [missingType, setMissingType] = useState("both"); // both, checkin, checkout
  const [missingTimeIn, setMissingTimeIn] = useState("08:00");
  const [missingTimeOut, setMissingTimeOut] = useState("17:00");
  const [missingReason, setMissingReason] = useState("");
  // Dành riêng cho Đổi ca
  const [targetSwapShift, setTargetSwapShift] = useState(""); 
  const [submitting, setSubmitting] = useState(false);

  // States của Xem Thông tin cá nhân
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Danh sách đơn bổ sung điểm danh
  const [attendanceRequests, setAttendanceRequests] = useState([]);

  // States cho Thông báo
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Fetch dữ liệu chấm công hôm nay, danh sách yêu cầu và thông báo
  useEffect(() => {
    if (user?.MaTaiKhoan) {
      const fetchTimekeeping = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/timekeeping/today-status?employeeId=${user.MaTaiKhoan}`);
          if (res.data.success) {
            setIsCheckedIn(res.data.data.isCheckedIn);
            setCheckInTime(res.data.data.checkInTime || "-");
            setTotalHours(res.data.data.totalHours || "0");
          }

          const reqRes = await axios.get(`http://localhost:5000/api/timekeeping/requests?employeeId=${user.MaTaiKhoan}`);
          if (reqRes.data.success) {
            setAttendanceRequests(reqRes.data.data.map(r => ({
              id: `RQ-${r.MaYeuCau}`,
              date: new Date(r.Ngay).toISOString().split('T')[0],
              shift: r.CaLam || "N/A",
              type: r.Loai,
              time: r.ThoiGian,
              reason: r.LyDo,
              status: r.TrangThai
            })));
          }

          // Fetch notifications
          try {
            const notifRes = await axios.get(`http://localhost:5000/api/notifications?userId=${user.MaTaiKhoan}&roleId=${user.MaVaiTro}`);
            if (notifRes.data.success) {
              setNotifications(notifRes.data.data);
            }
          } catch (err) {
            console.warn("Không lấy được danh sách thông báo:", err);
          }

          // Fetch profile details from employee table
          try {
            const empRes = await axios.get(`http://localhost:5000/api/employees/${user.MaTaiKhoan}`);
            if (empRes.data.success) {
              setProfileData(empRes.data.data);
            }
          } catch (err) {
            console.warn("Không lấy được profile từ bảng nhanvien:", err);
          }
        } catch (error) {
          console.error("Lỗi lấy dữ liệu", error);
        }
      };
      fetchTimekeeping();
    }
  }, [user?.MaTaiKhoan]);

  // Fetch phiếu lương
  useEffect(() => {
    if (user?.MaTaiKhoan && showPayslipModal) {
      const fetchPayslip = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/payroll/me/${user.MaTaiKhoan}?month=${payslipMonth}`);
          if (res.data.success) {
            setPayslipData(res.data.data);
          }
        } catch (error) {
          console.error("Lỗi lấy phiếu lương", error);
          toast.error("Không thể tải phiếu lương");
        }
      };
      fetchPayslip();
    }
  }, [user?.MaTaiKhoan, showPayslipModal, payslipMonth]);

  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setIsCheckedIn(true);
    setCheckInTime(time);
    localStorage.setItem(`isCheckedIn_${user?.MaTaiKhoan}_${todayStr}`, "true");
    localStorage.setItem(`checkInTime_${user?.MaTaiKhoan}_${todayStr}`, time);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setTotalHours("8"); // Mock 8 giờ làm việc sau khi checkout
    localStorage.setItem(`isCheckedIn_${user?.MaTaiKhoan}_${todayStr}`, "false");
    localStorage.setItem(`totalHours_${user?.MaTaiKhoan}_${todayStr}`, "8");
  };

  // Hàm đăng xuất
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:5000/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Lỗi khi đăng xuất backend:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // getPayslipData function removed as it is now fetched via API

  const handleAddAttendanceRequest = async (e) => {
    e.preventDefault();
    if (!missingReason.trim()) {
      toast.error("Vui lòng nhập lý do");
      return;
    }
    
    setSubmitting(true);
    
    try {
      let typeText = "";
      let timeText = "";
      let caText = missingShift;
      
      if (requestCategory === 'bosung') {
        typeText = `Bổ sung: ${missingType === 'both' ? 'Cả In/Out' : (missingType === 'checkin' ? 'Check-in' : 'Check-out')}`;
        timeText = missingType === 'both' ? `${missingTimeIn} - ${missingTimeOut}` : (missingType === 'checkin' ? missingTimeIn : missingTimeOut);
      } else if (requestCategory === 'xinnghi') {
        typeText = "Xin nghỉ ca làm";
        timeText = "Cả ca";
      } else if (requestCategory === 'doica') {
        typeText = "Xin đổi ca";
        if (!targetSwapShift.trim()) {
          toast.error("Vui lòng nhập thông tin ca muốn đổi");
          setSubmitting(false);
          return;
        }
        timeText = `Đổi sang: ${targetSwapShift}`;
      } else if (requestCategory === 'fulltime') {
        typeText = "Xin chuyển Full-time";
        timeText = `Áp dụng từ: ${missingDate}`;
        caText = ""; 
      } else if (requestCategory === 'nghiviec') {
        typeText = "Xin nghỉ việc";
        timeText = `Nghỉ từ ngày: ${missingDate}`;
        caText = ""; 
      }
      
      const payload = {
        MaNhanVien: user.MaTaiKhoan,
        Ngay: missingDate,
        CaLam: caText,
        Loai: typeText,
        ThoiGian: timeText,
        LyDo: missingReason
      };

      const res = await axios.post('http://localhost:5000/api/timekeeping/request', payload);
      
      if (res.data.success) {
        const newRequest = {
          id: `RQ-${res.data.data.id}`,
          date: missingDate,
          shift: caText || "N/A",
          type: typeText,
          time: timeText,
          reason: missingReason,
          status: "pending"
        };
        
        setAttendanceRequests([newRequest, ...attendanceRequests]);
        setMissingReason("");
        setTargetSwapShift("");
        toast.success("Gửi yêu cầu thành công! Đang chờ phê duyệt.");
      }
    } catch (error) {
      toast.error("Lỗi khi gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (id) => {
    const updated = attendanceRequests.filter(r => r.id !== id);
    setAttendanceRequests(updated);
    localStorage.setItem(`attendance_requests_${user?.MaTaiKhoan}`, JSON.stringify(updated));
    toast.success("Đã hủy yêu cầu bổ sung thành công.");
  };

  const handleMarkNotifRead = async (id, isRequest) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.MaThongBao === id ? { ...n, TrangThaiDoc: 1 } : n));
      setShowNotifDropdown(false);
      if (isRequest && (userRole === "1" || userRole === "2")) {
        window.location.href = "/timekeeping"; 
      }
    } catch (err) {
      console.error("Lỗi khi đọc thông báo:", err);
    }
  };

  const renderBellNotification = () => {
    const unreadCount = notifications.filter(n => n.TrangThaiDoc === 0).length;
    return (
      <div className="relative flex-shrink-0">
        <button 
          onClick={() => setShowNotifDropdown(!showNotifDropdown)}
          className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-slate-700 dark:text-zinc-300 relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex justify-between items-center">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Thông báo</span>
              {unreadCount > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      for (const notif of notifications) {
                        if (notif.TrangThaiDoc === 0) {
                          await axios.put(`http://localhost:5000/api/notifications/${notif.MaThongBao}/read`);
                        }
                      }
                      setNotifications(prev => prev.map(n => ({ ...n, TrangThaiDoc: 1 })));
                      toast.success("Đã đọc tất cả thông báo");
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-[10px] text-blue-500 hover:underline font-bold"
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.MaThongBao}
                    onClick={() => handleMarkNotifRead(notif.MaThongBao, notif.Loai === 'request')}
                    className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-855 transition-colors cursor-pointer text-left relative flex gap-3 ${
                      notif.TrangThaiDoc === 0 ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      {notif.Loai === 'request' ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : notif.Loai === 'approval' ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${notif.TrangThaiDoc === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-400'}`}>
                        {notif.TieuDe}
                      </p>
                      <p className="text-xxs text-slate-500 dark:text-zinc-500 mt-0.5 line-clamp-2">
                        {notif.NoiDung}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                        {new Date(notif.NgayTao).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    {notif.TrangThaiDoc === 0 && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 self-center" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const modules = [
    { to: "/pos", icon: Coffee, title: t("nav_pos"), description: t("desc_pos"), color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
    { to: "/employees", icon: Users, title: t("nav_employees"), description: t("desc_employees"), color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
    { to: "/products", icon: Package, title: t("nav_products"), description: t("desc_products"), color: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400" },
    { to: "/customers", icon: Star, title: t("nav_customers"), description: t("desc_customers"), color: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400" },
    { to: "/scheduling", icon: Calendar, title: t("nav_scheduling"), description: t("desc_scheduling"), color: "bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400" },
    { to: "/timekeeping", icon: Clock, title: t("nav_timekeeping"), description: t("desc_timekeeping"), color: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" },
    {
      onClick: () => setShowPayslipModal(true),
      icon: DollarSign,
      title: t("nav_payslip") || "Phiếu lương",
      description: t("desc_payslip") || "Xem chi tiết phiếu lương hàng tháng",
      color: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
      forStaffOnly: true
    },
    {
      onClick: () => setShowMissingAttendanceModal(true),
      icon: FileEdit,
      title: t("nav_missing_attendance") || "Gửi Yêu Cầu",
      description: t("desc_missing_attendance") || "Xin nghỉ, đổi ca, bổ sung công",
      color: "bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
      forStaffOnly: true
    },
    { to: "/logs", icon: FileText, title: t("nav_logs"), description: t("desc_logs"), color: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" },
    user ? {
      onClick: handleLogout,
      icon: LogOut,
      title: t("logout") || "Đăng xuất",
      description: "Đăng xuất khỏi hệ thống",
      color: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400"
    } : {
      to: "/login",
      icon: LogIn,
      title: t("login_btn") + " Portal",
      description: t("desc_login"),
      color: "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
    }
  ];

  const isAllowed = (m) => {
    if (m.forStaffOnly) {
      return userRole === "3";
    }

    if (m.onClick) return !!userRole;

    // Nếu chưa đăng nhập, chỉ cho phép xem trang Login và Home
    if (!userRole) {
      return m.to === "/login" || m.to === "/";
    }
    
    // Nếu là Staff (3), ẩn các module quản lý
    if (userRole === "3") {
      const restricted = ["/employees", "/products", "/logs"];
      return !restricted.includes(m.to);
    }
    
    // Nếu là Manager (2), ẩn logs (chỉ Admin được xem logs) và ẩn Login Portal
    if (userRole === "2") {
      return m.to !== "/logs" && m.to !== "/login";
    }
    
    // Admin (1) xem được tất cả trừ nút Login Portal
    return m.to !== "/login";
  };

  const filteredModules = modules.filter(isAllowed);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {userRole === "3" ? (
          /* --- STAFF DASHBOARD HEADER --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Left Panel: Profile */}
            <div className="lg:col-span-1 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-xl flex-shrink-0">
                {user?.HoTen ? user.HoTen.split(" ").pop().slice(0, 2).toUpperCase() : "NV"}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                  <span>{t("system_active")}</span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate group hover:text-amber-600 transition-colors">
                  {user?.HoTen || "Nguyễn Phạm Trang Dung"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5 hover:underline">
                  Xem thông tin hồ sơ
                </p>
              </div>
              
              {/* Bell/Notification */}
              {renderBellNotification()}
            </div>

            {/* Right Panel: Attendance Card (cols 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl">
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Dữ liệu ngày {dateFormatted}
                </p>
                <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Giờ điểm danh</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{checkInTime}</p>
                  </div>
                  <div className="border-x border-slate-100 dark:border-zinc-800 px-4">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Tổng giờ</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">
                      {totalHours} <span className="text-xs font-medium text-slate-400">Giờ</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Nơi làm việc</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight truncate" title="Katinat, D1, Phê La">
                      Katinat, D1, Phê La
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- ADMIN & MANAGER ORIGINAL HEADER & BENTO DASHBOARD ANALYTICS --- */
          <div className="space-y-10">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t("home_title")}</h1>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">{t("home_welcome")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold">
                    {t("system_active")}
                  </span>
                </div>
                {renderBellNotification()}
              </div>
            </div>

            {/* Bento Dashboard Analytics (Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart (col-span-2) */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>{t("chart_sales_trend")}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">{t("chart_peak_hours")}</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" className="hidden dark:block" />
                      <XAxis dataKey="time" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: "16px", 
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", 
                          background: "var(--color-card)", 
                          border: "1px solid var(--color-border)",
                          color: "var(--color-foreground)"
                        }} 
                      />
                      <Area type="monotone" dataKey="sales" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Popular Categories Chart (col-span-1) */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <span>{t("chart_share")}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">{t("chart_departments")}</h3>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySales} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" className="hidden dark:block" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: "16px", 
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", 
                          background: "var(--color-card)", 
                          border: "1px solid var(--color-border)",
                          color: "var(--color-foreground)"
                        }} 
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Modules Grid Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("modules_title")}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredModules.map((module, i) => {
              const Icon = module.icon;
              const cardContent = (
                <>
                  <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors mb-1">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      {module.description}
                    </p>
                  </div>
                </>
              );

              const cardClass = "bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl shadow-md p-6 hover:shadow-xl transition-all group hover:-translate-y-1.5 flex flex-col justify-between h-44 cursor-pointer text-left w-full";

              return (
                <motion.div
                  key={module.to || module.title || 'logout'}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  {module.onClick ? (
                    <button
                      onClick={module.onClick}
                      className={cardClass}
                    >
                      {cardContent}
                    </button>
                  ) : (
                    <Link
                      to={module.to}
                      className={cardClass}
                    >
                      {cardContent}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
      </div>

      {/* --- MODAL PHIẾU LƯƠNG --- */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-zinc-950/80 animate-fade-in overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Phiếu Lương Chi Tiết</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Xem và tải về thông tin thu nhập của bạn</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowPayslipModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Month Selector & Employee Profile Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-100 dark:border-zinc-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
                    {user?.HoTen ? user.HoTen.split(" ").pop().slice(0, 2).toUpperCase() : "NV"}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                      {user?.HoTen || "Nguyễn Phạm Trang Dung"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">
                      Chức danh: <span className="text-slate-700 dark:text-zinc-300 font-bold">{payslipData?.roleName || "Nhân viên"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Kỳ lương:</label>
                  <select 
                    value={payslipMonth} 
                    onChange={(e) => setPayslipMonth(e.target.value)}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-800 dark:text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="2026-06">Tháng 06 / 2026</option>
                    <option value="2026-05">Tháng 05 / 2026</option>
                    <option value="2026-04">Tháng 04 / 2026</option>
                  </select>
                </div>
              </div>

              {/* Salary Calculations & Specs */}
              {payslipData ? (
                <div className="space-y-4">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 text-center">
                      <span className="text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Ngày công</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white">{payslipData.daysWorked} công</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 text-center">
                      <span className="text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Tăng ca</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white">{payslipData.overtimeHours} giờ</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 text-center">
                      <span className="text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Tổng thu nhập</span>
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 block mt-1">{formatVND(payslipData.totalIncome)}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 text-center">
                      <span className="text-xxs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Tổng giảm trừ</span>
                      <span className="text-sm font-extrabold text-red-500 block mt-1">{formatVND(payslipData.totalDeductions)}</span>
                    </div>
                  </div>

                  {/* Detailed breakdown list */}
                  <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Khoản mục thu nhập & giảm trừ</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-850 px-5 text-sm font-medium">
                      {/* 1. Lương cơ bản tính theo công */}
                      <div className="py-3 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Lương ngày công thực tế ({payslipData.daysWorked} ngày)</span>
                        <span className="text-slate-800 dark:text-white font-bold">{formatVND(payslipData.actualWorkPay)}</span>
                      </div>
                      {/* 2. Lương tăng ca */}
                      <div className="py-3 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Lương tăng ca ({payslipData.overtimeHours} giờ x 150%)</span>
                        <span className="text-slate-800 dark:text-white font-bold">{formatVND(payslipData.otPay)}</span>
                      </div>
                      {/* 3. Phụ cấp ăn trưa */}
                      <div className="py-3 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Phụ cấp tiền ăn (35.000đ/ngày)</span>
                        <span className="text-slate-800 dark:text-white font-bold">{formatVND(payslipData.lunchAllowance)}</span>
                      </div>
                      {/* 4. Thưởng chuyên cần */}
                      <div className="py-3 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Thưởng chuyên cần / Hỗ trợ</span>
                        <span className="text-slate-800 dark:text-white font-bold">{formatVND(payslipData.bonusChuyenCan)}</span>
                      </div>
                      {/* 5. Khấu trừ BHXH */}
                      <div className="py-3 flex justify-between">
                        <span className="text-red-500 font-semibold">Khấu trừ Bảo hiểm xã hội (8% lương CB)</span>
                        <span className="text-red-500 font-bold">-{formatVND(payslipData.bhxh)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income Callout */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Thực Nhận (Net Salary)</span>
                      <span className="text-xxs text-emerald-600 dark:text-emerald-500 font-medium">Số tiền chuyển khoản cuối cùng</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatVND(payslipData.netSalary)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">Đang tải dữ liệu lương...</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 rounded-b-3xl">
              <button 
                onClick={() => {
                  toast.success("Đang kết nối đến máy in để in phiếu lương...");
                }}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In phiếu lương
              </button>
              <button 
                onClick={() => {
                  toast.success("Bắt đầu tải xuống PDF Phiếu lương...");
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải xuống PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- MODAL GỬI YÊU CẦU NHÂN SỰ --- */}
      {showMissingAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-zinc-950/80 animate-fade-in overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
          >
            {/* Left Panel: Form submission */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-950/40 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Gửi Yêu Cầu Nhân Sự</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Nghỉ phép, đổi ca, bổ sung công</p>
                  </div>
                </div>
                <button onClick={() => setShowMissingAttendanceModal(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAttendanceRequest} className="space-y-4">
                {/* Loại Yêu cầu */}
                <div>
                  <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Loại Yêu Cầu</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "bosung", label: "Bổ sung công" },
                      { id: "xinnghi", label: "Xin nghỉ ca" },
                      { id: "doica", label: "Xin đổi ca" },
                      { id: "fulltime", label: "Xin chuyển Full-time" },
                      { id: "nghiviec", label: "Xin nghỉ việc" }
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setRequestCategory(type.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          requestCategory === type.id 
                            ? "bg-sky-500 border-sky-500 text-white shadow-md" 
                            : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-850 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Ngày áp dụng</label>
                  <input 
                    type="date" 
                    value={missingDate}
                    max={requestCategory === 'bosung' ? todayStr : undefined}
                    min={requestCategory !== 'bosung' ? todayStr : undefined}
                    onChange={(e) => setMissingDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Shift Selector */}
                {requestCategory !== 'fulltime' && requestCategory !== 'nghiviec' && (
                  <div>
                    <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Ca làm việc liên quan</label>
                    <select 
                      value={missingShift}
                      onChange={(e) => setMissingShift(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="Ca Hành Chính (08:00 - 17:00)">Ca Hành Chính (08:00 - 17:00)</option>
                      <option value="Ca Sáng (08:00 - 12:00)">Ca Sáng (08:00 - 12:00)</option>
                      <option value="Ca Chiều (13:00 - 17:00)">Ca Chiều (13:00 - 17:00)</option>
                      <option value="Ca Tối (18:00 - 22:00)">Ca Tối (18:00 - 22:00)</option>
                      <option value="Cả Ngày">Cả Ngày</option>
                    </select>
                  </div>
                )}

                {/* Render conditional inputs based on Request Category */}
                {requestCategory === 'bosung' && (
                  <>
                    <div>
                      <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Thông tin bổ sung</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { id: "both", label: "Cả In & Out" },
                          { id: "checkin", label: "Giờ Check-in" },
                          { id: "checkout", label: "Giờ Check-out" }
                        ].map((type) => (
                          <button
                            type="button"
                            key={type.id}
                            onClick={() => setMissingType(type.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                              missingType === type.id 
                                ? "bg-amber-500 border-amber-500 text-white" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {(missingType === "both" || missingType === "checkin") && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Giờ Vào (Check-in)</label>
                            <input 
                              type="time" 
                              value={missingTimeIn}
                              onChange={(e) => setMissingTimeIn(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-bold focus:outline-none"
                              required
                            />
                          </div>
                        )}
                        {(missingType === "both" || missingType === "checkout") && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Giờ Ra (Check-out)</label>
                            <input 
                              type="time" 
                              value={missingTimeOut}
                              onChange={(e) => setMissingTimeOut(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-bold focus:outline-none"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {requestCategory === 'doica' && (
                  <div>
                    <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Bạn muốn đổi với ai / sang ca nào?</label>
                    <input 
                      type="text" 
                      value={targetSwapShift}
                      onChange={(e) => setTargetSwapShift(e.target.value)}
                      placeholder="VD: Đổi sang ca Chiều thứ 4 với bạn A"
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                )}

                {/* Reason Text Area & Chips */}
                <div>
                  <label className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Lý do chi tiết</label>
                  <textarea 
                    value={missingReason}
                    onChange={(e) => setMissingReason(e.target.value)}
                    placeholder="Vui lòng nhập lý do..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  
                  {/* Quick suggestion chips based on category */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(requestCategory === 'bosung' ? [
                      "Lỗi máy chấm công", "Quên quẹt vân tay", "Đi tiếp khách"
                    ] : requestCategory === 'xinnghi' ? [
                      "Bận việc gia đình", "Ốm đau / Khám bệnh", "Việc cá nhân đột xuất"
                    ] : requestCategory === 'doica' ? [
                      "Bận lịch học", "Kẹt xe / Xe hỏng", "Nhờ bạn làm thay"
                    ] : requestCategory === 'fulltime' ? [
                      "Muốn cống hiến lâu dài", "Đã thu xếp được lịch", "Đủ điều kiện thời gian"
                    ] : [
                      "Lý do cá nhân", "Chuyển nơi cư trú", "Tập trung học tập"
                    ]).map((chip) => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => setMissingReason(chip)}
                        className="text-xxs font-extrabold bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-4"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Đang gửi..." : "Gửi Yêu Cầu"}
                </button>
              </form>
            </div>

            {/* Right Panel: Request History */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-zinc-900/60 p-6 flex flex-col justify-between rounded-r-3xl border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800">
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Yêu cầu gần đây</h4>
                  <button 
                    onClick={() => setShowMissingAttendanceModal(false)}
                    className="md:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-slate-500 dark:text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {attendanceRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm relative group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xxs font-black text-slate-400 dark:text-zinc-500">{req.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          req.status === "approved" 
                            ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                            : req.status === "pending"
                            ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        }`}>
                          {req.status === "approved" ? "Đã duyệt" : req.status === "pending" ? "Chờ duyệt" : "Từ chối"}
                        </span>
                      </div>
                      
                      <p className="text-xs font-black text-slate-800 dark:text-white">{req.date}</p>
                      <p className="text-xxs text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">{req.shift}</p>
                      
                      <div className="mt-1.5 flex flex-col gap-0.5 text-xxs font-medium text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 p-2 rounded-lg">
                        <div><span className="font-bold text-slate-700 dark:text-zinc-300">Loại:</span> {req.type}</div>
                        <div><span className="font-bold text-slate-700 dark:text-zinc-300">Giờ:</span> {req.time}</div>
                        <div className="truncate"><span className="font-bold text-slate-700 dark:text-zinc-300">Lý do:</span> {req.reason}</div>
                      </div>

                      {/* Cancel pending request */}
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="absolute right-2 bottom-2 text-red-500 hover:text-red-600 text-xxs font-bold opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 dark:bg-red-950/30 rounded"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button for desktop layout */}
              <button
                onClick={() => setShowMissingAttendanceModal(false)}
                className="hidden md:block w-full py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-350 transition-colors mt-6"
              >
                Đóng cửa sổ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

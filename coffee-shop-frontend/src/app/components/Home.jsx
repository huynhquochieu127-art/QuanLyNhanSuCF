import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Coffee, Clock, Calendar, Users, Package, Star, FileText, LogIn, LogOut, TrendingUp, BarChart3, Bell, DollarSign, FileEdit, Printer, Download, X, CheckCircle2, AlertCircle, Send, AlertTriangle, UserMinus, UserCheck, LayoutList } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const attendanceTrendData = [
    { name: "Đúng giờ", value: 85, color: "#10b981" },
    { name: "Đi trễ", value: 10, color: "#f59e0b" },
    { name: "Vắng mặt", value: 5, color: "#ef4444" },
  ];

  // Lọc các module hiển thị dựa theo vai trò tài khoản
  const userStr = sessionStorage.getItem('user');
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
  const [scheduledStart, setScheduledStart] = useState("-");
  const [totalHours, setTotalHours] = useState("0.00");
  const [checkInTimestamp, setCheckInTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("vi-VN"));

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // State quản lý Modal Phiếu lương & Bổ sung điểm danh
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showMissingAttendanceModal, setShowMissingAttendanceModal] = useState(false);
  const [showMyScheduleModal, setShowMyScheduleModal] = useState(false);
  const [mySchedules, setMySchedules] = useState([]);
  const [selectedMyShift, setSelectedMyShift] = useState(null);

  // States của Phiếu lương
  const [payslipMonth, setPayslipMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payslipData, setPayslipData] = useState(null);
  const [payslipError, setPayslipError] = useState(null);

  // States của Bổ sung điểm danh / Yêu cầu
  const [requestCategory, setRequestCategory] = useState("bosung"); // bosung, xinnghi, doica
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Danh sách đơn bổ sung điểm danh
  const [attendanceRequests, setAttendanceRequests] = useState([]);

  // Dữ liệu thống kê dành cho Admin
  const [adminStats, setAdminStats] = useState(null);

  // States quản lý thông báo
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch dữ liệu chấm công hôm nay và danh sách yêu cầu
  useEffect(() => {
    if (user?.MaTaiKhoan) {
      const fetchTimekeeping = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/timekeeping/today-status?employeeId=${user.MaTaiKhoan}`);
          if (res.data.success) {
            setIsCheckedIn(res.data.data.isCheckedIn);
            setCheckInTime(res.data.data.checkInTime || "-");
            setScheduledStart(res.data.data.scheduledStart || "-");
            if (!res.data.data.isCheckedIn && res.data.data.totalHours) {
              setTotalHours(res.data.data.totalHours);
            }
            if (res.data.data.checkInTimestamp) {
              setCheckInTimestamp(res.data.data.checkInTimestamp);
            }
          }

          const reqRes = await axios.get(`http://localhost:5000/api/timekeeping/requests?employeeId=${user.MaTaiKhoan}`);
          if (reqRes.data.success) {
            setAttendanceRequests(reqRes.data.data.map(r => ({
              id: `RQ-${r.MaYeuCau}`,
              date: new Date(r.Ngay).toISOString().split('T')[0],
              shift: r.CaLam,
              type: r.Loai,
              time: r.ThoiGian,
              reason: r.LyDo,
              status: r.TrangThai
            })));
          }
        } catch (error) {
          console.error("Lỗi lấy dữ liệu", error);
        }
      };

      // Lấy dữ liệu profile
      const fetchProfile = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/employees/${user.MaTaiKhoan}`);
          if (res.data.success) {
            setProfileData(res.data.data);
          }
        } catch (error) {
          console.error("Lỗi tải thông tin cá nhân:", error);
        }
      };

      // Fetch thống kê Admin
      const fetchAdminStats = async () => {
        if (userRole === "1") {
          try {
            const res = await axios.get(`http://localhost:5000/api/stats/dashboard`);
            if (res.data.success) {
              setAdminStats(res.data.data);
            }
          } catch (error) {
            console.error("Lỗi lấy thống kê admin:", error);
          }
        }
      };

      // Fetch thông báo
      const fetchNotifs = async () => {
        try {
          const res = await axios.get("http://localhost:5000/api/notifications");
          if (res.data.success) {
            setNotifications(res.data.data);
          }
        } catch (error) {
          console.error("Lỗi tải thông báo:", error);
        }
      };

      fetchTimekeeping();
      
      if (showProfileModal && !profileData) {
        fetchProfile();
      }

      fetchAdminStats();
      fetchNotifs();
    }
  }, [user?.MaTaiKhoan, showProfileModal, userRole]);

  // Bộ đếm thời gian đếm ngược (đếm số giờ đã làm)
  useEffect(() => {
    let interval = null;
    if (isCheckedIn && checkInTimestamp) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(checkInTimestamp);
        const diffMs = now - start;
        const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        setTotalHours(hours);
      }, 60000); // Cập nhật mỗi phút
      
      // Chạy ngay lần đầu
      const now = new Date();
      const start = new Date(checkInTimestamp);
      setTotalHours(((now - start) / (1000 * 60 * 60)).toFixed(2));
    } else if (!isCheckedIn && !checkInTimestamp) {
      setTotalHours("0.00");
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTimestamp]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await axios.put(`http://localhost:5000/api/employees/${user.MaTaiKhoan}`, editProfileForm);
      if (res.data.success) {
        toast.success("Cập nhật hồ sơ thành công!");
        setProfileData({ ...profileData, ...editProfileForm });
        
        // Update user state and local storage as well if HoTen changed
        if (editProfileForm.HoTen !== user.HoTen) {
          const updatedUser = { ...user, HoTen: editProfileForm.HoTen };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          // Note: we might need to reload or rely on the state update above if we had a full context
        }
        
        setIsEditingProfile(false);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật hồ sơ");
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  // Fetch phiếu lương
  useEffect(() => {
    if (user?.MaTaiKhoan && showPayslipModal) {
      const fetchPayslip = async () => {
        setPayslipError(null);
        setPayslipData(null);
        try {
          const res = await axios.get(`http://localhost:5000/api/payroll/me/${user.MaTaiKhoan}?month=${payslipMonth}&_t=${Date.now()}`);
          if (res.data.success) {
            setPayslipData(res.data.data);
          } else {
            setPayslipError(res.data.message || "Phiếu lương chưa được phê duyệt.");
          }
        } catch (error) {
          console.error("Lỗi lấy phiếu lương", error);
          setPayslipError(error.response?.data?.message || "Không thể tải phiếu lương");
        }
      };
      fetchPayslip();
    }
  }, [user?.MaTaiKhoan, showPayslipModal, payslipMonth]);

  // Fetch lịch làm việc của tôi
  useEffect(() => {
    if (user?.MaTaiKhoan && showMyScheduleModal) {
      const fetchMySchedule = async () => {
        try {
          const now = new Date();
          const day = now.getDay() || 7;
          const mon = new Date(now);
          mon.setDate(now.getDate() - day + 1);
          const sun = new Date(mon);
          sun.setDate(mon.getDate() + 6);
          const startStr = mon.toISOString().split('T')[0];
          const endStr = sun.toISOString().split('T')[0];

          const res = await axios.get(`http://localhost:5000/api/shifts/registrations?startDate=${startStr}&endDate=${endStr}`);
          if (res.data.success) {
            const approvedRegs = res.data.data.filter(r => r.MaNhanVien === user.MaTaiKhoan && r.TrangThai === "approved");
            // Sắp xếp theo ngày
            approvedRegs.sort((a, b) => new Date(a.NgayLam) - new Date(b.NgayLam));
            setMySchedules(approvedRegs);
          }
        } catch (error) {
          console.error("Lỗi lấy lịch làm việc", error);
        }
      };
      fetchMySchedule();
    }
  }, [user?.MaTaiKhoan, showMyScheduleModal]);

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
      const token = sessionStorage.getItem('token');
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
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
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
      
      if (requestCategory === 'bosung') {
        typeText = `Bổ sung: ${missingType === 'both' ? 'Cả In/Out' : (missingType === 'checkin' ? 'Check-in' : 'Check-out')}`;
        timeText = missingType === 'both' ? `${missingTimeIn} - ${missingTimeOut}` : (missingType === 'checkin' ? missingTimeIn : missingTimeOut);
      } else if (requestCategory === 'xinnghi') {
        typeText = "Xin nghỉ phép";
        timeText = "Cả ca";
      } else if (requestCategory === 'doica') {
        typeText = "Xin đổi ca";
        if (!targetSwapShift.trim()) {
          toast.error("Vui lòng nhập ca muốn đổi sang");
          setSubmitting(false);
          return;
        }
        timeText = `Đổi sang: ${targetSwapShift}`;
      }
      
      const payload = {
        MaNhanVien: user.MaTaiKhoan,
        Ngay: missingDate,
        CaLam: missingShift,
        Loai: typeText,
        ThoiGian: timeText,
        LyDo: missingReason
      };

      if (requestCategory === "doica") {
        payload.targetShift = targetSwapShift;
      }
      const res = await axios.post(`http://localhost:5000/api/timekeeping/request`, payload);
      
      if (res.data.success) {
        const newRequest = {
          id: `RQ-${res.data.data.id}`,
          date: missingDate,
          shift: missingShift,
          type: typeText,
          time: timeText,
          reason: missingReason,
          status: "pending"
        };
        
        setAttendanceRequests([newRequest, ...attendanceRequests]);
        setMissingReason("");
        toast.success("Gửi yêu cầu bổ sung điểm danh thành công! Đang chờ phê duyệt.");
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

  const modules = [
    { to: "/employees", icon: Users, title: t("nav_employees") || "Nhân viên", description: t("desc_employees") || "Quản lý hồ sơ nhân viên", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
    { to: "/customers", icon: Star, title: t("nav_customers"), description: t("desc_customers"), color: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400" },
    { to: "/timekeeping", icon: CheckCircle2, title: t("nav_timekeeping") || "Chấm công", description: t("desc_timekeeping") || "Điểm danh & Quản lý giờ làm", color: "bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400" },
    { to: "/scheduling", icon: Calendar, title: t("nav_scheduling"), description: t("desc_scheduling"), color: "bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400" },
    {
      onClick: () => setShowMyScheduleModal(true),
      icon: Calendar,
      title: "Lịch Làm Việc",
      description: "Lập lịch ca trực nhân viên",
      color: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
      forStaffOnly: true
    },
    { to: "/shift-management", icon: Clock, title: "Quản lý Ca làm", description: "Thiết lập và quản lý các khung giờ ca làm", color: "bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400" },
    { to: "/employee-timesheet", icon: LayoutList, title: t("nav_employee_timesheet") || "Bảng Công Nhân Viên", description: "Quản lý điểm danh, yêu cầu và bảng công tháng", color: "bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400", managerOnly: true },
    { to: "/my-timesheet", icon: LayoutList, title: t("nav_my_timesheet") || "Bảng Công Của Tôi", description: "Xem chi tiết số công hàng tháng & phản hồi", color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
    { to: "/payroll", icon: DollarSign, title: t("nav_payroll") || "Quản lý lương", description: t("desc_payroll") || "Tính toán và xuất bảng lương", color: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
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

    if (m.managerOnly) {
      return userRole === "1" || userRole === "2";
    }

    if (m.onClick) return !!userRole;

    // Nếu chưa đăng nhập, chỉ cho phép xem trang Login và Home
    if (!userRole) {
      return m.to === "/login" || m.to === "/";
    }
    
    // Nếu là Staff (3), ẩn các module quản lý
    if (userRole === "3") {
      const restricted = ["/employees", "/shift-management", "/logs", "/payroll"];
      return !restricted.includes(m.to);
    }
    
    // Nếu là Manager (2), ẩn logs, ẩn tính lương và ẩn Login Portal
    if (userRole === "2") {
      return m.to !== "/logs" && m.to !== "/payroll" && m.to !== "/login";
    }
    
    // Admin (1) xem được tất cả trừ nút Login Portal
    return m.to !== "/login";
  };

  const filteredModules = modules.filter(isAllowed);

  return (
    <AdminLayout>
      <div className="space-y-8">
        
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
              <div className="relative flex-shrink-0">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-slate-700 dark:text-zinc-300 relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50 text-left">
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-800 dark:text-white">
                      Thông báo ({notifications.length})
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">Không có thông báo mới.</p>
                      ) : notifications.map(n => (
                        <div 
                          key={n.MaTB} 
                          onClick={() => {
                            setShowNotifications(false);
                            const title = n.TieuDe.toLowerCase();
                            const content = n.NoiDung.toLowerCase();
                            if (title.includes("đăng ký") || title.includes("lịch") || content.includes("đăng ký") || content.includes("lịch")) {
                              const isStaff = user && String(user.MaVaiTro) === "3";
                              const isScheduleFinalized = title.includes("lịch") || content.includes("duyệt");
                              if (isStaff && isScheduleFinalized) {
                                setShowMyScheduleModal(true);
                              } else {
                                const weekMatch = n.NoiDung.match(/\d{4}-\d{2}-\d{2}/);
                                const targetWeek = weekMatch ? weekMatch[0] : "";
                                if (targetWeek) {
                                  navigate(`/scheduling?week=${targetWeek}&tab=register`);
                                } else {
                                  navigate("/scheduling");
                                }
                              }
                            }
                          }}
                          className="p-4 border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                        >
                          <div className="font-bold text-sm text-slate-800 dark:text-white">{n.TieuDe}</div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{n.NoiDung}</div>
                          <div className="text-[10px] text-slate-400 mt-2">{new Date(n.NgayTao).toLocaleString("vi-VN")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Attendance Card (cols 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl">
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Dữ liệu ngày {dateFormatted}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Giờ hiện tại</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{currentTime}</p>
                  </div>
                  <div className="border-x border-slate-100 dark:border-zinc-800 px-4">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Giờ vào làm</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{scheduledStart}</p>
                  </div>
                  <div className="border-r border-slate-100 dark:border-zinc-800 pr-4">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase mb-1">Giờ làm</p>
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
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                    {userRole === "1" 
                      ? t("home_welcome_admin") 
                      : userRole === "2" 
                        ? t("home_welcome_manager") 
                        : t("home_welcome_staff")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold">
                  {t("system_active")}
                </span>
              </div>
            </div>

            {/* THỐNG KÊ ADMIN (Role 1 only) */}
            {userRole === "1" && adminStats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  {/* Card 1: Tổng số nhân viên */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Tổng nhân viên</p>
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{adminStats.totalEmployees}</h3>
                  </div>

                  {/* Card 2: NV làm việc hôm nay */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Làm việc hôm nay</p>
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{adminStats.workingToday}</h3>
                  </div>

                  {/* Card 3: Số ca làm hôm nay */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Số ca hôm nay</p>
                      <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{adminStats.shiftsToday}</h3>
                  </div>

                  {/* Card 4: Nhân viên đi trễ */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Nhân viên đi trễ</p>
                      <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-rose-600 dark:text-rose-500">{adminStats.lateEmployees}</h3>
                  </div>

                  {/* Card 5: Yêu cầu nghỉ phép */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Nghỉ phép chờ duyệt</p>
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <UserMinus className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500">{adminStats.pendingLeaves}</h3>
                  </div>
                </div>

                {/* Bento Dashboard Analytics (Charts) for HRM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Work Hours Chart (col-span-2) */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span>Xu hướng</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Biểu đồ giờ làm theo tháng</h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={adminStats.monthlyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" className="hidden dark:block" />
                          <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
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
                          <Area type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

              {/* Attendance Trend Chart (col-span-1) */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <BarChart3 className="w-4 h-4 text-sky-500" />
                    <span>Tỷ lệ</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Trạng thái chuyên cần</h3>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                        {attendanceTrendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
              </>
            )}
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

      <AnimatePresence>
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
              {payslipError ? (
                <div className="text-center py-16 text-slate-500 space-y-4">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 dark:text-zinc-200">{payslipError}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Vui lòng đợi Ban quản lý/Admin tính toán và duyệt bảng lương chính thức.</p>
                  </div>
                </div>
              ) : payslipData ? (
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
                disabled={!payslipData}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In phiếu lương
              </button>
              <button 
                onClick={() => {
                  toast.success("Bắt đầu tải xuống PDF Phiếu lương...");
                }}
                disabled={!payslipData}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải xuống PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showMyScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-zinc-950/80 animate-fade-in overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                {selectedMyShift ? (
                  <button 
                    onClick={() => setSelectedMyShift(null)}
                    className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedMyShift ? "Chi Tiết Ca Làm" : "Lịch Làm Việc Của Bạn"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {selectedMyShift ? new Date(selectedMyShift.NgayLam).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : "Ca làm việc đã được quản lý phê duyệt trong tuần này"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowMyScheduleModal(false); setSelectedMyShift(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {selectedMyShift ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">{selectedMyShift.TenCaLam}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Thời gian</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                          {selectedMyShift.GioBatDau} - {selectedMyShift.GioKetThuc}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cơ sở làm việc</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Chi nhánh Chính</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Trạng thái chấm công</p>
                        <div className="flex flex-col gap-1.5 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Giờ vào:</span>
                            {new Date(selectedMyShift.NgayLam).toDateString() === new Date().toDateString() && checkInTime !== "-" ? (
                              <span className="font-bold text-emerald-600">Đã chấm ({checkInTime})</span>
                            ) : (
                              <span className="font-bold text-slate-400">Chưa chấm</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Giờ ra:</span>
                            {new Date(selectedMyShift.NgayLam).toDateString() === new Date().toDateString() && totalHours !== "0" ? (
                              <span className="font-bold text-emerald-600">Đã chấm</span>
                            ) : (
                              <span className="font-bold text-slate-400">Chưa chấm</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-500 font-medium">Số giờ làm:</span>
                            {new Date(selectedMyShift.NgayLam).toDateString() === new Date().toDateString() && totalHours !== "0" ? (
                              <span className="font-bold text-sky-600">{totalHours} giờ</span>
                            ) : (
                              <span className="font-bold text-slate-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Vai trò</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{profileData?.roleName || "Nhân viên"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">Thao tác & Yêu cầu</h5>
                    <button
                      onClick={() => {
                        setMissingDate(selectedMyShift.NgayLam.split('T')[0]);
                        setMissingShift(`${selectedMyShift.TenCaLam} (${selectedMyShift.GioBatDau} - ${selectedMyShift.GioKetThuc})`);
                        setRequestCategory('xinnghi');
                        setShowMissingAttendanceModal(true);
                        setShowMyScheduleModal(false);
                        setSelectedMyShift(null);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                          <UserMinus className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Đăng ký xin nghỉ</p>
                          <p className="text-xs text-rose-500 dark:text-rose-500/70">Tạo đơn xin nghỉ phép cho ca này</p>
                        </div>
                      </div>
                      <span className="text-rose-400 font-black opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </button>

                    <button
                      onClick={() => {
                        setMissingDate(selectedMyShift.NgayLam.split('T')[0]);
                        setMissingShift(`${selectedMyShift.TenCaLam} (${selectedMyShift.GioBatDau} - ${selectedMyShift.GioKetThuc})`);
                        setRequestCategory('doica');
                        setShowMissingAttendanceModal(true);
                        setShowMyScheduleModal(false);
                        setSelectedMyShift(null);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Yêu cầu đổi ca</p>
                          <p className="text-xs text-amber-500 dark:text-amber-500/70">Xin đổi ca với người khác hoặc ca khác</p>
                        </div>
                      </div>
                      <span className="text-amber-400 font-black opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </button>
                  </div>
                </div>
              ) : mySchedules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-zinc-500">
                    <Coffee className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 font-medium">Bạn chưa có lịch làm việc nào được phê duyệt tuần này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mySchedules.map(reg => {
                    const d = new Date(reg.NgayLam);
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <div 
                        key={reg.MaDangKy} 
                        onClick={() => setSelectedMyShift(reg)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${isToday ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20 shadow-sky-500/10' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}
                      >
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
                          <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                          <span className="text-lg font-black leading-none mt-0.5">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-black truncate ${isToday ? 'text-sky-700 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>{reg.TenCaLam}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {reg.GioBatDau} - {reg.GioKetThuc}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
                            <span>8 Giờ công</span>
                          </div>
                        </div>
                        {isToday && (
                          <div className="px-3 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 text-xs font-bold rounded-full mr-2">
                            Hôm nay
                          </div>
                        )}
                        <div className="text-slate-300 dark:text-zinc-600">
                          <span className="font-bold">&rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bosung", label: "Bổ sung công" },
                      { id: "xinnghi", label: "Xin nghỉ phép" },
                      { id: "doica", label: "Xin đổi ca" }
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setRequestCategory(type.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
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
                    ] : [
                      "Bận lịch học", "Kẹt xe / Xe hỏng", "Nhờ bạn làm thay"
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
      </AnimatePresence>
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && profileData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center relative">
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setEditProfileForm({
                        HoTen: profileData.HoTen || '',
                        GioiTinh: profileData.GioiTinh || '',
                        SoDienThoai: profileData.SoDienThoai || '',
                        DiaChi: profileData.DiaChi || ''
                      });
                      setIsEditingProfile(true);
                    }}
                    title="Chỉnh sửa hồ sơ"
                    className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
                  >
                    <FileEdit className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl border border-white/30 mb-4">
                  {profileData.HoTen ? profileData.HoTen.split(" ").pop().slice(0, 2).toUpperCase() : "NV"}
                </div>
                <h2 className="text-2xl font-black text-white">{profileData.HoTen}</h2>
                <p className="text-amber-100 font-medium text-sm mt-1">{profileData.ChucVu} • {profileData.LoaiNhanVien}</p>
                
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 px-6 py-2 rounded-full shadow-lg border border-slate-100 dark:border-zinc-700 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4" />
                  {profileData.TrangThai || "Đang làm việc"}
                </div>
              </div>

              {/* Body */}
              <div className="p-8 pt-12 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Mã Nhân Viên */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Mã Nhân Viên</p>
                    <p className="font-bold text-slate-800 dark:text-white">{profileData.MaNhanVienCode || `NV00${profileData.MaNhanVien}`}</p>
                  </div>

                  {/* Họ tên */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Họ Tên</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={editProfileForm.HoTen} 
                        onChange={(e) => setEditProfileForm({...editProfileForm, HoTen: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white">{profileData.HoTen}</p>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Giới Tính</p>
                    {isEditingProfile ? (
                      <select 
                        value={editProfileForm.GioiTinh} 
                        onChange={(e) => setEditProfileForm({...editProfileForm, GioiTinh: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="">Chọn</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white">{profileData.GioiTinh || "Chưa cập nhật"}</p>
                    )}
                  </div>
                  
                  {/* Số Điện Thoại */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Số Điện Thoại</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={editProfileForm.SoDienThoai} 
                        onChange={(e) => setEditProfileForm({...editProfileForm, SoDienThoai: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white">{profileData.SoDienThoai || "Chưa cập nhật"}</p>
                    )}
                  </div>
                  
                  {/* Ngày Vào Làm */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Ngày Vào Làm</p>
                    <p className="font-bold text-slate-800 dark:text-white">{profileData.NgayVaoLam ? new Date(profileData.NgayVaoLam).toLocaleDateString('vi-VN') : "Chưa cập nhật"}</p>
                  </div>
                  
                  {/* Địa Chỉ */}
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Địa Chỉ</p>
                    {isEditingProfile ? (
                      <textarea 
                        value={editProfileForm.DiaChi} 
                        onChange={(e) => setEditProfileForm({...editProfileForm, DiaChi: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white">{profileData.DiaChi || "Chưa cập nhật"}</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                  {isEditingProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditingProfile(false)} 
                        className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={handleSaveProfile} 
                        disabled={savingProfile}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                      >
                        {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setShowProfileModal(false)} 
                      className="w-full py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
                    >
                      Đóng cửa sổ
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

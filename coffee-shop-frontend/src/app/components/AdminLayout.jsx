import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  Coffee, Users, Package, Star, FileText, Calendar, Clock, ShoppingCart, Home, 
  Sun, Moon, Menu, X, Bell, Search, ChevronDown, LogOut, Settings, Globe, DollarSign, LayoutList, FileEdit, CheckCircle2 
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";

const menuItems = [
  { path: "/", label: "Home", key: "home", icon: Home },
  { path: "/employees", label: "Employees", key: "employees", icon: Users },
  { path: "/timekeeping", label: "Timekeeping", key: "timekeeping", icon: CheckCircle2 },
  { path: "/scheduling", label: "Scheduling", key: "scheduling", icon: Calendar },
  { path: "/shift-management", label: "Shift Management", key: "shift_management", icon: Clock },
  { path: "/employee-timesheet", label: "Employee Timesheet", key: "employee_timesheet", icon: LayoutList },
  { path: "/my-timesheet", label: "My Timesheet", key: "my_timesheet", icon: LayoutList },
  { path: "/payroll", label: "Payroll", key: "payroll", icon: DollarSign },
  { path: "/?modal=payslip", label: "Phiếu lương", key: "payslip", icon: DollarSign },
  { path: "/?modal=missing-attendance", label: "Bổ sung điểm danh", key: "missing_attendance", icon: FileEdit },
  { path: "/logs", label: "System Logs", key: "logs", icon: FileText },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Scroll effect for header glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const userStr = sessionStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return;

        const res = await axios.get(`https://quanlynhansucf.onrender.com/api/notifications?userId=${user.MaTaiKhoan}&roleId=${user.MaVaiTro}`);
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch(e) {}
    };
    fetchNotifs();
    
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user ? user.HoTen : t("admin_user") || "Admin User";
  
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const userInitials = user ? getInitials(user.HoTen) : "AD";

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        await axios.post('https://quanlynhansucf.onrender.com/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Lỗi khi đăng xuất backend:", err);
    } finally {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      navigate('/login');
    }
  };

  const userRole = user ? String(user.MaVaiTro) : null;
  const allowedMenuItems = menuItems.filter(item => {
    if (!userRole) return item.path === "/";
    if (userRole === "1") {
      // Admin không có ca làm riêng, không duyệt công trực tiếp và không xếp ca (đã có quản lý làm)
      const restricted = ["/my-timesheet", "/employee-timesheet", "/scheduling", "/?modal=payslip", "/?modal=missing-attendance"];
      return !restricted.includes(item.path);
    }
    if (userRole === "3") {
      const restricted = ["/employees", "/shift-management", "/employee-timesheet", "/logs", "/payroll"];
      return !restricted.includes(item.path);
    }
    if (userRole === "2") {
      // Quản lý xem được hết ngoại trừ log hệ thống và tính lương
      return !["/logs", "/payroll", "/?modal=payslip", "/?modal=missing-attendance"].includes(item.path);
    }
    return true;
  });

  // Get current page title
  const currentMenuItem = menuItems.find(i => i.path === location.pathname);
  const pageTitle = currentMenuItem ? t(`nav_${currentMenuItem.key}`) : "Dashboard";

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-200 dark:border-zinc-800 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
            Coffee Shop
          </span>
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            {t("admin_portal") || "Management"}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4 px-2 uppercase tracking-wider">
          {t("menu") || "Menu"}
        </div>
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path.includes('?')
            ? (location.pathname + location.search) === item.path
            : item.path === "/" 
              ? location.pathname === "/" && location.search === ""
              : location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
                isActive 
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 font-semibold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="text-sm">{t(`nav_${item.key}`) || item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800 shrink-0">
        <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                {userInitials}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {userRole === "1" ? t("role_admin") : userRole === "2" ? t("role_manager") : t("role_staff")}
              </p>
            </div>
          </div>
          
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("logout") || "Sign out"}</span>
            </button>
          ) : (
            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors text-sm font-medium shadow-md shadow-amber-500/20"
            >
              <span>{t("login_btn") || "Login"}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-zinc-100 transition-colors duration-300 font-sans selection:bg-amber-500/30">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 z-30 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] h-full bg-white dark:bg-zinc-950 shadow-2xl animate-in slide-in-from-left z-50">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        
        {/* Top Header */}
        <header className={`sticky top-0 z-20 transition-all duration-300 ${
          scrolled 
            ? "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shadow-sm" 
            : "bg-transparent border-b border-transparent"
        }`}>
          <div className="flex items-center justify-between px-4 sm:px-8 h-20">
            
            {/* Left side: Mobile menu & Page Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                  {pageTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  {t("welcome_back") || "Welcome back,"} {userName}
                </p>
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <div className="hidden lg:flex items-center relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t("search") || "Search..."}
                  className="pl-9 pr-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-64 transition-all"
                />
              </div>

              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="p-2 sm:px-3 sm:py-2 rounded-full sm:rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-semibold hidden sm:block">
                  {language === "en" ? "EN" : "VI"}
                </span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-slate-300 relative overflow-hidden group"
              >
                <div className="relative z-10 flex items-center justify-center">
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-500" />
                  )}
                </div>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-slate-300 relative">
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => n.TrangThaiDoc === 0) && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse"></span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-800 dark:text-white">
                      Thông báo ({notifications.filter(n => n.TrangThaiDoc === 0).length})
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">Không có thông báo mới.</p>
                      ) : notifications.map(n => (
                        <div 
                          key={n.MaThongBao} 
                          onClick={async () => {
                            setShowNotifications(false);
                            try {
                              await axios.put(`https://quanlynhansucf.onrender.com/api/notifications/${n.MaThongBao}/read`);
                              setNotifications(prev => prev.map(item => item.MaThongBao === n.MaThongBao ? { ...item, TrangThaiDoc: 1 } : item));
                            } catch (e) {
                              console.error(e);
                            }
                            const title = n.TieuDe.toLowerCase();
                            const content = n.NoiDung.toLowerCase();
                            if (title.includes("đăng ký") || title.includes("lịch") || content.includes("đăng ký") || content.includes("lịch")) {
                              const weekMatch = n.NoiDung.match(/\d{4}-\d{2}-\d{2}/);
                              const targetWeek = weekMatch ? weekMatch[0] : "";
                              const isOfficial = title.includes("chính thức") || content.includes("chính thức") || title.includes("chốt lịch") || content.includes("chốt lịch");
                              const targetTab = isOfficial ? "official" : "register";
                              if (targetWeek) {
                                navigate(`/scheduling?week=${targetWeek}&tab=${targetTab}`);
                              } else {
                                navigate(`/scheduling?tab=${targetTab}`);
                              }
                            }
                          }}
                          className={`p-4 border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                            n.TrangThaiDoc === 0 ? 'bg-blue-50/30 dark:bg-blue-950/10 font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="font-bold text-sm">{n.TieuDe}</div>
                          <div className="text-xs mt-1">{n.NoiDung}</div>
                          <div className="text-[10px] text-slate-400 mt-2">{new Date(n.NgayTao).toLocaleString("vi-VN")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}

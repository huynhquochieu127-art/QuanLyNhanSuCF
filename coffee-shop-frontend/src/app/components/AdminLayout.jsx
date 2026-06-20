import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Coffee, Users, Package, Star, FileText, Calendar, Clock, ShoppingCart, Home, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const menuItems = [
  { path: "/", label: "Home", key: "home", icon: Home },
  { path: "/pos", label: "POS", key: "pos", icon: ShoppingCart },
  { path: "/employees", label: "Employees", key: "employees", icon: Users },
  { path: "/products", label: "Products", key: "products", icon: Package },
  { path: "/customers", label: "Customers", key: "customers", icon: Star },
  { path: "/scheduling", label: "Scheduling", key: "scheduling", icon: Calendar },
  { path: "/timekeeping", label: "Timekeeping", key: "timekeeping", icon: Clock },
  { path: "/logs", label: "System Logs", key: "logs", icon: FileText },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 dark:bg-zinc-950 text-white">
      {/* Header logo */}
      <div className="p-6 border-b border-slate-800 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide">Coffee Shop</h2>
            <p className="text-xs text-amber-500 font-medium">{t("admin_portal")}</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-950/20"
                  : "text-slate-400 hover:bg-slate-800/60 dark:hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
              <span className="font-medium text-sm">{t(`nav_${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer controls & Profile */}
      <div className="p-4 border-t border-slate-800 dark:border-zinc-800 space-y-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/50 dark:bg-zinc-900/50 hover:bg-slate-800 dark:hover:bg-zinc-900 transition-colors text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🌐</span>
            <span className="text-sm font-medium">{t("lang_switcher")}</span>
          </div>
          <span className="text-xs bg-slate-700 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-slate-400 font-bold">
            {language === "en" ? "EN" : "VI"}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/50 dark:bg-zinc-900/50 hover:bg-slate-800 dark:hover:bg-zinc-900 transition-colors text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="text-sm font-medium">{t("theme_light")}</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium">{t("theme_dark")}</span>
              </>
            )}
          </div>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 px-3 pt-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-orange-900/10">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-200">{t("admin_user")}</p>
            <p className="text-xs text-slate-400 truncate">admin@shop.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 transition-colors duration-300 overflow-hidden">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-wide">{t("admin_portal")}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="text-xs bg-slate-800 active:bg-slate-750 px-2 py-1 rounded text-slate-300 font-bold"
          >
            {language === "en" ? "EN" : "VI"}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-300" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:block w-66 h-full shadow-2xl flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            {/* Close button inside Drawer */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
}

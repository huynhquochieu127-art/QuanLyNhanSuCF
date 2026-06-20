import { Link } from "react-router";
import { Coffee, Clock, Calendar, Users, Package, Star, FileText, LogIn, TrendingUp, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

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

  const modules = [
    { to: "/pos", icon: Coffee, title: t("nav_pos"), description: t("desc_pos"), color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
    { to: "/employees", icon: Users, title: t("nav_employees"), description: t("desc_employees"), color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
    { to: "/products", icon: Package, title: t("nav_products"), description: t("desc_products"), color: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400" },
    { to: "/customers", icon: Star, title: t("nav_customers"), description: t("desc_customers"), color: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400" },
    { to: "/scheduling", icon: Calendar, title: t("nav_scheduling"), description: t("desc_scheduling"), color: "bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400" },
    { to: "/timekeeping", icon: Clock, title: t("nav_timekeeping"), description: t("desc_timekeeping"), color: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" },
    { to: "/logs", icon: FileText, title: t("nav_logs"), description: t("desc_logs"), color: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" },
    { to: "/login", icon: LogIn, title: t("login_btn") + " Portal", description: t("desc_login"), color: "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
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
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold">
              {t("system_active")}
            </span>
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

        {/* Modules Grid Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("modules_title")}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((module, i) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.to}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={module.to}
                    className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl shadow-md p-6 hover:shadow-xl transition-all group hover:-translate-y-1.5 flex flex-col justify-between h-44 cursor-pointer"
                  >
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
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}

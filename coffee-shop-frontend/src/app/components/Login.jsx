import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Mode Đăng nhập
      const promise = axios.post('http://localhost:5000/api/auth/login', {
        Email: email,
        MatKhau: password
      });

      toast.promise(promise, {
        loading: t("login_loading") || "Đang xử lý...",
        success: (res) => {
          // Lưu token và thông tin user vào sessionStorage
          sessionStorage.setItem('token', res.data.token);
          sessionStorage.setItem('user', JSON.stringify(res.data.user));
          
          setTimeout(() => {
            navigate("/");
          }, 1000);

          return res.data.message || t("login_success") || "Đăng nhập thành công!";
        },
        error: (err) => {
          return err.response?.data?.message || t("login_failed") || "Đăng nhập thất bại!";
        },
      });

    } catch (error) {
      console.error("Lỗi xử lý form:", error);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Left panel: Image cover */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="w-full h-full"
        >
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1515860734122-e0d771b36d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBzaG9wJTIwYmFyaXN0YSUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3Nzk1MDk3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Coffee shop barista"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 to-orange-950/50 mix-blend-multiply" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center text-white px-8"
          >
            <Coffee className="w-20 h-20 mx-auto mb-4 text-amber-400" />
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">{t("login_welcome")}</h2>
            <p className="text-xl opacity-90 font-light">{t("login_subtitle")}</p>
          </motion.div>
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-amber-50/50 to-orange-100/50 dark:from-zinc-950 dark:to-zinc-900 p-8">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/20"
            >
              <Coffee className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-500 tracking-tight mb-2">
              {t("login_title")}
            </h1>
            <p className="text-amber-700/80 dark:text-amber-600">
              {t("login_sign_in")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-black/40 border border-white/20 dark:border-zinc-800/40 p-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">{t("login_email")}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coffeeshop.com"
                className="w-full px-4 py-3 border border-amber-200 dark:border-zinc-800 rounded-xl bg-amber-50/20 dark:bg-zinc-950/30 text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">{t("login_password")}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-amber-200 dark:border-zinc-800 rounded-xl bg-amber-50/20 dark:bg-zinc-950/30 text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-700 dark:text-amber-600 hover:text-amber-800 dark:hover:text-amber-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 text-amber-600 border-amber-200 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:bg-zinc-950 dark:border-zinc-850"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-zinc-400 font-medium">{t("login_remember")}</span>
              </label>
              <Link to="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:underline">
                {t("login_forgot")}
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3.5 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-md shadow-orange-500/10 text-base font-bold tracking-wide"
            >
              {t("login_btn")}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

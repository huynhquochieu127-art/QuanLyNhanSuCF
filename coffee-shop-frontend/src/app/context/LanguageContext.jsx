import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    // Layout & Navigation
    nav_home: "Home",
    nav_pos: "POS",
    nav_employees: "Employees",
    nav_products: "Products",
    nav_customers: "Customers",
    nav_scheduling: "Scheduling",
    nav_timekeeping: "Timekeeping",
    nav_logs: "System Logs",
    admin_portal: "Admin Portal",
    admin_user: "Admin User",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    lang_switcher: "Language",
    lang_name: "English",
    cat_coffee: "Coffee",
    cat_bakery: "Bakery",
    cat_food: "Food",

    // Login Screen
    login_welcome: "Welcome Back",
    login_subtitle: "Manage your coffee shop with ease",
    login_title: "Coffee Shop Admin",
    login_sign_in: "Sign in to your dashboard",
    login_email: "Email Address",
    login_password: "Password",
    login_remember: "Remember Me",
    login_forgot: "Forgot Password?",
    login_btn: "Login",
    login_no_account: "Don't have an account?",
    login_contact_admin: "Contact Admin",
    login_loading: "Authenticating credentials...",
    login_success: "Logged in successfully! Welcome back.",
    login_failed: "Login failed.",

    // Home Dashboard
    home_title: "Coffee Shop Manager",
    home_welcome: "Welcome back, Administrator",
    system_active: "System Active",
    chart_sales_trend: "Sales Trend (Today)",
    chart_peak_hours: "Peak Hour Revenues",
    chart_share: "Sales Share",
    chart_departments: "Popular Departments",
    modules_title: "Management Modules",
    desc_pos: "Manage orders and tables",
    desc_employees: "Manage staff members",
    desc_products: "Manage menu items",
    desc_customers: "Reward points and CRM",
    desc_scheduling: "Manage staff schedules",
    desc_timekeeping: "Check-in and attendance",
    desc_logs: "Activity audit trail",
    desc_login: "Admin authentication",

    // POS Dashboard
    pos_terminal: "POS Terminal",
    pos_search_placeholder: "Quick search menu items...",
    pos_table_layout: "Table Layout",
    pos_tables_count: "8 Tables",
    pos_available: "Available",
    pos_occupied: "Occupied",
    pos_current_order: "Current Order",
    pos_items_count: "Items",
    pos_empty_cart: "No items in the order yet",
    pos_discount_code: "Discount Code (%)",
    pos_subtotal: "Subtotal",
    pos_discount: "Discount",
    pos_total_bill: "Total Bill",
    pos_checkout_btn: "Checkout Order",
    pos_toast_added: "Added {{name}} to cart!",
    pos_toast_removed: "Removed {{name}} from cart",
    pos_toast_empty: "Your cart is empty",
    pos_checkout_title: "POS Checkout",
    pos_checkout_subtitle: "Select a payment option and process transaction.",
    pos_amount_due: "Amount Due",
    pos_scan_qr: "Scan QR Code",
    pos_cash_payment: "Cash Payment",
    pos_cash_received: "Cash Received",
    pos_enter_cash: "Enter cash amount",
    pos_change_due: "Change Due",
    pos_confirm_payment: "Confirm Payment",
    pos_processing: "Processing Transaction...",
    pos_payment_completed: "Payment completed successfully!",
    pos_success_title: "Transaction Successful",
    pos_success_subtitle: "Order successfully completed and catalog updated.",
    pos_qr_instructions: "Scan code using Mobile Banking or E-Wallet",
  },
  vi: {
    // Layout & Navigation
    nav_home: "Trang chủ",
    nav_pos: "Bán hàng POS",
    nav_employees: "Nhân viên",
    nav_products: "Thực đơn",
    nav_customers: "Khách hàng",
    nav_scheduling: "Lịch làm việc",
    nav_timekeeping: "Chấm công",
    nav_logs: "Lịch sử hệ thống",
    admin_portal: "Trang Quản Trị",
    admin_user: "Quản trị viên",
    theme_light: "Chế độ Sáng",
    theme_dark: "Chế độ Tối",
    lang_switcher: "Ngôn ngữ",
    lang_name: "Tiếng Việt",
    cat_coffee: "Cà phê",
    cat_bakery: "Bánh ngọt",
    cat_food: "Đồ ăn",

    // Login Screen
    login_welcome: "Chào Mừng Trở Lại",
    login_subtitle: "Quản lý quán cafe của bạn dễ dàng hơn",
    login_title: "Admin Cà Phê",
    login_sign_in: "Đăng nhập vào trang quản trị",
    login_email: "Địa chỉ Email",
    login_password: "Mật khẩu",
    login_remember: "Ghi nhớ đăng nhập",
    login_forgot: "Quên mật khẩu?",
    login_btn: "Đăng nhập",
    login_no_account: "Chưa có tài khoản?",
    login_contact_admin: "Liên hệ Quản trị",
    login_loading: "Đang xác thực thông tin...",
    login_success: "Đăng nhập thành công! Chào mừng trở lại.",
    login_failed: "Đăng nhập thất bại.",

    // Home Dashboard
    home_title: "Quản Lý Quán Cà Phê",
    home_welcome: "Chào mừng trở lại, Quản trị viên",
    system_active: "Hệ thống hoạt động",
    chart_sales_trend: "Xu hướng doanh số (Hôm nay)",
    chart_peak_hours: "Doanh thu theo giờ cao điểm",
    chart_share: "Tỷ trọng doanh số",
    chart_departments: "Danh mục phổ biến",
    modules_title: "Các Module Quản Lý",
    desc_pos: "Bán hàng và quản lý bàn ăn",
    desc_employees: "Quản lý thông tin nhân sự",
    desc_products: "Quản lý danh sách thực đơn",
    desc_customers: "Chăm sóc khách hàng & tích điểm",
    desc_scheduling: "Lập lịch ca trực nhân viên",
    desc_timekeeping: "Theo dõi giờ công, chuyên cần",
    desc_logs: "Lịch sử hoạt động hệ thống",
    desc_login: "Đăng nhập xác thực admin",

    // POS Dashboard
    pos_terminal: "Quầy Thu Ngân POS",
    pos_search_placeholder: "Tìm nhanh đồ uống, món ăn...",
    pos_table_layout: "Sơ đồ bàn",
    pos_tables_count: "8 Bàn ăn",
    pos_available: "Bàn trống",
    pos_occupied: "Có khách",
    pos_current_order: "Đơn hàng hiện tại",
    pos_items_count: "Món",
    pos_empty_cart: "Chưa có món nào trong đơn hàng",
    pos_discount_code: "Mã giảm giá (%)",
    pos_subtotal: "Tạm tính",
    pos_discount: "Giảm giá",
    pos_total_bill: "Tổng thanh toán",
    pos_checkout_btn: "Thanh toán hóa đơn",
    pos_toast_added: "Đã thêm {{name}} vào giỏ!",
    pos_toast_removed: "Đã xóa {{name}} khỏi giỏ",
    pos_toast_empty: "Giỏ hàng đang trống",
    pos_checkout_title: "Thanh Toán Hóa Đơn",
    pos_checkout_subtitle: "Vui lòng chọn hình thức thanh toán để hoàn tất.",
    pos_amount_due: "Số tiền cần thanh toán",
    pos_scan_qr: "Quét mã QR Code",
    pos_cash_payment: "Tiền mặt",
    pos_cash_received: "Tiền khách đưa",
    pos_enter_cash: "Nhập số tiền khách đưa",
    pos_change_due: "Tiền thừa trả khách",
    pos_confirm_payment: "Xác nhận thanh toán",
    pos_processing: "Đang xử lý giao dịch...",
    pos_payment_completed: "Thanh toán thành công!",
    pos_success_title: "Giao Dịch Thành Công",
    pos_success_subtitle: "Đơn hàng đã được lưu lại và cập nhật hệ thống.",
    pos_qr_instructions: "Quét mã bằng ứng dụng Mobile Banking hoặc Ví điện tử",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    if (saved) return saved;
    // Default to vietnamese or browser preference
    const locale = navigator.language || "en";
    return locale.startsWith("vi") ? "vi" : "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "vi" : "en"));
  };

  const t = (key, params = {}) => {
    const dict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    
    // Replace dynamic params e.g. {{name}}
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(`{{${paramKey}}}`, params[paramKey]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

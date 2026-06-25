import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Coffee, Croissant, Cookie, Sandwich, X, Minus, Plus, ShoppingCart, QrCode, CreditCard, Banknote, CheckCircle, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";

// Tables will be fetched from API

// Initial menuItems removed, will fetch from API

export default function POSDashboard() {
  const { t, language } = useLanguage();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("menu"); // "menu" or "cart" for mobile view
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qr"); // "qr" or "cash"
  const [cashPaid, setCashPaid] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const categories = ["All", "Coffee", "Bakery", "Food"];

  const translateCategory = (cat) => {
    if (cat === "All") return language === "en" ? "All" : "Tất cả";
    return t(`cat_${cat.toLowerCase()}`);
  };

  useEffect(() => {
    const fetchProductsAndTables = async () => {
      try {
        const resProducts = await axios.get('https://quanlynhansucf.onrender.com/api/products');
        if (resProducts.data.success) {
          const mapped = resProducts.data.data
            .filter(p => p.CoBan === 1)
            .map(p => ({
              id: p.MaSanPham,
              name: p.TenSanPham,
              price: parseFloat(p.Gia),
              category: p.MaDanhMuc === 1 ? 'Coffee' : 'Bakery',
              icon: p.MaDanhMuc === 1 ? Coffee : (p.MaDanhMuc === 2 ? Croissant : Sandwich)
            }));
          setMenuItems(mapped);
        }

        const resTables = await axios.get('https://quanlynhansucf.onrender.com/api/tables');
        if (resTables.data.success) {
          const mappedTables = resTables.data.data.map(t => ({
            id: t.MaBan,
            name: t.TenBan,
            status: t.TrangThai === 'ON' ? 'occupied' : 'available'
          }));
          setTables(mappedTables);
        }
      } catch (err) {
        toast.error("Lỗi tải dữ liệu");
      }
    };
    fetchProductsAndTables();
  }, []);

  // Filter menuItems by search and category
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    const existing = cart.find((c) => c.menuItem.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }]);
    }
    toast.success(t("pos_toast_added", { name: item.name }));
  };

  const removeFromCart = (itemId) => {
    const item = cart.find((c) => c.menuItem.id === itemId);
    setCart(cart.filter((c) => c.menuItem.id !== itemId));
    if (item) {
      toast.error(t("pos_toast_removed", { name: item.menuItem.name }));
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(
      cart
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const newQuantity = c.quantity + delta;
            return newQuantity > 0 ? { ...c, quantity: newQuantity } : c;
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
  const total = subtotal - discountAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!selectedTable) {
      toast.warning("Vui lòng chọn bàn trước khi thanh toán");
      return;
    }
    if (cart.length === 0) {
      toast.warning(t("pos_toast_empty"));
      return;
    }
    setShowCheckout(true);
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      let customerId = null;
      if (customerPhone) {
        const cusRes = await axios.post('https://quanlynhansucf.onrender.com/api/customers/find-or-create', { SoDienThoai: customerPhone });
        if (cusRes.data.success) {
          customerId = cusRes.data.data.MaKhachHang;
        }
      }

      const orderData = {
        MaBan: selectedTable,
        MaKhachHang: customerId,
        TongTien: subtotal,
        GiamGia: discountAmount,
        ThanhTien: total,
        PhuongThucThanhToan: paymentMethod,
        items: cart.map(c => ({
          MaSanPham: c.menuItem.id,
          SoLuong: c.quantity,
          DonGia: c.menuItem.price
        }))
      };

      const res = await axios.post('https://quanlynhansucf.onrender.com/api/pos/order', orderData);
      
      if (res.data.success) {
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        toast.success("Thanh toán thành công!");
        
        setTimeout(() => {
          setCart([]);
          setDiscount("");
          setSelectedTable(null);
          setCustomerPhone("");
          setShowCheckout(false);
          setPaymentSuccess(false);
          setCashPaid("");
        }, 1500);
      }
    } catch (err) {
      setIsProcessingPayment(false);
      toast.error("Lỗi khi thanh toán đơn hàng!");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-amber-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-amber-700 to-orange-600 dark:from-zinc-900 dark:to-zinc-800 text-white p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:bg-white/20 p-2 rounded-xl transition-all duration-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-300 animate-bounce" />
            <h1 className="text-xl font-bold tracking-tight">{t("pos_terminal")}</h1>
          </div>
        </div>

        {/* Search Bar inside header on desktop */}
        <div className="hidden md:flex relative w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("pos_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-white/10 dark:bg-zinc-850 border border-white/20 dark:border-zinc-700/50 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-amber-500 transition-all text-sm"
          />
        </div>

        {/* Mobile Tab Toggle */}
        <div className="flex lg:hidden bg-amber-800/40 dark:bg-zinc-950 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "menu" ? "bg-amber-600 text-white shadow" : "text-amber-200 dark:text-zinc-400"
            }`}
          >
            {language === "en" ? "Menu" : "Thực đơn"}
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold relative transition-all ${
              activeTab === "cart" ? "bg-amber-600 text-white shadow" : "text-amber-200 dark:text-zinc-400"
            }`}
          >
            {language === "en" ? "Cart" : "Giỏ hàng"}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden relative">
        
        {/* Left Side: Tables Status & Mobile Menu Panel */}
        <div
          className={`col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden h-full ${
            activeTab === "menu" ? "flex" : "hidden lg:grid"
          }`}
        >
          {/* Tables Status (col-span-4 on desktop) */}
          <div className="md:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800/50 p-4 flex flex-col overflow-auto h-full">
            <h2 className="text-md font-bold text-amber-900 dark:text-amber-500 mb-3 flex items-center gap-2">
              <span>{t("pos_table_layout")}</span>
              <span className="text-xs bg-amber-100 dark:bg-zinc-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">{t("pos_tables_count")}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {tables.map((table) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    selectedTable === table.id 
                      ? "bg-amber-100 border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.5)] ring-2 ring-amber-500 ring-offset-1" 
                      : table.status === "available"
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400"
                        : "bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-400"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-base font-bold">{table.name}</div>
                    <div className="text-[10px] mt-1 font-medium capitalize opacity-85">
                      {table.status === "available" ? t("pos_available") : t("pos_occupied")}
                    </div>
                  </div>
                  <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${table.status === "available" ? "bg-emerald-500" : "bg-rose-500"}`} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Menu Panel (col-span-8 on desktop) */}
          <div className="md:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800/50 p-4 flex flex-col overflow-hidden h-full">
            {/* Category selection */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-500/10"
                        : "bg-amber-50/50 dark:bg-zinc-800 text-amber-800 dark:text-zinc-300 hover:bg-amber-100/50 dark:hover:bg-zinc-700/60"
                    }`}
                  >
                    {translateCategory(cat)}
                  </motion.button>
                ))}
              </div>

              {/* Mobile Search bar */}
              <div className="flex md:hidden relative w-full mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("pos_search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-slate-800 dark:text-slate-150 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-auto">
              {filteredMenu.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                  <Coffee className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No menu items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-zinc-950/40 dark:to-zinc-900/10 p-4 rounded-2xl hover:shadow-md transition-all border border-amber-200/40 dark:border-zinc-800/40 text-left relative overflow-hidden group cursor-pointer"
                      >
                        <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 dark:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                          <Icon className="w-20 h-20 text-amber-900 dark:text-white" />
                        </div>
                        <div className="w-9 h-9 bg-amber-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-zinc-155 truncate mb-1">{item.name}</div>
                        <div className="text-sm font-extrabold text-amber-700 dark:text-amber-500">${item.price.toFixed(2)}</div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Order summary & Cart Panel */}
        <div
          className={`col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-xl p-4 flex flex-col h-full overflow-hidden ${
            activeTab === "cart" ? "flex" : "hidden lg:flex"
          }`}
        >
          <h2 className="text-md font-bold text-amber-900 dark:text-amber-500 mb-3 flex items-center justify-between">
            <span>{t("pos_current_order")}</span>
            <span className="text-xs bg-orange-100 dark:bg-zinc-800 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full font-bold">
              {cartCount} {t("pos_items_count")}
            </span>
          </h2>
          
          {/* Cart list */}
          <div className="flex-1 overflow-auto mb-4 space-y-2.5 pr-1">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 py-16"
                >
                  <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">{t("pos_empty_cart")}</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ duration: 0.2 }}
                    key={item.menuItem.id} 
                    className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-855 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-sm font-semibold truncate text-slate-800 dark:text-zinc-200">{item.menuItem.name}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-500 font-bold mt-0.5">${item.menuItem.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-lg overflow-hidden p-0.5">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="w-6.5 h-6.5 bg-slate-50 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-955/50 rounded flex items-center justify-center transition-colors text-slate-600 dark:text-zinc-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-zinc-200">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="w-6.5 h-6.5 bg-slate-50 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-955/50 rounded flex items-center justify-center transition-colors text-slate-600 dark:text-zinc-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="w-7 h-7 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Pricing & Billing panel */}
          <form onSubmit={handleCheckoutSubmit} className="space-y-4 border-t border-slate-100 dark:border-zinc-800/80 pt-4">
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">SĐT Khách (nếu có)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Nhập SĐT..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">{t("pos_discount_code")}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
            </div>
            
            <div className="space-y-2 text-sm bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 p-3.5 rounded-2xl">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500 dark:text-zinc-400">{t("pos_subtotal")}</span>
                <span className="text-slate-800 dark:text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500 dark:text-zinc-400">{t("pos_discount")} ({discount}%)</span>
                  <span className="text-rose-600 dark:text-rose-400">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-slate-200 dark:border-zinc-800 my-1" />
              <div className="flex justify-between text-lg font-extrabold">
                <span className="text-slate-900 dark:text-white">{t("pos_total_bill")}</span>
                <span className="text-amber-600 dark:text-amber-500">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-md shadow-orange-500/10 text-lg font-bold tracking-wide cursor-pointer"
            >
              {t("pos_checkout_btn")}
            </motion.button>
          </form>
        </div>
      </div>

      {/* Checkout Dialog Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessingPayment) setShowCheckout(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 z-10 flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowCheckout(false)}
                disabled={isProcessingPayment}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">{t("pos_checkout_title")}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">{t("pos_checkout_subtitle")}</p>

              {paymentSuccess ? (
                /* Success animation view */
                <div className="flex-1 py-12 flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, damping: 10 }}
                  >
                    <CheckCircle className="w-20 h-20 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("pos_success_title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{t("pos_success_subtitle")}</p>
                </div>
              ) : (
                /* Regular payment selection view */
                <div className="flex-grow space-y-5 overflow-auto pr-1">
                  
                  {/* Total indicator */}
                  <div className="bg-amber-50 dark:bg-zinc-950/60 border border-amber-200/50 dark:border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wide">{t("pos_amount_due")}</span>
                      <h3 className="text-2xl font-black text-amber-900 dark:text-white mt-0.5">${total.toFixed(2)}</h3>
                    </div>
                    <div className="text-xs bg-amber-100 dark:bg-zinc-850 text-amber-800 dark:text-zinc-400 px-3 py-1 rounded-full font-bold">
                      {cartCount} {t("pos_items_count")}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qr")}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === "qr"
                          ? "bg-amber-50/50 dark:bg-zinc-850 border-amber-505 border-2 text-amber-900 dark:text-white font-bold"
                          : "border-slate-200 dark:border-zinc-800 text-slate-505 hover:bg-slate-50 dark:hover:bg-zinc-850/30"
                      }`}
                    >
                      <QrCode className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                      <span className="text-sm">{t("pos_scan_qr")}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === "cash"
                          ? "bg-amber-50/50 dark:bg-zinc-850 border-amber-505 border-2 text-amber-900 dark:text-white font-bold"
                          : "border-slate-200 dark:border-zinc-800 text-slate-505 hover:bg-slate-50 dark:hover:bg-zinc-855/30"
                      }`}
                    >
                      <Banknote className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                      <span className="text-sm">{t("pos_cash_payment")}</span>
                    </button>
                  </div>

                  {/* QR Scan Method Canvas */}
                  {paymentMethod === "qr" && (
                    <div className="flex flex-col items-center py-4 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-850 relative overflow-hidden">
                      <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                        {/* Custom vector QR code with coffee icon */}
                        <svg className="w-40 h-40" viewBox="0 0 100 100" fill="currentColor">
                          {/* Locator blocks */}
                          <rect x="0" y="0" width="30" height="30" fill="#78350f" />
                          <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                          <rect x="10" y="10" width="10" height="10" fill="#78350f" />
                          
                          <rect x="70" y="0" width="30" height="30" fill="#78350f" />
                          <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                          <rect x="80" y="10" width="10" height="10" fill="#78350f" />
                          
                          <rect x="0" y="70" width="30" height="30" fill="#78350f" />
                          <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                          <rect x="10" y="80" width="10" height="10" fill="#78350f" />
                          
                          {/* Bits */}
                          <rect x="40" y="0" width="10" height="5" />
                          <rect x="55" y="0" width="5" height="15" />
                          <rect x="45" y="10" width="15" height="5" />
                          <rect x="35" y="20" width="10" height="15" />
                          <rect x="55" y="25" width="10" height="10" />
                          <rect x="85" y="35" width="15" height="5" />
                          <rect x="75" y="45" width="5" height="20" />
                          <rect x="90" y="55" width="10" height="15" />
                          <rect x="35" y="50" width="15" height="10" />
                          <rect x="35" y="70" width="10" height="5" />
                          <rect x="55" y="75" width="15" height="10" />
                          <rect x="45" y="85" width="5" height="10" />
                          <rect x="85" y="85" width="15" height="5" />
                          <rect x="70" y="80" width="5" height="15" />
                          
                          {/* Center design */}
                          <circle cx="50" cy="50" r="10" fill="#ffffff" />
                          <path d="M47,53 C47,47 53,47 53,53 C53,50 47,50 47,53 Z" fill="#ea580c" />
                          <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
                        </svg>

                        {/* Scanner animation overlay */}
                        <motion.div
                          animate={{ y: [0, 160, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-3 right-3 h-1 bg-amber-500 shadow-md shadow-amber-500/50 rounded z-10"
                        />
                      </div>
                      <p className="text-[11px] text-slate-505 dark:text-zinc-400 mt-4 tracking-wide font-medium">{t("pos_qr_instructions")}</p>
                    </div>
                  )}

                  {/* Cash Method Input */}
                  {paymentMethod === "cash" && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-850">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">{t("pos_cash_received")}</label>
                        <input
                          type="number"
                          placeholder={t("pos_enter_cash")}
                          value={cashPaid}
                          onChange={(e) => setCashPaid(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-bold"
                        />
                      </div>

                      {cashPaid && parseFloat(cashPaid) >= total && (
                        <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/45 p-3.5 rounded-2xl">
                          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{t("pos_change_due")}</span>
                          <span className="text-xl font-black text-emerald-900 dark:text-emerald-400">
                            ${(parseFloat(cashPaid) - total).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2">
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={processPayment}
                      disabled={isProcessingPayment || (paymentMethod === "cash" && (!cashPaid || parseFloat(cashPaid) < total))}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all font-bold text-md shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{t("pos_processing")}</span>
                        </>
                      ) : (
                        <span>{t("pos_confirm_payment")} (${total.toFixed(2)})</span>
                      )}
                    </motion.button>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

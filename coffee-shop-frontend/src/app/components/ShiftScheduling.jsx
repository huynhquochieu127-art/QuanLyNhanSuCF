import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowLeft, Calendar, Plus, X, AlertCircle, ChevronLeft, ChevronRight,
  Edit, Trash2, Users, Briefcase, CheckCircle, XCircle, Clock,
  ClipboardList, Send, RefreshCw, BellRing, CheckSquare
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = "http://localhost:5000/api";

// Định nghĩa cấu trúc ca cố định
const SHIFT_STRUCTURE = {
  fulltime: [
    { key: "CA_A", label: "Ca A (Full-time)", time: "6h30–15h", color: "bg-blue-100 text-blue-800 border-blue-300" },
    { key: "CA_B", label: "Ca B (Full-time)", time: "15h–23h", color: "bg-purple-100 text-purple-800 border-purple-300" },
  ],
  parttime: [
    { key: "CA1", label: "Ca 1", time: "6h30–12h", color: "bg-green-100 text-green-800 border-green-300" },
    { key: "CA2", label: "Ca 2", time: "12h–17h30", color: "bg-amber-100 text-amber-800 border-amber-300" },
    { key: "CA3", label: "Ca 3", time: "17h30–23h", color: "bg-orange-100 text-orange-800 border-orange-300" },
  ],
};

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt",   cls: "bg-amber-100 text-amber-700 border-amber-300" },
  approved: { label: "Đã duyệt",    cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  rejected: { label: "Từ chối",     cls: "bg-rose-100 text-rose-700 border-rose-300" },
};

export default function ShiftScheduling() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'approvals' | 'official'
  const [shifts, setShifts] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [weekStatus, setWeekStatus] = useState("pending");
  
  // Trạng thái lưu nháp (Batch Save)
  const [draftChanges, setDraftChanges] = useState({}); // { 'empId-date-shiftId': 'add' | 'remove' }
  const [isSaving, setIsSaving] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date(d).setDate(diff));
  });

  const userStr = sessionStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userRole = currentUser ? String(currentUser.MaVaiTro) : "3";
  const isStaff = userRole === "3";
  const isManager = userRole === "2";
  const isAdmin = userRole === "1";
  // MaNhanVien của user (dùng trong đăng ký ca)
  const myEmployeeId = currentUser?.MaNhanVien || currentUser?.MaTaiKhoan;

  // -------------------------------------------------------
  // Fetch helpers
  // -------------------------------------------------------
  const fetchShiftsAndStaff = async () => {
    try {
      const [shRes, stRes] = await Promise.all([
        axios.get(`${API}/shifts`),
        axios.get(`${API}/employees`)
      ]);
      if (shRes.data.success) setShifts(shRes.data.data);
      if (stRes.data.success) {
        setStaffMembers(
          stRes.data.data.filter(s => 
            s.TrangThai === "Đang làm việc" && 
            String(s.MaVaiTro) !== "1" && 
            String(s.MaVaiTro) !== "2"
          )
        );
      }
    } catch (e) { console.error(e); }
  };

  const getWeekRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return {
      startStr: start.toISOString().split("T")[0],
      endStr: end.toISOString().split("T")[0],
    };
  };

  const fetchRegistrations = async () => {
    const { startStr, endStr } = getWeekRange();
    try {
      const params = new URLSearchParams({ startDate: startStr, endDate: endStr });
      const [regRes, statusRes] = await Promise.all([
        axios.get(`${API}/shifts/registrations?${params}`),
        axios.get(`${API}/shifts/week-status/${startStr}`)
      ]);
      
      if (regRes.data.success) {
        setRegistrations(regRes.data.data);
        setDraftChanges({}); // Clear drafts on fetch
      }
      if (statusRes.data.success) {
        const newStatus = statusRes.data.data.TrangThai;
        setWeekStatus(newStatus);
        
        const urlParams = new URLSearchParams(location.search);
        const urlTab = urlParams.get("tab");
        if (urlTab) {
          if (urlTab === "official" && newStatus !== "admin_approved") {
            setActiveTab("register");
          } else {
            setActiveTab(urlTab);
          }
        } else {
          if (newStatus === "admin_approved") {
            setActiveTab("official");
          } else {
            setActiveTab("register");
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchShiftsAndStaff();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const weekParam = params.get("week");
    if (weekParam) {
      const parts = weekParam.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsedDate = new Date(y, m, d);
        if (!isNaN(parsedDate.getTime())) {
          const currentStr = currentWeekStart.toISOString().split("T")[0];
          if (currentStr !== weekParam) {
            setCurrentWeekStart(parsedDate);
          }
        }
      }
    }
    const tabParam = params.get("tab");
    if (tabParam && (tabParam === "register" || tabParam === "approvals" || tabParam === "official")) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchRegistrations();
  }, [currentWeekStart]);

  // -------------------------------------------------------
  // Week helpers
  // -------------------------------------------------------
  const getDaysInWeek = () => {
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
    return dayNames.map((name, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split("T")[0],
        name,
        displayDate: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      };
    });
  };

  const days = getDaysInWeek();
  const weekLabel = `${days[0].displayDate} – ${days[6].displayDate}`;

  const changeWeek = (delta) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + delta * 7);
    setCurrentWeekStart(d);
  };

  // -------------------------------------------------------
  // Register helpers
  // -------------------------------------------------------
  const handleOpenRegistration = async () => {
    try {
      const { startStr } = getWeekRange();
      await axios.put(`${API}/shifts/week-status/${startStr}`, { status: 'open' });
      toast.success("Đã mở đăng ký ca & gửi thông báo cho nhân viên!");
      fetchRegistrations();
    } catch (e) {
      toast.error("Lỗi cập nhật trạng thái tuần");
    }
  };

  const handleSubmitToAdmin = async () => {
    try {
      const { startStr } = getWeekRange();
      await axios.put(`${API}/shifts/week-status/${startStr}`, { status: 'manager_approved' });
      toast.success("Đã gửi bảng đăng ký cho Admin duyệt!");
      fetchRegistrations();
    } catch (e) {
      toast.error("Lỗi cập nhật trạng thái tuần");
    }
  };

  const handleAdminFinalize = async () => {
    try {
      const { startStr } = getWeekRange();
      await axios.post(`${API}/shifts/finalize-week/${startStr}`);
      toast.success("Đã chốt lịch & gửi thông báo cho nhân viên!");
      fetchRegistrations();
    } catch (e) {
      toast.error("Lỗi chốt lịch");
    }
  };

  const handleAdminReopen = async () => {
    try {
      const { startStr } = getWeekRange();
      await axios.put(`${API}/shifts/week-status/${startStr}`, { status: 'reopened' });
      toast.success("Đã mở lại cổng đăng ký tuần!");
      fetchRegistrations();
    } catch (e) {
      toast.error("Lỗi mở lại đăng ký tuần");
    }
  };

  const handleApproveReg = async (id, status) => {
    try {
      const res = await axios.put(`${API}/shifts/register/${id}/status`, { TrangThai: status });
      if (res.data.success) {
        toast.success(status === 'approved' ? "Đã duyệt ca" : "Đã từ chối ca");
        fetchRegistrations();
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const pendingRegs = registrations.filter(r => r.TrangThai === "pending");

  // Excel Grid helpers
  const caA = shifts.find(s => s.TenCaLam === 'Ca A');
  const caB = shifts.find(s => s.TenCaLam === 'Ca B');
  const ca1 = shifts.find(s => s.TenCaLam === 'Ca 1');
  const ca2 = shifts.find(s => s.TenCaLam === 'Ca 2');
  const ca3 = shifts.find(s => s.TenCaLam === 'Ca 3');



  const getReg = (empId, date, shiftId) => {
    if (!shiftId) return null;
    return registrations.find(r => {
      if (r.MaNhanVien != empId || r.MaCaLam != shiftId) return false;
      const d = new Date(r.NgayLam);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dateStr === date;
    });
  };

  const isPastDeadline = () => {
    if (!currentWeekStart) return false;
    const deadline = new Date(currentWeekStart);
    deadline.setDate(deadline.getDate() - 1); // Sunday before Monday
    deadline.setHours(18, 0, 0, 0); // 18h00
    return new Date() > deadline;
  };

  const getCanClick = (emp) => {
    if (weekStatus === 'admin_approved') return false;
    if (isAdmin) return false;
    if (isManager) return false;
    
    if (isStaff) {
      if (weekStatus === 'open' && isPastDeadline()) return false;
      return (weekStatus === 'open' || weekStatus === 'reopened') && myEmployeeId == emp.MaNhanVien;
    }
    return false;
  };

  const handleCellToggle = (emp, date, shiftObj, existingItem) => {
    if (!shiftObj) return;

    if (isStaff && weekStatus === 'open' && isPastDeadline()) {
      toast.error("Đã quá hạn đăng ký lịch làm việc tuần này (Hạn cuối: 18h00 Chủ Nhật)!");
      return;
    }

    const canClick = getCanClick(emp);
    if (!canClick) return;

    if (existingItem && existingItem.TrangThai !== "pending" && weekStatus !== "reopened") {
      toast.error("Chỉ có thể thay đổi ca đang chờ duyệt");
      return;
    }


    const key = `${emp.MaNhanVien}_${date}_${shiftObj.MaCaLam}`;
    const currentDraft = draftChanges[key];
    
    // 2. Kiểm tra mỗi nhân sự chỉ được làm tối đa 1 ca / ngày
    const isTryingToAdd = (!existingItem && currentDraft !== 'add') || (existingItem && currentDraft === 'remove');
    
    if (isTryingToAdd) {
      const existingShiftsForDay = registrations.filter(r => {
        if (r.MaNhanVien != emp.MaNhanVien) return false;
        if (r.TrangThai === 'rejected') return false; // Bỏ qua ca bị từ chối
        const d = new Date(r.NgayLam);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr === date;
      });
      let draftAdds = 0;
      let draftRemoves = 0;
      Object.keys(draftChanges).forEach(k => {
        const [eId, dStr, sId] = k.split('_');
        if (eId == emp.MaNhanVien && dStr === date) {
          if (draftChanges[k] === 'add') draftAdds++;
          if (draftChanges[k] === 'remove') {
            const hasReg = existingShiftsForDay.some(r => r.MaCaLam == sId);
            if (hasReg) draftRemoves++;
          }
        }
      });
      const totalShifts = existingShiftsForDay.length + draftAdds - draftRemoves;
      if (totalShifts >= 1) {
        toast.error("Mỗi nhân viên chỉ được đăng ký tối đa 1 ca làm/ngày!");
        return;
      }
    }

    const newDrafts = { ...draftChanges };

    if (existingItem) {
      if (currentDraft === 'remove') delete newDrafts[key];
      else newDrafts[key] = 'remove';
    } else {
      if (currentDraft === 'add') delete newDrafts[key];
      else newDrafts[key] = 'add';
    }
    
    setDraftChanges(newDrafts);
  };

  const handleSaveChanges = async () => {
    const changes = Object.entries(draftChanges);
    if (changes.length === 0) return;

    setIsSaving(true);
    let errorMessages = [];

    for (const [key, action] of changes) {
      const [empId, date, shiftId] = key.split('_');
      
      if (action === 'add') {
        try {
          await axios.post(`${API}/shifts/register`, { MaNhanVien: empId, MaCaLam: shiftId, NgayLam: date });
        } catch (e) { 
          errorMessages.push(`Ngày ${date}: ${e.response?.data?.message || e.message}`);
          console.error(e); 
        }
      } else if (action === 'remove') {
        const reg = registrations.find(r => {
          if (r.MaNhanVien != empId || r.MaCaLam != shiftId) return false;
          const d = new Date(r.NgayLam);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dateStr === date;
        });
        if (reg && (reg.TrangThai === "pending" || weekStatus === "reopened")) {
          try {
            await axios.delete(`${API}/shifts/register/${reg.MaDangKy}`);
          } catch (e) { 
            errorMessages.push(`Lỗi xóa ngày ${date}: ${e.response?.data?.message || e.message}`);
            console.error(e); 
          }
        }
      }
    }

    if (errorMessages.length > 0) {
      toast.error(
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <strong>Có lỗi với một số thay đổi:</strong>
          <ul className="list-disc pl-4 mt-2">
            {errorMessages.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>,
        { duration: 8000 }
      );
    } else {
      toast.success("Lưu thay đổi thành công!");
      setDraftChanges({});
    }

    setIsSaving(false);
    fetchRegistrations();
  };

  const getCellBg = (reg, isDraftAdd, isDraftRemove) => {
    if (isDraftRemove) return "bg-slate-200 text-slate-400 opacity-50"; // Visual cue for removal
    if (isDraftAdd) return "bg-sky-200 text-sky-800 ring-2 ring-sky-400"; // Visual cue for addition
    if (!reg) return "";
    if (reg.TrangThai === "approved") return "bg-sky-200 text-sky-800";
    if (reg.TrangThai === "pending") return "bg-amber-100 text-amber-800";
    if (reg.TrangThai === "rejected") return "bg-rose-100 text-rose-800";
    return "";
  };

  const getCellSymbol = (reg, isDraftAdd, isDraftRemove) => {
    if (isDraftRemove) return "";
    if (isDraftAdd) return "X";
    if (!reg) return "";
    if (reg.TrangThai === "approved") return "X";
    if (reg.TrangThai === "pending") return "X";
    if (reg.TrangThai === "rejected") return "❌";
    return "";
  };

  // -------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------
  const WeekNav = () => (
    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
      <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="px-3 text-sm font-bold text-slate-700 dark:text-zinc-300 min-w-[160px] text-center">Tuần {weekLabel}</span>
      <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  const getHeaderInfo = () => {
    if (activeTab === "official") {
      return {
        title: "Lịch Làm Việc Chính Thức",
        desc: "Xem lịch làm việc chính thức của tuần"
      };
    }
    if (activeTab === "approvals") {
      return {
        title: "Duyệt Đăng Ký Ca Làm",
        desc: "Xem & duyệt ca làm việc của nhân viên"
      };
    }
    return {
      title: "Bảng Đăng Ký Ca Làm",
      desc: isManager || isAdmin ? "Xem lịch & duyệt ca làm việc" : "Xem lịch & đăng ký ca làm"
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-6">
      <header className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {headerInfo.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                {headerInfo.desc}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <WeekNav />
          {isManager && (
            <Link to="/shift-management" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2">
              <Edit className="w-4 h-4" /> Quản lý Ca Làm
            </Link>
          )}
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {location.pathname !== "/" && (
          <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "register"
                  ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 bg-white dark:bg-zinc-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Đăng ký ca
            </button>
            
            {(isManager || isAdmin) && (
              <button
                onClick={() => setActiveTab("approvals")}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === "approvals"
                    ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 bg-white dark:bg-zinc-900"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <CheckSquare className="w-4 h-4" /> Duyệt đăng ký
                {pendingRegs.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRegs.length}</span>
                )}
              </button>
            )}

            {weekStatus === 'admin_approved' && (
              <button
                onClick={() => setActiveTab("official")}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === "official"
                    ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 bg-white dark:bg-zinc-900"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Lịch làm chính thức
              </button>
            )}
          </div>
        )}

        {/* ====== TAB 2: ĐĂNG KÝ CA / LỊCH LÀM CHÍNH THỨC ====== */}
        {(activeTab === "register" || activeTab === "official") && (
          <div className="p-4 overflow-x-auto">
            {isStaff && weekStatus === 'pending' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 my-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Đăng Ký Ca Đang Đóng</h3>
                <p className="text-slate-500 dark:text-zinc-400 max-w-md text-sm px-6 leading-relaxed">
                  Quản lý chưa mở cổng đăng ký lịch làm việc cho tuần này (<span className="font-bold">{weekLabel}</span>). 
                  Vui lòng quay lại sau hoặc liên hệ quản lý để biết thêm chi tiết!
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {activeTab === "official" ? "Lịch Làm Việc Chính Thức" : "Bảng Đăng Ký Ca Làm"}
                </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Trạng thái tuần: 
                    <span className="ml-1 font-bold">
                      {weekStatus === 'pending' && <span className="text-slate-500">Chưa mở đăng ký</span>}
                      {weekStatus === 'open' && (
                        <>
                          <span className="text-sky-600">Đang mở đăng ký</span>
                          {isPastDeadline() && <span className="text-rose-600 ml-2 font-black">(Đã hết hạn đăng ký - Hạn cuối: 18h00 Chủ Nhật)</span>}
                        </>
                      )}
                      {weekStatus === 'reopened' && <span className="text-amber-600">Đang mở lại đăng ký (Bởi Quản lý)</span>}
                      {weekStatus === 'manager_approved' && <span className="text-amber-600">Chờ duyệt</span>}
                      {weekStatus === 'admin_approved' && <span className="text-emerald-600">Đã chốt lịch</span>}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {(isManager || isAdmin) && weekStatus === 'pending' && (
                    <button onClick={handleOpenRegistration} className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                      <BellRing className="w-4 h-4" /> Mở đăng ký
                    </button>
                  )}
                  {(isManager || isAdmin) && (weekStatus === 'open' || weekStatus === 'reopened') && (
                    <button onClick={handleAdminFinalize} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                      <CheckCircle className="w-4 h-4" /> Chốt lịch làm việc
                    </button>
                  )}
                  {(isManager || isAdmin) && weekStatus === 'admin_approved' && activeTab === "register" && (
                    <button onClick={handleAdminReopen} className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                      <RefreshCw className="w-4 h-4" /> Mở lại đăng ký
                    </button>
                  )}
                  {isStaff && activeTab !== "official" && (
                    <button 
                      onClick={handleSaveChanges} 
                      disabled={Object.keys(draftChanges).length === 0 || isSaving || (weekStatus === 'open' && isPastDeadline())} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${
                        Object.keys(draftChanges).length === 0 || (weekStatus === 'open' && isPastDeadline())
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600" 
                          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10"
                      }`}
                    >
                      {isSaving ? "Đang lưu..." : "Lưu đăng ký"}
                    </button>
                  )}
                  <button onClick={fetchRegistrations} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors">
                    <RefreshCw className="w-4 h-4" /> Làm mới
                  </button>
              </div>
            </div>

            {/* Legend */}
            {activeTab === "official" ? (
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-200 text-sky-800">Lịch làm chính thức (X)</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-200 text-sky-800">Đã duyệt (X)</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-amber-100 text-amber-800">Chờ duyệt (X)</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-rose-100 text-rose-800">Từ chối (❌)</span>
              </div>
            )}

            <div className="min-w-max border border-slate-300 dark:border-zinc-700">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-[#a9d18e]">
                    <th rowSpan={4} className="px-4 py-2 border border-slate-400 font-bold min-w-[150px] align-bottom bg-white text-slate-800 text-left text-[14px]">
                      HỌ VÀ TÊN
                    </th>
                    {days.map(day => (
                      <React.Fragment key={day.date}>
                        <th colSpan={2} className="py-2 border border-slate-400 font-bold text-slate-900 bg-[#a9d18e] uppercase text-[13px]">
                          {day.name}
                        </th>
                        <th colSpan={2} className="py-2 border border-slate-400 font-bold text-slate-900 bg-[#c5e0b4] text-[13px]">
                          {day.displayDate.split('/')[0]}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                  <tr>
                    {days.map(day => (
                      <React.Fragment key={`${day.date}-AB`}>
                        <th colSpan={2} className="py-1.5 border border-slate-400 text-red-600 bg-[#bdd7ee] font-bold text-[13px]">CA A</th>
                        <th colSpan={2} className="py-1.5 border border-slate-400 text-red-600 bg-[#ccc0da] font-bold text-[13px]">CA B</th>
                      </React.Fragment>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    {days.map(day => (
                      <React.Fragment key={`${day.date}-123`}>
                        <th className="py-1 border border-slate-400 text-slate-800 font-normal min-w-[50px] text-[12px]">CA 1</th>
                        <th colSpan={2} className="py-1 border border-slate-400 text-slate-800 font-normal min-w-[100px] text-[12px]">CA 2</th>
                        <th className="py-1 border border-slate-400 text-slate-800 font-normal min-w-[50px] text-[12px]">CA 3</th>
                      </React.Fragment>
                    ))}
                  </tr>
                  <tr>
                    {days.map(day => (
                      <React.Fragment key={`${day.date}-times`}>
                        <th className="py-1 border border-slate-400 text-slate-900 font-normal bg-[#f8cbad] text-[11px]">6h30-12</th>
                        <th className="py-1 border border-slate-400 text-slate-900 font-normal bg-[#ffe699] text-[11px]">12h-15h</th>
                        <th className="py-1 border border-slate-400 text-slate-900 font-normal bg-[#fff2cc] text-[11px]">15-17h30</th>
                        <th className="py-1 border border-slate-400 text-slate-900 font-normal bg-[#9bc2e6] text-[11px]">17h30-23</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                  <tbody>
                    {staffMembers.map(emp => {
                      const isFT = emp.LoaiNhanVien === 'Full-time' || emp.LoaiNhanVien === 'Toàn thời gian';
                      const canClick = activeTab === "official" ? false : getCanClick(emp);
                      
                      const isMyRow = String(emp.MaNhanVien) === String(myEmployeeId);
                      return (
                      <tr key={emp.MaNhanVien} className={`hover:bg-slate-50 ${isMyRow ? 'bg-amber-50/70 font-semibold' : 'bg-white'}`}>
                        <td className={`px-4 py-2 border border-slate-400 text-left font-bold uppercase italic text-[13px] ${isMyRow ? 'text-amber-800 bg-amber-100/50' : 'text-slate-800'}`}>
                          {emp.HoTen} {isMyRow && '(Bạn)'}
                        </td>
                        {days.map(day => {
                          const getFilteredReg = (empId, date, shiftId) => {
                            const reg = getReg(empId, date, shiftId);
                            if (activeTab === "official") {
                              return (reg && reg.TrangThai === "approved") ? reg : null;
                            }
                            return reg;
                          };

                          const rA = getFilteredReg(emp.MaNhanVien, day.date, caA?.MaCaLam);
                          const rB = getFilteredReg(emp.MaNhanVien, day.date, caB?.MaCaLam);
                          const r1 = getFilteredReg(emp.MaNhanVien, day.date, ca1?.MaCaLam);
                          const r2 = getFilteredReg(emp.MaNhanVien, day.date, ca2?.MaCaLam);
                          const r3 = getFilteredReg(emp.MaNhanVien, day.date, ca3?.MaCaLam);

                          const keyA = `${emp.MaNhanVien}_${day.date}_${caA?.MaCaLam}`;
                          const keyB = `${emp.MaNhanVien}_${day.date}_${caB?.MaCaLam}`;
                          const key1 = `${emp.MaNhanVien}_${day.date}_${ca1?.MaCaLam}`;
                          const key2 = `${emp.MaNhanVien}_${day.date}_${ca2?.MaCaLam}`;
                          const key3 = `${emp.MaNhanVien}_${day.date}_${ca3?.MaCaLam}`;

                          const draftA = activeTab === "official" ? null : draftChanges[keyA];
                          const draftB = activeTab === "official" ? null : draftChanges[keyB];
                          const draft1 = activeTab === "official" ? null : draftChanges[key1];
                          const draft2 = activeTab === "official" ? null : draftChanges[key2];
                          const draft3 = activeTab === "official" ? null : draftChanges[key3];

                          const actA = rA || r1;
                          const actA2 = rA || r2;
                          const actB2 = rB || r2;
                          const actB3 = rB || r3;

                          const isDraftAddA = isFT ? draftA === 'add' : draft1 === 'add';
                          const isDraftRemA = isFT ? draftA === 'remove' : draft1 === 'remove';
                          
                          const isDraftAddA2 = isFT ? draftA === 'add' : draft2 === 'add';
                          const isDraftRemA2 = isFT ? draftA === 'remove' : draft2 === 'remove';

                          const isDraftAddB2 = isFT ? draftB === 'add' : draft2 === 'add';
                          const isDraftRemB2 = isFT ? draftB === 'remove' : draft2 === 'remove';

                          const isDraftAddB3 = isFT ? draftB === 'add' : draft3 === 'add';
                          const isDraftRemB3 = isFT ? draftB === 'remove' : draft3 === 'remove';

                          return (
                            <React.Fragment key={day.date}>
                              {/* Cell 1: Khung 6h30-12h */}
                              <td 
                                className={`border border-slate-400 font-bold text-[13px] ${canClick ? 'cursor-pointer hover:bg-slate-100' : 'cursor-not-allowed'} ${getCellBg(actA, isDraftAddA, isDraftRemA)}`}
                                onClick={() => canClick && handleCellToggle(emp, day.date, isFT ? caA : ca1, actA)}
                              >
                                {getCellSymbol(actA, isDraftAddA, isDraftRemA)}
                              </td>
                              {/* Cell 2: Khung 12h-15h */}
                              <td 
                                className={`border border-slate-400 font-bold text-[13px] ${canClick ? 'cursor-pointer hover:bg-slate-100' : 'cursor-not-allowed'} ${getCellBg(actA2, isDraftAddA2, isDraftRemA2)}`}
                                onClick={() => canClick && handleCellToggle(emp, day.date, isFT ? caA : ca2, actA2)}
                              >
                                {getCellSymbol(actA2, isDraftAddA2, isDraftRemA2)}
                              </td>
                              {/* Cell 3: Khung 15h-17h30 */}
                              <td 
                                className={`border border-slate-400 font-bold text-[13px] ${canClick ? 'cursor-pointer hover:bg-slate-100' : 'cursor-not-allowed'} ${getCellBg(actB2, isDraftAddB2, isDraftRemB2)}`}
                                onClick={() => canClick && handleCellToggle(emp, day.date, isFT ? caB : ca2, actB2)}
                              >
                                {getCellSymbol(actB2, isDraftAddB2, isDraftRemB2)}
                              </td>
                              {/* Cell 4: Khung 17h30-23h */}
                              <td 
                                className={`border border-slate-400 font-bold text-[13px] ${canClick ? 'cursor-pointer hover:bg-slate-100' : 'cursor-not-allowed'} ${getCellBg(actB3, isDraftAddB3, isDraftRemB3)}`}
                                onClick={() => canClick && handleCellToggle(emp, day.date, isFT ? caB : ca3, actB3)}
                              >
                                {getCellSymbol(actB3, isDraftAddB3, isDraftRemB3)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
            )}
          </div>
        )}

        {/* ====== TAB 3: DUYỆT ĐĂNG KÝ (Manager only) ====== */}
        {activeTab === "approvals" && isManager && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Duyệt Đăng Ký Ca</h2>
                <p className="text-sm text-slate-500 mt-1">Xem xét và phê duyệt đăng ký ca của nhân viên trong tuần <strong>{weekLabel}</strong></p>
              </div>
              <WeekNav />
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-14 text-slate-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Không có đăng ký nào trong tuần này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map(reg => (
                  <div key={reg.MaDangKy} className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                        {reg.HoTen?.split(" ").pop().slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">{reg.HoTen}</div>
                        <div className="text-sm text-slate-600 dark:text-zinc-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(reg.NgayLam).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{reg.TenCaLam} ({reg.GioBatDau}–{reg.GioKetThuc})</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[reg.TrangThai]?.cls}`}>{STATUS_CONFIG[reg.TrangThai]?.label}</span>
                        </div>
                        {reg.GhiChu && <p className="text-xs text-slate-500 mt-1 italic">"{reg.GhiChu}"</p>}
                      </div>
                    </div>
                    {reg.TrangThai === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveReg(reg.MaDangKy, "approved")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleApproveReg(reg.MaDangKy, "rejected")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                      </div>
                    )}
                    {reg.TrangThai !== "pending" && (
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 border ${STATUS_CONFIG[reg.TrangThai]?.cls}`}>
                        {reg.TrangThai === "approved" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {STATUS_CONFIG[reg.TrangThai]?.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

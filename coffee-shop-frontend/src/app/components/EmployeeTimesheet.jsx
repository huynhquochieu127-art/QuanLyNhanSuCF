import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, Users, Clock, FileText, Edit3, Save, X, RefreshCw, Send, AlertCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

export default function EmployeeTimesheet() {
  const [activeTab, setActiveTab] = useState("monthly_timesheets");
  const [employee, setEmployee] = useState({ name: "Manager", id: null, role: "2" });

  const [allAttendance, setAllAttendance] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  // Bảng công tháng
  const [tsMonth, setTsMonth] = useState(5);
  const [tsYear, setTsYear] = useState(2026);
  const [timesheets, setTimesheets] = useState([]);
  const [managerGhiChu, setManagerGhiChu] = useState({});

  // Chỉnh sửa inline
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setEmployee({
        name: userObj.HoTen || userObj.Email,
        id: userObj.MaTaiKhoan,
        role: String(userObj.MaVaiTro),
      });
    }
  }, []);

  const fetchAllData = async () => {
    try {
      const attRes = await axios.get(`http://localhost:5000/api/timekeeping`);
      if (attRes.data.success) setAllAttendance(attRes.data.data);
      const reqRes = await axios.get(`http://localhost:5000/api/timekeeping/requests`);
      if (reqRes.data.success) setAllRequests(reqRes.data.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/timesheets?month=${tsMonth}&year=${tsYear}`);
      if (res.data.success) {
        setTimesheets(res.data.data);
        const notes = {};
        res.data.data.forEach((ts) => { notes[ts.MaBangCong] = ts.GhiChuQL || ""; });
        setManagerGhiChu(notes);
      }
    } catch (err) {
      console.error("Lỗi khi tải bảng công:", err);
    }
  };

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { fetchTimesheets(); }, [tsMonth, tsYear]);

  // Bắt đầu chỉnh sửa inline
  const startEdit = (ts) => {
    setEditingId(ts.MaBangCong);
    setEditForm({
      SoCong: ts.SoCong || 0,
      SoGioLam: ts.SoGioLam || 0,
      SoNgayNghi: ts.SoNgayNghi || 0,
      SoNgayTre: ts.SoNgayTre || 0,
      GhiChuQL: managerGhiChu[ts.MaBangCong] || "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  // Lưu chỉnh sửa
  const handleSaveEdit = async (maBangCong) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/timesheets/${maBangCong}`, editForm);
      if (res.data.success) {
        toast.success("Đã lưu thay đổi bảng công!");
        setEditingId(null);
        fetchTimesheets();
      }
    } catch (err) {
      toast.error("Lỗi khi lưu bảng công");
    }
  };

  const handleApproveRequest = async (id, status) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/timekeeping/request/${id}/status`, { status });
      if (res.data.success) {
        toast.success(status === "approved" ? "Đã duyệt yêu cầu!" : "Đã từ chối yêu cầu!");
        fetchAllData();
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái yêu cầu");
    }
  };

  const handleSendToEmployee = async (maBangCong) => {
    try {
      const ghiChu = editingId === maBangCong ? editForm.GhiChuQL : managerGhiChu[maBangCong] || "";
      const res = await axios.post("http://localhost:5000/api/timesheets/send-to-employee", { maBangCong, ghiChu });
      if (res.data.success) {
        toast.success("✅ Đã gửi bảng công cho nhân viên! Họ sẽ nhận được thông báo.");
        fetchTimesheets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi bảng công");
    }
  };

  const handleSubmitToAdmin = async (maBangCong) => {
    try {
      const res = await axios.post("http://localhost:5000/api/timesheets/submit-to-admin", { maBangCong });
      if (res.data.success) {
        toast.success("✅ Đã chốt và gửi bảng công lên Admin tính lương!");
        fetchTimesheets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi Admin");
    }
  };

  const tabs = [
    { key: "monthly_timesheets", label: "Bảng Công Tháng", icon: Clock },
    { key: "report", label: "Báo Cáo Điểm Danh", icon: Users },
    {
      key: "requests",
      label: "Duyệt Yêu Cầu",
      icon: FileText,
      badge: allRequests.filter((r) => r.TrangThai === "pending").length,
    },
  ];

  const statusConfig = {
    draft: { label: "Nháp", color: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300" },
    sent_to_emp: { label: "Đã gửi NV", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    emp_replied: { label: "NV phản hồi", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200" },
    submitted_to_admin: { label: "Đã gửi Admin", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200" },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Bảng Công Nhân Viên
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
              Tổng hợp, gửi và duyệt bảng công tháng cho nhân viên
            </p>
          </div>
        </div>

        {/* Tab Bar + Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-zinc-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ============ TAB: BẢNG CÔNG THÁNG ============ */}
          {activeTab === "monthly_timesheets" && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Quản lý Bảng Công Tháng</h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
                    Kiểm tra chi tiết số công hàng ngày, chỉnh sửa và gửi bảng công cho từng nhân viên
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={tsMonth}
                    onChange={(e) => setTsMonth(parseInt(e.target.value))}
                    className="bg-slate-100 dark:bg-zinc-800 text-sm font-bold text-slate-700 dark:text-zinc-300 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[...Array(12).keys()].map((i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                  <select
                    value={tsYear}
                    onChange={(e) => setTsYear(parseInt(e.target.value))}
                    className="bg-slate-100 dark:bg-zinc-800 text-sm font-bold text-slate-700 dark:text-zinc-300 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>Năm {y}</option>
                    ))}
                  </select>
                  <button
                    onClick={fetchTimesheets}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                  </button>
                </div>
              </div>

              {timesheets.filter(ts => ts.MaNhanVien !== 1).length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Không có dữ liệu nhân viên hoạt động</p>
                  <p className="text-sm mt-1 text-slate-400">Nhân viên cần có dữ liệu chấm công trong tháng này</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bảng chi tiết lưới ngày giống Hình 1 */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm max-w-full">
                    <table className="min-w-max w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-amber-500 dark:bg-amber-600 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-zinc-800">
                          <th className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 sticky left-0 bg-amber-500 dark:bg-amber-600 z-10 w-8 text-center">No.</th>
                          <th className="py-2.5 px-4 border-r border-slate-200 dark:border-zinc-800 sticky left-8 bg-amber-500 dark:bg-amber-600 z-10 min-w-[150px]">NAME</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 text-center w-12">Số công</th>
                          {/* Render columns 01 to 31 */}
                          {[...Array(new Date(tsYear, tsMonth, 0).getDate()).keys()].map((day) => {
                            const dateNum = String(day + 1).padStart(2, "0");
                            const d = new Date(tsYear, tsMonth - 1, day + 1);
                            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            return (
                              <th
                                key={day}
                                className={`py-1.5 px-1 border-r border-slate-200 dark:border-zinc-800 text-center w-10 min-w-[40px] ${
                                  isWeekend ? "bg-amber-100 dark:bg-zinc-800 text-rose-500" : ""
                                }`}
                              >
                                <div>{dateNum}</div>
                                <div className="text-[9px] font-medium opacity-80">{dayName}</div>
                              </th>
                            );
                          })}
                          <th className="py-2.5 px-3 border-l border-slate-200 dark:border-zinc-800 text-center min-w-[60px] bg-emerald-500 text-white font-black">TOTAL (h)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timesheets.filter(ts => ts.MaNhanVien !== 1).map((ts, index) => {
                          const daysInMonth = new Date(tsYear, tsMonth, 0).getDate();
                          
                          // Mock/Simulate hours mapping for grid based on actual logs
                          const dailyHours = Array(daysInMonth).fill("O"); // default Off
                          
                          // If we have attendance logs, we populate them:
                          allAttendance.forEach((att) => {
                            const attDate = new Date(att.NgayLam);
                            if (
                              att.MaNhanVien === ts.MaNhanVien &&
                              attDate.getMonth() + 1 === tsMonth &&
                              attDate.getFullYear() === tsYear
                            ) {
                              const dayIdx = attDate.getDate() - 1;
                              if (dayIdx >= 0 && dayIdx < daysInMonth) {
                                dailyHours[dayIdx] = att.SoGioLam ? parseFloat(att.SoGioLam).toFixed(1) : "8.0";
                              }
                            }
                          });

                          return (
                            <tr
                              key={ts.MaBangCong}
                              className="border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 text-center sticky left-0 bg-white dark:bg-zinc-900 z-10 font-bold text-slate-500">
                                {index + 1}
                              </td>
                              <td className="py-2.5 px-4 border-r border-slate-200 dark:border-zinc-800 sticky left-8 bg-white dark:bg-zinc-900 z-10 font-black text-slate-800 dark:text-white">
                                {ts.HoTen}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 text-center font-bold text-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10">
                                {ts.SoCong || 0}
                              </td>
                              {dailyHours.map((hours, dIdx) => {
                                const isO = hours === "O";
                                return (
                                  <td
                                    key={dIdx}
                                    className={`py-2 px-1 border-r border-slate-200 dark:border-zinc-850 text-center font-bold ${
                                      isO 
                                        ? "text-blue-500 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/5" 
                                        : "text-slate-800 dark:text-zinc-200"
                                    }`}
                                  >
                                    {hours}
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-3 border-l border-slate-200 dark:border-zinc-800 text-center bg-emerald-500/10 font-black text-emerald-700 dark:text-emerald-400">
                                {ts.SoGioLam || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Phần chi tiết tương tác gửi/chốt/sửa của từng nhân viên */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {timesheets.filter(ts => ts.MaNhanVien !== 1).map((ts) => {
                      const isEditing = editingId === ts.MaBangCong;
                      const status = statusConfig[ts.TrangThai] || statusConfig.draft;
                      const hasReply = ts.TrangThai === "emp_replied";
                      const isDone = ts.TrangThai === "submitted_to_admin";
                      const isSent = ts.TrangThai === "sent_to_emp";
                      const isDraft = ts.TrangThai === "draft";

                      return (
                        <div
                          key={ts.MaBangCong}
                          className={`border rounded-2xl p-4 transition-all shadow-sm ${
                            hasReply
                              ? "border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10"
                              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{ts.HoTen}</p>
                              <p className="text-xs text-slate-500 dark:text-zinc-400">{ts.LoaiNhanVien} · {ts.ChucVu}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                                {status.label}
                              </span>
                              {hasReply && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-2.5 h-2.5" /> Có phản hồi
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                              { label: "Công", field: "SoCong", value: ts.SoCong || 0, unit: "n" },
                              { label: "Giờ", field: "SoGioLam", value: ts.SoGioLam || 0, unit: "h" },
                              { label: "Nghỉ", field: "SoNgayNghi", value: ts.SoNgayNghi || 0, unit: "n" },
                              { label: "Trễ", field: "SoNgayTre", value: ts.SoNgayTre || 0, unit: "l" },
                            ].map((item) => (
                              <div key={item.field} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={editForm[item.field]}
                                    onChange={(e) => setEditForm((p) => ({ ...p, [item.field]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full text-center text-sm font-bold bg-white dark:bg-zinc-700 border border-indigo-300 rounded px-1 py-0.5 focus:outline-none"
                                  />
                                ) : (
                                  <p className="text-base font-black text-slate-800 dark:text-zinc-200">
                                    {item.value}<span className="text-[10px] font-medium text-slate-450 ml-0.5">{item.unit}</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Lời nhắn / Ghi chú QL */}
                          <div className="mb-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ghi chú gửi nhân viên</label>
                            <input
                              type="text"
                              value={isEditing ? editForm.GhiChuQL : (managerGhiChu[ts.MaBangCong] || "")}
                              onChange={(e) => {
                                if (isEditing) {
                                  setEditForm((p) => ({ ...p, GhiChuQL: e.target.value }));
                                } else {
                                  setManagerGhiChu((p) => ({ ...p, [ts.MaBangCong]: e.target.value }));
                                }
                              }}
                              placeholder="Nhập lời nhắn..."
                              disabled={isDone}
                              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                          </div>

                          {/* Phản hồi nhân viên */}
                          {(hasReply || ts.PhanHoiNV) && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                              <p className="text-[9px] font-bold text-blue-500 uppercase">Nhân viên phản hồi:</p>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">"{ts.PhanHoiNV}"</p>
                            </div>
                          )}

                          {/* Action panel */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                            <div className="flex gap-1.5">
                              {!isDone && !isEditing && (
                                <button
                                  onClick={() => startEdit(ts)}
                                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa số công
                                </button>
                              )}
                              {isEditing && (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(ts.MaBangCong)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="flex gap-1.5">
                              {(isDraft || hasReply) && !isEditing && (
                                <button
                                  onClick={() => handleSendToEmployee(ts.MaBangCong)}
                                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                  <Send className="w-3 h-3" /> Gửi nhân viên
                                </button>
                              )}
                              {(isSent || hasReply) && !isEditing && (
                                <button
                                  onClick={() => handleSubmitToAdmin(ts.MaBangCong)}
                                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                  <CheckCircle className="w-3 h-3" /> Chốt & Gửi Admin
                                </button>
                              )}
                              {isDone && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Đã gửi Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ TAB: BÁO CÁO ĐIỂM DANH ============ */}
          {activeTab === "report" && (
            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Báo cáo Điểm danh Tổng hợp</h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">Lịch sử chấm công của toàn bộ nhân viên</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-zinc-800">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800/50">
                      {["Nhân viên", "Ngày Làm", "Giờ Vào", "Giờ Ra", "Số Giờ", "Trạng thái"].map((h) => (
                        <th key={h} className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendance.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Chưa có dữ liệu chấm công</p></td></tr>
                    ) : allAttendance.map((record, index) => {
                      const checkInTime = new Date(record.GioCheckIn);
                      const isLate = checkInTime.getHours() > 8 || (checkInTime.getHours() === 8 && checkInTime.getMinutes() > 15);
                      return (
                        <tr key={index} className="border-t border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">{record.EmployeeName || record.MaNhanVien}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-zinc-400">{new Date(record.NgayLam).toLocaleDateString("vi-VN")}</td>
                          <td className="py-3 px-4 text-sm font-medium">
                            <span className={isLate ? "text-rose-600 font-bold" : "text-emerald-600"}>
                              {checkInTime.toLocaleTimeString("vi-VN")}{isLate && <span className="ml-1 text-xs">(Trễ)</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-zinc-400">{record.GioCheckOut ? new Date(record.GioCheckOut).toLocaleTimeString("vi-VN") : "-"}</td>
                          <td className="py-3 px-4 text-sm font-bold">{record.SoGioLam ? `${record.SoGioLam}h` : "-"}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${record.TrangThai === "OUT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {record.TrangThai === "OUT" ? "Hoàn thành" : "Đang làm"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ TAB: DUYỆT YÊU CẦU ============ */}
          {activeTab === "requests" && (
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Duyệt Yêu Cầu Nhân Sự</h2>
              <div className="grid gap-4">
                {allRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Chưa có yêu cầu nào</p></div>
                ) : allRequests.map((req) => (
                  <div key={req.MaYeuCau} className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${req.Loai.includes("nghỉ") ? "bg-rose-100 text-rose-700" : req.Loai.includes("đổi ca") ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>{req.Loai}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{req.EmployeeName || req.MaNhanVien}</span>
                        <span className="text-xs text-slate-500">Gửi ngày {new Date(req.NgayTao).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300"><span className="font-bold">Ngày áp dụng:</span> {new Date(req.Ngay).toLocaleDateString("vi-VN")}</p>
                      <p className="text-sm text-slate-500 mt-1 italic">"{req.LyDo}"</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {req.TrangThai === "pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveRequest(req.MaYeuCau, "approved")} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Duyệt</button>
                          <button onClick={() => handleApproveRequest(req.MaYeuCau, "rejected")} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1"><XCircle className="w-4 h-4" /> Từ chối</button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 ${req.TrangThai === "approved" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"}`}>
                          {req.TrangThai === "approved" ? <><CheckCircle className="w-4 h-4" /> Đã Duyệt</> : <><XCircle className="w-4 h-4" /> Đã Từ Chối</>}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

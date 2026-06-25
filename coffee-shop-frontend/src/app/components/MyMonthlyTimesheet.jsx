import { useState, useEffect } from "react";
import { Clock, RefreshCw, Send, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

export default function MyMonthlyTimesheet() {
  const [employee, setEmployee] = useState({ name: "Nhân viên", id: null, role: "3" });
  const [tsMonth, setTsMonth] = useState(5);
  const [tsYear, setTsYear] = useState(2026);
  
  const [personalTimesheet, setPersonalTimesheet] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [employeePhanHoi, setEmployeePhanHoi] = useState("");
  const [loading, setLoading] = useState(false);

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

  const fetchData = async () => {
    if (!employee.id) return;
    setLoading(true);
    try {
      // 1. Lấy thông tin bảng công cá nhân từ API
      const res = await axios.get(`https://quanlynhansucf.onrender.com/api/timesheets?month=${tsMonth}&year=${tsYear}&employeeId=${employee.id}`);
      if (res.data.success) {
        setPersonalTimesheet(res.data.data);
        setEmployeePhanHoi(res.data.data?.PhanHoiNV || "");
      } else {
        setPersonalTimesheet(null);
      }

      // 2. Lấy dữ liệu chấm công thực tế để điền vào lưới ngày
      const attRes = await axios.get(`https://quanlynhansucf.onrender.com/api/timekeeping?employeeId=${employee.id}`);
      if (attRes.data.success) {
        setAllAttendance(attRes.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu bảng công:", err);
      toast.error("Không thể tải dữ liệu bảng công!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tsMonth, tsYear, employee.id]);

  const handleEmployeeReply = async (isAgree) => {
    try {
      const res = await axios.post("https://quanlynhansucf.onrender.com/api/timesheets/employee-reply", {
        maBangCong: personalTimesheet.MaBangCong,
        phanHoi: isAgree ? "Đồng ý" : employeePhanHoi,
        isAgree
      });
      if (res.data.success) {
        toast.success(isAgree ? "Đã xác nhận đồng ý bảng công!" : "Đã gửi ý kiến phản hồi!");
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi phản hồi");
    }
  };

  const daysInMonth = new Date(tsYear, tsMonth, 0).getDate();
  const dailyHours = Array(daysInMonth).fill("O");

  if (employee.id && allAttendance.length > 0) {
    allAttendance.forEach((att) => {
      const attDate = new Date(att.NgayLam);
      if (attDate.getMonth() + 1 === tsMonth && attDate.getFullYear() === tsYear) {
        const dayIdx = attDate.getDate() - 1;
        if (dayIdx >= 0 && dayIdx < daysInMonth) {
          dailyHours[dayIdx] = att.SoGioLam ? parseFloat(att.SoGioLam).toFixed(1) : "8.0";
        }
      }
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Bảng Công Nhân Viên
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
              Xem chi tiết số công hàng ngày và gửi phản hồi cho quản lý
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Bảng Công Tháng Của Tôi</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
                Chi tiết số giờ làm việc thực tế từng ngày trong tháng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tsMonth}
                onChange={(e) => setTsMonth(parseInt(e.target.value))}
                className="bg-slate-100 dark:bg-zinc-800 text-sm font-bold text-slate-700 dark:text-zinc-300 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {[...Array(12).keys()].map((i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                value={tsYear}
                onChange={(e) => setTsYear(parseInt(e.target.value))}
                className="bg-slate-100 dark:bg-zinc-800 text-sm font-bold text-slate-700 dark:text-zinc-300 rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tải lại
              </button>
            </div>
          </div>

          {!personalTimesheet ? (
            <div className="text-center py-16 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có dữ liệu bảng công cho Tháng {tsMonth}/{tsYear}</p>
              <p className="text-sm mt-1 text-slate-450">Bảng công sẽ xuất hiện sau khi quản lý tính toán.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Detailed Grid Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm max-w-full">
                <table className="min-w-max w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-500 dark:bg-amber-600 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-zinc-800">
                      <th className="py-2.5 px-4 border-r border-slate-200 dark:border-zinc-800 sticky left-0 bg-amber-500 dark:bg-amber-600 z-10 min-w-[150px]">NAME</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 text-center w-12">Số công</th>
                      {/* Render columns 01 to 31 */}
                      {[...Array(daysInMonth).keys()].map((day) => {
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
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-zinc-800 sticky left-0 bg-white dark:bg-zinc-900 z-10 font-black text-slate-800 dark:text-white">
                        {employee.name}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-zinc-800 text-center font-bold text-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10">
                        {personalTimesheet.SoCong || 0}
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
                        {personalTimesheet.SoGioLam || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stats Summary & Interaction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Stats */}
                <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Tổng Hợp Công Tháng</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Số công</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{personalTimesheet.SoCong || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Số giờ làm</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{personalTimesheet.SoGioLam || 0}h</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Số ngày nghỉ</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{personalTimesheet.SoNgayNghi || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Đi trễ</p>
                      <p className="text-xl font-black text-slate-850 dark:text-white mt-1">{personalTimesheet.SoNgayTre || 0}</p>
                    </div>
                  </div>

                  {personalTimesheet.GhiChuQL && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Ghi chú từ quản lý:</p>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mt-1">"{personalTimesheet.GhiChuQL}"</p>
                    </div>
                  )}
                </div>

                {/* Confirm & Feedback form */}
                <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Xác Nhận & Phản Hồi</h3>
                    <div>
                      <span className="text-xs text-slate-450 font-medium block mb-1">Trạng thái:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        personalTimesheet.TrangThai === 'draft' ? 'bg-slate-100 text-slate-700 dark:bg-zinc-800' :
                        personalTimesheet.TrangThai === 'sent_to_emp' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30' :
                        personalTimesheet.TrangThai === 'emp_replied' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30'
                      }`}>
                        {personalTimesheet.TrangThai === 'draft' && 'Quản lý đang soạn thảo'}
                        {personalTimesheet.TrangThai === 'sent_to_emp' && 'Chờ nhân viên xác nhận'}
                        {personalTimesheet.TrangThai === 'emp_replied' && 'Đã phản hồi / đồng ý'}
                        {personalTimesheet.TrangThai === 'submitted_to_admin' && 'Bảng công đã được chốt'}
                      </span>
                    </div>
                  </div>

                  {personalTimesheet.TrangThai === 'sent_to_emp' && (
                    <div className="space-y-3 mt-4">
                      <input
                        type="text"
                        placeholder="Ý kiến phản hồi nếu có sai lệch..."
                        value={employeePhanHoi}
                        onChange={(e) => setEmployeePhanHoi(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none w-full"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEmployeeReply(true)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm"
                        >
                          Xác nhận đồng ý
                        </button>
                        {employeePhanHoi && (
                          <button
                            onClick={() => handleEmployeeReply(false)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap"
                          >
                            Phản hồi sai lệch
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {personalTimesheet.TrangThai === 'emp_replied' && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl mt-4">
                      Bạn đã gửi phản hồi: "{personalTimesheet.PhanHoiNV || 'Đồng ý'}"
                    </div>
                  )}

                  {personalTimesheet.TrangThai === 'submitted_to_admin' && (
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-xl mt-4">
                      Bảng công đã gửi lên Admin. Không thể chỉnh sửa hoặc phản hồi thêm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

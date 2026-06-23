import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock, LogIn, LogOut, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function Timekeeping() {
  const [activeTab, setActiveTab] = useState("personal"); // personal, report, requests
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [employee, setEmployee] = useState({ name: "Nhân viên", id: null, role: "3" });

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Lấy dữ liệu user từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setEmployee({ name: userObj.HoTen || userObj.Email, id: userObj.MaTaiKhoan, role: String(userObj.MaVaiTro) });
    }
  }, []);

  const fetchPersonalHistory = async () => {
    try {
      if (!employee.id) return;
      const res = await axios.get(`http://localhost:5000/api/timekeeping?employeeId=${employee.id}`);
      if (res.data.success) {
        setAttendanceHistory(res.data.data);
        
        // Kiểm tra xem hôm nay đã check-in chưa
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = res.data.data.find(r => r.NgayLam && r.NgayLam.startsWith(todayStr));
        
        if (todayRecord) {
          if (!todayRecord.GioCheckOut) {
            setIsCheckedIn(true);
            setLastAction(`Đã Check-in lúc ${new Date(todayRecord.GioCheckIn).toLocaleTimeString('vi-VN')}`);
          } else {
            setIsCheckedIn(false);
            setLastAction(`Đã Check-out lúc ${new Date(todayRecord.GioCheckOut).toLocaleTimeString('vi-VN')}`);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử chấm công:", err);
    }
  };

  const fetchAllData = async () => {
    try {
      // Lấy toàn bộ báo cáo chấm công
      const attRes = await axios.get(`http://localhost:5000/api/timekeeping`);
      if (attRes.data.success) {
        setAllAttendance(attRes.data.data);
      }
      
      // Lấy toàn bộ yêu cầu
      const reqRes = await axios.get(`http://localhost:5000/api/timekeeping/requests`);
      if (reqRes.data.success) {
        setAllRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu quản lý:", err);
    }
  };

  useEffect(() => {
    if (employee.id) {
      fetchPersonalHistory();
      if (employee.role === "1" || employee.role === "2") {
        fetchAllData();
      }
    }
  }, [employee.id, employee.role]);

  const handleCheckIn = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/timekeeping/checkin', { MaNhanVien: employee.id });
      if (res.data.success) {
        toast.success("Check-in thành công!");
        setIsCheckedIn(true);
        const time = new Date().toLocaleTimeString("vi-VN", { hour: "numeric", minute: "2-digit" });
        setLastAction(`Checked in lúc ${time}`);
        fetchPersonalHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi Check-in");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/timekeeping/checkout', { MaNhanVien: employee.id });
      if (res.data.success) {
        toast.success(`Check-out thành công! Số giờ làm: ${res.data.data.soGioLam}h`);
        setIsCheckedIn(false);
        const time = new Date().toLocaleTimeString("vi-VN", { hour: "numeric", minute: "2-digit" });
        setLastAction(`Checked out lúc ${time}`);
        fetchPersonalHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi Check-out");
    }
  };

  const handleApproveRequest = async (id, status) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/timekeeping/request/${id}/status`, { status });
      if (res.data.success) {
        toast.success(status === 'approved' ? "Đã duyệt yêu cầu!" : "Đã từ chối yêu cầu!");
        fetchAllData(); // Refresh list
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái yêu cầu");
    }
  };

  const isManager = employee.role === "1" || employee.role === "2";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Chấm Công</h1>
            </div>
          </div>
        </div>
      </header>

      {/* TABS FOR MANAGER/ADMIN */}
      {isManager && (
        <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("personal")}
                className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "personal" 
                    ? "border-amber-500 text-amber-600" 
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Cá Nhân
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "report" 
                    ? "border-amber-500 text-amber-600" 
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Báo Cáo Điểm Danh
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "requests" 
                    ? "border-amber-500 text-amber-600" 
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Duyệt Yêu Cầu
                {allRequests.filter(r => r.TrangThai === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {allRequests.filter(r => r.TrangThai === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 py-8">
        {/* TAB 1: PERSONAL TIMEKEEPING */}
        {activeTab === "personal" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black uppercase shadow-xl shadow-amber-500/20">
                  {employee.name.split(" ").pop().charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{employee.name}</h2>
                <p className="text-slate-500 dark:text-zinc-400 font-medium">{currentDate}</p>
              </div>

              {lastAction && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 mb-8 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Clock className="w-5 h-5" />
                  {lastAction}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckedIn}
                  className={`py-8 rounded-2xl text-xl font-black flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    isCheckedIn
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed border border-slate-200 dark:border-zinc-700"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:-translate-y-1"
                  }`}
                >
                  <LogIn className="w-10 h-10" />
                  Bắt Đầu Ca (IN)
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!isCheckedIn}
                  className={`py-8 rounded-2xl text-xl font-black flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    !isCheckedIn
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed border border-slate-200 dark:border-zinc-700"
                      : "bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20 hover:-translate-y-1"
                  }`}
                >
                  <LogOut className="w-10 h-10" />
                  Kết Thúc Ca (OUT)
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                Lịch sử của tôi
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800">
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày Làm</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giờ Vào</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giờ Ra</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số Giờ</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-slate-500 font-medium">Chưa có lịch sử chấm công</td></tr>
                    ) : (
                      attendanceHistory.map((record, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">
                            {new Date(record.NgayLam).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {new Date(record.GioCheckIn).toLocaleTimeString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-rose-600 dark:text-rose-400">
                            {record.GioCheckOut ? new Date(record.GioCheckOut).toLocaleTimeString("vi-VN") : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-zinc-300">
                            {record.SoGioLam ? `${record.SoGioLam}h` : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              record.TrangThai === "OUT" 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {record.TrangThai === "OUT" ? "Hoàn thành" : "Đang làm"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL REPORT */}
        {activeTab === "report" && isManager && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Báo cáo Điểm danh Tổng hợp</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">Lịch sử chấm công của toàn bộ nhân viên</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl">Nhân viên</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày Làm</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giờ Vào</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giờ Ra</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số Giờ</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tr-xl">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-500 font-medium">Chưa có dữ liệu</td></tr>
                  ) : (
                    allAttendance.map((record, index) => {
                      // Logic tính đi trễ (Giả sử ca chuẩn là 08:00)
                      const checkInTime = new Date(record.GioCheckIn);
                      const isLate = checkInTime.getHours() > 8 || (checkInTime.getHours() === 8 && checkInTime.getMinutes() > 15);

                      return (
                        <tr key={index} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">
                            {record.EmployeeName || record.MaNhanVien}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-zinc-400">
                            {new Date(record.NgayLam).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            <span className={isLate ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400"}>
                              {checkInTime.toLocaleTimeString("vi-VN")}
                              {isLate && <span className="ml-1 text-xs text-rose-500">(Trễ)</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-zinc-400">
                            {record.GioCheckOut ? new Date(record.GioCheckOut).toLocaleTimeString("vi-VN") : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-zinc-300">
                            {record.SoGioLam ? `${record.SoGioLam}h` : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              record.TrangThai === "OUT" 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {record.TrangThai === "OUT" ? "Hoàn thành" : "Đang làm"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REQUESTS MANAGEMENT */}
        {activeTab === "requests" && isManager && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Duyệt Yêu Cầu Nhân Sự</h2>
            <div className="grid gap-4">
              {allRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-medium">Chưa có yêu cầu nào</div>
              ) : (
                allRequests.map((req) => (
                  <div key={req.MaYeuCau} className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          req.Loai.includes('nghỉ') ? 'bg-rose-100 text-rose-700' :
                          req.Loai.includes('đổi ca') ? 'bg-purple-100 text-purple-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {req.Loai}
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {req.EmployeeName || req.MaNhanVien}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Gửi ngày {new Date(req.NgayTao).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">Ngày áp dụng:</span> {new Date(req.Ngay).toLocaleDateString("vi-VN")}
                      </p>
                      {req.CaLam && (
                        <p className="text-sm text-slate-700 dark:text-zinc-300">
                          <span className="font-bold">Ca:</span> {req.CaLam} {req.ThoiGian ? `(${req.ThoiGian})` : ""}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 italic">
                        " {req.LyDo} "
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {req.TrangThai === "pending" ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveRequest(req.MaYeuCau, 'approved')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors shadow-md flex items-center gap-1 text-sm font-bold"
                          >
                            <CheckCircle className="w-4 h-4" /> Duyệt
                          </button>
                          <button 
                            onClick={() => handleApproveRequest(req.MaYeuCau, 'rejected')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition-colors shadow-md flex items-center gap-1 text-sm font-bold"
                          >
                            <XCircle className="w-4 h-4" /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 ${
                          req.TrangThai === 'approved' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {req.TrangThai === 'approved' ? <><CheckCircle className="w-4 h-4" /> Đã Duyệt</> : <><XCircle className="w-4 h-4" /> Đã Từ Chối</>}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

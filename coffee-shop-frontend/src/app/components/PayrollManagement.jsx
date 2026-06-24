import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calculator, FileText, Download, Settings, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function PayrollManagement() {
  const [reports, setReports] = useState([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.getMonth() + 1;
  });
  const [year, setYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [isCalculating, setIsCalculating] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [wageConfig, setWageConfig] = useState({ hourlyRate: '30000', fullTimeBase: '5000000' });

  useEffect(() => {
    const saved = localStorage.getItem("wage_config");
    if (saved) setWageConfig(JSON.parse(saved));
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem("wage_config", JSON.stringify(wageConfig));
    setShowConfigModal(false);
    toast.success("Đã lưu cấu hình lương");
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/payroll/reports?month=${month}&year=${year}`);
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [month, year]);

  const handleCalculatePayroll = async () => {
    if (!window.confirm(`Bạn có chắc muốn tính lương cho tháng ${month}/${year}? Dữ liệu cũ của tháng này sẽ bị ghi đè.`)) return;
    
    setIsCalculating(true);
    try {
      const res = await axios.post("http://localhost:5000/api/payroll/calculate", { month, year });
      if (res.data.success) {
        toast.success(`Đã tính lương cho ${res.data.data.length} nhân viên`);
        fetchReports();
      }
    } catch (error) {
      toast.error("Lỗi tính lương");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn CHỐT và DUYỆT bảng lương tháng ${month}/${year}? Sau khi duyệt, nhân viên sẽ nhận được thông báo và xem được phiếu lương.`)) return;

    setIsCalculating(true);
    try {
      const res = await axios.post("http://localhost:5000/api/payroll/approve", { month, year });
      if (res.data.success) {
        toast.success(res.data.message || "Đã chốt và duyệt lương thành công!");
        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi phê duyệt bảng lương");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6">
      <header className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Quản Lý Lương</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Tính toán và xuất bảng lương hàng tháng</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={month} 
              onChange={e => setMonth(Number(e.target.value))}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={e => setYear(Number(e.target.value))}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {reports.length > 0 && reports[0].TrangThai === 'approved' ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold text-sm rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <FileText className="w-4 h-4" /> Đã chốt & gửi NV
              </span>
            ) : (
              <>
                <button 
                  onClick={handleCalculatePayroll}
                  disabled={isCalculating}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  {isCalculating ? "Đang tính..." : <><Calculator className="w-4 h-4" /> Tính Lương</>}
                </button>
                <button 
                  onClick={handleApprovePayroll}
                  disabled={isCalculating || reports.length === 0}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                  title={reports.length === 0 ? "Vui lòng tính lương trước khi chốt" : ""}
                >
                  Chốt & Duyệt Lương
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" /> Bảng lương tháng {month}/{year}
          </h2>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Xuất File
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-zinc-800">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã NV</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chức vụ</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tổng Ca</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tổng Thu Nhập</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Khấu Trừ</th>
                <th className="p-4 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right">Thực Lãnh</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">
                    Chưa có bảng lương tháng này. Vui lòng bấm "Tính Lương".
                  </td>
                </tr>
              ) : (
                reports.map(rep => {
                  const tongThuNhap = Number(rep.TongLuong) + Number(rep.KhauTru);
                  return (
                    <tr key={rep.MaBangLuong} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-zinc-300">NV{String(rep.MaNhanVien).padStart(3, '0')}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">
                        {rep.HoTen}
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{rep.LoaiNhanVien}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-zinc-400 font-medium">{rep.ChucVu}</td>
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-zinc-300 text-right">{rep.TongCaLam}</td>
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-zinc-300 text-right">{tongThuNhap.toLocaleString('vi-VN')} đ</td>
                      <td className="p-4 text-sm font-bold text-rose-500 text-right">-{Number(rep.KhauTru).toLocaleString('vi-VN')} đ</td>
                      <td className="p-4 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">{Number(rep.TongLuong).toLocaleString('vi-VN')} đ</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          rep.TrangThai === 'approved' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {rep.TrangThai === 'approved' ? 'Đã duyệt' : 'Bản nháp'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cấu Hình Lương */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" /> Thiết Lập Mức Lương
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Lương Part-time (VNĐ/giờ)
                </label>
                <input 
                  type="number" 
                  value={wageConfig.hourlyRate}
                  onChange={e => setWageConfig({...wageConfig, hourlyRate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Lương cơ bản Full-time (VNĐ/tháng)
                </label>
                <input 
                  type="number" 
                  value={wageConfig.fullTimeBase}
                  onChange={e => setWageConfig({...wageConfig, fullTimeBase: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-medium"
                  placeholder="Mặc định: 6000000"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveConfig}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Clock, Plus, Edit, Trash2, Search, ArrowLeft, CheckCircle2 } from "lucide-react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router";

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [editShiftForm, setEditShiftForm] = useState({ TenCaLam: '', GioBatDau: '', GioKetThuc: '', MoTa: '' });
  const [isEditingShift, setIsEditingShift] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://quanlynhansucf.onrender.com/api/shifts");
      if (res.data.success) {
        setShifts(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể lấy danh sách ca làm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditShiftForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      if (!editShiftForm.TenCaLam || !editShiftForm.GioBatDau || !editShiftForm.GioKetThuc) {
        toast.error("Vui lòng nhập đủ tên ca, giờ bắt đầu và kết thúc");
        return;
      }
      
      let res;
      if (isEditingShift) {
        res = await axios.put(`https://quanlynhansucf.onrender.com/api/shifts/${editShiftForm.MaCaLam}`, editShiftForm);
      } else {
        res = await axios.post("https://quanlynhansucf.onrender.com/api/shifts", editShiftForm);
      }
      
      if (res.data.success) {
        toast.success(isEditingShift ? "Cập nhật ca làm thành công" : "Thêm ca làm thành công");
        fetchShifts();
        setEditShiftForm({ TenCaLam: '', GioBatDau: '', GioKetThuc: '', MoTa: '' });
        setIsEditingShift(false);
      }
    } catch (error) {
      console.error("Lỗi thêm/sửa ca làm:", error);
      toast.error(error.response?.data?.message || (isEditingShift ? "Lỗi cập nhật ca làm" : "Lỗi thêm ca làm"));
    }
  };

  const handleEditClick = (shift) => {
    setEditShiftForm(shift);
    setIsEditingShift(true);
  };

  const handleCancelEdit = () => {
    setEditShiftForm({ TenCaLam: '', GioBatDau: '', GioKetThuc: '', MoTa: '' });
    setIsEditingShift(false);
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa ca làm này? Việc xóa sẽ xóa luôn tất cả lịch phân ca liên quan đến ca này!")) return;
    try {
      const res = await axios.delete(`https://quanlynhansucf.onrender.com/api/shifts/${id}`);
      if (res.data.success) {
        toast.success("Đã xóa ca làm thành công");
        fetchShifts();
        if (isEditingShift && editShiftForm.MaCaLam === id) {
          handleCancelEdit();
        }
      }
    } catch (error) {
      toast.error("Lỗi xóa ca làm");
    }
  };

  const filteredShifts = shifts.filter(s => 
    s.TenCaLam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.MoTa && s.MoTa.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-6 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/scheduling" className="p-2 bg-white rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Thiết lập Ca Làm</h1>
            </div>
            <p className="text-slate-500 font-medium ml-12">Quản lý các khung giờ làm việc chuẩn cho cửa hàng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Form Thêm/Sửa */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  {isEditingShift ? "Cập nhật Ca làm" : "Thêm Ca làm mới"}
                </h2>
              </div>
              <form onSubmit={handleSaveShift} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên Ca Làm <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="TenCaLam"
                    value={editShiftForm.TenCaLam}
                    onChange={handleInputChange}
                    placeholder="VD: Ca Sáng, Ca Chiều..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giờ bắt đầu <span className="text-rose-500">*</span></label>
                    <input
                      type="time"
                      name="GioBatDau"
                      value={editShiftForm.GioBatDau}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giờ kết thúc <span className="text-rose-500">*</span></label>
                    <input
                      type="time"
                      name="GioKetThuc"
                      value={editShiftForm.GioKetThuc}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mô tả thêm</label>
                  <textarea
                    name="MoTa"
                    value={editShiftForm.MoTa || ''}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về ca làm..."
                    rows="3"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex justify-center items-center gap-2"
                  >
                    {isEditingShift ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isEditingShift ? "Lưu thay đổi" : "Thêm Ca Làm"}
                  </button>
                  {isEditingShift && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Cột phải: Danh sách Ca làm */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">Danh sách Ca làm ({shifts.length})</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm ca làm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
                ) : filteredShifts.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Chưa có ca làm nào được thiết lập.
                  </div>
                ) : (
                  filteredShifts.map((shift) => (
                    <div 
                      key={shift.MaCaLam} 
                      className={`p-4 rounded-2xl border transition-all ${
                        isEditingShift && editShiftForm.MaCaLam === shift.MaCaLam 
                          ? "bg-amber-50 border-amber-200 shadow-sm" 
                          : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center font-black">
                            {shift.GioBatDau.split(':')[0]}h
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900">{shift.TenCaLam}</h3>
                            <div className="text-sm font-medium text-slate-500 mt-0.5">
                              {shift.GioBatDau} - {shift.GioKetThuc}
                            </div>
                            {shift.MoTa && (
                              <div className="text-xs text-slate-400 mt-1 italic">{shift.MoTa}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(shift)}
                            className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Sửa ca"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.MaCaLam)}
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Xóa ca"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

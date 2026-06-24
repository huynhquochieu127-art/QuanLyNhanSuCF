import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Lock, Unlock, KeyRound, Users, UserCheck, ShieldAlert, UserX, CheckCircle, XCircle, Calendar, Clock, ClipboardList } from "lucide-react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { toast } from "sonner";

export default function EmployeeDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy user role hiện tại để phân quyền hiển thị
  const [currentUserRole, setCurrentUserRole] = useState("3");
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUserRole(String(JSON.parse(userStr).MaVaiTro));
    }
  }, []);

  // Manager Approvals state
  const [pendingLeave, setPendingLeave] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [approvalTab, setApprovalTab] = useState("leave");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    MaNhanVienCode: '',
    HoTen: '',
    GioiTinh: '',
    SoDienThoai: '',
    ChucVu: '',
    LoaiNhanVien: 'Full-time',
    Luong: '',
    TrangThai: 'Đang làm việc',
    Email: '',
    MatKhau: '',
    Role: '3'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/employees');
      if (res.data.success) {
        setEmployeeList(res.data.data);
      } else {
        toast.error("Không thể lấy dữ liệu nhân viên");
      }
    } catch (err) {
      console.error("Lỗi khi kết nối API danh sách nhân viên:", err);
      toast.error("Không thể kết nối đến server backend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/positions');
      if (res.data.success) {
        setPositionsList(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chức vụ:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
  }, []);

  const fetchApprovals = async () => {
    try {
      const [leaveRes, attRes] = await Promise.all([
        axios.get('http://localhost:5000/api/timekeeping/leave'),
        axios.get('http://localhost:5000/api/timekeeping/requests'),
      ]);
      if (leaveRes.data.success) {
        setPendingLeave(leaveRes.data.data.filter(r => r.TrangThai === "pending"));
      }
      if (attRes.data.success) {
        setPendingAttendance(attRes.data.data.filter(r => r.TrangThai === "pending"));
      }

      // Ca làm việc: Lấy tuần hiện tại
      const d = new Date();
      const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const currentWeekStart = new Date(new Date(d).setDate(diff));
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 6);
      
      const startStr = currentWeekStart.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      
      const shiftRes = await axios.get(`http://localhost:5000/api/shifts/registrations?startDate=${startStr}&endDate=${endStr}`);
      if (shiftRes.data.success) {
        setPendingShifts(shiftRes.data.data.filter(r => r.TrangThai === "pending"));
      }
    } catch (e) {
      console.error("Lỗi lấy dữ liệu duyệt:", e);
    }
  };

  useEffect(() => {
    if (currentUserRole === "2" || currentUserRole === "1") {
      fetchApprovals();
    }
  }, [currentUserRole]);

  const handleLeaveAction = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/timekeeping/leave/${id}/status`, { status, GhiChuQL: "" });
      toast.success(status === "approved" ? "Đã duyệt đơn nghỉ!" : "Đã từ chối đơn nghỉ!");
      fetchApprovals();
    } catch (e) { toast.error("Lỗi duyệt đơn"); }
  };

  const handleApproveAttendance = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/timekeeping/request/${id}/status`, { status });
      toast.success(status === "approved" ? "Đã duyệt!" : "Đã từ chối!");
      fetchApprovals();
    } catch (e) { toast.error("Lỗi cập nhật"); }
  };

  const handleApproveShift = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/shifts/register/${id}/status`, { status });
      toast.success(status === "approved" ? "Đã duyệt đăng ký ca" : "Đã từ chối đăng ký ca");
      fetchApprovals();
    } catch (e) { toast.error("Lỗi cập nhật"); }
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingId(employee.MaNhanVien);
      setFormData({
        MaNhanVienCode: employee.MaNhanVienCode || '',
        HoTen: employee.HoTen || '',
        GioiTinh: employee.GioiTinh || '',
        SoDienThoai: employee.SoDienThoai || '',
        ChucVu: employee.ChucVu || '',
        LoaiNhanVien: employee.LoaiNhanVien || 'Full-time',
        Luong: employee.Luong || '',
        TrangThai: employee.TrangThai || 'Đang làm việc',
        Email: employee.Email || '',
        MatKhau: '', // Không hiển thị mật khẩu cũ
        Role: employee.MaVaiTro ? String(employee.MaVaiTro) : '3'
      });
    } else {
      setEditingId(null);
      setFormData({
        MaNhanVienCode: '',
        HoTen: '',
        GioiTinh: '',
        SoDienThoai: '',
        ChucVu: '',
        LoaiNhanVien: 'Full-time',
        Luong: '',
        TrangThai: 'Đang làm việc',
        Email: '',
        MatKhau: '',
        Role: '3'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Quy tắc: Quản lý cố định Full-time
      if (name === 'Role' && value === '2') {
        newData.LoaiNhanVien = 'Full-time';
      }
      
      // Quy tắc: Part-time cố định lương 30K/h
      if (name === 'LoaiNhanVien' && value === 'Part-time') {
        newData.Luong = '30000';
      } else if (name === 'LoaiNhanVien' && value === 'Full-time') {
        // Reset lương khi chuyển lại Full-time nếu đang là 30k
        if (prev.Luong === '30000') newData.Luong = '';
      }
      
      // Ràng buộc chéo khi Role thay đổi (kéo theo LoaiNhanVien đổi)
      if (newData.LoaiNhanVien === 'Part-time') {
        newData.Luong = '30000';
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Chỉ gửi những gì cho phép sửa
        const res = await axios.put(`http://localhost:5000/api/employees/${editingId}`, formData);
        if (res.data.success) {
          toast.success("Cập nhật nhân viên thành công");
          fetchEmployees();
          handleCloseModal();
        }
      } else {
        // Tạo mới bắt buộc phải có Email và Mật khẩu
        if (!formData.Email || !formData.MatKhau) {
          return toast.error("Vui lòng nhập Email và Mật khẩu để tạo tài khoản");
        }
        const res = await axios.post(`http://localhost:5000/api/employees`, formData);
        if (res.data.success) {
          toast.success("Thêm nhân viên và tài khoản thành công");
          fetchEmployees();
          handleCloseModal();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn cho nghỉ việc và KHÓA tài khoản này?")) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/employees/${id}`);
        if (res.data.success) {
          toast.success(res.data.message || "Đã chuyển trạng thái nghỉ việc");
          fetchEmployees();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi xóa");
      }
    }
  };

  const handleToggleLock = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/account/${id}/toggle-lock`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái khóa");
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Nhập mật khẩu mới cho tài khoản này (Để trống để hủy):", "123456");
    if (newPassword) {
      try {
        const res = await axios.put(`http://localhost:5000/api/auth/account/${id}/reset-password`, { newPassword });
        if (res.data.success) {
          toast.success(res.data.message);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi đặt lại mật khẩu");
      }
    }
  };

  // Lọc ra danh sách nhân viên được phép hiển thị (Quản lý không thấy Admin)
  const visibleEmployees = employeeList.filter(emp => {
    if (currentUserRole !== "1" && String(emp.MaVaiTro) === "1") {
      return false;
    }
    return true;
  });

  const filteredEmployees = visibleEmployees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (emp.HoTen && emp.HoTen.toLowerCase().includes(searchLower)) ||
      (emp.MaNhanVienCode && emp.MaNhanVienCode.toLowerCase().includes(searchLower)) ||
      (emp.SoDienThoai && emp.SoDienThoai.toLowerCase().includes(searchLower)) ||
      (emp.Email && emp.Email.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadgeColor = (status) => {
    if (status === 'Đang làm việc') return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === 'Đã nghỉ việc') return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getRoleName = (role) => {
    if (String(role) === '1') return <span className="font-bold text-rose-600">Admin</span>;
    if (String(role) === '2') return <span className="font-bold text-purple-600">Quản lý</span>;
    return <span className="text-slate-600">Nhân viên</span>;
  };

  const isAdmin = currentUserRole === "1";

  return (
    <AdminLayout>
      <div className="p-6 relative">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Quản lý Nhân Sự & Tài Khoản</h1>
          <p className="text-slate-500 font-medium">Hồ sơ nhân viên và quyền truy cập hệ thống</p>
        </div>

        {/* Approvals Dashboard cho Quản lý */}
        {!isAdmin && currentUserRole === "2" && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-amber-500" />
              Đơn Chờ Duyệt
            </h2>
            <div className="flex gap-2 border-b border-slate-200 mb-4 overflow-x-auto">
              {[
                { key: "leave", label: "Đơn xin nghỉ", badge: pendingLeave.length },
                { key: "attendance", label: "Bổ sung điểm danh", badge: pendingAttendance.length },
                { key: "shift", label: "Đăng ký ca", badge: pendingShifts.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setApprovalTab(tab.key)}
                  className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                    approvalTab === tab.key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {approvalTab === "leave" && (
                pendingLeave.length === 0 ? <p className="text-slate-500 text-center py-4 font-medium">Không có đơn xin nghỉ chờ duyệt</p> :
                pendingLeave.map(req => (
                  <div key={req.MaDon} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{req.EmployeeName} <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2">{req.LoaiNghi === 'phep' ? 'Nghỉ phép' : req.LoaiNghi === 'om' ? 'Nghỉ ốm' : req.LoaiNghi === 'viec_rieng' ? 'Việc riêng' : 'Khác'}</span></div>
                      <div className="text-sm text-slate-600 mt-1">Nghỉ từ: <span className="font-bold">{new Date(req.NgayNghi).toLocaleDateString("vi-VN")}</span> {req.NgayNghiDen && req.NgayNghiDen !== req.NgayNghi ? `đến ${new Date(req.NgayNghiDen).toLocaleDateString("vi-VN")}` : ""}</div>
                      <div className="text-sm italic text-slate-500 mt-1">"{req.LyDo}"</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(req.MaDon, "approved")} className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"><CheckCircle className="w-4 h-4"/> Duyệt</button>
                      <button onClick={() => handleLeaveAction(req.MaDon, "rejected")} className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-rose-600 transition-colors"><XCircle className="w-4 h-4"/> Từ chối</button>
                    </div>
                  </div>
                ))
              )}
              {approvalTab === "attendance" && (
                pendingAttendance.length === 0 ? <p className="text-slate-500 text-center py-4 font-medium">Không có yêu cầu điểm danh chờ duyệt</p> :
                pendingAttendance.map(req => (
                  <div key={req.MaYeuCau} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{req.EmployeeName} <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2">{req.Loai}</span></div>
                      <div className="text-sm text-slate-600 mt-1">Ngày: <span className="font-bold">{new Date(req.Ngay).toLocaleDateString("vi-VN")}</span> {req.CaLam && `- Ca: ${req.CaLam}`}</div>
                      <div className="text-sm italic text-slate-500 mt-1">"{req.LyDo}"</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveAttendance(req.MaYeuCau, "approved")} className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"><CheckCircle className="w-4 h-4"/> Duyệt</button>
                      <button onClick={() => handleApproveAttendance(req.MaYeuCau, "rejected")} className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-rose-600 transition-colors"><XCircle className="w-4 h-4"/> Từ chối</button>
                    </div>
                  </div>
                ))
              )}
              {approvalTab === "shift" && (
                pendingShifts.length === 0 ? <p className="text-slate-500 text-center py-4 font-medium">Không có đăng ký ca chờ duyệt</p> :
                pendingShifts.map(req => (
                  <div key={req.MaDangKy} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{req.HoTen}</div>
                      <div className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 font-bold"><Calendar className="w-4 h-4"/> {new Date(req.NgayLam).toLocaleDateString("vi-VN")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4 ml-1"/> {req.TenCaLam} ({req.GioBatDau}-{req.GioKetThuc})</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveShift(req.MaDangKy, "approved")} className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"><CheckCircle className="w-4 h-4"/> Duyệt</button>
                      <button onClick={() => handleApproveShift(req.MaDangKy, "rejected")} className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-rose-600 transition-colors"><XCircle className="w-4 h-4"/> Từ chối</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mini Dashboard */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase">Tổng nhân sự</p>
              </div>
              <h2 className="text-2xl font-black text-slate-900">{visibleEmployees.length}</h2>
            </div>
            
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase">Đang làm việc</p>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {visibleEmployees.filter(emp => emp.TrangThai === 'Đang làm việc').length}
              </h2>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase">Tài khoản bị khóa</p>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {visibleEmployees.filter(emp => emp.TrangThaiHoatDong === 0).length}
              </h2>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase">{isAdmin ? "Quản lý / Admin" : "Quản lý"}</p>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {visibleEmployees.filter(emp => String(emp.MaVaiTro) === '1' || String(emp.MaVaiTro) === '2').length}
              </h2>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, mã NV, email hoặc SĐT..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20 font-bold text-sm"
              >
                <Plus className="w-5 h-5" />
                Thêm Nhân viên
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã NV</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và Tên</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản (Email)</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái CV</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Truy cập</th>
                  {isAdmin && <th className="text-center py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500 font-medium">Đang tải dữ liệu...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500 font-medium">Không tìm thấy nhân sự nào.</td></tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.MaNhanVien} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">{employee.MaNhanVienCode || employee.MaNhanVien}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{employee.HoTen}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{employee.ChucVu || "Chưa có CV"} ({employee.LoaiNhanVien || "Full-time"}) - {employee.SoDienThoai}</div>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">{employee.Email || "N/A"}</td>
                      <td className="py-4 px-4 text-sm">{getRoleName(employee.MaVaiTro)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(employee.TrangThai)}`}>
                          {employee.TrangThai}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {employee.TrangThaiHoatDong === 1 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">
                            <Unlock className="w-3 h-3" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold">
                            <Lock className="w-3 h-3" /> Bị Khóa
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleLock(employee.MaNhanVien)}
                              className={`p-2 rounded-lg transition-colors shadow-sm ${
                                employee.TrangThaiHoatDong === 1 
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                              title={employee.TrangThaiHoatDong === 1 ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {employee.TrangThaiHoatDong === 1 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleResetPassword(employee.MaNhanVien)}
                              className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors shadow-sm"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(employee)}
                              className="p-2 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors shadow-sm"
                              title="Sửa thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.MaNhanVien)}
                              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
                              title="Cho nghỉ việc"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Hiển thị {filteredEmployees.length} / {visibleEmployees.length} nhân sự</span>
          </div>
        </div>

        {/* Modal Thêm / Sửa Nhân Viên */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-black text-slate-900">
                  {editingId ? "Cập nhật Hồ sơ & Phân quyền" : "Thêm Nhân Sự Mới"}
                </h2>
                <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form id="employeeForm" onSubmit={handleSubmit} className="space-y-8">
                  {/* Khu vực 1: Thông tin đăng nhập */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Thông tin Tài Khoản (Đăng nhập)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email Đăng nhập {(!editingId) && <span className="text-rose-500">*</span>}</label>
                        <input type="email" name="Email" required={!editingId} disabled={!!editingId} value={formData.Email} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60" placeholder="VD: nv.a@coffeeshop.com" />
                        {editingId && <p className="text-xs text-slate-400 mt-1">Không thể thay đổi Email sau khi tạo.</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu {(!editingId) && <span className="text-rose-500">*</span>}</label>
                        <input type="text" name="MatKhau" required={!editingId} disabled={!!editingId} value={formData.MatKhau} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60" placeholder={editingId ? "••••••••" : "Nhập mật khẩu khởi tạo"} />
                        {editingId && <p className="text-xs text-slate-400 mt-1">Mật khẩu được mã hóa, không hiển thị.</p>}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phân quyền (Role)</label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="Role" value="3" checked={formData.Role === '3'} onChange={handleInputChange} className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-slate-300" />
                            <span className="text-sm font-bold text-slate-700">Nhân viên</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="Role" value="2" checked={formData.Role === '2'} onChange={handleInputChange} className="w-4 h-4 text-purple-500 focus:ring-purple-500 border-slate-300" />
                            <span className="text-sm font-bold text-purple-700">Quản lý</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Khu vực 2: Hồ sơ nhân sự */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Hồ sơ Nhân Sự</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Họ và Tên <span className="text-rose-500">*</span></label>
                        <input type="text" name="HoTen" required value={formData.HoTen} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors" placeholder="Nhập họ tên đầy đủ" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Mã NV (Hệ thống tự tạo)</label>
                        <input type="text" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed" placeholder={editingId ? (formData.MaNhanVienCode || "Tự động tạo") : "Hệ thống sẽ tự động tạo từ 1 (NV001)"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                        <input type="tel" name="SoDienThoai" value={formData.SoDienThoai} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors" placeholder="Nhập số điện thoại" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Giới tính</label>
                        <select name="GioiTinh" value={formData.GioiTinh} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors">
                          <option value="">-- Chọn giới tính --</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Địa chỉ</label>
                        <input type="text" name="DiaChi" value={formData.DiaChi} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors" placeholder="Nhập địa chỉ cư trú" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Chức vụ (Công việc)</label>
                        <select name="ChucVu" value={formData.ChucVu} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors">
                          <option value="">-- Chọn chức vụ --</option>
                          {positionsList.map(pos => (
                            <option key={pos.MaChucVu} value={pos.TenChucVu}>{pos.TenChucVu}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Loại Hợp đồng</label>
                        <select name="LoaiNhanVien" disabled={formData.Role === '2'} value={formData.LoaiNhanVien} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed">
                          <option value="Full-time">Full-time (Toàn thời gian)</option>
                          <option value="Part-time">Part-time (Bán thời gian)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          {formData.LoaiNhanVien === 'Part-time' ? 'Lương theo giờ (Cố định)' : 'Lương Cơ Bản (Tháng)'}
                        </label>
                        <input type="number" name="Luong" disabled={formData.LoaiNhanVien === 'Part-time'} value={formData.Luong} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="Ví dụ: 5000000" />
                        {formData.LoaiNhanVien === 'Part-time' && (
                          <p className="text-xs text-rose-500 font-bold mt-1">Hệ thống áp dụng mặc định 30,000đ/giờ</p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors font-bold text-sm shadow-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="employeeForm"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20 font-bold text-sm flex items-center gap-2"
                >
                  {editingId ? <Edit className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                  {editingId ? "Lưu thay đổi" : "Tạo Hồ sơ & Tài khoản"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from "react";
import { Search, Plus, Coins, Edit, Trash2, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { toast } from "sonner";

export default function CustomerLoyalty() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    HoTen: '',
    SoDienThoai: '',
    Email: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/customers');
      if (res.data.success) {
        // Mock reward points for UI since DB doesn't have it yet
        const mapped = res.data.data.map(c => ({
          id: c.MaKhachHang,
          name: c.HoTen,
          phone: c.SoDienThoai || '',
          email: c.Email || '',
          rewardPoints: (c.MaKhachHang * 125) % 2500
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.error("Lỗi lấy khách hàng:", err);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        HoTen: customer.name,
        SoDienThoai: customer.phone,
        Email: customer.email
      });
    } else {
      setEditingId(null);
      setFormData({ HoTen: '', SoDienThoai: '', Email: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/customers/${editingId}`, formData);
        toast.success("Cập nhật thành công");
      } else {
        await axios.post(`http://localhost:5000/api/customers`, formData);
        toast.success("Thêm khách hàng thành công");
      }
      fetchCustomers();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa khách hàng này?")) {
      try {
        await axios.delete(`http://localhost:5000/api/customers/${id}`);
        toast.success("Xóa thành công");
        fetchCustomers();
      } catch (err) {
        toast.error("Lỗi xóa khách hàng");
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      String(customer.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPointsBadgeColor = (points) => {
    if (points >= 1000) return "bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900";
    if (points >= 500) return "bg-gradient-to-r from-amber-300 to-yellow-400 text-gray-900";
    return "bg-gradient-to-r from-yellow-200 to-amber-300 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="p-6 relative">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">Quản lý Khách hàng</h1>
          <p className="text-gray-600">Quản lý thông tin và điểm thưởng khách hàng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Tổng Khách hàng</p>
                <p className="text-3xl">{customers.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Tổng Điểm Thưởng</p>
                <p className="text-3xl">{customers.reduce((sum, c) => sum + c.rewardPoints, 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Thành viên VIP (1000+ điểm)</p>
                <p className="text-3xl">{customers.filter((c) => c.rewardPoints >= 1000).length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc số điện thoại..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Thêm Khách hàng
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700">Mã KH</th>
                  <th className="text-left py-4 px-4 text-gray-700">Họ và Tên</th>
                  <th className="text-left py-4 px-4 text-gray-700">Số Điện thoại</th>
                  <th className="text-left py-4 px-4 text-gray-700">Điểm Thưởng</th>
                  <th className="text-center py-4 px-4 text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-500">Chưa có khách hàng nào.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                      <td className="py-4 px-4 text-gray-800">KH{customer.id}</td>
                      <td className="py-4 px-4 text-gray-800">{customer.name}</td>
                      <td className="py-4 px-4 text-gray-600">{customer.phone}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm ${getPointsBadgeColor(customer.rewardPoints)}`}>
                          <Coins className="w-4 h-4" />
                          <span className="font-medium">{customer.rewardPoints.toLocaleString()}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(customer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Cập nhật Khách hàng" : "Thêm Khách hàng"}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên *</label>
                    <input type="text" name="HoTen" required value={formData.HoTen} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input type="text" name="SoDienThoai" value={formData.SoDienThoai} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" form="customerForm" className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 transition-all shadow-md">
                  Lưu lại
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

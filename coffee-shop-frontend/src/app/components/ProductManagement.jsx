import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

export default function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    TenSanPham: '',
    Gia: '',
    MoTa: '',
    CoBan: 1,
    MaDanhMuc: 1
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://quanlynhansucf.onrender.com/api/products');
      if (res.data.success) {
        const mapped = res.data.data.map(p => ({
          id: p.MaSanPham,
          name: p.TenSanPham,
          price: parseFloat(p.Gia),
          category: p.MaDanhMuc === 1 ? 'Coffee' : 'Bakery', // Tạm thời
          image: p.MoTa || "https://images.unsplash.com/photo-1593443320739-77f74939d0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200",
          inStock: p.CoBan === 1
        }));
        setProductList(mapped);
      }
    } catch (err) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        TenSanPham: product.name,
        Gia: product.price,
        MoTa: product.image,
        CoBan: product.inStock ? 1 : 0,
        MaDanhMuc: product.category === 'Coffee' ? 1 : 2
      });
    } else {
      setEditingId(null);
      setFormData({ TenSanPham: '', Gia: '', MoTa: '', CoBan: 1, MaDanhMuc: 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`https://quanlynhansucf.onrender.com/api/products/${editingId}`, formData);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await axios.post(`https://quanlynhansucf.onrender.com/api/products`, formData);
        toast.success("Thêm sản phẩm thành công");
      }
      fetchProducts();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu sản phẩm");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await axios.delete(`https://quanlynhansucf.onrender.com/api/products/${id}`);
        toast.success("Xóa sản phẩm thành công");
        fetchProducts();
      } catch (err) {
        toast.error("Lỗi xóa sản phẩm");
      }
    }
  };

  const toggleStock = async (product) => {
    try {
      const newStatus = product.inStock ? 0 : 1;
      await axios.put(`https://quanlynhansucf.onrender.com/api/products/${product.id}`, {
        TenSanPham: product.name,
        Gia: product.price,
        MoTa: product.image,
        CoBan: newStatus,
        MaDanhMuc: product.category === 'Coffee' ? 1 : 2
      });
      // Cập nhật state trực tiếp cho nhanh
      setProductList(productList.map(p => p.id === product.id ? { ...p, inStock: !p.inStock } : p));
      toast.success("Đã cập nhật trạng thái kho");
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const filteredProducts = productList.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(product.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 relative">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">Quản lý Sản phẩm</h1>
          <p className="text-gray-600">Quản lý thực đơn và trạng thái kho</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Thêm Sản phẩm
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700">Hình ảnh</th>
                  <th className="text-left py-4 px-4 text-gray-700">Tên sản phẩm</th>
                  <th className="text-left py-4 px-4 text-gray-700">Danh mục</th>
                  <th className="text-left py-4 px-4 text-gray-700">Giá bán</th>
                  <th className="text-left py-4 px-4 text-gray-700">Trạng thái</th>
                  <th className="text-center py-4 px-4 text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">Chưa có sản phẩm nào.</td></tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                      <td className="py-4 px-4">
                        <ImageWithFallback src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-800 font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">SP{product.id}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{product.category}</td>
                      <td className="py-4 px-4 text-gray-800 font-medium">{product.price.toLocaleString()} VNĐ</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleStock(product)}
                          className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none"
                          style={{ backgroundColor: product.inStock ? "#10b981" : "#6b7280" }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: product.inStock ? "translateX(28px)" : "translateX(4px)" }}
                          />
                        </button>
                        <span className="ml-3 text-sm text-gray-600">{product.inStock ? "Còn hàng" : "Hết hàng"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
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
                  {editingId ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm"}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                    <input type="text" name="TenSanPham" required value={formData.TenSanPham} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                    <input type="number" name="Gia" required value={formData.Gia} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh (Tùy chọn)</label>
                    <input type="text" name="MoTa" value={formData.MoTa} onChange={handleInputChange} placeholder="URL hình ảnh..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select name="MaDanhMuc" value={formData.MaDanhMuc} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value={1}>Coffee</option>
                      <option value={2}>Bakery</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" name="CoBan" id="CoBan" checked={formData.CoBan === 1} onChange={handleInputChange} className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500" />
                    <label htmlFor="CoBan" className="text-sm font-medium text-gray-700">Còn hàng trong kho</label>
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" form="productForm" className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 transition-all shadow-md">
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

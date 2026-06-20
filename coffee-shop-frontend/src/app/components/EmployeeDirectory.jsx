import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { toast } from "sonner";

export default function EmployeeDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockEmployees = [
    { id: "EMP001", name: "Sarah Johnson", phone: "(555) 123-4567", role: "Admin" },
    { id: "EMP002", name: "Mike Chen", phone: "(555) 234-5678", role: "Manager" },
    { id: "EMP003", name: "Emma Davis", phone: "(555) 345-6789", role: "Staff" },
    { id: "EMP004", name: "James Wilson", phone: "(555) 456-7890", role: "Staff" },
    { id: "EMP005", name: "Lisa Anderson", phone: "(555) 567-8901", role: "Manager" },
    { id: "EMP006", name: "Tom Martinez", phone: "(555) 678-9012", role: "Staff" },
    { id: "EMP007", name: "Anna Taylor", phone: "(555) 789-0123", role: "Staff" },
    { id: "EMP008", name: "David Brown", phone: "(555) 890-1234", role: "Staff" },
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("Chưa đăng nhập, hiển thị dữ liệu mẫu.");
          setEmployeeList(mockEmployees);
          setLoading(false);
          return;
        }

        const res = await axios.get('http://localhost:5000/api/auth/taikhoan', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          // Map dữ liệu từ database SQL Server sang giao diện
          const mapped = res.data.data.map(user => ({
            id: user.MaTaiKhoan,
            name: user.HoTen,
            phone: user.Email, // Vì DB SQL Server mẫu chưa có cột số điện thoại, ta lấy Email thay thế
            role: String(user.MaVaiTro) === '1' ? 'Admin' : (String(user.MaVaiTro) === '2' ? 'Manager' : 'Staff')
          }));
          setEmployeeList(mapped);
        } else {
          setEmployeeList(mockEmployees);
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API danh sách nhân viên:", err);
        // Nếu bị lỗi 403 Forbidden (chưa có quyền)
        if (err.response?.status === 403) {
          toast.error("Bạn không có quyền xem danh sách nhân viên (Chỉ Admin/Manager được phép). Hiển thị dữ liệu mẫu.");
        } else {
          toast.error("Không thể kết nối đến server backend. Hiển thị dữ liệu mẫu.");
        }
        setEmployeeList(mockEmployees);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employeeList.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Admin": return "bg-purple-100 text-purple-700 border-purple-300";
      case "Manager": return "bg-blue-100 text-blue-700 border-blue-300";
      case "Staff": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">Employee Directory</h1>
          <p className="text-gray-600">Manage your coffee shop staff members</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md">
              <Plus className="w-5 h-5" />
              Add New Employee
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700">Employee ID</th>
                  <th className="text-left py-4 px-4 text-gray-700">Full Name</th>
                  <th className="text-left py-4 px-4 text-gray-700">Phone Number</th>
                  <th className="text-left py-4 px-4 text-gray-700">Role</th>
                  <th className="text-center py-4 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                    <td className="py-4 px-4 text-gray-800">{employee.id}</td>
                    <td className="py-4 px-4 text-gray-800">{employee.name}</td>
                    <td className="py-4 px-4 text-gray-600">{employee.phone}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">No employees found matching your search criteria.</div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredEmployees.length} of {employeeList.length} employees</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

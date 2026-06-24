import { createBrowserRouter, Navigate } from "react-router";
import Timekeeping from "./components/Timekeeping";
import ShiftScheduling from "./components/ShiftScheduling";
import Home from "./components/Home";
import Login from "./components/Login";
import EmployeeDirectory from "./components/EmployeeDirectory";
import ProductManagement from "./components/ProductManagement";
import CustomerLoyalty from "./components/CustomerLoyalty";
import SystemLogs from "./components/SystemLogs";
import PayrollManagement from "./components/PayrollManagement";
import ShiftManagement from "./components/ShiftManagement";
import EmployeeTimesheet from "./components/EmployeeTimesheet";
import MyMonthlyTimesheet from "./components/MyMonthlyTimesheet";
import React from "react";

// Component bảo vệ Route dựa trên Token và Vai Trò (MaVaiTro)
function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem("token");
  const userStr = sessionStorage.getItem("user");

  if (!token || !userStr) {
    // Chưa đăng nhập, chuyển hướng về Login
    return React.createElement(Navigate, { to: "/login", replace: true });
  }

  const user = JSON.parse(userStr);
  const userRole = String(user.MaVaiTro);

  // Nếu vai trò hiện tại không nằm trong danh sách vai trò được phép
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.map(String).includes(userRole)) {
    // Không có quyền, chuyển hướng về trang chủ
    return React.createElement(Navigate, { to: "/", replace: true });
  }

  return children;
}

// Hàm bọc Route giúp code cấu hình gọn gàng hơn
const protect = (Component, allowedRoles = []) => {
  return () => React.createElement(ProtectedRoute, { allowedRoles }, React.createElement(Component));
};

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: protect(Home, [1, 2, 3]) },
      { path: "login", Component: Login },
      // Các route dùng chung cho mọi vai trò sau khi đăng nhập
      { path: "timekeeping", Component: protect(Timekeeping, [1, 2, 3]) },
      { path: "customers", Component: protect(CustomerLoyalty, [1, 2, 3]) },
      
      // Các route chỉ Admin (1) và Manager (2) được vào
      { path: "employees", Component: protect(EmployeeDirectory, [1, 2]) },
      { path: "payroll", Component: protect(PayrollManagement, [1]) },
      
      // Route Lịch làm việc cho mọi role (Role 3 xem được, Role 1,2 sửa được)
      { path: "scheduling", Component: protect(ShiftScheduling, [1, 2, 3]) },
      { path: "shift-management", Component: protect(ShiftManagement, [1, 2]) },
      { path: "employee-timesheet", Component: protect(EmployeeTimesheet, [1, 2]) },
      { path: "my-timesheet", Component: protect(MyMonthlyTimesheet, [1, 2, 3]) },

      // Route chỉ Admin (1) mới được vào
      { path: "logs", Component: protect(SystemLogs, [1]) },
    ],
  },
]);

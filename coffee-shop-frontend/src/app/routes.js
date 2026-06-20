import { createBrowserRouter } from "react-router";
import POSDashboard from "./components/POSDashboard";
import Timekeeping from "./components/Timekeeping";
import ShiftScheduling from "./components/ShiftScheduling";
import Home from "./components/Home";
import Login from "./components/Login";
import EmployeeDirectory from "./components/EmployeeDirectory";
import ProductManagement from "./components/ProductManagement";
import CustomerLoyalty from "./components/CustomerLoyalty";
import SystemLogs from "./components/SystemLogs";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "pos", Component: POSDashboard },
      { path: "timekeeping", Component: Timekeeping },
      { path: "scheduling", Component: ShiftScheduling },
      { path: "employees", Component: EmployeeDirectory },
      { path: "products", Component: ProductManagement },
      { path: "customers", Component: CustomerLoyalty },
      { path: "logs", Component: SystemLogs },
    ],
  },
]);

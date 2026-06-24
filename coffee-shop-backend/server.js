const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Khởi tạo kết nối DB (sẽ tự in log khi thành công)
require('./src/config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/auth.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const customerRoutes = require('./src/routes/customer.routes');
const timekeepingRoutes = require('./src/routes/timekeeping.routes');
const productRoutes = require('./src/routes/product.routes');
const posRoutes = require('./src/routes/pos.routes');
const tableRoutes = require('./src/routes/table.routes');
const payrollRoutes = require('./src/routes/payroll.routes');
const positionRoutes = require('./src/routes/position.routes');
const shiftRoutes = require('./src/routes/shift.routes');
const statsRoutes = require('./src/routes/stats.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const discountRoutes = require('./src/routes/discount.routes');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/timekeeping', timekeepingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/discounts', discountRoutes);

// Route test cơ bản
app.get("/", (req, res) => {
  res.send("Coffee Shop Backend đang chạy!");
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

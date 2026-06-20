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
app.use('/api/auth', authRoutes);

// Route test cơ bản
app.get("/", (req, res) => {
  res.send("Coffee Shop Backend đang chạy!");
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

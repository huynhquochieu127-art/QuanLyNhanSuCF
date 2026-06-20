const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (Cần token)
// Route lấy danh sách tài khoản (chỉ ai đăng nhập mới được xem)
router.get('/taikhoan', verifyToken, authController.getTaiKhoan);

// API test để lấy thông tin user đang đăng nhập từ token
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bạn đã xác thực thành công!',
    user: req.user // Thông tin lấy từ JWT token
  });
});

module.exports = router;

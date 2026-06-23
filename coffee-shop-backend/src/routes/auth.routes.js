const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', authController.login);

// Protected routes (Cần token và phân quyền)
router.post('/logout', verifyToken, authController.logout);
// Route lấy danh sách tài khoản (chỉ Admin và Quản lý mới được xem)
router.get('/taikhoan', verifyToken, authorize([1, 2]), authController.getTaiKhoan);
router.put('/account/:id/toggle-lock', authController.toggleLockAccount);

// API test để lấy thông tin user đang đăng nhập từ token
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bạn đã xác thực thành công!',
    user: req.user // Thông tin lấy từ JWT token
  });
});

module.exports = router;

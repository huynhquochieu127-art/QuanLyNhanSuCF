const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Lấy token từ header Authorization: Bearer <token>
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Không tìm thấy token truy cập. Vui lòng đăng nhập!' 
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin giải mã vào req.user để các hàm sau dùng
    next(); // Cho phép đi tiếp
  } catch (error) {
    console.error('Lỗi xác thực token:', error.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn!' 
    });
  }
};

module.exports = {
  verifyToken
};

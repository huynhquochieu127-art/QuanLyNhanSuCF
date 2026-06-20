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

// Middleware phân quyền dựa trên MaVaiTro
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin xác thực!'
      });
    }

    const { MaVaiTro } = req.user;

    // Hỗ trợ truyền vào một số đơn lẻ hoặc một mảng các mã vai trò, chuyển tất cả về String để so sánh tránh lệch kiểu dữ liệu (INT vs String)
    const rolesList = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => String(r));

    if (rolesList.length > 0 && !rolesList.includes(String(MaVaiTro))) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này!'
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorize
};


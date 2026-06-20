const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// API Test: Lấy danh sách tài khoản
const getTaiKhoan = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MaTaiKhoan, HoTen, Email, MaVaiTro, TrangThaiHoatDong FROM taikhoan'); // Không lấy Mật khẩu ra
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy tài khoản:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu tài khoản'
    });
  }
};

// API: Đăng nhập
const login = async (req, res) => {
  try {
    // Lấy thông tin từ client gửi lên
    const { Email, MatKhau } = req.body;

    if (!Email || !MatKhau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu' });
    }

    // Tìm tài khoản trong database
    const [users] = await db.query('SELECT * FROM taikhoan WHERE Email = ?', [Email]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email không tồn tại' });
    }

    const user = users[0];

    // Kiểm tra mật khẩu
    // Bước này mình làm linh hoạt: Kiểm tra xem DB đang lưu mã hóa (bcrypt) hay lưu chữ thường (plain text)
    let isPasswordValid = false;
    
    // Nếu mật khẩu bắt đầu bằng '$2' thì đó là chuỗi mã hóa bcrypt
    if (user.MatKhau && user.MatKhau.startsWith('$2')) {
      isPasswordValid = await bcrypt.compare(MatKhau, user.MatKhau);
    } else {
      // Dùng cho trường hợp data giả (chữ thường)
      isPasswordValid = (MatKhau === user.MatKhau);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // Nếu đúng, tạo JWT Token
    // Payload là dữ liệu sẽ mã hóa vào token (không nên để mật khẩu vào đây)
    const payload = {
      MaTaiKhoan: user.MaTaiKhoan,
      Email: user.Email,
      HoTen: user.HoTen,
      MaVaiTro: user.MaVaiTro
    };

    // Token hết hạn sau 1 ngày (24h)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: payload
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// API: Đăng xuất
const logout = (req, res) => {
  // Với JWT, client sẽ tự xóa token ở frontend. Backend chỉ cần trả về thông báo.
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

module.exports = {
  getTaiKhoan,
  login,
  logout
};

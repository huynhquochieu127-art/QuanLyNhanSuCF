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

// API: Đăng ký (Mặc định vai trò là Nhân viên - 3)
const register = async (req, res) => {
  try {
    const { HoTen, Email, MatKhau } = req.body;

    if (!HoTen || !Email || !MatKhau) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu' 
      });
    }

    // 1. Kiểm tra Email đã tồn tại chưa
    const [existingUsers] = await db.query('SELECT * FROM taikhoan WHERE Email = ?', [Email]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email này đã được đăng ký sử dụng' 
      });
    }

    // 2. Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(MatKhau, saltRounds);

    // Mặc định vai trò là Nhân viên (3) và trạng thái Hoạt động (1)
    const defaultRole = 3;
    const defaultStatus = 1;

    // 3. Tự động kiểm tra cấu trúc khóa chính MaTaiKhoan để chèn chính xác (Bảo mật & Cực kỳ an toàn)
    let hasIdentity = false;
    let isCharPk = false;
    let columns = [];
    
    try {
      const [columnsResult] = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'taikhoan'
      `);
      columns = columnsResult || [];
    } catch (e) {
      console.warn("Không thể truy vấn INFORMATION_SCHEMA.COLUMNS:", e.message);
    }

    try {
      const [identityCheck] = await db.query(`
        SELECT OBJECTPROPERTY(OBJECT_ID('taikhoan'), 'TableHasIdentity') AS HasIdentity
      `);
      hasIdentity = identityCheck && identityCheck[0] && identityCheck[0].HasIdentity === 1;
    } catch (e) {
      console.warn("Không thể truy vấn TableHasIdentity:", e.message);
    }

    const pkColumn = columns && Array.isArray(columns) ? columns.find(c => c.COLUMN_NAME && c.COLUMN_NAME.toLowerCase() === 'mataikhoan') : null;
    if (pkColumn && pkColumn.DATA_TYPE && pkColumn.DATA_TYPE.toLowerCase().includes('char')) {
      isCharPk = true;
    }

    let insertQuery = '';
    let params = [];

    if (hasIdentity) {
      // Nếu khóa tự động tăng, không cần chèn MaTaiKhoan
      insertQuery = `
        INSERT INTO taikhoan (HoTen, Email, MatKhau, MaVaiTro, TrangThaiHoatDong)
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [HoTen, Email, hashedPassword, defaultRole, defaultStatus];
    } else {
      // Nếu khóa không tự tăng, tự động sinh khóa chính
      let nextId;
      if (isCharPk) {
        // Kiểu chuỗi (Ví dụ: TK001, TK002)
        const [maxIdResult] = await db.query('SELECT MAX(MaTaiKhoan) as maxId FROM taikhoan');
        const maxId = maxIdResult && maxIdResult[0] && maxIdResult[0].maxId;
        if (maxId) {
          const numPart = parseInt(maxId.replace(/^\D+/g, ''), 10) || 0;
          const prefix = maxId.match(/^\D+/g) ? maxId.match(/^\D+/g)[0] : 'TK';
          nextId = `${prefix}${String(numPart + 1).padStart(3, '0')}`;
        } else {
          nextId = 'TK001';
        }
      } else {
        // Kiểu số
        let maxId = 0;
        try {
          const [maxIdResult] = await db.query('SELECT MAX(MaTaiKhoan) as maxId FROM taikhoan');
          maxId = maxIdResult && maxIdResult[0] && maxIdResult[0].maxId || 0;
        } catch (e) {
          console.warn("Không thể lấy MAX(MaTaiKhoan), thử bắt đầu từ 1:", e.message);
        }
        
        // Nếu maxId có dạng chuỗi (ví dụ 'TK001') mặc dù isCharPk chưa được phát hiện, ta vẫn cố gắng xử lý để tránh lỗi
        if (typeof maxId === 'string') {
          const numPart = parseInt(maxId.replace(/^\D+/g, ''), 10) || 0;
          const prefix = maxId.match(/^\D+/g) ? maxId.match(/^\D+/g)[0] : 'TK';
          nextId = `${prefix}${String(numPart + 1).padStart(3, '0')}`;
        } else {
          nextId = parseInt(maxId, 10) + 1;
        }
      }

      insertQuery = `
        INSERT INTO taikhoan (MaTaiKhoan, HoTen, Email, MatKhau, MaVaiTro, TrangThaiHoatDong)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      params = [nextId, HoTen, Email, hashedPassword, defaultRole, defaultStatus];
    }

    await db.query(insertQuery, params);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản nhân viên thành công!',
      data: {
        Email,
        HoTen,
        MaVaiTro: defaultRole
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng ký tài khoản:', error);
    res.status(500).json({ 
      success: false, 
      message: `Lỗi server khi đăng ký tài khoản: ${error.message}` 
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
  register,
  logout
};

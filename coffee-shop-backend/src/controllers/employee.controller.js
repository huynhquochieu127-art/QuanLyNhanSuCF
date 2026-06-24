const db = require('../config/db');

// Lấy danh sách nhân viên kết hợp với tài khoản
const getEmployees = async (req, res) => {
  try {
    const query = `
      SELECT n.*, t.Email, t.MaVaiTro, t.TrangThaiHoatDong 
      FROM nhanvien n
      LEFT JOIN taikhoan t ON n.MaNhanVien = t.MaTaiKhoan
      WHERE t.MaVaiTro IS NULL OR t.MaVaiTro != 1
      ORDER BY n.MaNhanVien DESC
    `;
    const [rows] = await db.query(query);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu nhân viên' });
  }
};

// Lấy nhân viên theo ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM nhanvien WHERE MaNhanVien = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Lỗi khi lấy nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const bcrypt = require('bcrypt');

// Thêm nhân viên mới (và tạo luôn tài khoản)
const createEmployee = async (req, res) => {
  try {
    const { MaNhanVienCode, HoTen, GioiTinh, SoDienThoai, DiaChi, ChucVu, LoaiNhanVien, NgayVaoLam, Luong, TrangThai, Email, MatKhau, Role } = req.body;

    if (!HoTen || !Email || !MatKhau) {
      return res.status(400).json({ success: false, message: 'Họ tên, Email và Mật khẩu là bắt buộc' });
    }

    // Kiểm tra Email
    const [existing] = await db.query('SELECT * FROM taikhoan WHERE Email = ?', [Email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    // 1. Tạo tài khoản
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(MatKhau, saltRounds);
    const roleId = Role || 3;

    // Lấy ID mới (Vì bảng taikhoan bị lỗi AUTO_INCREMENT do vướng khóa ngoại)
    const [maxIdResult] = await db.query('SELECT MAX(MaTaiKhoan) as maxId FROM taikhoan');
    const newAccountId = (maxIdResult[0].maxId || 0) + 1;

    await db.query(
      'INSERT INTO taikhoan (MaTaiKhoan, HoTen, Email, MatKhau, MaVaiTro, TrangThaiHoatDong) VALUES (?, ?, ?, ?, ?, ?)',
      [newAccountId, HoTen, Email, hashedPassword, roleId, 1]
    );

    // 2. Tạo nhân viên với ID = Tài khoản ID để đồng bộ
    const query = `
      INSERT INTO nhanvien (MaNhanVien, MaTaiKhoan, MaNhanVienCode, HoTen, GioiTinh, SoDienThoai, DiaChi, ChucVu, LoaiNhanVien, NgayVaoLam, Luong, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Xử lý các trường có thể undefined thành null
    const params = [
      newAccountId,
      newAccountId,
      `NV${String(newAccountId).padStart(3, '0')}`,
      HoTen,
      GioiTinh || null,
      SoDienThoai || null,
      DiaChi || null,
      ChucVu || null,
      LoaiNhanVien || 'Full-time',
      NgayVaoLam || null,
      Luong || 0,
      TrangThai || 'Đang làm việc'
    ];

    await db.query(query, params);

    res.status(201).json({
      success: true,
      message: 'Thêm nhân viên và tài khoản thành công',
      data: {
        MaNhanVien: newAccountId,
        HoTen, Email, Role: roleId
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm nhân viên' });
  }
};

// Cập nhật thông tin nhân viên
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { MaNhanVienCode, HoTen, GioiTinh, SoDienThoai, DiaChi, ChucVu, LoaiNhanVien, NgayVaoLam, Luong, TrangThai } = req.body;

    // Kiểm tra NV có tồn tại không
    const [check] = await db.query('SELECT * FROM nhanvien WHERE MaNhanVien = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    const query = `
      UPDATE nhanvien 
      SET MaNhanVienCode = ?, HoTen = ?, GioiTinh = ?, SoDienThoai = ?, DiaChi = ?, ChucVu = ?, LoaiNhanVien = ?, NgayVaoLam = ?, Luong = ?, TrangThai = ?
      WHERE MaNhanVien = ?
    `;

    const params = [
      MaNhanVienCode || check[0].MaNhanVienCode,
      HoTen || check[0].HoTen,
      GioiTinh || check[0].GioiTinh,
      SoDienThoai || check[0].SoDienThoai,
      DiaChi || check[0].DiaChi,
      ChucVu || check[0].ChucVu,
      LoaiNhanVien || check[0].LoaiNhanVien || 'Full-time',
      NgayVaoLam || check[0].NgayVaoLam,
      Luong !== undefined ? Luong : check[0].Luong,
      TrangThai || check[0].TrangThai,
      id
    ];

    await db.query(query, params);

    // Update Role in taikhoan if requested
    const { Role } = req.body;
    if (Role) {
      await db.query('UPDATE taikhoan SET MaVaiTro = ? WHERE MaTaiKhoan = ?', [Role, id]);
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật nhân viên:', error);
    res.status(500).json({ success: false, message: `Lỗi server: ${error.message}` });
  }
};

// Xóa nhân viên
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra NV có tồn tại không
    const [check] = await db.query('SELECT * FROM nhanvien WHERE MaNhanVien = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }

    // Đổi trạng thái nghỉ việc thay vì xóa cứng (Soft Delete / Disable)
    await db.query('UPDATE nhanvien SET TrangThai = "Đã nghỉ việc" WHERE MaNhanVien = ?', [id]);
    
    // Khóa tài khoản đăng nhập
    await db.query('UPDATE taikhoan SET TrangThaiHoatDong = 0 WHERE MaTaiKhoan = ?', [id]);

    res.json({
      success: true,
      message: 'Đã chuyển trạng thái Nghỉ việc và Khóa tài khoản thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhân viên:', error);
    res.status(500).json({ success: false, message: `Lỗi server: ${error.message}` });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};

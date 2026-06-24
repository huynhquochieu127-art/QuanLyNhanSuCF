const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const tablesToDrop = [
  'chitietdonhang',
  'donhang',
  'goidouong',
  'sanpham',
  'danhmuc',
  'bancafe',
  'khachhang',
  'yeucau_chamcong',
  'chamcong',
  'phancanhanvien',
  'bangluong',
  'baocao',
  'nhatkynhapxuat',
  'lichsunhapxuat',
  'nhanvien',
  'taikhoan',
  'vaitro',
  'calam',
  'chucvu'
];

async function rebuild() {
  console.log('Connecting to SQL Server at:', process.env.DB_SERVER);
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected successfully!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  // 1. Drop existing tables in dependency order
  console.log('Dropping existing tables...');
  for (const table of tablesToDrop) {
    try {
      await pool.request().query(`IF OBJECT_ID('dbo.${table}', 'U') IS NOT NULL DROP TABLE dbo.${table}`);
      console.log(`- Dropped table: ${table} (if it existed)`);
    } catch (err) {
      console.error(`- Failed to drop table ${table}:`, err.message);
    }
  }

  // 2. Create tables in correct order
  console.log('Creating tables...');
  const tableDefinitions = [
    {
      name: 'vaitro',
      query: `
        CREATE TABLE vaitro (
          MaVaiTro INT PRIMARY KEY,
          TenVaiTro NVARCHAR(15) NOT NULL
        )
      `
    },
    {
      name: 'taikhoan',
      query: `
        CREATE TABLE taikhoan (
          MaTaiKhoan INT PRIMARY KEY,
          HoTen NVARCHAR(100) NOT NULL,
          Email VARCHAR(100) NOT NULL UNIQUE,
          MatKhau VARCHAR(255) NOT NULL,
          SoDienThoai VARCHAR(20) NULL,
          MaVaiTro INT FOREIGN KEY REFERENCES vaitro(MaVaiTro),
          TrangThaiHoatDong TINYINT DEFAULT 1,
          NgayTao DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'chucvu',
      query: `
        CREATE TABLE chucvu (
          MaChucVu INT IDENTITY(1,1) PRIMARY KEY,
          TenChucVu NVARCHAR(255) NOT NULL,
          MoTa NVARCHAR(MAX) NULL
        )
      `
    },
    {
      name: 'nhanvien',
      query: `
        CREATE TABLE nhanvien (
          MaNhanVien INT PRIMARY KEY,
          MaTaiKhoan INT FOREIGN KEY REFERENCES taikhoan(MaTaiKhoan),
          MaNhanVienCode VARCHAR(20) NULL,
          HoTen NVARCHAR(100) NOT NULL,
          GioiTinh NVARCHAR(10) NULL,
          SoDienThoai VARCHAR(20) NULL,
          DiaChi NVARCHAR(255) NULL,
          ChucVu NVARCHAR(50) NULL,
          LoaiNhanVien NVARCHAR(50) DEFAULT N'Full-time',
          NgayVaoLam DATE NULL,
          Luong DECIMAL(18,2) DEFAULT 0,
          TrangThai NVARCHAR(30) DEFAULT N'Đang làm việc'
        )
      `
    },
    {
      name: 'calam',
      query: `
        CREATE TABLE calam (
          MaCaLam INT PRIMARY KEY,
          TenCaLam NVARCHAR(100) NOT NULL,
          GioBatDau TIME NOT NULL,
          GioKetThuc TIME NOT NULL,
          MoTa NVARCHAR(255) NULL
        )
      `
    },
    {
      name: 'danhmuc',
      query: `
        CREATE TABLE danhmuc (
          MaDanhMuc INT PRIMARY KEY,
          TenDanhMuc NVARCHAR(100) NOT NULL,
          MoTa NVARCHAR(255) NULL
        )
      `
    },
    {
      name: 'sanpham',
      query: `
        CREATE TABLE sanpham (
          MaSanPham INT IDENTITY(1,1) PRIMARY KEY,
          TenSanPham NVARCHAR(100) NOT NULL,
          Gia DECIMAL(18,2) NOT NULL,
          MoTa VARCHAR(255) NULL,
          CoBan TINYINT DEFAULT 1,
          MaDanhMuc INT FOREIGN KEY REFERENCES danhmuc(MaDanhMuc)
        )
      `
    },
    {
      name: 'bancafe',
      query: `
        CREATE TABLE bancafe (
          MaBan INT PRIMARY KEY,
          TenBan NVARCHAR(50) NOT NULL,
          TrangThai VARCHAR(10) DEFAULT 'OFF',
          SoChoNgoi INT DEFAULT 2
        )
      `
    },
    {
      name: 'khachhang',
      query: `
        CREATE TABLE khachhang (
          MaKhachHang INT PRIMARY KEY,
          HoTen NVARCHAR(100) NOT NULL,
          SoDienThoai VARCHAR(20) NOT NULL,
          Email VARCHAR(100) NULL
        )
      `
    },
    {
      name: 'donhang',
      query: `
        CREATE TABLE donhang (
          MaDonHang INT PRIMARY KEY,
          MaBan INT FOREIGN KEY REFERENCES bancafe(MaBan) ON DELETE SET NULL,
          MaNhanVien INT FOREIGN KEY REFERENCES nhanvien(MaNhanVien) ON DELETE SET NULL,
          MaKhachHang INT FOREIGN KEY REFERENCES khachhang(MaKhachHang) ON DELETE SET NULL,
          NgayDat DATETIME DEFAULT GETDATE(),
          TongTien DECIMAL(18,2) NOT NULL,
          GiamGia DECIMAL(18,2) DEFAULT 0,
          ThanhTien DECIMAL(18,2) NOT NULL,
          PhuongThucThanhToan NVARCHAR(50) NULL,
          TrangThai NVARCHAR(50) DEFAULT N'Đã thanh toán'
        )
      `
    },
    {
      name: 'chitietdonhang',
      query: `
        CREATE TABLE chitietdonhang (
          MaChiTietDonHang INT PRIMARY KEY,
          MaDonHang INT FOREIGN KEY REFERENCES donhang(MaDonHang) ON DELETE CASCADE,
          MaSanPham INT FOREIGN KEY REFERENCES sanpham(MaSanPham) ON DELETE SET NULL,
          SoLuong INT NOT NULL,
          DonGia DECIMAL(18,2) NOT NULL,
          ThanhTien DECIMAL(18,2) NOT NULL
        )
      `
    },
    {
      name: 'chamcong',
      query: `
        CREATE TABLE chamcong (
          MaChamCong INT IDENTITY(1,1) PRIMARY KEY,
          MaNhanVien INT FOREIGN KEY REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE,
          MaCaLam INT FOREIGN KEY REFERENCES calam(MaCaLam) ON DELETE SET NULL,
          NgayLam DATE NOT NULL,
          GioCheckIn DATETIME NOT NULL,
          GioCheckOut DATETIME NULL,
          SoGioLam DECIMAL(18,2) NULL,
          DiTre INT DEFAULT 0,
          VeSom INT DEFAULT 0,
          TrangThai VARCHAR(10) DEFAULT 'IN',
          GhiChu NVARCHAR(255) NULL
        )
      `
    },
    {
      name: 'yeucau_chamcong',
      query: `
        CREATE TABLE yeucau_chamcong (
          MaYeuCau INT IDENTITY(1,1) PRIMARY KEY,
          MaNhanVien INT FOREIGN KEY REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE,
          Ngay DATE NOT NULL,
          CaLam NVARCHAR(50) NULL,
          Loai NVARCHAR(50) NOT NULL,
          ThoiGian NVARCHAR(50) NULL,
          LyDo NVARCHAR(255) NULL,
          TrangThai NVARCHAR(30) DEFAULT N'pending',
          NgayTao DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'bangluong',
      query: `
        CREATE TABLE bangluong (
          MaBangLuong INT PRIMARY KEY,
          MaNhanVien INT FOREIGN KEY REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE,
          Thang INT NOT NULL,
          Nam INT NOT NULL,
          TongCaLam INT DEFAULT 0,
          Thuong DECIMAL(18,2) DEFAULT 0,
          KhauTru DECIMAL(18,2) DEFAULT 0,
          TongLuong DECIMAL(18,2) NOT NULL,
          TrangThai VARCHAR(30) NULL,
          NgayTao DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'baocao',
      query: `
        CREATE TABLE baocao (
          MaBaoCao INT PRIMARY KEY,
          LoaiBaoCao NVARCHAR(100) NOT NULL,
          Ngay DATE NOT NULL,
          DoanhThu DECIMAL(18,2) DEFAULT 0,
          MaTaiKhoan INT FOREIGN KEY REFERENCES taikhoan(MaTaiKhoan) ON DELETE SET NULL,
          NgayTao DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'nhatkynhapxuat',
      query: `
        CREATE TABLE nhatkynhapxuat (
          MaNhatKy INT PRIMARY KEY,
          MaTaiKhoan INT FOREIGN KEY REFERENCES taikhoan(MaTaiKhoan) ON DELETE CASCADE,
          LoaiNhapXuat VARCHAR(15) NOT NULL,
          TenFile NVARCHAR(255) NOT NULL,
          NgayThucHien DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'lichsunhapxuat',
      query: `
        CREATE TABLE lichsunhapxuat (
          MaLichSu INT PRIMARY KEY,
          MaTaiKhoan INT FOREIGN KEY REFERENCES taikhoan(MaTaiKhoan) ON DELETE CASCADE,
          HanhDong NVARCHAR(50) NOT NULL,
          NoiDung NVARCHAR(255) NULL,
          NgayTao DATETIME DEFAULT GETDATE()
        )
      `
    },
    {
      name: 'goidouong',
      query: `
        CREATE TABLE goidouong (
          MaGoi INT PRIMARY KEY,
          MaNhaHang INT NULL,
          MaSanPham INT FOREIGN KEY REFERENCES sanpham(MaSanPham) ON DELETE SET NULL,
          SoLuong INT DEFAULT 1,
          LyDo NVARCHAR(255) NULL,
          GhiChu NVARCHAR(255) NULL
        )
      `
    }
  ];

  for (const def of tableDefinitions) {
    try {
      await pool.request().query(def.query);
      console.log(`- Created table: ${def.name}`);
    } catch (err) {
      console.error(`❌ Failed to create table ${def.name}:`, err.message);
      process.exit(1);
    }
  }

  // 3. Seed data
  console.log('Seeding data...');
  try {
    // Seed vaitro
    await pool.request().query(`
      INSERT INTO vaitro (MaVaiTro, TenVaiTro) VALUES 
      (1, N'Admin'),
      (2, N'Manager'),
      (3, N'Staff')
    `);
    console.log('- Seeded: vaitro');

    // Seed taikhoan
    await pool.request().query(`
      INSERT INTO taikhoan (MaTaiKhoan, HoTen, Email, MatKhau, SoDienThoai, MaVaiTro, TrangThaiHoatDong) VALUES 
      (1, N'Nguyễn Văn Admin', 'admin@gmail.com', '123456', '0912345678', 1, 1),
      (2, N'Nguyễn Văn Manager', 'staff@gmail.com', '123456', '0912345678', 2, 1),
      (3, N'Đỗ Văn Đoàn', 'doan@gmail.com', '$2b$10$ydBCzN1MJMjKNkPZu5taHeb6lngi4.BBUWLg9NqMFRaU4PK0VtKiO', NULL, 3, 1),
      (4, N'Đỗ Văn Đoàn', 'doan1@gmail.com', '$2b$10$5EG.JuTvA971.aR81Kvm7.MlILUfrUaRvrLVElKQEdF.jnkrhmwbm', NULL, 3, 1)
    `);
    console.log('- Seeded: taikhoan');

    // Seed danhmuc
    await pool.request().query(`
      INSERT INTO danhmuc (MaDanhMuc, TenDanhMuc) VALUES
      (1, N'Coffee'),
      (2, N'Bakery'),
      (3, N'Food')
    `);
    console.log('- Seeded: danhmuc');

    // Seed sanpham
    await pool.request().query(`
      INSERT INTO sanpham (TenSanPham, Gia, MoTa, CoBan, MaDanhMuc) VALUES
      (N'Espresso', 35000, 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=200', 1, 1),
      (N'Cappuccino', 45000, 'https://images.unsplash.com/photo-1615486780246-76e6bb33e8b5?w=200', 1, 1),
      (N'Latte', 48000, 'https://images.unsplash.com/photo-1543233604-3baca4d35513?w=200', 1, 1),
      (N'Americano', 38000, 'https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?w=200', 1, 1),
      (N'Mocha', 52000, 'https://images.unsplash.com/photo-1489866492941-15d60bdaa7e0?w=200', 1, 1),
      (N'Croissant', 32000, 'https://images.unsplash.com/photo-1571157577110-493b325fdd3d?w=200', 1, 2),
      (N'Muffin', 35000, 'https://images.unsplash.com/photo-1751151856149-5ebf1d21586a?w=200', 1, 2),
      (N'Brownie', 40000, 'https://images.unsplash.com/photo-1737700088850-d0b53f9d39ec?w=200', 1, 2),
      (N'Club Sandwich', 75000, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200', 1, 3),
      (N'Panini', 68000, 'https://images.unsplash.com/photo-1627443831818-d7a8d5e18239?w=200', 1, 3),
      (N'Banh Mi Thit', 45000, 'https://images.unsplash.com/photo-1662991054703-a15d787d559e?w=200', 1, 3)
    `);
    console.log('- Seeded: sanpham');

    // Seed bancafe
    await pool.request().query(`
      INSERT INTO bancafe (MaBan, TenBan, TrangThai, SoChoNgoi) VALUES
      (1, N'T1', 'OFF', 2),
      (2, N'T2', 'OFF', 4),
      (3, N'T3', 'OFF', 2),
      (4, N'T4', 'OFF', 4),
      (5, N'T5', 'OFF', 6),
      (6, N'T6', 'OFF', 2),
      (7, N'T7', 'OFF', 4),
      (8, N'T8', 'OFF', 8)
    `);
    console.log('- Seeded: bancafe');

    // Seed chucvu
    await pool.request().query(`
      INSERT INTO chucvu (TenChucVu) VALUES 
      (N'Thu ngân'), 
      (N'Phục vụ'), 
      (N'Pha chế'), 
      (N'Quản lý')
    `);
    console.log('- Seeded: chucvu');

    console.log('✅ All data seeded successfully!');
  } catch (err) {
    console.error('❌ Failed to seed data:', err.message);
    process.exit(1);
  } finally {
    await sql.close();
    process.exit(0);
  }
}

rebuild();

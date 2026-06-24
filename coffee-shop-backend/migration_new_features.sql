-- ============================================================
-- MIGRATION: Tính năng mới cho Quản lý Nhân sự
-- Chạy file này 1 lần trong MySQL để tạo các bảng mới
-- ============================================================

-- 1. Bảng đăng ký ca làm (nhân viên tự đăng ký)
CREATE TABLE IF NOT EXISTS dangky_ca (
  MaDangKy    INT AUTO_INCREMENT PRIMARY KEY,
  MaNhanVien  INT NOT NULL,
  MaCaLam     INT NOT NULL,
  NgayLam     DATE NOT NULL,
  TrangThai   ENUM('pending','approved','rejected') DEFAULT 'pending',
  GhiChu      TEXT,
  NgayTao     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE,
  FOREIGN KEY (MaCaLam) REFERENCES calam(MaCaLam) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (MaNhanVien, MaCaLam, NgayLam)
);

-- 2. Bảng đơn xin nghỉ
CREATE TABLE IF NOT EXISTS don_xin_nghi (
  MaDon       INT AUTO_INCREMENT PRIMARY KEY,
  MaNhanVien  INT NOT NULL,
  NgayNghi    DATE NOT NULL,
  NgayNghiDen DATE,
  LyDo        TEXT NOT NULL,
  LoaiNghi    ENUM('phep','om','viec_rieng','khac') DEFAULT 'phep',
  TrangThai   ENUM('pending','approved','rejected') DEFAULT 'pending',
  GhiChuQL    TEXT COMMENT 'Ghi chú của quản lý khi duyệt/từ chối',
  NgayTao     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE
);

-- 3. Bảng tổng hợp công tháng (quản lý gửi cho NV xem và phản hồi)
CREATE TABLE IF NOT EXISTS bangcong_thang (
  MaBangCong  INT AUTO_INCREMENT PRIMARY KEY,
  MaNhanVien  INT NOT NULL,
  Thang       INT NOT NULL,
  Nam         INT NOT NULL,
  SoCong      DECIMAL(5,2) DEFAULT 0,
  SoGioLam    DECIMAL(8,2) DEFAULT 0,
  SoNgayNghi  INT DEFAULT 0,
  SoNgayTre   INT DEFAULT 0,
  GhiChuQL    TEXT COMMENT 'Ghi chú của quản lý',
  PhanHoiNV   TEXT COMMENT 'Phản hồi của nhân viên nếu sai',
  TrangThai   ENUM('draft','sent_to_emp','emp_replied','confirmed','submitted_to_admin') DEFAULT 'draft',
  NgayGui     DATETIME COMMENT 'Ngày quản lý gửi cho nhân viên',
  NgayXacNhan DATETIME COMMENT 'Ngày quản lý confirm',
  NgayTao     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE,
  UNIQUE KEY unique_monthly (MaNhanVien, Thang, Nam)
);

-- 4. Bảng mã giảm giá
CREATE TABLE IF NOT EXISTS mamgiamgia (
  MaMG        INT AUTO_INCREMENT PRIMARY KEY,
  MaCode      VARCHAR(50) NOT NULL UNIQUE,
  TenMG       VARCHAR(100),
  LoaiGiam    ENUM('percent','fixed') DEFAULT 'percent' COMMENT 'percent=%, fixed=tiền cố định',
  GiaTriGiam  DECIMAL(10,2) NOT NULL,
  GiaTriToiDa DECIMAL(10,2) DEFAULT NULL COMMENT 'Áp dụng cho loại percent: giảm tối đa bao nhiêu',
  SoLanDung   INT DEFAULT 0 COMMENT 'Số lần đã sử dụng',
  GioiHanDung INT DEFAULT NULL COMMENT 'Tổng số lần được phép dùng (NULL = không giới hạn)',
  NgayBatDau  DATE DEFAULT (CURDATE()),
  NgayHetHan  DATE DEFAULT NULL,
  TrangThai   TINYINT(1) DEFAULT 1 COMMENT '1=active, 0=inactive',
  NgayTao     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed: Một số mã giảm giá mẫu
INSERT IGNORE INTO mamgiamgia (MaCode, TenMG, LoaiGiam, GiaTriGiam, GioiHanDung, NgayHetHan, TrangThai) VALUES
('WELCOME10', 'Chào mừng khách mới', 'percent', 10, 100, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1),
('GIAMGIA20K', 'Giảm 20,000đ cho bill từ 100K', 'fixed', 20000, 50, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1),
('SUMMER15', 'Summer Sale 15%', 'percent', 15, NULL, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 0);

const db = require('./src/config/db');

async function seedDonHang() {
  try {
    console.log('Bat dau tao du lieu mau cho bang donhang...\n');

    // Lay MaDonHang lon nhat hien tai
    const [maxRes] = await db.query('SELECT ISNULL(MAX(MaDonHang), 0) as maxId FROM donhang');
    let nextId = maxRes[0].maxId + 1;
    console.log('MaDonHang bat dau tu:', nextId);

    // Kiem tra du lieu bang bancafe va nhanvien truoc
    const [bans] = await db.query('SELECT TOP 5 MaBan FROM bancafe');
    const [nvs] = await db.query('SELECT TOP 5 MaTaiKhoan FROM taikhoan WHERE MaVaiTro = 3');
    const [khs] = await db.query('SELECT TOP 3 MaKhachHang FROM khachhang');

    console.log('So ban cafe:', bans.length);
    console.log('So nhan vien (role 3):', nvs.length);
    console.log('So khach hang:', khs.length);

    const maBan1 = bans[0]?.MaBan || 1;
    const maBan2 = bans[1]?.MaBan || 2;
    const maBan3 = bans[2]?.MaBan || 3;
    const maNV = nvs[0]?.MaTaiKhoan || 6;
    const maKH = khs[0]?.MaKhachHang || null;

    // Tao 10 don hang mau
    const donhangs = [
      {
        MaBan: maBan1, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-20 08:30:00', TongTien: 85000, GiamGia: 0,
        ThanhTien: 85000, PhuongThucThanhToan: 'Tien mat', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan2, MaNhanVien: maNV, MaKhachHang: maKH,
        NgayDat: '2026-06-20 09:15:00', TongTien: 120000, GiamGia: 10000,
        ThanhTien: 110000, PhuongThucThanhToan: 'The', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan1, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-21 10:00:00', TongTien: 65000, GiamGia: 0,
        ThanhTien: 65000, PhuongThucThanhToan: 'Tien mat', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan3, MaNhanVien: maNV, MaKhachHang: maKH,
        NgayDat: '2026-06-21 14:30:00', TongTien: 200000, GiamGia: 20000,
        ThanhTien: 180000, PhuongThucThanhToan: 'The', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan2, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-22 08:00:00', TongTien: 45000, GiamGia: 0,
        ThanhTien: 45000, PhuongThucThanhToan: 'Tien mat', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan1, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-22 11:30:00', TongTien: 150000, GiamGia: 15000,
        ThanhTien: 135000, PhuongThucThanhToan: 'Chuyen khoan', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan3, MaNhanVien: maNV, MaKhachHang: maKH,
        NgayDat: '2026-06-23 09:00:00', TongTien: 95000, GiamGia: 0,
        ThanhTien: 95000, PhuongThucThanhToan: 'Tien mat', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan2, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-23 15:00:00', TongTien: 170000, GiamGia: 0,
        ThanhTien: 170000, PhuongThucThanhToan: 'The', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan1, MaNhanVien: maNV, MaKhachHang: maKH,
        NgayDat: '2026-06-24 10:30:00', TongTien: 110000, GiamGia: 10000,
        ThanhTien: 100000, PhuongThucThanhToan: 'Chuyen khoan', TrangThai: 'Hoan thanh'
      },
      {
        MaBan: maBan3, MaNhanVien: maNV, MaKhachHang: null,
        NgayDat: '2026-06-24 16:00:00', TongTien: 75000, GiamGia: 0,
        ThanhTien: 75000, PhuongThucThanhToan: 'Tien mat', TrangThai: 'Hoan thanh'
      },
    ];

    let successCount = 0;
    for (const dh of donhangs) {
      await db.query(`
        INSERT INTO donhang 
          (MaDonHang, MaBan, MaNhanVien, MaKhachHang, NgayDat, TongTien, GiamGia, ThanhTien, PhuongThucThanhToan, TrangThai)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nextId,
        dh.MaBan, dh.MaNhanVien, dh.MaKhachHang,
        dh.NgayDat, dh.TongTien, dh.GiamGia,
        dh.ThanhTien, dh.PhuongThucThanhToan, dh.TrangThai
      ]);
      successCount++;
      console.log(`Da tao don hang #${nextId}: Ban ${dh.MaBan} - ${dh.ThanhTien.toLocaleString()} VND - ${dh.PhuongThucThanhToan}`);
      nextId++;
    }

    // Kiem tra lai
    const [total] = await db.query('SELECT COUNT(*) as total, SUM(ThanhTien) as tongDoanhThu FROM donhang');
    console.log(`\n=== KET QUA ===`);
    console.log(`Tong so don hang: ${total[0].total}`);
    console.log(`Tong doanh thu: ${Number(total[0].tongDoanhThu).toLocaleString()} VND`);
    console.log('\nTao du lieu mau THANH CONG!');

  } catch (err) {
    console.error('Loi:', err.message);
    console.error(err);
  }
  process.exit(0);
}

seedDonHang();

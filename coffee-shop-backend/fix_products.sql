INSERT IGNORE INTO danhmuc (MaDanhMuc, TenDanhMuc) VALUES
(1, 'Coffee'),
(2, 'Bakery'),
(3, 'Food');

INSERT IGNORE INTO sanpham (MaSanPham, TenSanPham, Gia, MoTa, CoBan, MaDanhMuc) VALUES
(1, 'Espresso', 35000, 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=200', 1, 1),
(2, 'Cappuccino', 45000, 'https://images.unsplash.com/photo-1615486780246-76e6bb33e8b5?w=200', 1, 1),
(3, 'Latte', 48000, 'https://images.unsplash.com/photo-1543233604-3baca4d35513?w=200', 1, 1),
(4, 'Americano', 38000, 'https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?w=200', 1, 1),
(5, 'Mocha', 52000, 'https://images.unsplash.com/photo-1489866492941-15d60bdaa7e0?w=200', 1, 1),
(6, 'Croissant', 32000, 'https://images.unsplash.com/photo-1571157577110-493b325fdd3d?w=200', 1, 2),
(7, 'Muffin', 35000, 'https://images.unsplash.com/photo-1751151856149-5ebf1d21586a?w=200', 1, 2),
(8, 'Brownie', 40000, 'https://images.unsplash.com/photo-1737700088850-d0b53f9d39ec?w=200', 1, 2),
(9, 'Club Sandwich', 75000, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200', 1, 3),
(10, 'Panini', 68000, 'https://images.unsplash.com/photo-1627443831818-d7a8d5e18239?w=200', 1, 3),
(11, 'Banh Mi Thit', 45000, 'https://images.unsplash.com/photo-1662991054703-a15d787d559e?w=200', 1, 3);

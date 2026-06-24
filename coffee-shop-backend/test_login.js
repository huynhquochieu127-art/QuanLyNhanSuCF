const db = require('./src/config/db');

async function test() {
  try {
    const Email = 'doan1@gmail.com'; // manager_d email
    const [users] = await db.query('SELECT * FROM taikhoan WHERE Email = ?', [Email]);
    console.log('User raw row:', users[0]);

    if (users.length > 0) {
      const user = users[0];
      const payload = {
        MaTaiKhoan: user.MaTaiKhoan,
        Email: user.Email,
        HoTen: user.HoTen,
        MaVaiTro: user.MaVaiTro
      };
      console.log('Payload generated:', payload);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

test();

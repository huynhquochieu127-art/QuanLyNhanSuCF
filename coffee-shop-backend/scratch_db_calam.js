const db = require('./src/config/db');

async function test() {
  try {
    const [calam] = await db.query('SELECT * FROM calam');
    console.log('--- calam ---');
    console.log(calam);
    if (calam.length > 0) {
      console.log('Types:', {
        GioBatDau: typeof calam[0].GioBatDau,
        GioBatDau_instance: calam[0].GioBatDau instanceof Date ? 'Date' : 'Not Date',
        GioKetThuc: typeof calam[0].GioKetThuc,
        GioKetThuc_instance: calam[0].GioKetThuc instanceof Date ? 'Date' : 'Not Date'
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();

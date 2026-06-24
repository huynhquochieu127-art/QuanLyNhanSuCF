const db = require('./src/config/db');

async function verify() {
  try {
    console.log('Testing SELECT query...');
    const [products] = await db.query('SELECT MaSanPham, TenSanPham, Gia FROM sanpham');
    console.log(`- Success! Retrieved ${products.length} products.`);
    console.log('Sample product:', products[0]);

    console.log('\nTesting parameterized query...');
    const [matched] = await db.query('SELECT * FROM sanpham WHERE TenSanPham = ?', ['Espresso']);
    console.log('- Success! Matched product:', matched[0]?.TenSanPham);

    console.log('\nTesting INSERT query with identity...');
    const [insertResult] = await db.query(
      'INSERT INTO sanpham (TenSanPham, Gia, MoTa, CoBan, MaDanhMuc) VALUES (?, ?, ?, ?, ?)',
      ['Flat White', 42000, 'https://images.unsplash.com', 1, 1]
    );
    console.log('- Success! Insert Result:', insertResult);
    const newProductId = insertResult.insertId;
    console.log('Inserted product ID (insertId):', newProductId);

    if (newProductId) {
      console.log('\nVerifying inserted product...');
      const [newProduct] = await db.query('SELECT * FROM sanpham WHERE MaSanPham = ?', [newProductId]);
      console.log('- Retrieved new product:', newProduct[0]);

      console.log('\nTesting DELETE query...');
      const [deleteResult] = await db.query('DELETE FROM sanpham WHERE MaSanPham = ?', [newProductId]);
      console.log('- Delete Result:', deleteResult);
    }

    console.log('\n✅ All database wrapper tests passed!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    process.exit(0);
  }
}

verify();

const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// Cấu hình kết nối SQL Server LocalDB dùng Windows Authentication
const server = process.env.DB_SERVER || '(localdb)\\MSSQLLocalDB';
const database = process.env.DB_NAME || 'dacnpm';

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;Encrypt=no;`,
};

// Tạo Connection Pool
const pool = new sql.ConnectionPool(config);
const poolPromise = pool.connect()
  .then(p => {
    console.log(`✅ Kết nối SQL Server thành công tới database: ${database} trên Server: ${server}!`);
    return p;
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối SQL Server:', err.message);
    console.error('Chi tiết lỗi:', err);
    throw err;
  });

// Hàm query giả lập mysql2 để không làm hỏng controllers hiện tại
const query = async (sqlString, params = []) => {
  try {
    const activePool = await poolPromise;
    const request = activePool.request();

    let processedSql = sqlString;
    if (params && params.length > 0) {
      let paramIndex = 0;
      processedSql = sqlString.replace(/\?/g, () => {
        const paramName = `myparam${paramIndex}`;
        const val = params[paramIndex];
        request.input(paramName, val);
        paramIndex++;
        return `@${paramName}`;
      });
    }

    const result = await request.query(processedSql);
    // mysql2.query trả về mảng [rows, fields]. Ở đây ta chỉ cần [rows]
    return [result.recordset];
  } catch (error) {
    console.error('❌ Lỗi khi thực thi câu lệnh SQL Server:', error.message);
    console.error('Câu lệnh gốc:', sqlString);
    console.error('Tham số:', params);
    throw error;
  }
};

module.exports = {
  sql,
  poolPromise,
  query
};

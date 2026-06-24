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
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = sql.connect(config)
  .then(pool => {
    console.log(`✅ Kết nối SQL Server thành công tới database: ${process.env.DB_DATABASE} trên server: ${process.env.DB_SERVER}!`);
    return pool;
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối SQL Server:', err.message);
    throw err;
  });

module.exports = {
  query: async (queryText, params) => {
    const pool = await poolPromise;
    const request = pool.request();
    
    let mssqlQuery = queryText;
    
    // 1. Rewrite MySQL-specific functions/constructs
    mssqlQuery = mssqlQuery.replace(/DATABASE\(\)/gi, 'DB_NAME()');
    mssqlQuery = mssqlQuery.replace(/NOW\(\)/gi, 'GETDATE()');
    
    // 2. Translate parameter placeholders from '?' to '@p0', '@p1', etc.
    if (params && params.length > 0) {
      let paramIndex = 0;
      mssqlQuery = mssqlQuery.replace(/\?/g, () => {
        const paramName = `p${paramIndex}`;
        const val = params[paramIndex];
        request.input(paramName, val);
        paramIndex++;
        return `@${paramName}`;
      });
    }
    
    // 3. Determine if query is a SELECT/SHOW query vs INSERT/UPDATE/DELETE
    const isSelect = queryText.trim().match(/^(select|show)/i);
    
    if (!isSelect) {
      // Append SCOPE_IDENTITY() for INSERT to fetch the auto-generated identity ID.
      if (queryText.trim().match(/^insert/i)) {
        mssqlQuery += '; SELECT SCOPE_IDENTITY() AS insertId;';
      }
    }
    
    // 4. Run the query
    const result = await request.query(mssqlQuery);
    
    if (isSelect) {
      return [result.recordset || [], null];
    } else {
      let insertId = null;
      if (result.recordsets && result.recordsets.length > 1) {
        const identityRecordset = result.recordsets[result.recordsets.length - 1];
        if (identityRecordset && identityRecordset[0] && identityRecordset[0].insertId !== undefined) {
          insertId = identityRecordset[0].insertId;
        }
      } else if (result.recordset && result.recordset[0] && result.recordset[0].insertId !== undefined) {
        insertId = result.recordset[0].insertId;
      }
      
      const mockResult = {
        insertId: insertId,
        affectedRows: result.rowsAffected ? result.rowsAffected[0] : 0,
        warningStatus: 0
      };
      return [mockResult, null];
    }
  }
};

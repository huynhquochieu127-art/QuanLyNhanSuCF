const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load local .env manually to prioritize it over system env
let envConfig = {};
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
  }
} catch (err) {
  console.warn("Không thể đọc file .env trực tiếp:", err.message);
}

const dbHost = envConfig.DB_HOST || process.env.DB_HOST || "localhost";
const dbUser = envConfig.DB_USER || process.env.DB_USER || "root";
const dbPassword = envConfig.DB_PASSWORD || process.env.DB_PASSWORD || "123456";
const dbName = envConfig.DB_NAME || process.env.DB_NAME || "dacnpm";
const dbPort = parseInt(envConfig.DB_PORT || process.env.DB_PORT || "3306", 10);

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then((conn) => {
    console.log("Kết nối cơ sở dữ liệu MySQL thành công!");
    conn.release();
  })
  .catch((err) => {
    console.error("Lỗi kết nối cơ sở dữ liệu:", err.message);
  });

module.exports = pool;

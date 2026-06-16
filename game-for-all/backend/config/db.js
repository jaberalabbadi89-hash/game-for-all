const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

let dbConfig;
const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || (process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://') ? process.env.DB_HOST : null);

if (dbUrl) {
  console.log('Connecting to database by parsing connection URI.');
  try {
    const parsedUrl = new URL(dbUrl);
    dbConfig = {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port) || 3306,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: decodeURIComponent(parsedUrl.pathname.substring(1).split('?')[0]),
      ssl: {
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 10
    };
  } catch (err) {
    console.error('Failed to parse database connection URI. Falling back to direct string connection:', err.message);
    dbConfig = dbUrl;
  }
} else {
  console.log('Connecting to database using individual DB variables.');
  dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10
  };
}

const pool = mysql.createPool(dbConfig);

console.log('--- DB CONFIG LOG ---');
console.log('Host/URI:', dbConfig.host || dbUrl);
console.log('User:', dbConfig.user || 'N/A');
console.log('Password is set?', !!(dbConfig.password || process.env.DB_PASSWORD));
console.log('---------------------');

async function connectDB() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return {
      connected: true,
      message: 'Database connected successfully',
    };
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  connectDB,
  query,
};
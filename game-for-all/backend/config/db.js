const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false // هذا ضروري جداً لـ Aiven
  }
});

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
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.porter,
  waitForConnections: true,
  connectionLimit: 30, // Adjust based on load and DB capacity
  queueLimit: 0,
});

const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

export { pool, query };

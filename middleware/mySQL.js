import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection setup
const connection = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.porter
});

// Helper function to run queries with promise
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error('MySQL Error:', err);
        reject(err);
      }
      resolve(results || []);  // Return an empty array if no results
    });
  });
};


export { connection, query };
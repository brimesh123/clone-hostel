// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // Should be "localhost"
  user: process.env.DB_USER,       // Should be "root" or your MySQL username
  password: process.env.DB_PASS,   // Should be empty (or your password)
  database: process.env.DB_NAME,   // "hostel_management"
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;

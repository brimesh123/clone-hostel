// models/adminModel.js
const db = require('../config/db');

const AdminModel = {
  // Find admin(s) by username
  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows;
  },

  // Create a new admin record
  create: async (username, passwordHash, role) => {
    const [result] = await db.query(
      'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return result;
  }
};

module.exports = AdminModel;

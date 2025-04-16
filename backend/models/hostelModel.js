// models/hostelModel.js
const db = require('../config/db');

const HostelModel = {
  // Create a new hostel with hostel_type (either 'boys' or 'girls')
  createHostel: async (name, username, password, fee6, fee12, hostel_type) => {
    const [result] = await db.query(
      'INSERT INTO hostels (name, username, password_hash, fee_6_month, fee_12_month, hostel_type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, username, password, fee6, fee12, hostel_type]
    );
    return result.insertId;
  },

  // Get all hostels excluding the password (or password_hash) column
  getAllHostels: async () => {
    const [rows] = await db.query(
      'SELECT hostel_id, name, username, fee_6_month, fee_12_month, hostel_type, created_at FROM hostels'
    );
    return rows;
  },

  // Get hostel details by ID excluding the password (or password_hash) column
  getHostelById: async (id) => {
    const [rows] = await db.query(
      'SELECT hostel_id, name, username, fee_6_month, fee_12_month, hostel_type, created_at FROM hostels WHERE hostel_id = ?',
      [id]
    );
    return rows[0];
  },

  // Find hostel by username (for authentication)
  findByUsername: async (username) => {
    const [rows] = await db.query(
      'SELECT hostel_id, name, username, password_hash, hostel_type FROM hostels WHERE username = ?',
      [username]
    );
    return rows;
  },

  // Get fee statistics including hostel_type for context
  getFeeStatistics: async () => {
    const [rows] = await db.query(
      `SELECT h.name, h.fee_6_month, h.fee_12_month, h.hostel_type, COUNT(s.id) as total_students
       FROM hostels h
       LEFT JOIN students s ON h.hostel_id = s.hostel_id
       GROUP BY h.hostel_id`
    );
    return rows;
  },

  // Update hostel information
  updateHostel: async (hostelId, name, fee_6_month, fee_12_month) => {
    const [result] = await db.query(
      'UPDATE hostels SET name = ?, fee_6_month = ?, fee_12_month = ? WHERE hostel_id = ?',
      [name, fee_6_month, fee_12_month, hostelId]
    );
    return result.affectedRows;
  },

  // Delete a hostel
  deleteHostel: async (hostelId) => {
    // First delete associated students (if there's a foreign key constraint)
    // Note: This is a cascading delete. If your database has CASCADE ON DELETE set up, you might not need this.
    try {
      await db.query('DELETE FROM students WHERE hostel_id = ?', [hostelId]);
    } catch (err) {
      console.log('No students to delete or cascading delete is enabled');
    }
    
    // Then delete the hostel
    const [result] = await db.query(
      'DELETE FROM hostels WHERE hostel_id = ?',
      [hostelId]
    );
    return result.affectedRows;
  },

  // Update hostel password
  updateHostelPassword: async (hostelId, hashedPassword) => {
    const [result] = await db.query(
      'UPDATE hostels SET password_hash = ? WHERE hostel_id = ?',
      [hashedPassword, hostelId]
    );
    return result.affectedRows;
  },

  // Get hostel with password hash (for internal use only)
  getHostelWithPasswordHash: async (hostelId) => {
    const [rows] = await db.query(
      'SELECT hostel_id, name, username, password_hash, hostel_type FROM hostels WHERE hostel_id = ?',
      [hostelId]
    );
    return rows[0];
  },

  // Get simplified hostel password data
  getHostelPassword: async (hostelId) => {
    const [rows] = await db.query(
      'SELECT username, password_hash FROM hostels WHERE hostel_id = ?',
      [hostelId]
    );
    return rows.length > 0 ? { username: rows[0].username, passwordHash: rows[0].password_hash } : null;
  },

  // Get master admin by ID
  getMasterAdmin: async (adminId) => {
    const [rows] = await db.query(
      'SELECT id, username, password_hash FROM admins WHERE id = ? AND role = "master"',
      [adminId]
    );
    return rows[0];
  }
};

module.exports = HostelModel;
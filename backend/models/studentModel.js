// models/studentModel.js - Updated
const db = require('../config/db');

const StudentModel = {
  // Create a new student with academic year
  createStudent: async (studentData) => {
    // Determine academic year based on current date
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // JavaScript months are 0-based
   
    // Academic year runs from June to May (e.g., 2024-2025)
    const academicYearStart = month >= 6 ? year : year - 1;
    const academicYearEnd = academicYearStart + 1;
    const academicYear = `${academicYearStart}-${academicYearEnd}`;
   
    const [result] = await db.query(
      `INSERT INTO students (
        roll_no, first_name, father_name, surname, address, city, aadhar,
        personal_phone, parent_phone, college, stream, hostel_id, admission_date,
        status, academic_year, due_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW())`,
      [
        studentData.roll_no,
        studentData.first_name,
        studentData.father_name,
        studentData.surname,
        studentData.address,
        studentData.city,
        studentData.aadhar,
        studentData.personal_phone,
        studentData.parent_phone,
        studentData.college,
        studentData.stream,
        studentData.hostel_id,
        studentData.admission_date,
        'active', // Default status
        academicYear
      ]
    );
   
    return result.insertId;
  },
  
  // Find student by roll number
  findByRollNo: async (rollNo) => {
    const [rows] = await db.query(
      'SELECT * FROM students WHERE roll_no = ?',
      [rollNo]
    );
    
    return rows[0];
  },
  
  // Find student by Aadhar number
  findByAadhar: async (aadhar) => {
    const [rows] = await db.query(
      'SELECT * FROM students WHERE aadhar = ?',
      [aadhar]
    );
    
    return rows[0];
  },
  
  // Get all active students for a hostel
  getStudentsByHostel: async (hostelId, onlyActive = true) => {
    let query = `
      SELECT s.*, h.name as hostel_name, h.hostel_type
      FROM students s
      JOIN hostels h ON s.hostel_id = h.hostel_id
      WHERE s.hostel_id = ?
    `;
    
    if (onlyActive) {
      query += ` AND s.status = 'active'`;
    }
    
    query += ` ORDER BY s.created_at DESC`;
    
    const [rows] = await db.query(query, [hostelId]);
    
    return rows;
  },
  
  // Get all students who have left a hostel
  getLeftStudentsByHostel: async (hostelId) => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.hostel_id = ? AND s.status = 'left'
       ORDER BY s.left_date DESC`,
      [hostelId]
    );
    
    return rows;
  },
  
  // Get all students (for master admin)
  getAllStudents: async (status = 'active') => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.status = ?
       ORDER BY s.created_at DESC`,
      [status]
    );
    
    return rows;
  },
  
  // Get a student by ID
  getStudentById: async (studentId) => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.id = ?`,
      [studentId]
    );
   
    return rows[0];
  },
  
  // Update a student
  updateStudent: async (studentId, updateData) => {
    // Build dynamic SQL for updating
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
   
    const setClause = fields.map(field => `${field} = ?`).join(', ');
   
    const [result] = await db.query(
      `UPDATE students SET ${setClause} WHERE id = ?`,
      [...values, studentId]
    );
   
    return result.affectedRows;
  },
  
  // Mark a student as left
  markStudentAsLeft: async (studentId, leftDate) => {
    const formattedLeftDate = leftDate || new Date().toISOString().split('T')[0];
    
    const [result] = await db.query(
      `UPDATE students SET status = 'left', left_date = ? WHERE id = ?`,
      [formattedLeftDate, studentId]
    );
    
    return result.affectedRows;
  },
  
  // Delete a student
  deleteStudent: async (studentId) => {
    const [result] = await db.query(
      'DELETE FROM students WHERE id = ?',
      [studentId]
    );
    
    return result.affectedRows;
  },
  
  // Search students
  searchStudents: async (query, status = 'active') => {
    const searchParam = `%${query}%`;
    
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.status = ? AND (
          s.first_name LIKE ?
          OR s.surname LIKE ?
          OR s.roll_no LIKE ?
          OR s.personal_phone LIKE ?
          OR s.parent_phone LIKE ?
          OR s.college LIKE ?
       )
       ORDER BY s.created_at DESC`,
      [status, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam]
    );
    
    return rows;
  },
  
  // Search students by hostel with status filter
  searchStudentsByHostel: async (query, hostelId, status = 'active') => {
    const searchParam = `%${query}%`;
    
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.hostel_id = ? AND s.status = ? AND (
          s.first_name LIKE ?
          OR s.surname LIKE ?
          OR s.roll_no LIKE ?
          OR s.personal_phone LIKE ?
          OR s.parent_phone LIKE ?
          OR s.college LIKE ?
       )
       ORDER BY s.created_at DESC`,
      [hostelId, status, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam]
    );
    
    return rows;
  },
  
  // Get count of students by hostel (for dashboard)
  getStudentCountByHostel: async (status = 'active') => {
    const [rows] = await db.query(
      `SELECT h.hostel_id, h.name as hostel_name, h.hostel_type, COUNT(s.id) as student_count
       FROM hostels h
       LEFT JOIN students s ON h.hostel_id = s.hostel_id AND s.status = ?
       GROUP BY h.hostel_id
       ORDER BY h.name`,
      [status]
    );
    
    return rows;
  },
  
  // Get recent students for a hostel with limit
  getRecentStudentsByHostel: async (hostelId, limit = 5, status = 'active') => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.hostel_id = ? AND s.status = ?
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [hostelId, status, limit]
    );
    
    return rows;
  },
  
  // Get students by academic year
  getStudentsByAcademicYear: async (academicYear, hostelId = null) => {
    let query = `
      SELECT s.*, h.name as hostel_name, h.hostel_type
      FROM students s
      JOIN hostels h ON s.hostel_id = h.hostel_id
      WHERE s.academic_year = ?
    `;
    
    if (hostelId) {
      query += ` AND s.hostel_id = ?`;
      const [rows] = await db.query(query, [academicYear, hostelId]);
      return rows;
    } else {
      const [rows] = await db.query(query, [academicYear]);
      return rows;
    }
  },
  
  // Get current academic year
  getCurrentAcademicYear: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // JavaScript months are 0-based
    
    // Academic year runs from June to May
    const academicYearStart = month >= 6 ? year : year - 1;
    const academicYearEnd = academicYearStart + 1;
    
    return `${academicYearStart}-${academicYearEnd}`;
  },
  
  // Get all academic years in the system
  getAllAcademicYears: async () => {
    const [rows] = await db.query(
      `SELECT DISTINCT academic_year FROM students ORDER BY academic_year DESC`
    );
    
    return rows.map(row => row.academic_year);
  },

  // Get active students with due_date
  getActiveStudentsWithDueDate: async (hostelId) => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.hostel_id = ? AND s.status = 'active'
       ORDER BY s.first_name, s.surname`,
      [hostelId]
    );
    
    return rows;
  },
  
  // Get all active students with due_date across all hostels
  getAllActiveStudentsWithDueDate: async () => {
    const [rows] = await db.query(
      `SELECT s.*, h.name as hostel_name, h.hostel_type
       FROM students s
       JOIN hostels h ON s.hostel_id = h.hostel_id
       WHERE s.status = 'active'
       ORDER BY h.name, s.first_name, s.surname`
    );
    
    return rows;
  },
  
  // Get hostel fee information
  getHostelFeeInfo: async (hostelId) => {
    const [rows] = await db.query(
      `SELECT fee_6_month, fee_12_month FROM hostels WHERE hostel_id = ?`,
      [hostelId]
    );
    
    return rows[0];
  },
  
  // Get all hostels with student count
  getAllHostelsWithStudentCount: async () => {
    const [rows] = await db.query(
      `SELECT h.hostel_id, h.name, h.hostel_type, COUNT(s.id) as student_count
       FROM hostels h
       LEFT JOIN students s ON h.hostel_id = s.hostel_id AND s.status = 'active'
       GROUP BY h.hostel_id
       ORDER BY h.name`
    );
    
    return rows;
  },

  findHighestRollNumber: async (hostelId, yearPart) => {
    const [rows] = await db.query(
      `SELECT MAX(SUBSTRING(roll_no, -3)) as maxCount 
       FROM students 
       WHERE hostel_id = ? 
       AND roll_no LIKE ?`,
      [hostelId, `${hostelId}${yearPart}%`]
    );
    
    return rows[0].maxCount ? parseInt(rows[0].maxCount) : 0;
  }
};

module.exports = StudentModel;
// controllers/studentController.js - Updated
const StudentModel = require('../models/studentModel');
const HostelModel = require('../models/hostelModel');
const db = require('../config/db');

const studentController = {
  // Create a new student
  createStudent: async (req, res) => {
    try {
      const {
        first_name,
        father_name,
        surname,
        address,
        city,
        aadhar,
        personal_phone,
        parent_phone,
        college,
        stream,
        hostel_id,
        admission_date
      } = req.body;
      
      // Validate required fields
      if (!first_name || !surname || !address || !city || !aadhar ||
          !personal_phone || !parent_phone || !hostel_id || !admission_date) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }
      
      // Generate roll number parts:
      // 1. Hostel Prefix: using hostel_id as a string
      // 2. Year Part: last two digits of the current year
      const hostelPrefix = hostel_id.toString();
      const currentYear = new Date().getFullYear();
      const yearPart = currentYear.toString().slice(-2);
      
      // Find the highest existing roll number for this hostel and year
      const [maxRollResult] = await db.query(
        `SELECT MAX(CAST(SUBSTRING(roll_no, ${hostelPrefix.length + yearPart.length + 1}) AS UNSIGNED)) as maxCount 
         FROM students 
         WHERE hostel_id = ? 
         AND roll_no LIKE ?`,
        [hostel_id, `${hostelPrefix}${yearPart}%`]
      );
      
      // Get the next student number
      const highestCount = maxRollResult[0].maxCount || 0;
      const nextCount = highestCount + 1;
      const studentPart = nextCount.toString().padStart(3, '0');
      const roll_no = `${hostelPrefix}${yearPart}${studentPart}`;
      
      // Check if Aadhar number already exists
      const existingAadhar = await StudentModel.findByAadhar(aadhar);
      if (existingAadhar) {
        return res.status(400).json({ error: 'Aadhar number already exists' });
      }
      
      // Double-check the roll number doesn't already exist (as a safety measure)
      const existingStudent = await StudentModel.findByRollNo(roll_no);
      if (existingStudent) {
        return res.status(400).json({ error: 'Roll number already exists. System error.' });
      }
      
      // Create the student record with the generated roll number
      const studentId = await StudentModel.createStudent({
        roll_no,
        first_name,
        father_name: father_name || null,
        surname,
        address,
        city,
        aadhar,
        personal_phone,
        parent_phone,
        college: college || null,
        stream: stream || null,
        hostel_id,
        admission_date
      });
      
      res.status(201).json({
        message: 'Student created successfully',
        studentId
      });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get active students for receptionist's hostel
  getStudentsByHostel: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { status = 'active' } = req.query;
      const user = req.user;
     
      // If user is a receptionist, make sure they can only view their hostel's students
      if (user.role === 'receptionist' && user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access students from other hostels' });
      }
     
      const students = await (status === 'left' 
        ? StudentModel.getLeftStudentsByHostel(hostelId)
        : StudentModel.getStudentsByHostel(hostelId));
      
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get all students (for master admin) with status filter
  getAllStudents: async (req, res) => {
    try {
      const user = req.user;
      const { status = 'active' } = req.query;
     
      // Only master admin can view all students
      if (user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can view all students' });
      }
     
      const students = await StudentModel.getAllStudents(status);
      res.json(students);
    } catch (error) {
      console.error('Error fetching all students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get students by academic year
  getStudentsByAcademicYear: async (req, res) => {
    try {
      const user = req.user;
      const { academicYear } = req.params;
      const { hostelId } = req.query;
      
      if (!academicYear) {
        return res.status(400).json({ error: 'Academic year is required' });
      }
      
      // If user is receptionist, they can only view their hostel
      if (user.role === 'receptionist') {
        if (hostelId && user.id.toString() !== hostelId) {
          return res.status(403).json({ error: 'Unauthorized: Cannot access students from other hostels' });
        }
        
        const students = await StudentModel.getStudentsByAcademicYear(academicYear, user.id);
        return res.json(students);
      }
      
      // For master admin
      const students = await StudentModel.getStudentsByAcademicYear(academicYear, hostelId);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students by academic year:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get all academic years
  getAllAcademicYears: async (req, res) => {
    try {
      const academicYears = await StudentModel.getAllAcademicYears();
      res.json(academicYears);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get current academic year
  getCurrentAcademicYear: async (req, res) => {
    try {
      const currentYear = StudentModel.getCurrentAcademicYear();
      res.json({ academicYear: currentYear });
    } catch (error) {
      console.error('Error getting current academic year:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get a specific student by ID
  getStudentById: async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
     
      // Get the student with hostel info
      const student = await StudentModel.getStudentById(studentId);
     
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
     
      // If user is a receptionist, check if student belongs to their hostel
      if (user.role === 'receptionist' && user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access student from another hostel' });
      }
     
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Update a student
  updateStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
      
      // Get current student data
      const student = await StudentModel.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // If user is a receptionist, check if student belongs to their hostel
      if (user.role === 'receptionist' && user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot update student from another hostel' });
      }
      
      // Fields that can be updated
      const updateData = {};
      const updateableFields = [
        'first_name', 'father_name', 'surname', 'address', 'city',
        'personal_phone', 'parent_phone', 'college', 'stream'
      ];
      
      // Add fields that are present in the request body to update data
      updateableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      
      // Only master admin or receptionist can update certain fields
      // Receptionist should be able to update status for retrieving students
      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
        
        // If marking as left, set the left_date
        if (req.body.status === 'left' && !student.left_date) {
          updateData.left_date = req.body.left_date || new Date().toISOString().split('T')[0];
        }
        
        // If returning to active, clear the left_date
        if (req.body.status === 'active' && student.status === 'left') {
          updateData.left_date = null;
        }
      }
      
      // Only master admin can update these fields
      if (user.role === 'master') {
        if (req.body.hostel_id !== undefined) {
          updateData.hostel_id = req.body.hostel_id;
        }
        
        if (req.body.academic_year !== undefined) {
          updateData.academic_year = req.body.academic_year;
        }
      }
      
      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      // Update the student
      await StudentModel.updateStudent(studentId, updateData);
      
      res.json({ 
        message: 'Student updated successfully',
        status: updateData.status || student.status
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Add a new method for retrieving a student (unmarking as left)
  retrieveStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
      
      // Get current student data
      const student = await StudentModel.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // If user is a receptionist, check if student belongs to their hostel
      if (user.role === 'receptionist' && user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot retrieve student from another hostel' });
      }
      
      // Check if student is actually marked as left
      if (student.status !== 'left') {
        return res.status(400).json({ error: 'Student is not marked as left' });
      }
      
      // Update student status to active and clear left_date
      await StudentModel.updateStudent(studentId, {
        status: 'active',
        left_date: null
      });
      
      res.json({ message: 'Student successfully retrieved and marked as active' });
    } catch (error) {
      console.error('Error retrieving student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Mark a student as left
  markStudentAsLeft: async (req, res) => {
    try {
      const { studentId } = req.params;
      const { left_date } = req.body;
      const user = req.user;
      
      // Get current student data
      const student = await StudentModel.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Check permissions
      if (user.role === 'receptionist' && user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot update student from another hostel' });
      }
      
      // Check if student is already marked as left
      if (student.status === 'left') {
        return res.status(400).json({ error: 'Student is already marked as left' });
      }
      
      // Mark the student as left
      await StudentModel.markStudentAsLeft(studentId, left_date);
      
      res.json({ message: 'Student has been marked as left successfully' });
    } catch (error) {
      console.error('Error marking student as left:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Delete a student
  deleteStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
     
      // Get current student data
      const student = await StudentModel.getStudentById(studentId);
     
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
     
      // Only master admin or the hostel admin of the student can delete
      if (user.role === 'receptionist' && user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot delete student from another hostel' });
      }
     
      // Delete the student
      await StudentModel.deleteStudent(studentId);
     
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Search students
  searchStudents: async (req, res) => {
    try {
      const { query, status = 'active' } = req.query;
      const user = req.user;
     
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
     
      let students;
     
      // If master admin, search all students
      if (user.role === 'master') {
        students = await StudentModel.searchStudents(query, status);
      } else {
        // If receptionist, only search in their hostel
        students = await StudentModel.searchStudentsByHostel(query, user.id, status);
      }
     
      res.json(students);
    } catch (error) {
      console.error('Error searching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get count of students by hostel (for dashboard)
  getStudentCountByHostel: async (req, res) => {
    try {
      const { status = 'active' } = req.query;
      const counts = await StudentModel.getStudentCountByHostel(status);
      res.json(counts);
    } catch (error) {
      console.error('Error getting student counts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get recent students for a hostel
  getRecentStudentsByHostel: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { limit = 5, status = 'active' } = req.query;
      const user = req.user;
     
      // If user is a receptionist, make sure they can only view their hostel's students
      if (user.role === 'receptionist' && user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access students from other hostels' });
      }
     
      const students = await StudentModel.getRecentStudentsByHostel(hostelId, parseInt(limit), status);
      res.json(students);
    } catch (error) {
      console.error('Error fetching recent students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = studentController;
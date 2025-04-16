// routes/studentRoutes.js - Updated
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Create a new student (Reception admin)
router.post('/create', studentController.createStudent);

// Get students for receptionist's hostel (now with status filter)
router.get('/list', studentController.getStudentsByHostel);

// Get all students (Master admin only)
router.get('/all', studentController.getAllStudents);

// Get academic years and related endpoints
router.get('/academic-years', studentController.getAllAcademicYears);
router.get('/current-academic-year', studentController.getCurrentAcademicYear);
router.get('/academic-year/:academicYear', studentController.getStudentsByAcademicYear);

// Get student count by hostel
router.get('/count', studentController.getStudentCountByHostel);

// Search students
router.get('/search', studentController.searchStudents);

// Mark student as left
router.put('/:studentId/mark-as-left', studentController.markStudentAsLeft);

// Get, update, delete a specific student
router.get('/:studentId', studentController.getStudentById);
router.put('/:studentId', studentController.updateStudent);
router.delete('/:studentId', studentController.deleteStudent);

// Get students for a specific hostel (Master admin only)
router.get('/hostel/:hostelId', studentController.getStudentsByHostel);

// Get recent students for a hostel
router.get('/recent/:hostelId', studentController.getRecentStudentsByHostel);

// Route to retrieve a student (unmark as left)
router.put('/:studentId/retrieve', studentController.retrieveStudent);

module.exports = router;
// routes/dueRoutes.js
const express = require('express');
const router = express.Router();
const dueController = require('../controllers/dueController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get dues for a specific student
router.get('/student/:studentId', dueController.getStudentDues);

// Get all students with dues for a hostel (reception admin)
router.get('/hostel/:hostelId', dueController.getHostelDues);

// Get all students with dues (master admin only)
router.get('/all', dueController.getAllDues);

// Get summary of dues by hostel (master admin only)
router.get('/summary', dueController.getDuesSummary);

module.exports = router;
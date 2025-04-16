// routes/hostelRoutes.js
const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Create a hostel (Only Master Admin)
router.post('/create', hostelController.createHostel);

// Get all hostels
router.get('/list', hostelController.getAllHostels);

// Get fee statistics
router.get('/stats', hostelController.getFeeStatistics);

// Get current hostel information (for Reception Admin)
router.get('/current', hostelController.getCurrentHostel);

// Get a specific hostel by ID
router.get('/:hostelId', hostelController.getHostelById);

// Update a hostel (Only Master Admin)
router.put('/:hostelId', hostelController.updateHostel);

// Delete a hostel (Only Master Admin)
router.delete('/:hostelId', hostelController.deleteHostel);

// Reset a hostel's password (Only Master Admin)
router.put('/reset-password/:hostelId', hostelController.resetHostelPassword);

// View a hostel's password (requires master admin verification)
router.post('/view-password/:hostelId', hostelController.viewHostelPassword);

module.exports = router;
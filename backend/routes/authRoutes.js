// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// (For development only – you may disable registration in production)
router.post('/register', authController.registerMasterAdmin);

// Master admin login route
router.post('/login', authController.loginMasterAdmin);

module.exports = router;

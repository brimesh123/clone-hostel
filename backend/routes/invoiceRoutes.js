// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Create a new invoice
router.post('/create', invoiceController.createInvoice);

// Get invoices for a student
router.get('/student/:studentId', invoiceController.getInvoicesByStudent);

// Get invoices for a hostel
router.get('/hostel/:hostelId', invoiceController.getInvoicesByHostel);

// Get payment summary for a hostel (dashboard)
router.get('/summary/:hostelId', invoiceController.getPaymentSummary);

// Get monthly revenue for a hostel (dashboard charts)
router.get('/monthly/:hostelId', invoiceController.getMonthlyRevenue);

// Get overall payment summary (Master admin only)
router.get('/overall-summary', invoiceController.getOverallPaymentSummary);

// Get, update, delete a specific invoice
router.get('/:invoiceId', invoiceController.getInvoiceById);
router.put('/:invoiceId', invoiceController.updateInvoice);
router.delete('/:invoiceId', invoiceController.deleteInvoice);

// Get recent invoices for a hostel
router.get('/recent/:hostelId', invoiceController.getRecentInvoicesByHostel);

// Get invoices by academic stats
router.get('/academic-stats/:academicStats', invoiceController.getInvoicesByAcademicStats);

// Get invoice summary by academic stats
router.get('/summary/academic-stats/:academicStats', invoiceController.getSummaryByAcademicStats);

// Get available academic stats
router.get('/academic-stats/available', invoiceController.getAvailableAcademicStats);

// Get all academic terms summary for a hostel
router.get('/academic-stats/hostel/:hostelId', invoiceController.getHostelAcademicStatsSummary);

// The existing route for specific academic stats summary
router.get('/summary/academic-stats/:academicStats', invoiceController.getSummaryByAcademicStats);

module.exports = router;
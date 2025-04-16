// controllers/invoiceController.js
const InvoiceModel = require('../models/invoiceModel');
const StudentModel = require('../models/studentModel');

const invoiceController = {
  // Create a new invoice
  // Update the createInvoice function in invoiceController.js to include academic_stats calculation
  createInvoice: async (req, res) => {
    try {
      const {
        student_id,
        invoice_date,
        amount,
        payment_period,
        payment_method,
        payment_details,
        notes,
      } = req.body;
  
      /* ---------- 1. Basic validation ---------- */
      if (
        !student_id ||
        !invoice_date ||
        !amount ||
        !payment_period ||
        !payment_method ||
        !payment_details
      ) {
        return res.status(400).json({ error: "Required fields are missing" });
      }
  
      if (!["6", "12", 6, 12].includes(payment_period)) {
        return res
          .status(400)
          .json({ error: "Payment period must be either 6 or 12 months" });
      }
  
      if (!["cheque", "online"].includes(payment_method)) {
        return res
          .status(400)
          .json({ error: "Payment method must be either cheque or online" });
      }
  
      /* ---------- 2. Fetch student & access check ---------- */
      const student = await StudentModel.getStudentById(student_id);
  
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
  
      if (
        req.user.role === "receptionist" &&
        req.user.id.toString() !== student.hostel_id.toString()
      ) {
        return res.status(403).json({
          error: "Unauthorized: Cannot create invoice for student from another hostel",
        });
      }
  
      /* ---------- 3. Validate payment details ---------- */
      if (payment_method === "cheque") {
        const { cheque_number, cheque_date, bank_name } = payment_details;
        if (!cheque_number || !cheque_date || !bank_name) {
          return res
            .status(400)
            .json({ error: "Cheque details are incomplete" });
        }
      } else {
        const { transaction_id, transaction_date } = payment_details;
        if (!transaction_id || !transaction_date) {
          return res
            .status(400)
            .json({ error: "Transaction details are incomplete" });
        }
      }
  
      /* =========================================================
         4.  Choose the **old** due date as the base date
             for academic_stats  (this is the only change!)
         ========================================================= */
      const oldDueDate = student.due_date
        ? new Date(student.due_date)
        : new Date(invoice_date);
  
      // We add one day because the next “period” starts the day *after* the current due date
      const periodStart = new Date(oldDueDate);
      periodStart.setDate(periodStart.getDate() + 1);
  
      const m = periodStart.getMonth() + 1; // 1‑12
      const y = periodStart.getFullYear();
  
      // Academic year runs June‑May
      const academicYearStart = m >= 6 ? y : y - 1;
      const academicYearEnd = academicYearStart + 1;
  
      // 1 = Jun‑Nov, 2 = Dec‑May
      const academicHalf = m >= 6 && m <= 11 ? 1 : 2;
  
      const academicStats = `${academicYearStart
        .toString()
        .slice(-2)}${academicYearEnd.toString().slice(-2)}${academicHalf}`;
  
      /* ---------- 5.  Compute the NEW due date ---------- */
      const today = new Date();
      const effectiveStart = oldDueDate > today ? oldDueDate : today;
  
      const newDueDate = new Date(effectiveStart);
      newDueDate.setMonth(
        newDueDate.getMonth() + parseInt(payment_period, 10)
      );
  
      const formattedDueDate = newDueDate.toISOString().split("T")[0];
  
      /* ---------- 6.  Persist invoice + student update ---------- */
      const invoiceId = await InvoiceModel.createInvoice({
        student_id,
        invoice_date,
        amount: parseFloat(amount),
        payment_period: parseInt(payment_period, 10),
        payment_method,
        payment_details,
        notes,
        academic_stats: academicStats,
      });
  
      await StudentModel.updateStudent(student_id, { due_date: formattedDueDate });
  
      /* ---------- 7.  Response ---------- */
      res.status(201).json({
        message: "Invoice created successfully",
        invoiceId,
        due_date: formattedDueDate,
        academic_stats: academicStats,
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  
  
  // Get all invoices for a student
  getInvoicesByStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get the student to check hostel access
      const student = await StudentModel.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Check permissions for receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access invoices for student from another hostel' });
      }
      
      const invoices = await InvoiceModel.getInvoicesByStudent(studentId);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get all invoices for a hostel
  getInvoicesByHostel: async (req, res) => {
    try {
      const { hostelId } = req.params;
      
      // Check permissions for receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access invoices from another hostel' });
      }
      
      const invoices = await InvoiceModel.getInvoicesByHostel(hostelId);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching hostel invoices:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get a specific invoice by ID
  getInvoiceById: async (req, res) => {
    try {
      const { invoiceId } = req.params;
      
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      // Check permissions for receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== invoice.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access invoice from another hostel' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Update an invoice
  updateInvoice: async (req, res) => {
    try {
      const { invoiceId } = req.params;
      
      // First, get the invoice to check permissions
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      // Check permissions for receptionist
      
      
      // Prepare update data
      const updateData = {};
      
      // Fields that can be updated
      const allowedFields = ['notes'];
      
      // Only master admin can update more fields
      
      
      // Check each field in request body
      allowedFields.forEach(field => {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      });
      
      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      
      // Update the invoice
      await InvoiceModel.updateInvoice(invoiceId, updateData);
      
      res.json({ message: 'Invoice updated successfully' });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Delete an invoice
  deleteInvoice: async (req, res) => {
    try {
      const { invoiceId } = req.params;
      
      // First, get the invoice to check permissions
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      
      
      // Delete the invoice
      await InvoiceModel.deleteInvoice(invoiceId);
      
      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get payment summary for a hostel (for dashboard)
  getPaymentSummary: async (req, res) => {
    try {
      const { hostelId } = req.params;
      
      // Check permissions for receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access payment data from another hostel' });
      }
      
      const summary = await InvoiceModel.getPaymentSummaryByHostel(hostelId);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get monthly revenue for a hostel (for dashboard charts)
  getMonthlyRevenue: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { year } = req.query;
      
      // Default to current year if not specified
      const targetYear = year || new Date().getFullYear();
      
      // Check permissions for receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access revenue data from another hostel' });
      }
      
      const monthlyData = await InvoiceModel.getMonthlyRevenueByHostel(hostelId, targetYear);
      
      // Format data for frontend charting
      const formattedData = Array.from({ length: 12 }, (_, index) => {
        // Month names
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Find if we have data for this month
        const monthData = monthlyData.find(item => item.month === index + 1);
        
        return {
          month: monthNames[index],
          monthNumber: index + 1,
          amount: monthData ? parseFloat(monthData.total_amount) : 0,
          count: monthData ? monthData.invoice_count : 0
        };
      });
      
      res.json(formattedData);
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get overall payment summary for master admin
  getOverallPaymentSummary: async (req, res) => {
    try {
      // Only master admin can access this endpoint
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access overall payment summary' });
      }
      
      const summary = await InvoiceModel.getOverallPaymentSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching overall payment summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get recent invoices for a hostel
getRecentInvoicesByHostel: async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { limit = 5 } = req.query;
    
    // Check permissions for receptionist
    if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
      return res.status(403).json({ error: 'Unauthorized: Cannot access invoices from another hostel' });
    }
    
    const invoices = await InvoiceModel.getRecentInvoicesByHostel(hostelId, parseInt(limit));
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

// Get invoices by academic stats
getInvoicesByAcademicStats: async (req, res) => {
  try {
    const { academicStats } = req.params;
    const { hostelId } = req.query;
    
    // If hostelId is provided, filter by hostel
    let invoices;
    if (hostelId) {
      // Check permissions if receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access invoices from another hostel' });
      }
      
      invoices = await InvoiceModel.getInvoicesByAcademicStatsAndHostel(academicStats, hostelId);
    } else {
      // Only master admin can access all hostels
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access all hostel data' });
      }
      
      invoices = await InvoiceModel.getInvoicesByAcademicStats(academicStats);
    }
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices by academic stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

// Get invoice summary by academic stats


getInvoiceSummaryByAcademicYear: async (req, res) => {
  try {
    const { academicYear } = req.params;
    
    const summary = await InvoiceModel.getInvoiceSummaryByAcademicYear(academicYear);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching invoice summary by academic year:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

//----------------------------------------------------------------

// Enhanced version for getting invoice summary by academic stats
getSummaryByAcademicStats: async (req, res) => {
  try {
    const { academicStats } = req.params;
    const { hostelId } = req.query;
    
    // If hostelId is provided, filter by hostel
    let summary;
    if (hostelId) {
      // Check permissions if receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access data from another hostel' });
      }
      
      summary = await InvoiceModel.getSummaryByAcademicStatsAndHostel(academicStats, hostelId);
    } else {
      // Only master admin can access all hostels
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access all hostel data' });
      }
      
      summary = await InvoiceModel.getSummaryByAcademicStats(academicStats);
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary by academic stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

// New method to get all available academic stats
getAvailableAcademicStats: async (req, res) => {
  try {
    const { hostelId } = req.query;
    
    // If hostelId is provided, filter by hostel
    let academicStats;
    if (hostelId) {
      // Check permissions if receptionist
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access data from another hostel' });
      }
      
      academicStats = await InvoiceModel.getAvailableAcademicStats(hostelId);
    } else {
      // Only master admin can access all hostels
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access all hostel data' });
      }
      
      academicStats = await InvoiceModel.getAvailableAcademicStats();
    }
    
    // Format the academic stats for better readability
    const formattedStats = academicStats.map(stat => {
      if (stat && stat.length === 5) {
        const year1 = '20' + stat.substring(0, 2);
        const year2 = '20' + stat.substring(2, 4);
        const halfNum = stat.substring(4, 5);
        const half = halfNum === '1' ? 'First Half (Jun-Nov)' : 'Second Half (Dec-May)';
        
        return {
          code: stat,
          display: `${year1}-${year2} ${half}`,
          year: `${year1}-${year2}`,
          half: halfNum
        };
      }
      return { code: stat, display: stat };
    });
    
    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching available academic stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

// New method to get academic term summary across all terms for a hostel
getHostelAcademicStatsSummary: async (req, res) => {
  try {
    const { hostelId } = req.params;
    
    // Check permissions if receptionist
    if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
      return res.status(403).json({ error: 'Unauthorized: Cannot access data from another hostel' });
    }
    
    // Get all available academic stats for this hostel
    const academicStats = await InvoiceModel.getAvailableAcademicStats(hostelId);
    
    // For each academic stat, get the summary data
    const summaries = await Promise.all(
      academicStats.map(async (stat) => {
        const summary = await InvoiceModel.getSummaryByAcademicStatsAndHostel(stat, hostelId);
        
        // Format the academic term for display
        let termDisplay = stat;
        if (stat && stat.length === 5) {
          const year1 = '20' + stat.substring(0, 2);
          const year2 = '20' + stat.substring(2, 4);
          const halfNum = stat.substring(4, 5);
          const half = halfNum === '1' ? 'First Half (Jun-Nov)' : 'Second Half (Dec-May)';
          termDisplay = `${year1}-${year2} ${half}`;
        }
        
        return {
          academic_stats: stat,
          term_display: termDisplay,
          ...summary
        };
      })
    );
    
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching hostel academic stats summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

};

module.exports = invoiceController;
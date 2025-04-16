// controllers/dueController.js
const InvoiceModel = require('../models/invoiceModel');
const StudentModel = require('../models/studentModel');

const dueController = {
  // Get dues for a specific student
  getStudentDues: async (req, res) => {
    try {
      const { studentId } = req.params;
     
      // Get the student to check hostel access
      const student = await StudentModel.getStudentById(studentId);
     
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
     
      // Check if receptionist has access to this student's data
      if (req.user.role === 'receptionist' && req.user.id.toString() !== student.hostel_id.toString()) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access student from another hostel' });
      }
      
      // Get the most recent invoice
      const [recentInvoice] = await InvoiceModel.getRecentInvoiceForStudent(studentId);
      
      // Get hostel fees
      const hostelInfo = await StudentModel.getHostelFeeInfo(student.hostel_id);
      
      // Determine if the student has dues based on the due_date
      const today = new Date();
      let hasDues = false;
      let daysOverdue = 0;
      let dueAmount = 0;
      let nextDueDate = null;
      
      if (student.due_date) {
        nextDueDate = new Date(student.due_date);
        hasDues = nextDueDate < today;
        
        if (hasDues) {
          daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
          // Set default due amount to 6-month fee
          dueAmount = hostelInfo ? parseFloat(hostelInfo.fee_6_month) : 0;
        }
      } else {
        // If no due_date is set, the student has never paid, so they are due
        hasDues = true;
        nextDueDate = new Date(student.admission_date);
        daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
        dueAmount = hostelInfo ? parseFloat(hostelInfo.fee_6_month) : 0;
      }
      
      const dueInfo = {
        hasDues,
        nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
        dueAmount,
        daysOverdue: Math.max(0, daysOverdue),
        lastPaymentDate: recentInvoice ? recentInvoice.invoice_date : null,
        lastPaymentAmount: recentInvoice ? recentInvoice.amount : null,
        paymentPeriod: recentInvoice ? recentInvoice.payment_period : null
      };
      
      res.json(dueInfo);
    } catch (error) {
      console.error('Error fetching student dues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get all students with dues for a hostel
  getHostelDues: async (req, res) => {
    try {
      const { hostelId } = req.params;
     
      // Check if receptionist has access to this hostel
      if (req.user.role === 'receptionist' && req.user.id.toString() !== hostelId) {
        return res.status(403).json({ error: 'Unauthorized: Cannot access dues from another hostel' });
      }
      
      // Get all active students from the hostel
      const students = await StudentModel.getActiveStudentsWithDueDate(hostelId);
      
      // Get hostel fee information
      const hostelInfo = await StudentModel.getHostelFeeInfo(hostelId);
      const defaultFee = hostelInfo ? parseFloat(hostelInfo.fee_6_month) : 0;
      
      // Current date for calculations
      const today = new Date();
      
      // Prepare result array
      const studentsWithDues = [];
      
      // For each student, check if they have dues
      for (const student of students) {
        // Determine if the student has dues based on the due_date
        let hasDues = false;
        let daysOverdue = 0;
        let nextDueDate = null;
        
        if (student.due_date) {
          nextDueDate = new Date(student.due_date);
          hasDues = nextDueDate < today;
          
          if (hasDues) {
            daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
          }
        } else {
          // If no due_date is set, the student has never paid, so they are due
          hasDues = true;
          nextDueDate = new Date(student.admission_date);
          daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
        }
        
        // Only include students with dues
        if (hasDues) {
          // Get the most recent invoice for this student
          const [recentInvoice] = await InvoiceModel.getRecentInvoiceForStudent(student.id);
          
          studentsWithDues.push({
            ...student,
            nextDueDate: nextDueDate.toISOString(),
            dueAmount: defaultFee,
            daysOverdue: Math.max(0, daysOverdue),
            lastPayment: recentInvoice ? {
              date: recentInvoice.invoice_date,
              amount: recentInvoice.amount,
              period: recentInvoice.payment_period
            } : null
          });
        }
      }
      
      res.json(studentsWithDues);
    } catch (error) {
      console.error('Error fetching hostel dues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get all students with dues (master admin only)
  getAllDues: async (req, res) => {
    try {
      // Only master admin can access this endpoint
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access overall dues' });
      }
      
      // Get all active students with their due_date
      const students = await StudentModel.getAllActiveStudentsWithDueDate();
      
      // Current date for calculations
      const today = new Date();
      
      // Prepare result array
      const studentsWithDues = [];
      
      // Process each student
      for (const student of students) {
        // Get hostel fee information for this student's hostel
        const hostelInfo = await StudentModel.getHostelFeeInfo(student.hostel_id);
        const defaultFee = hostelInfo ? parseFloat(hostelInfo.fee_6_month) : 0;
        
        // Determine if the student has dues based on the due_date
        let hasDues = false;
        let daysOverdue = 0;
        let nextDueDate = null;
        
        if (student.due_date) {
          nextDueDate = new Date(student.due_date);
          hasDues = nextDueDate < today;
          
          if (hasDues) {
            daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
          }
        } else {
          // If no due_date is set, the student has never paid, so they are due
          hasDues = true;
          nextDueDate = new Date(student.admission_date);
          daysOverdue = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24));
        }
        
        // Only include students with dues
        if (hasDues) {
          // Get the most recent invoice for this student
          const [recentInvoice] = await InvoiceModel.getRecentInvoiceForStudent(student.id);
          
          studentsWithDues.push({
            ...student,
            nextDueDate: nextDueDate.toISOString(),
            dueAmount: defaultFee,
            daysOverdue: Math.max(0, daysOverdue),
            lastPayment: recentInvoice ? {
              date: recentInvoice.invoice_date,
              amount: recentInvoice.amount,
              period: recentInvoice.payment_period
            } : null
          });
        }
      }
      
      res.json(studentsWithDues);
    } catch (error) {
      console.error('Error fetching all dues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
 
  // Get summary of dues by hostel (for dashboard)
  getDuesSummary: async (req, res) => {
    try {
      // Only master admin can access this endpoint
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can access dues summary' });
      }
      
      // Get count of all active students per hostel
      const hostels = await StudentModel.getAllHostelsWithStudentCount();
      
      const summary = [];
      const today = new Date();
      
      for (const hostel of hostels) {
        // Get active students for this hostel with their due_date
        const students = await StudentModel.getActiveStudentsWithDueDate(hostel.hostel_id);
        
        // Get hostel fee information
        const hostelInfo = await StudentModel.getHostelFeeInfo(hostel.hostel_id);
        const defaultFee = hostelInfo ? parseFloat(hostelInfo.fee_6_month) : 0;
        
        let studentsWithDues = 0;
        let totalDueAmount = 0;
        
        // Calculate dues based on due_date
        for (const student of students) {
          let hasDues = false;
          
          if (student.due_date) {
            const dueDate = new Date(student.due_date);
            hasDues = dueDate < today;
          } else {
            hasDues = true;
          }
          
          if (hasDues) {
            studentsWithDues++;
            totalDueAmount += defaultFee;
          }
        }
        
        summary.push({
          hostel_id: hostel.hostel_id,
          hostel_name: hostel.name,
          hostel_type: hostel.hostel_type,
          total_students: parseInt(hostel.student_count) || 0,
          students_with_dues: studentsWithDues,
          percentage_with_dues: hostel.student_count > 0
            ? Math.round((studentsWithDues / parseInt(hostel.student_count)) * 100)
            : 0,
          total_due_amount: totalDueAmount
        });
      }
      
      res.json(summary);
    } catch (error) {
      console.error('Error fetching dues summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = dueController;
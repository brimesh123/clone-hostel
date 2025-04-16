// models/invoiceModel.js
const db = require('../config/db');

const InvoiceModel = {
  // Create a new invoice
  // Update the createInvoice method in InvoiceModel to include academic_stats
  createInvoice: async (invoiceData) => {
    const [result] = await db.query(
      `INSERT INTO invoices (
        student_id, invoice_date, amount, payment_period,
        payment_method, payment_details, notes, academic_stats, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        invoiceData.student_id,
        invoiceData.invoice_date,
        invoiceData.amount,
        invoiceData.payment_period,
        invoiceData.payment_method,
        JSON.stringify(invoiceData.payment_details),
        invoiceData.notes || null,
        invoiceData.academic_stats || null
      ]
    );

    return result.insertId;
  },
 
  // Get the most recent invoice for a student
  getRecentInvoiceForStudent: async (studentId) => {
    const [rows] = await db.query(
      `SELECT * FROM invoices 
       WHERE student_id = ? 
       ORDER BY invoice_date DESC 
       LIMIT 1`,
      [studentId]
    );
    
    return rows;
  },
 
  // Get all invoices for a student
  getInvoicesByStudent: async (studentId) => {
    const [rows] = await db.query(
      `SELECT * FROM invoices WHERE student_id = ? ORDER BY invoice_date DESC`,
      [studentId]
    );
   
    return rows;
  },
 
  // Get all invoices for a hostel
  getInvoicesByHostel: async (hostelId) => {
    const [rows] = await db.query(
      `SELECT i.*, s.first_name, s.surname, s.roll_no
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       WHERE s.hostel_id = ?
       ORDER BY i.invoice_date DESC`,
      [hostelId]
    );
   
    return rows;
  },
 
  // Get a specific invoice by ID
  getInvoiceById: async (invoiceId) => {
    const [rows] = await db.query(
      `SELECT i.*, s.first_name, s.surname, s.roll_no, s.hostel_id
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       WHERE i.invoice_id = ?`,
      [invoiceId]
    );
   
    return rows[0];
  },
 
  // Update an invoice
  updateInvoice: async (invoiceId, updateData) => {
    // Build dynamic SQL for updating
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
   
    // Special handling for payment_details which needs to be JSON stringified
    if (updateData.payment_details) {
      const idx = fields.indexOf('payment_details');
      values[idx] = JSON.stringify(values[idx]);
    }
   
    const setClause = fields.map(field => `${field} = ?`).join(', ');
   
    const [result] = await db.query(
      `UPDATE invoices SET ${setClause} WHERE invoice_id = ?`,
      [...values, invoiceId]
    );
   
    return result.affectedRows;
  },
 
  // Delete an invoice
  deleteInvoice: async (invoiceId) => {
    const [result] = await db.query(
      'DELETE FROM invoices WHERE invoice_id = ?',
      [invoiceId]
    );
   
    return result.affectedRows;
  },
 
  // Get payment summary for a hostel (for dashboard)
  getPaymentSummaryByHostel: async (hostelId) => {
    const [rows] = await db.query(
      `SELECT
         SUM(i.amount) as total_amount,
         COUNT(i.invoice_id) as invoice_count,
         SUM(CASE WHEN i.payment_period = 6 THEN 1 ELSE 0 END) as six_month_count,
         SUM(CASE WHEN i.payment_period = 12 THEN 1 ELSE 0 END) as twelve_month_count
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       WHERE s.hostel_id = ?`,
      [hostelId]
    );
   
    return rows[0];
  },
 
  // Get monthly revenue for a hostel (for dashboard charts)
  getMonthlyRevenueByHostel: async (hostelId, year) => {
    const [rows] = await db.query(
      `SELECT
         MONTH(i.invoice_date) as month,
         SUM(i.amount) as total_amount,
         COUNT(i.invoice_id) as invoice_count
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       WHERE s.hostel_id = ? AND YEAR(i.invoice_date) = ?
       GROUP BY MONTH(i.invoice_date)
       ORDER BY MONTH(i.invoice_date)`,
      [hostelId, year]
    );
   
    return rows;
  },
 
  // Get overall summary for master admin
  getOverallPaymentSummary: async () => {
    const [rows] = await db.query(
      `SELECT
         h.hostel_id,
         h.name as hostel_name,
         h.hostel_type,
         COUNT(DISTINCT s.id) as student_count,
         SUM(i.amount) as total_amount,
         COUNT(i.invoice_id) as invoice_count,
         SUM(CASE WHEN i.payment_period = 6 THEN 1 ELSE 0 END) as six_month_count,
         SUM(CASE WHEN i.payment_period = 12 THEN 1 ELSE 0 END) as twelve_month_count
       FROM hostels h
       LEFT JOIN students s ON h.hostel_id = s.hostel_id
       LEFT JOIN invoices i ON s.id = i.student_id
       GROUP BY h.hostel_id
       ORDER BY h.name`
    );
   
    return rows;
  },

  getRecentInvoicesByHostel: async (hostelId, limit = 5) => {
    const [rows] = await db.query(
      `SELECT i.*, s.first_name, s.surname, s.roll_no
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       WHERE s.hostel_id = ?
       ORDER BY i.created_at DESC
       LIMIT ?`,
      [hostelId, limit]
    );
   
    return rows;
  },

  // Get dues for a specific student
  getDuesForStudent: async (studentId) => {
    try {
      // First, check if the student has ever made a payment
      const [invoices] = await db.query(
        `SELECT * FROM invoices 
         WHERE student_id = ? 
         ORDER BY invoice_date DESC`,
        [studentId]
      );
      
      // If no invoices/payments found, the student is automatically due
      if (invoices.length === 0) {
        // Get hostel fees for the student to determine due amount
        const [hostelInfo] = await db.query(
          `SELECT h.fee_6_month, h.fee_12_month
           FROM students s
           JOIN hostels h ON s.hostel_id = h.hostel_id
           WHERE s.id = ?`,
          [studentId]
        );
        
        // Get student's admission date
        const [studentInfo] = await db.query(
          `SELECT admission_date FROM students WHERE id = ?`,
          [studentId]
        );
        
        if (hostelInfo.length > 0 && studentInfo.length > 0) {
          // Calculate due amount (default to 6-month fee)
          const dueAmount = parseFloat(hostelInfo[0].fee_6_month);
          const admissionDate = new Date(studentInfo[0].admission_date);
          
          return {
            hasDues: true,
            nextDueDate: admissionDate, // Due immediately after admission
            dueAmount: dueAmount,
            lastPaymentDate: null,
            lastPaymentAmount: null,
            paymentPeriod: null
          };
        }
      }
      
      // Get current academic year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12 months
      
      // Academic year runs from June to May
      // First half: June-November, Second half: December-May
      const isFirstHalf = currentMonth >= 6 && currentMonth <= 11;
      const currentYear = currentDate.getFullYear();
      let academicYear;
      
      if (isFirstHalf) {
        academicYear = `${currentYear}-${currentYear + 1}`;
      } else {
        academicYear = `${currentYear - 1}-${currentYear}`;
      }
      
      // Determine current half (1 or 2)
      const currentHalf = isFirstHalf ? 1 : 2;
      
      // Calculate start and end dates of current half
      let halfStartDate, halfEndDate;
      
      if (currentHalf === 1) {
        // First half: June 1 to November 30
        halfStartDate = `${currentYear}-06-01`;
        halfEndDate = `${currentYear}-11-30`;
      } else {
        // Second half: December 1 to May 31
        halfStartDate = `${currentYear - 1}-12-01`;
        halfEndDate = `${currentYear}-05-31`;
      }
      
      // Get most recent invoice to determine when the next payment is due
      if (invoices.length > 0) {
        // Student has previous payments
        const invoice = invoices[0];
        const paymentDate = new Date(invoice.invoice_date);
        const paymentPeriod = parseInt(invoice.payment_period);
        
        // Add payment period (in months) to the payment date to get next due date
        const nextDueDate = new Date(paymentDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + paymentPeriod);
        
        // If next due date is in the past, it's due now
        const isDueNow = nextDueDate < currentDate;
        
        // Get hostel fees for the student
        const [hostelInfo] = await db.query(
          `SELECT h.fee_6_month, h.fee_12_month
           FROM students s
           JOIN hostels h ON s.hostel_id = h.hostel_id
           WHERE s.id = ?`,
          [studentId]
        );
        
        let dueAmount = 0;
        if (hostelInfo.length > 0) {
          dueAmount = parseFloat(hostelInfo[0].fee_6_month); // Default to 6-month fee
        }
        
        return {
          hasDues: isDueNow,
          nextDueDate: nextDueDate,
          dueAmount: dueAmount,
          lastPaymentDate: invoice.invoice_date,
          lastPaymentAmount: invoice.amount,
          paymentPeriod: invoice.payment_period,
          daysOverdue: isDueNow ? Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24)) : 0
        };
      }
      
      // Default fallback (should not reach here due to the first check)
      return {
        hasDues: false,
        nextDueDate: null,
        dueAmount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        paymentPeriod: null,
        daysOverdue: 0
      };
    } catch (error) {
      console.error('Error in getDuesForStudent:', error);
      throw error;
    }
  },

  // Get all students with dues for a specific hostel
  getStudentsWithDuesByHostel: async (hostelId) => {
    try {
      // Current date for calculations
      const currentDate = new Date();
      
      // Get all active students from the hostel
      const [students] = await db.query(
        `SELECT s.id, s.first_name, s.surname, s.roll_no, s.admission_date, 
                s.personal_phone, s.parent_phone, s.college
         FROM students s
         WHERE s.hostel_id = ? AND s.status = 'active'
         ORDER BY s.first_name, s.surname`,
        [hostelId]
      );
      
      // For each student, check if they have dues
      const studentsWithDues = [];
      
      for (const student of students) {
        // Get most recent invoice
        const [recentInvoice] = await db.query(
          `SELECT i.*, s.academic_year
           FROM invoices i
           JOIN students s ON i.student_id = s.id
           WHERE i.student_id = ?
           ORDER BY i.invoice_date DESC
           LIMIT 1`,
          [student.id]
        );
        
        // Get hostel fees
        const [hostelInfo] = await db.query(
          `SELECT fee_6_month, fee_12_month FROM hostels WHERE hostel_id = ?`,
          [hostelId]
        );
        
        let hasDues = true;
        let nextDueDate = new Date(student.admission_date);
        nextDueDate.setMonth(nextDueDate.getMonth() + 6); // Default 6 months from admission
        let dueAmount = hostelInfo.length > 0 ? parseFloat(hostelInfo[0].fee_6_month) : 0;
        let daysOverdue = Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24));
        
        if (recentInvoice.length > 0) {
          const invoice = recentInvoice[0];
          const paymentDate = new Date(invoice.invoice_date);
          const paymentPeriod = parseInt(invoice.payment_period);
          
          // Calculate next due date
          nextDueDate = new Date(paymentDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + paymentPeriod);
          
          // Check if payment is due
          hasDues = nextDueDate < currentDate;
          daysOverdue = hasDues ? Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24)) : 0;
        } else {
          // No invoice at all, student has dues since admission
          hasDues = true;
          daysOverdue = Math.max(0, Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24)));
        }
        
        if (hasDues) {
          studentsWithDues.push({
            ...student,
            nextDueDate,
            dueAmount,
            daysOverdue,
            lastPayment: recentInvoice.length > 0 ? {
              date: recentInvoice[0].invoice_date,
              amount: recentInvoice[0].amount,
              period: recentInvoice[0].payment_period
            } : null
          });
        }
      }
      
      return studentsWithDues;
    } catch (error) {
      console.error('Error in getStudentsWithDuesByHostel:', error);
      throw error;
    }
  },

  // Get all students with dues across all hostels (for master admin)
  getAllStudentsWithDues: async () => {
    try {
      // Get all active students
      const [students] = await db.query(
        `SELECT s.id, s.first_name, s.surname, s.roll_no, s.hostel_id, 
                s.admission_date, s.personal_phone, s.college,
                h.name as hostel_name, h.hostel_type
         FROM students s
         JOIN hostels h ON s.hostel_id = h.hostel_id
         WHERE s.status = 'active'
         ORDER BY h.name, s.first_name, s.surname`
      );
      
      // Current date for calculations
      const currentDate = new Date();
      
      // For each student, check if they have dues
      const studentsWithDues = [];
      const hostelFees = {}; // Cache hostel fees to reduce DB queries
      
      for (const student of students) {
        // Get most recent invoice
        const [recentInvoice] = await db.query(
          `SELECT i.*
           FROM invoices i
           WHERE i.student_id = ?
           ORDER BY i.invoice_date DESC
           LIMIT 1`,
          [student.id]
        );
        
        // Get hostel fees (from cache if available)
        if (!hostelFees[student.hostel_id]) {
          const [hostelInfo] = await db.query(
            `SELECT fee_6_month, fee_12_month FROM hostels WHERE hostel_id = ?`,
            [student.hostel_id]
          );
          
          if (hostelInfo.length > 0) {
            hostelFees[student.hostel_id] = {
              fee_6_month: parseFloat(hostelInfo[0].fee_6_month),
              fee_12_month: parseFloat(hostelInfo[0].fee_12_month)
            };
          }
        }
        
        let hasDues = true;
        let nextDueDate = new Date(student.admission_date);
        nextDueDate.setMonth(nextDueDate.getMonth() + 6); // Default 6 months from admission
        let dueAmount = hostelFees[student.hostel_id] ? hostelFees[student.hostel_id].fee_6_month : 0;
        let daysOverdue = Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24));
        
        if (recentInvoice.length > 0) {
          const invoice = recentInvoice[0];
          const paymentDate = new Date(invoice.invoice_date);
          const paymentPeriod = parseInt(invoice.payment_period);
          
          // Calculate next due date
          nextDueDate = new Date(paymentDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + paymentPeriod);
          
          // Check if payment is due
          hasDues = nextDueDate < currentDate;
          daysOverdue = hasDues ? Math.floor((currentDate - nextDueDate) / (1000 * 60 * 60 * 24)) : 0;
        } else {
          // No invoice at all, mark as new student with dues
          hasDues = true;
          daysOverdue = Math.max(0, Math.floor((currentDate - student.admission_date) / (1000 * 60 * 60 * 24)));
        }
        
        if (hasDues) {
          studentsWithDues.push({
            ...student,
            nextDueDate,
            dueAmount,
            daysOverdue,
            isNewStudent: recentInvoice.length === 0,
            lastPayment: recentInvoice.length > 0 ? {
              date: recentInvoice[0].invoice_date,
              amount: recentInvoice[0].amount,
              period: recentInvoice[0].payment_period
            } : null
          });
        }
      }
      
      return studentsWithDues;
    } catch (error) {
      console.error('Error in getAllStudentsWithDues:', error);
      throw error;
    }
  },

  // Get summary of dues by hostel (for dashboard)
  getDuesSummaryByHostel: async () => {
    try {
      // Get count of all active students per hostel
      const [activeStudentCounts] = await db.query(
        `SELECT h.hostel_id, h.name, COUNT(s.id) as total_students
         FROM hostels h
         LEFT JOIN students s ON h.hostel_id = s.hostel_id AND s.status = 'active'
         GROUP BY h.hostel_id`
      );
      
      const summary = [];
      const currentDate = new Date();
      
      for (const hostel of activeStudentCounts) {
        // Get students with dues
        const [students] = await db.query(
          `SELECT s.id
           FROM students s
           WHERE s.hostel_id = ? AND s.status = 'active'`,
          [hostel.hostel_id]
        );
        
        let studentsWithDues = 0;
        let totalDueAmount = 0;
        
        for (const student of students) {
          // Check most recent invoice for student
          const [recentInvoice] = await db.query(
            `SELECT i.*, i.payment_period
             FROM invoices i
             WHERE i.student_id = ?
             ORDER BY i.invoice_date DESC
             LIMIT 1`,
            [student.id]
          );
          
          // Get hostel fees
          const [hostelFees] = await db.query(
            `SELECT fee_6_month FROM hostels WHERE hostel_id = ?`,
            [hostel.hostel_id]
          );
          
          const defaultFee = hostelFees.length > 0 ? parseFloat(hostelFees[0].fee_6_month) : 0;
          
          let hasDues = true;
          
          if (recentInvoice.length > 0) {
            const invoice = recentInvoice[0];
            const paymentDate = new Date(invoice.invoice_date);
            const paymentPeriod = parseInt(invoice.payment_period);
            
            // Calculate next due date
            const nextDueDate = new Date(paymentDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + paymentPeriod);
            
            // Check if payment is due
            hasDues = nextDueDate < currentDate;
            
            if (hasDues) {
              studentsWithDues++;
              totalDueAmount += defaultFee;
            }
          } else {
            // No invoice at all - new student with dues
            studentsWithDues++;
            totalDueAmount += defaultFee;
          }
        }
        
        summary.push({
          hostel_id: hostel.hostel_id,
          hostel_name: hostel.name,
          total_students: parseInt(hostel.total_students) || 0,
          students_with_dues: studentsWithDues,
          percentage_with_dues: hostel.total_students > 0 
            ? Math.round((studentsWithDues / parseInt(hostel.total_students)) * 100) 
            : 0,
          total_due_amount: totalDueAmount
        });
      }
      
      return summary;
    } catch (error) {
      console.error('Error in getDuesSummaryByHostel:', error);
      throw error;
    }
  },

  // Get academic year statistics - students paid for 6 months, 12 months, and total revenue
getAcademicYearStats: async (hostelId, academicYear) => {
  const [rows] = await db.query(
    `SELECT 
      SUM(CASE WHEN i.payment_period = 6 OR i.payment_period = '6' THEN 1 ELSE 0 END) as six_month_count,
      SUM(CASE WHEN i.payment_period = 12 OR i.payment_period = '12' THEN 1 ELSE 0 END) as twelve_month_count,
      SUM(i.amount) as total_revenue,
      COUNT(DISTINCT i.student_id) as total_paid_students
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     WHERE s.hostel_id = ? AND s.academic_year = ? AND s.status = 'active'`,
    [hostelId, academicYear]
  );
  
  // Format the result with defaults for nulls
  return {
    six_month_count: rows[0].six_month_count || 0,
    twelve_month_count: rows[0].twelve_month_count || 0,
    total_revenue: rows[0].total_revenue || 0,
    total_paid_students: rows[0].total_paid_students || 0
  };
  },

  
  // Get invoices by academic stats
getInvoicesByAcademicStats: async (academicStats) => {
  const [rows] = await db.query(
    `SELECT i.*, s.first_name, s.surname, s.roll_no, h.name as hostel_name, h.hostel_type
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     JOIN hostels h ON s.hostel_id = h.hostel_id
     WHERE i.academic_stats = ?
     ORDER BY i.invoice_date DESC`,
    [academicStats]
  );
  
  return rows;
},

// Get invoices by academic stats and hostel
getInvoicesByAcademicStatsAndHostel: async (academicStats, hostelId) => {
  const [rows] = await db.query(
    `SELECT i.*, s.first_name, s.surname, s.roll_no, h.name as hostel_name, h.hostel_type
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     JOIN hostels h ON s.hostel_id = h.hostel_id
     WHERE i.academic_stats = ? AND s.hostel_id = ?
     ORDER BY i.invoice_date DESC`,
    [academicStats, hostelId]
  );
  
  return rows;
},



  // Enhanced version to get summary by academic stats
getSummaryByAcademicStats: async (academicStats) => {
  const [rows] = await db.query(
    `SELECT 
       COUNT(i.invoice_id) as invoice_count,
       SUM(i.amount) as total_amount,
       SUM(CASE WHEN i.payment_period = 6 THEN 1 ELSE 0 END) as six_month_count,
       SUM(CASE WHEN i.payment_period = 12 THEN 1 ELSE 0 END) as twelve_month_count,
       COUNT(DISTINCT i.student_id) as student_count
     FROM invoices i
     WHERE i.academic_stats = ?`,
    [academicStats]
  );
  
  // Return default values if no data found to prevent nulls
  return rows[0] || {
    invoice_count: 0,
    total_amount: 0,
    six_month_count: 0,
    twelve_month_count: 0,
    student_count: 0
  };
},

// Enhanced version for hostel-specific summaries
getSummaryByAcademicStatsAndHostel: async (academicStats, hostelId) => {
  const [rows] = await db.query(
    `SELECT 
       COUNT(i.invoice_id) as invoice_count,
       SUM(i.amount) as total_amount,
       SUM(CASE WHEN i.payment_period = 6 THEN 1 ELSE 0 END) as six_month_count,
       SUM(CASE WHEN i.payment_period = 12 THEN 1 ELSE 0 END) as twelve_month_count,
       COUNT(DISTINCT i.student_id) as student_count
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     WHERE i.academic_stats = ? AND s.hostel_id = ?`,
    [academicStats, hostelId]
  );
  
  // Return default values if no data found to prevent nulls
  return rows[0] || {
    invoice_count: 0,
    total_amount: 0,
    six_month_count: 0,
    twelve_month_count: 0,
    student_count: 0
  };
},

// New function to get all available academic stats for a hostel
getAvailableAcademicStats: async (hostelId = null) => {
  let query = `
    SELECT DISTINCT i.academic_stats
    FROM invoices i
  `;
  
  let params = [];
  
  if (hostelId) {
    query += `
      JOIN students s ON i.student_id = s.id
      WHERE s.hostel_id = ?
    `;
    params.push(hostelId);
  }
  
  query += ` ORDER BY i.academic_stats DESC`;
  
  const [rows] = await db.query(query, params);
  
  // Return an array of academic_stats values
  return rows.map(row => row.academic_stats);
},

  // Get invoice summary by academic year
  getInvoiceSummaryByAcademicYear: async (academicYear) => {
  // For academic year like "2425" (representing 2024-2025)
  // We'll need to match academic_stats that start with this value
  const searchPattern = `${academicYear}%`;
  
  const [rows] = await db.query(
    `SELECT 
       academic_stats,
       COUNT(invoice_id) as invoice_count,
       SUM(amount) as total_amount,
       SUM(CASE WHEN payment_period = 6 THEN 1 ELSE 0 END) as six_month_count,
       SUM(CASE WHEN payment_period = 12 THEN 1 ELSE 0 END) as twelve_month_count
     FROM invoices
     WHERE academic_stats LIKE ?
     GROUP BY academic_stats
     ORDER BY academic_stats`,
    [searchPattern]
  );
  
  return rows;
  }
};

module.exports = InvoiceModel;
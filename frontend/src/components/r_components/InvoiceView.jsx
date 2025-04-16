// src/components/r_components/InvoiceView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import config from '../../config';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../contexts/authContext';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Import icons
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Mail, 
  User,
  FileText,
  MoreHorizontal,
  Calendar,
  EditIcon,
  TrashIcon,
  CheckCircleIcon
} from "lucide-react";

const InvoiceView = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // User info, if needed for display
  
  // Ref for printable content
  const printableRef = useRef(null);

  // Component state
  const [invoice, setInvoice] = useState(null);
  const [student, setStudent] = useState(null);
  const [hostelInfo, setHostelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  // State for edit dialog – now for all editable fields
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentPeriod, setEditPaymentPeriod] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentDetails, setEditPaymentDetails] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch invoice, student, and hostel data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch invoice details
        const invoiceResponse = await fetch(`${config.backendUrl}/api/invoices/${invoiceId}`, {
          credentials: 'include',
        });
        if (!invoiceResponse.ok) throw new Error('Failed to fetch invoice information');
        const invoiceData = await invoiceResponse.json();
        setInvoice(invoiceData);

        // Initialize all editable fields
        setEditNotes(invoiceData.notes || '');
        setEditAmount(invoiceData.amount || '');
        setEditPaymentPeriod(invoiceData.payment_period || '');
        setEditPaymentMethod(invoiceData.payment_method || '');
        if (invoiceData.payment_details) {
          try {
            const pd = typeof invoiceData.payment_details === 'string'
              ? JSON.parse(invoiceData.payment_details)
              : invoiceData.payment_details;
            setEditPaymentDetails(JSON.stringify(pd, null, 2));
          } catch (err) {
            setEditPaymentDetails('');
          }
        } else {
          setEditPaymentDetails('');
        }

        // Fetch student details
        const studentResponse = await fetch(`${config.backendUrl}/api/students/${invoiceData.student_id}`, {
          credentials: 'include',
        });
        if (!studentResponse.ok) throw new Error('Failed to fetch student information');
        const studentData = await studentResponse.json();
        setStudent(studentData);

        // Fetch current hostel info
        const hostelResponse = await fetch(`${config.backendUrl}/api/hostels/current`, {
          credentials: 'include',
        });
        if (!hostelResponse.ok) throw new Error('Failed to fetch hostel information');
        const hostelData = await hostelResponse.json();
        setHostelInfo(hostelData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load invoice data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  // Format functions (date, currency, academic year, etc.)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAcademicYear = (academicStats) => {
    if (!academicStats || academicStats.length < 4) return 'N/A';
    const yearCode = academicStats.substring(0, 4);
    const startYear = "20" + yearCode.substring(0, 2);
    const endYear = "20" + yearCode.substring(2, 4);
    return `${startYear}-${endYear}`;
  };

  const getAcademicPeriod = (academicStats, paymentPeriod) => {
    if (paymentPeriod === 12) {
      return 'Full Year';
    }
    if (!academicStats || academicStats.length < 5) return '';
    const halfCode = academicStats.charAt(4);
    return halfCode === '1' ? 'First Half' : 'Second Half';
  };

  const getPaymentDetails = () => {
    if (!invoice) return null;
    let paymentDetails;
    try {
      paymentDetails = typeof invoice.payment_details === 'string'
        ? JSON.parse(invoice.payment_details)
        : invoice.payment_details;
    } catch (error) {
      console.error("Error parsing payment details:", error);
      paymentDetails = {};
    }
    if (invoice.payment_method === 'cheque') {
      return (
        <div className="space-y-2">
          <p><span className="font-medium">Payment Method:</span> Cheque</p>
          <p><span className="font-medium">Cheque Number:</span> {paymentDetails.cheque_number || 'N/A'}</p>
          <p><span className="font-medium">Cheque Date:</span> {formatDate(paymentDetails.cheque_date) || 'N/A'}</p>
          <p><span className="font-medium">Bank Name:</span> {paymentDetails.bank_name || 'N/A'}</p>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <p><span className="font-medium">Payment Method:</span> Online Transfer</p>
          <p><span className="font-medium">Transaction ID:</span> {paymentDetails.transaction_id || 'N/A'}</p>
          <p><span className="font-medium">Transaction Date:</span> {formatDate(paymentDetails.transaction_date) || 'N/A'}</p>
        </div>
      );
    }
  };

  // Handle PDF download (unchanged)
  const handleDownloadPDF = () => {
    if (!invoice || !student || !hostelInfo) return;
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(22);
      doc.setTextColor(33, 37, 41);
      doc.text(hostelInfo.name || "Hostel Management", 105, 20, { align: 'center' });
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(20, 28, 190, 28);
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text("Invoice", 20, 40);
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`#${invoice.invoice_id}`, 20, 48);
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text(hostelInfo.address || "123 Hostel Street, City - 123456", 190, 40, { align: 'right' });
      doc.setTextColor(107, 114, 128);
      doc.text(hostelInfo.email || "contact@hostel.com | +91 1234567890", 190, 48, { align: 'right' });
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 55, 190, 55);
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      doc.text("Bill To:", 20, 65);
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text(`${student.first_name} ${student.surname}`, 20, 73);
      doc.setTextColor(107, 114, 128);
      doc.text(`Roll No: ${student.roll_no}`, 20, 80);
      doc.text(`${student.address}, ${student.city}`, 20, 87);
      doc.text(`Phone: ${student.personal_phone}`, 20, 94);
      if (student.parent_phone) {
        doc.text(`Parent Phone: ${student.parent_phone}`, 20, 101);
      }
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      let yPos = 65;
      doc.text("Invoice Date:", 130, yPos);
      doc.text(formatDate(invoice.invoice_date), 190, yPos, { align: 'right' });
      yPos += 8;
      doc.text("Payment Period:", 130, yPos);
      doc.text(`${invoice.payment_period} Months`, 190, yPos, { align: 'right' });
      yPos += 8;
      if (invoice.academic_stats) {
        doc.text("Academic Year:", 130, yPos);
        doc.text(formatAcademicYear(invoice.academic_stats), 190, yPos, { align: 'right' });
        yPos += 8;
        doc.text("Academic Period:", 130, yPos);
        doc.text(getAcademicPeriod(invoice.academic_stats, invoice.payment_period), 190, yPos, { align: 'right' });
        yPos += 8;
      }
      doc.text("Payment Status:", 130, yPos);
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(165, yPos - 5, 25, 7, 2, 2, 'F');
      doc.setTextColor(22, 163, 74);
      doc.text("PAID", 177, yPos, { align: 'center' });
      doc.setTextColor(33, 37, 41);
      const tableY = 110;
      doc.setFillColor(249, 250, 251);
      doc.rect(20, tableY, 170, 10, 'F');
      doc.setTextColor(33, 37, 41);
      doc.setFontSize(11);
      doc.text("Description", 25, tableY + 7);
      doc.text("Academic Session", 90, tableY + 7);
      doc.text("Amount", 180, tableY + 7, { align: 'right' });
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, tableY, 170, 10);
      let contentY = tableY + 10;
      doc.rect(20, contentY, 170, 15);
      doc.text(`Hostel Fee (${invoice.payment_period} Months)`, 25, contentY + 7);
      if (invoice.academic_stats) {
        doc.text(formatAcademicYear(invoice.academic_stats), 90, contentY + 5);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(getAcademicPeriod(invoice.academic_stats, invoice.payment_period), 90, contentY + 11);
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
      } else {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Period: ${formatDate(invoice.invoice_date)} -`, 90, contentY + 5);
        doc.text(`${formatDate(new Date(new Date(invoice.invoice_date).setMonth(
          new Date(invoice.invoice_date).getMonth() + parseInt(invoice.payment_period)
        )))}`, 90, contentY + 11);
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
      }
      doc.setTextColor(22, 163, 74);
      doc.text(`Rs. ${parseFloat(invoice.amount).toFixed(2)}`, 180, contentY + 7, { align: 'right' });
      doc.setTextColor(33, 37, 41);
      let totalY = contentY + 15;
      doc.setFillColor(249, 250, 251);
      doc.rect(20, totalY, 170, 10, 'F');
      doc.rect(20, totalY, 170, 10);
      doc.setFont("helvetica", "bold");
      doc.text("Total", 25, totalY + 7);
      doc.setTextColor(22, 163, 74);
      doc.text(`Rs. ${parseFloat(invoice.amount).toFixed(2)}`, 180, totalY + 7, { align: 'right' });
      doc.setTextColor(33, 37, 41);
      doc.setFont("helvetica", "normal");
      let detailsY = totalY + 25;
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details:", 25, detailsY);
      doc.setFont("helvetica", "normal");
      detailsY += 10;
      let paymentDetails;
      try {
        paymentDetails = typeof invoice.payment_details === 'string'
          ? JSON.parse(invoice.payment_details)
          : invoice.payment_details;
      } catch (error) {
        console.error("Error parsing payment details:", error);
        paymentDetails = {};
      }
      if (invoice.payment_method === 'cheque') {
        doc.text("Payment Method: Cheque", 25, detailsY);
        detailsY += 7;
        doc.text(`Cheque Number: ${paymentDetails.cheque_number || 'N/A'}`, 25, detailsY);
        detailsY += 7;
        doc.text(`Cheque Date: ${formatDate(paymentDetails.cheque_date) || 'N/A'}`, 25, detailsY);
        detailsY += 7;
        doc.text(`Bank Name: ${paymentDetails.bank_name || 'N/A'}`, 25, detailsY);
      } else {
        doc.text("Payment Method: Online Transfer", 25, detailsY);
        detailsY += 7;
        doc.text(`Transaction ID: ${paymentDetails.transaction_id || 'N/A'}`, 25, detailsY);
        detailsY += 7;
        doc.text(`Transaction Date: ${formatDate(paymentDetails.transaction_date) || 'N/A'}`, 25, detailsY);
      }
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 120, totalY + 25);
      doc.setFont("helvetica", "normal");
      if (invoice.notes) {
        doc.text(invoice.notes, 120, totalY + 35, { maxWidth: 70 });
      } else {
        doc.text("No additional notes.", 120, totalY + 35);
      }
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 240, 190, 240);
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.text("Thank you for your payment!", 105, 250, { align: 'center' });
      doc.text("For any queries, please contact the hostel administration.", 105, 257, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 270, { align: 'center' });
      doc.save(`Invoice_${invoiceId}_${student.first_name}_${student.surname}.pdf`);
      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  // Handle email invoice (unchanged)
  const handleEmailInvoice = () => {
    alert("This functionality would email the invoice to the student or parent.");
  };

  // Handle invoice update – now sending all editable fields
  const handleUpdateInvoice = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const payload = {
        notes: editNotes,
        amount: editAmount,
        payment_period: editPaymentPeriod,
        payment_method: editPaymentMethod,
        payment_details: editPaymentDetails
      };

      const response = await fetch(`${config.backendUrl}/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      // Update local invoice data with new values
      setInvoice({
        ...invoice,
        ...payload,
      });

      setShowUpdateSuccess(true);
      setTimeout(() => setShowUpdateSuccess(false), 3000);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err.message || 'Failed to update invoice. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle invoice deletion (unchanged)
  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${config.backendUrl}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invoice');
      }

      setShowDeleteSuccess(true);
      setTimeout(() => {
        navigate('/invoices');
      }, 1500);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err.message || 'Failed to delete invoice. Please try again.');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice</h1>
            <p className="text-slate-500 mt-1">View and download invoice details</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => student && navigate(`/student/${student.id}`)}>
            <User className="mr-2 h-4 w-4" />
            View Student Profile
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <MoreHorizontal className="mr-2 h-4 w-4" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {showDownloadSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">
            Invoice PDF has been downloaded successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {showUpdateSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">
            <CheckCircleIcon className="inline mr-2 h-4 w-4" />
            Invoice updated successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {showDeleteSuccess && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-700">
            Invoice deleted successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div 
          ref={printableRef} 
          className="bg-white rounded-lg shadow-lg border max-w-4xl mx-auto p-8 print:p-0 print:border-0 print:shadow-none"
        >
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Invoice</h2>
              <p className="text-slate-500">#{invoice?.invoice_id}</p>
            </div>
            
            <div className="text-right">
              <h3 className="font-medium text-slate-800">{hostelInfo?.name || "Hostel Management"}</h3>
              <p className="text-sm text-slate-500">
                {hostelInfo?.address || "123 Hostel Street, City - 123456"}
              </p>
              <p className="text-sm text-slate-500">
                {hostelInfo?.email || "contact@hostel.com"} | {hostelInfo?.phone || "+91 1234567890"}
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Bill To:</h3>
              <p className="font-medium">{student?.first_name} {student?.surname}</p>
              <p className="text-sm text-slate-600">Roll No: {student?.roll_no}</p>
              <p className="text-sm text-slate-600">{student?.address}, {student?.city}</p>
              <p className="text-sm text-slate-600">Phone: {student?.personal_phone}</p>
              {student?.parent_phone && <p className="text-sm text-slate-600">Parent Phone: {student?.parent_phone}</p>}
            </div>
            
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Invoice Date:</span>
                <span>{formatDate(invoice?.invoice_date)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Payment Period:</span>
                <span>{invoice?.payment_period} Months</span>
              </div>
              
              {invoice?.academic_stats && (
                <div className="flex justify-between">
                  <span className="font-medium">Academic Year:</span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                    {formatAcademicYear(invoice.academic_stats)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="font-medium">Payment Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
                  Paid
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Invoice Items */}
          <div className="border rounded-md overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Academic Session</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-3 px-4">
                    Hostel Fee ({invoice?.payment_period} Months)
                  </td>
                  <td className="py-3 px-4">
                    {invoice?.academic_stats ? (
                      <div>
                        <div className="font-medium">{formatAcademicYear(invoice.academic_stats)}</div>
                        <div className="text-xs text-slate-500">{getAcademicPeriod(invoice.academic_stats, invoice?.payment_period)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Period: {formatDate(invoice?.invoice_date)} -
                        {formatDate(invoice?.invoice_date ? new Date(new Date(invoice.invoice_date).setMonth(
                          new Date(invoice.invoice_date).getMonth() + parseInt(invoice.payment_period)
                        )) : null)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">{invoice?.amount ? formatCurrency(invoice.amount) : '-'}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium" colSpan="2">Total</th>
                  <th className="text-right py-3 px-4 font-medium">{invoice?.amount ? formatCurrency(invoice.amount) : '-'}</th>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Payment Details:</h3>
              {getPaymentDetails()}
            </div>
            
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Notes:</h3>
              <p className="text-sm text-slate-600">
                {invoice?.notes || "No additional notes."}
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>Thank you for your payment!</p>
            <p className="mt-1">For any queries, please contact the hostel administration.</p>
          </div>
          
          {/* Print-only information */}
          <div className="hidden print:block text-center text-xs text-slate-400 mt-8">
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
      
      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update details for Invoice #{invoiceId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <input
                id="amount"
                type="number"
                className="w-full border rounded p-2"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentPeriod">Payment Period (months)</Label>
              <input
                id="paymentPeriod"
                type="number"
                className="w-full border rounded p-2"
                value={editPaymentPeriod}
                onChange={(e) => setEditPaymentPeriod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                className="w-full border rounded p-2"
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
              >
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDetails">Payment Details (JSON format)</Label>
              <Textarea
                id="paymentDetails"
                placeholder='e.g. {"transaction_id": "ABC123", "transaction_date": "2025-04-16"}'
                value={editPaymentDetails}
                onChange={(e) => setEditPaymentDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInvoice} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog (unchanged) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-slate-500">
              Invoice #{invoiceId} for {student?.first_name} {student?.surname}
            </p>
            <p className="text-sm font-medium mt-2">
              Amount: {invoice?.amount ? formatCurrency(invoice.amount) : '-'}
            </p>
            <p className="text-sm text-slate-500">
              Date: {formatDate(invoice?.invoice_date)}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceView;

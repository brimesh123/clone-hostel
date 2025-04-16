// src/components/r_components/InvoiceManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { jsPDF } from "jspdf";
// IMPORTANT: Import autoTable directly from the package, not as jsPDF method
import autoTable from 'jspdf-autotable';

// Import icons
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Printer,
  FileText,
  Download,
  User,
  PlusCircle
} from "lucide-react";

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, cheque, online
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const itemsPerPage = 10;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch invoices for the receptionist's hostel
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Get the current hostel info
      const hostelResponse = await fetch(`${config.backendUrl}/api/hostels/current`, {
        credentials: 'include',
      });
      
      if (!hostelResponse.ok) throw new Error('Failed to fetch hostel information');
      const hostelData = await hostelResponse.json();
      
      // Fetch invoices for this hostel
      const invoicesResponse = await fetch(`${config.backendUrl}/api/invoices/hostel/${hostelData.hostel_id}`, {
        credentials: 'include',
      });
      
      if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
      const invoicesData = await invoicesResponse.json();
      
      setInvoices(invoicesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices based on search term and filter type
  useEffect(() => {
    let result = [...invoices];
    
    // Apply payment method filter
    if (filter !== 'all') {
      result = result.filter(invoice => invoice.payment_method === filter);
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(invoice => {
        return (
          (invoice.first_name && invoice.first_name.toLowerCase().includes(lowercasedTerm)) ||
          (invoice.surname && invoice.surname.toLowerCase().includes(lowercasedTerm)) ||
          (invoice.roll_no && invoice.roll_no.toString().includes(lowercasedTerm)) ||
          (invoice.invoice_id && invoice.invoice_id.toString().includes(lowercasedTerm))
        );
      });
    }
    
    setFilteredInvoices(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [invoices, searchTerm, filter]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  };

  // Handle invoice view
  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoice/${invoiceId}`);
  };

  // Handle invoice printing
  const handlePrintInvoice = (invoiceId) => {
    // First navigate to invoice view, then trigger print
    navigate(`/invoice/${invoiceId}?print=true`);
  };

  // Handle invoice download - Fixed to use autoTable correctly
  const handleDownloadInvoice = async (invoice) => {
    try {
      // Fetch student details to get accurate information
      const studentResponse = await fetch(`${config.backendUrl}/api/students/${invoice.student_id}`, {
        credentials: 'include',
      });
      
      if (!studentResponse.ok) throw new Error('Failed to fetch student information');
      const studentData = await studentResponse.json();
      
      // Get current hostel info (instead of fetching by ID)
      const hostelResponse = await fetch(`${config.backendUrl}/api/hostels/current`, {
        credentials: 'include',
      });
      
      if (!hostelResponse.ok) throw new Error('Failed to fetch hostel information');
      const hostelData = await hostelResponse.json();
      
      // Generate PDF
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text(hostelData.name || "Hostel Management", 105, 20, { align: 'center' });
      
      // Add invoice title and number
      doc.setFontSize(16);
      doc.text(`INVOICE #${invoice.invoice_id}`, 105, 30, { align: 'center' });
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${formatDate(invoice.invoice_date)}`, 20, 40);
      
      // Add student info
      doc.text("Bill To:", 20, 45);
      doc.text(`Name: ${studentData.first_name} ${studentData.surname}`, 20, 50);
      doc.text(`Roll No: ${studentData.roll_no}`, 20, 55);
      doc.text(`Address: ${studentData.address}, ${studentData.city}`, 20, 60);
      
      // Add payment info
      doc.text(`Payment Method: ${invoice.payment_method === 'cheque' ? 'Cheque' : 'Online Transfer'}`, 130, 30);
      doc.text(`Payment Period: ${invoice.payment_period} Months`, 130, 35);
      
      // Parse payment details (handle both string and object formats)
      const paymentDetails = typeof invoice.payment_details === 'string' 
        ? JSON.parse(invoice.payment_details) 
        : invoice.payment_details;
        
      if (invoice.payment_method === 'cheque' && paymentDetails) {
        doc.text(`Cheque Number: ${paymentDetails.cheque_number || 'N/A'}`, 130, 40);
        doc.text(`Bank: ${paymentDetails.bank_name || 'N/A'}`, 130, 45);
      } else if (paymentDetails) {
        doc.text(`Transaction ID: ${paymentDetails.transaction_id || 'N/A'}`, 130, 40);
        doc.text(`Date: ${paymentDetails.transaction_date || 'N/A'}`, 130, 45);
      }
      
      // *** IMPORTANT: Using autoTable correctly as a function from the import, not as doc method ***
      const tableEndY = autoTable(doc, {
        startY: 70,
        head: [['Description', 'Period', 'Amount']],
        body: [
          [
            `Hostel Fee (${invoice.payment_period} Months)`, 
            `${formatDate(invoice.invoice_date)} - ${formatDate(new Date(new Date(invoice.invoice_date).setMonth(new Date(invoice.invoice_date).getMonth() + parseInt(invoice.payment_period))))}`, 
            `₹${parseFloat(invoice.amount).toFixed(2)}`
          ],
          ['', 'Total', `₹${parseFloat(invoice.amount).toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        footStyles: { fillColor: [240, 249, 255], textColor: 0, fontStyle: 'bold' },
      });
      
      // Add footer
      doc.text("Thank you for your payment!", 105, tableEndY.finalY + 20, { align: 'center' });
      
      // Save PDF
      doc.save(`Invoice_${invoice.invoice_id}_${studentData.first_name}_${studentData.surname}.pdf`);
      
      // Show success message
      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  // Handle create new invoice button
  const handleCreateNewInvoice = () => {
    navigate('/students');
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-slate-500 mt-1">View, filter, and manage hostel fee invoices</p>
        </div>
        <Button onClick={handleCreateNewInvoice}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </header>

      {showDownloadSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">
            Invoice PDF has been downloaded successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Invoices</CardTitle>
          <CardDescription>List of all fee payment invoices for your hostel</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search invoices by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Payment Type</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cheque">Cheque Payments</SelectItem>
                  <SelectItem value="online">Online Payments</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={fetchInvoices}>
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill().map((_, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-lg font-medium">No invoices found</h3>
                  <p className="mt-1 text-slate-500">
                    {searchTerm || filter !== 'all'
                      ? 'Try adjusting your search or filter'
                      : 'Start by creating an invoice for a student'}
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/students')}
                  >
                    Create New Invoice
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCurrentPageItems().map((invoice) => (
                          <TableRow key={invoice.invoice_id}>
                            <TableCell>
                              <span className="font-medium">INV-{invoice.invoice_id}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{invoice.first_name} {invoice.surname}</div>
                                  <div className="text-xs text-slate-500">Roll No: {invoice.roll_no}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                            <TableCell>{invoice.payment_period} months</TableCell>
                            <TableCell>
                              <Badge variant={invoice.payment_method === 'cheque' ? 'outline' : 'secondary'}>
                                {invoice.payment_method === 'cheque' ? 'Cheque' : 'Online'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-green-600">
                                {formatCurrency(invoice.amount)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewInvoice(invoice.invoice_id)}
                                >
                                  View
                                </Button>

                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, index) => (
                          <PaginationItem key={index}>
                            <PaginationLink
                              onClick={() => setCurrentPage(index + 1)}
                              isActive={currentPage === index + 1}
                            >
                              {index + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice statistics summary */}
      {!isLoading && filteredInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0)
                  )}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Payment Methods</p>
                <div className="flex gap-3">
                  <Badge variant="outline">
                    Cheque: {filteredInvoices.filter(i => i.payment_method === 'cheque').length}
                  </Badge>
                  <Badge variant="secondary">
                    Online: {filteredInvoices.filter(i => i.payment_method === 'online').length}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceManagement;
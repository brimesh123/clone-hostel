import React, { useState, useEffect } from 'react';
import config from '../../config';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AcademicStatsTester = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentPeriod, setPaymentPeriod] = useState('6');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentDetails, setPaymentDetails] = useState({
    transaction_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [invoices, setInvoices] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [academicSummary, setAcademicSummary] = useState([]);

  // Load students for testing
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`${config.backendUrl}/api/students/list`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const data = await response.json();
        setStudents(data);
        
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      }
    };

    // Generate academic years for testing (current and previous two years)
    const generateAcademicYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = 0; i < 3; i++) {
        const startYear = currentYear - i;
        const endYear = startYear + 1;
        // Format as 2-digit years (e.g., "2425" for 2024-2025)
        const academicYear = `${startYear.toString().substr(2, 2)}${endYear.toString().substr(2, 2)}`;
        years.push(academicYear);
      }
      setAcademicYears(years);
      setSelectedAcademicYear(years[0]);
    };

    fetchStudents();
    generateAcademicYears();
  }, []);

  // Load invoices when tab changes or on refresh
  const loadInvoices = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/invoices/list`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch invoices');
      
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    }
  };

  // Load academic summary when selected year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      const fetchAcademicSummary = async () => {
        try {
          const response = await fetch(`${config.backendUrl}/api/invoices/academic-summary/${selectedAcademicYear}`, {
            credentials: 'include',
          });
          
          if (!response.ok) throw new Error('Failed to fetch academic summary');
          
          const data = await response.json();
          setAcademicSummary(data);
        } catch (err) {
          console.error('Error fetching academic summary:', err);
          setError('Failed to load academic summary');
        }
      };

      fetchAcademicSummary();
    }
  }, [selectedAcademicYear]);

  // Handle tab change
  useEffect(() => {
    if (activeTab === 'view') {
      loadInvoices();
    }
  }, [activeTab]);

  // Handle payment method change
  useEffect(() => {
    if (paymentMethod === 'online') {
      setPaymentDetails({
        transaction_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    } else {
      setPaymentDetails({
        cheque_number: '',
        cheque_date: new Date().toISOString().split('T')[0],
        bank_name: ''
      });
    }
  }, [paymentMethod]);

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
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle payment details change
  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const invoiceData = {
        student_id: selectedStudentId,
        invoice_date: new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
        payment_period: parseInt(paymentPeriod),
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        notes
      };

      const response = await fetch(`${config.backendUrl}/api/invoices/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const result = await response.json();
      setSuccess(`Invoice created successfully! Academic Stats: ${result.academic_stats}, Due Date: ${result.due_date}`);
      
      // Reset form
      setAmount('');
      setNotes('');
      
      // Reload invoices if we're on the view tab
      if (activeTab === 'view') {
        loadInvoices();
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  // Get short name for academic stats
  const getAcademicStatsDescription = (stats) => {
    if (!stats || stats.length !== 5) return 'Invalid';
    
    const year1 = `20${stats.substr(0, 2)}`;
    const year2 = `20${stats.substr(2, 2)}`;
    const half = stats.substr(4, 1) === '1' ? 'First Half (Jun-Nov)' : 'Second Half (Dec-May)';
    
    return `${year1}-${year2} ${half}`;
  };

  return (
    <div className="container py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Academic Stats Tester</h1>
        <p className="text-slate-500 mt-1">Test the academic stats feature for invoices</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          <TabsTrigger value="view">View Invoices</TabsTrigger>
          <TabsTrigger value="summary">Academic Summary</TabsTrigger>
        </TabsList>

        {/* Create Invoice Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
              <CardDescription>This will test the academic_stats column functionality</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="student">Select Student</Label>
                      <Select 
                        value={selectedStudentId} 
                        onValueChange={setSelectedStudentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.first_name} {student.surname} (Roll: {student.roll_no})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentPeriod">Payment Period</Label>
                      <Select 
                        value={paymentPeriod} 
                        onValueChange={setPaymentPeriod}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select 
                        value={paymentMethod} 
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'online' ? (
                      <>
                        <div>
                          <Label htmlFor="transaction_id">Transaction ID</Label>
                          <Input
                            id="transaction_id"
                            name="transaction_id"
                            value={paymentDetails.transaction_id}
                            onChange={handlePaymentDetailsChange}
                            placeholder="Enter transaction ID"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="transaction_date">Transaction Date</Label>
                          <Input
                            id="transaction_date"
                            name="transaction_date"
                            type="date"
                            value={paymentDetails.transaction_date}
                            onChange={handlePaymentDetailsChange}
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="cheque_number">Cheque Number</Label>
                          <Input
                            id="cheque_number"
                            name="cheque_number"
                            value={paymentDetails.cheque_number}
                            onChange={handlePaymentDetailsChange}
                            placeholder="Enter cheque number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cheque_date">Cheque Date</Label>
                          <Input
                            id="cheque_date"
                            name="cheque_date"
                            type="date"
                            value={paymentDetails.cheque_date}
                            onChange={handlePaymentDetailsChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="bank_name">Bank Name</Label>
                          <Input
                            id="bank_name"
                            name="bank_name"
                            value={paymentDetails.bank_name}
                            onChange={handlePaymentDetailsChange}
                            placeholder="Enter bank name"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create Invoice'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Invoices Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>View Invoices with Academic Stats</CardTitle>
                  <CardDescription>All invoices with their academic period information</CardDescription>
                </div>
                <Button variant="outline" onClick={loadInvoices}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Academic Stats</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.invoice_id}>
                          <TableCell className="font-medium">
                            INV-{invoice.invoice_id}
                          </TableCell>
                          <TableCell>
                            {invoice.first_name} {invoice.surname}
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.invoice_date)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            {invoice.payment_period} months
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.academic_stats || 'N/A'}
                            </Badge>
                            <div className="text-xs text-slate-500 mt-1">
                              {invoice.academic_stats ? getAcademicStatsDescription(invoice.academic_stats) : 'Not set'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Academic Year Summary</CardTitle>
                  <CardDescription>Financial summary by academic period</CardDescription>
                </div>
                <Select 
                  value={selectedAcademicYear} 
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        20{year.substring(0, 2)}-20{year.substring(2, 4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Period</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead>6-Month Plans</TableHead>
                      <TableHead>12-Month Plans</TableHead>
                      <TableHead>Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No data for this academic year
                        </TableCell>
                      </TableRow>
                    ) : (
                      academicSummary.map((period) => (
                        <TableRow key={period.academic_stats}>
                          <TableCell className="font-medium">
                            {getAcademicStatsDescription(period.academic_stats)}
                          </TableCell>
                          <TableCell>{period.invoice_count}</TableCell>
                          <TableCell>{period.six_month_count}</TableCell>
                          <TableCell>{period.twelve_month_count}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(period.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {academicSummary.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-md border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-500">Total Invoices</p>
                      <p className="text-xl font-bold">
                        {academicSummary.reduce((sum, period) => sum + period.invoice_count, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">6-Month Plans</p>
                      <p className="text-xl font-bold">
                        {academicSummary.reduce((sum, period) => sum + period.six_month_count, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">12-Month Plans</p>
                      <p className="text-xl font-bold">
                        {academicSummary.reduce((sum, period) => sum + period.twelve_month_count, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Revenue</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          academicSummary.reduce((sum, period) => sum + parseFloat(period.total_amount), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicStatsTester;
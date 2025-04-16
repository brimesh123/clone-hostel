import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import recharts for data visualization
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Import icons
import {
  ArrowLeftIcon,
  BuildingIcon,
  UserIcon,
  EditIcon,
  TrashIcon,
  AlertCircleIcon,
  FileTextIcon,
  CreditCardIcon,
  ListIcon,
  DownloadIcon,
  SearchIcon,
  CalendarIcon,
  MoreHorizontalIcon,
  EyeIcon,
  KeyIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  PlusIcon,
  LockIcon,
  UsersIcon,
  TrendingUpIcon
} from "lucide-react";

const HostelDetail = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  
  const [hostel, setHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dueStudents, setDueStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receptionAdmin, setReceptionAdmin] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    fee_6_month: '',
    fee_12_month: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

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

  // Fetch hostel details
  const fetchHostelDetails = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/${hostelId}`, {
        credentials: 'include',
      });
      
      if (response.status === 404) {
        setError('Hostel not found. It may have been deleted or you may have entered an invalid URL.');
        setHostel(null);
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch hostel details');
      
      const data = await response.json();
      setHostel(data);
      
      // Initialize form data
      setFormData({
        name: data.name || '',
        fee_6_month: data.fee_6_month || '',
        fee_12_month: data.fee_12_month || '',
        password: ''
      });
      
      // Get reception admin info
      setReceptionAdmin({
        username: data.username || 'Unknown',
        created_at: data.created_at || null
      });
      
    } catch (error) {
      console.error('Error fetching hostel details:', error);
      setError(error.message || 'Failed to load hostel details');
    }
  };

  // Fetch students for this hostel
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/students/hostel/${hostelId}?status=${statusFilter}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to load students');
    }
  };

  // Fetch payment information
  const fetchPayments = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/invoices/hostel/${hostelId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch payment information');
      
      const data = await response.json();
      setPayments(data);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Don't set error state, as this is not critical
    }
  };

  // Fetch students with dues
  const fetchDueStudents = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/dues/hostel/${hostelId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch due information');
      
      const data = await response.json();
      setDueStudents(data);
      
    } catch (error) {
      console.error('Error fetching dues:', error);
      // Don't set error state, as this is not critical
    }
  };

  // Load all data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await fetchHostelDetails();
      await fetchStudents();
      await fetchPayments();
      await fetchDueStudents();
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadAllData();
  }, [hostelId]);

  // Reload students when status filter changes
  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  // Filter students based on search term
  useEffect(() => {
    if (!students) return;
    
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
      return;
    }
    
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = students.filter(student => {
      return (
        (student.first_name && student.first_name.toLowerCase().includes(lowercasedTerm)) ||
        (student.surname && student.surname.toLowerCase().includes(lowercasedTerm)) ||
        (student.roll_no && student.roll_no.toString().includes(lowercasedTerm)) ||
        (student.personal_phone && student.personal_phone.toString().includes(lowercasedTerm)) ||
        (student.college && student.college.toLowerCase().includes(lowercasedTerm))
      );
    });
    
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Hostel name is required';
    }
    
    if (!formData.fee_6_month) {
      errors.fee_6_month = '6-month fee is required';
    } else if (isNaN(parseFloat(formData.fee_6_month))) {
      errors.fee_6_month = 'Fee must be a valid number';
    }
    
    if (!formData.fee_12_month) {
      errors.fee_12_month = '12-month fee is required';
    } else if (isNaN(parseFloat(formData.fee_12_month))) {
      errors.fee_12_month = 'Fee must be a valid number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle hostel update
  const handleUpdateHostel = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/${hostelId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          fee_6_month: parseFloat(formData.fee_6_month),
          fee_12_month: parseFloat(formData.fee_12_month)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hostel');
      }
      
      // Refresh hostel data
      await fetchHostelDetails();
      
      // Close dialog
      setIsEditDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating hostel:', error);
      setFormErrors({
        ...formErrors,
        submit: error.message || 'Failed to update hostel. Please try again.'
      });
    }
  };

  // Handle reception admin password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/reset-password/${hostelId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      // Close dialog
      setIsResetPasswordDialogOpen(false);
      
      // Clear password field
      setFormData({
        ...formData,
        password: ''
      });
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setFormErrors({
        ...formErrors,
        submit: error.message || 'Failed to reset password. Please try again.'
      });
    }
  };

  // Handle hostel deletion - updated to require confirmation text
  const handleDeleteHostel = async () => {
    // Ensure the confirmation text matches exactly
    if (deleteConfirmText.trim() !== 'delete') {
      setFormErrors({
        ...formErrors,
        deleteConfirm: 'Please type "delete" to confirm'
      });
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/${hostelId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hostel');
      }
      
      // Navigate back to hostel list
      navigate('/hostels');
      
    } catch (error) {
      console.error('Error deleting hostel:', error);
      setError(error.message || 'Failed to delete hostel. Please try again.');
    }
  };

  // Generate payment data for charts
  const generatePaymentDistributionData = () => {
    if (!payments || payments.length === 0) return [];
    
    const sixMonthCount = payments.filter(p => p.payment_period === 6).length;
    const twelveMonthCount = payments.filter(p => p.payment_period === 12).length;
    
    return [
      { name: '6-Month Plan', value: sixMonthCount },
      { name: '12-Month Plan', value: twelveMonthCount }
    ];
  };

  // Generate chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Generate monthly revenue data
  const generateMonthlyRevenueData = () => {
    if (!payments || payments.length === 0) return [];
    
    // Group payments by month and year
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill().map((_, i) => ({
      month: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0,
      count: 0
    }));
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.invoice_date);
      if (paymentDate.getFullYear() === currentYear) {
        const monthIndex = paymentDate.getMonth();
        monthlyData[monthIndex].amount += parseFloat(payment.amount);
        monthlyData[monthIndex].count += 1;
      }
    });
    
    return monthlyData;
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!hostel || !students || !payments || !dueStudents) {
      return {
        totalStudents: 0,
        totalRevenue: 0,
        totalInvoices: 0,
        studentsWithDues: 0,
        totalDueAmount: 0,
        sixMonthPayments: 0,
        twelveMonthPayments: 0,
        newStudentsThisYear: 0,
        expectedRevenueThisYear: 0,
        expectedRevenueAcademicYear: 0
      };
    }
    
    const totalStudents = students.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalInvoices = payments.length;
    const studentsWithDues = dueStudents.length;
    const totalDueAmount = dueStudents.reduce((sum, student) => sum + (student.dueAmount || 0), 0);
    
    // Count payment plans
    const sixMonthPayments = payments.filter(p => p.payment_period === 6).length;
    const twelveMonthPayments = payments.filter(p => p.payment_period === 12).length;
    
    // Calculate new students this year
    const currentYear = new Date().getFullYear();
    const newStudentsThisYear = students.filter(student => {
      const admissionDate = new Date(student.admission_date);
      return admissionDate.getFullYear() === currentYear;
    }).length;
    
    // Calculate expected revenue
    const expectedRevenueThisYear = (totalStudents * parseFloat(hostel.fee_12_month));
    
    // Parse academic year (format: "2023-2024")
    const currentMonth = new Date().getMonth(); // 0-11
    let academicYear;
    
    // Academic year typically starts in June/July, so adjust accordingly
    if (currentMonth >= 5) { // June onwards
      academicYear = `${currentYear}-${currentYear + 1}`;
    } else {
      academicYear = `${currentYear - 1}-${currentYear}`;
    }
    
    // Count students in current academic year
    const studentsInCurrentAcademicYear = students.filter(student => 
      student.academic_year === academicYear
    ).length;
    
    const expectedRevenueAcademicYear = studentsInCurrentAcademicYear * parseFloat(hostel.fee_12_month);
    
    return {
      totalStudents,
      totalRevenue,
      totalInvoices,
      studentsWithDues,
      totalDueAmount,
      sixMonthPayments,
      twelveMonthPayments,
      newStudentsThisYear,
      expectedRevenueThisYear,
      expectedRevenueAcademicYear
    };
  };

  const stats = calculateStats();

  // Handle view student details
  const handleViewStudent = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/hostels')} className="mr-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Hostels
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/hostels')} className="mr-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Hostels
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Hostel not found. Please check the URL and try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/hostels')} className="mr-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold">{hostel.name}</h1>
              <Badge className="ml-3" variant={hostel.hostel_type === 'boys' ? 'default' : 'secondary'}>
                {hostel.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Manage hostel details, students, and finances
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsResetPasswordDialogOpen(true)}
          >
            <KeyIcon className="mr-2 h-4 w-4" />
            Reset Admin Password
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Hostel
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BuildingIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students">
            <UsersIcon className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="dues">
            <AlertCircleIcon className="mr-2 h-4 w-4" />
            Due Management
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Hostel Information</CardTitle>
                <CardDescription>Key details and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Hostel Type</p>
                    <p className="font-medium">
                      {hostel.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Created On</p>
                    <p className="font-medium">{formatDate(hostel.created_at)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">6-Month Fee</p>
                    <p className="font-medium">{formatCurrency(hostel.fee_6_month)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">12-Month Fee</p>
                    <p className="font-medium">{formatCurrency(hostel.fee_12_month)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Administrator Account</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500">Username</p>
                      <p className="font-medium">
                        {receptionAdmin?.username || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500">Account Created</p>
                      <p className="font-medium">
                        {receptionAdmin?.created_at ? formatDate(receptionAdmin.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md border">
                  <h3 className="font-medium mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setActiveTab('students')}
                    >
                      <UsersIcon className="mr-2 h-4 w-4" />
                      View Students
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setActiveTab('payments')}
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      View Payments
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setActiveTab('dues')}
                    >
                      <AlertCircleIcon className="mr-2 h-4 w-4" />
                      Manage Dues
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Finance Statistics</CardTitle>
                <CardDescription>Key revenue indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Students</span>
                    <span className="font-medium">{stats.totalStudents}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Invoices</span>
                    <span className="font-medium">{stats.totalInvoices}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Expected Revenue (Year)</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(stats.expectedRevenueThisYear)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Expected Revenue (Academic)</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(stats.expectedRevenueAcademicYear)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Students with Dues</span>
                    <span className="font-medium text-red-600">
                      {stats.studentsWithDues}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Due Amount</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(stats.totalDueAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Collection Rate</span>
                    <span className="font-medium">
                      {stats.totalRevenue + stats.totalDueAmount > 0
                        ? `${Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalDueAmount)) * 100)}%`
                        : '100%'}
                    </span>
                  </div>
                </div>
                
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">New Students This Year</p>
                      <p className="text-xl font-bold">
                        {stats.newStudentsThisYear}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Additional statistics cards */}
                <div className="grid grid-cols-2 gap-2">
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">6-Month Plan</p>
                        <p className="text-xl font-bold">{stats.sixMonthPayments}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">12-Month Plan</p>
                        <p className="text-xl font-bold">{stats.twelveMonthPayments}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Plan Distribution</CardTitle>
                <CardDescription>
                  Distribution of 6-month vs 12-month payment plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {payments && payments.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generatePaymentDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {generatePaymentDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-slate-400">No payment data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
           
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue (Current Year)</CardTitle>
                <CardDescription>
                  Revenue collected each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {payments && payments.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={generateMonthlyRevenueData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="amount" name="Revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-slate-400">No revenue data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
       
        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    {statusFilter === 'active' ? 'Active' : 'Left'} students in this hostel
                  </CardDescription>
                </div>
               
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Students</SelectItem>
                      <SelectItem value="left">Left Students</SelectItem>
                    </SelectContent>
                  </Select>
                 
                  <Button variant="outline" onClick={() => fetchStudents()}>
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative flex mb-4">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search students by name, roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
             
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center">
                            <UsersIcon className="h-10 w-10 text-slate-300 mb-2" />
                            <p className="font-medium">No students found</p>
                            <p className="text-sm">
                              {searchTerm
                                ? 'Try adjusting your search'
                                : statusFilter === 'active'
                                  ? 'No active students in this hostel'
                                  : 'No students have left this hostel'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.roll_no}
                          </TableCell>
                          <TableCell>
                            {student.first_name} {student.surname}
                          </TableCell>
                          <TableCell>{student.personal_phone}</TableCell>
                          <TableCell>{student.college}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.academic_year}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewStudent(student.id)}>
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {statusFilter === 'active' && (
                                  <DropdownMenuItem onClick={() => navigate(`/create-invoice/${student.id}`)}>
                                    <FileTextIcon className="mr-2 h-4 w-4" />
                                    Create Invoice
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
             
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-slate-500">
                  Showing {filteredStudents.length} of {students.length} students
                </div>
               
                {statusFilter === 'active' && (
                  <Button
                    size="sm"
                    onClick={() => navigate('/add-student')}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
       
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    All fee payments for this hostel
                  </CardDescription>
                </div>
               
                <Button variant="outline" onClick={() => fetchPayments()}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center">
                            <FileTextIcon className="h-10 w-10 text-slate-300 mb-2" />
                            <p className="font-medium">No payments found</p>
                            <p className="text-sm">
                              No fee payments have been recorded for this hostel
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.invoice_id}>
                          <TableCell className="font-medium">
                            INV-{payment.invoice_id}
                          </TableCell>
                          <TableCell>
                            {payment.first_name} {payment.surname}
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.invoice_date)}
                          </TableCell>
                          <TableCell>
                            {payment.payment_period} months
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_method === 'cheque' ? 'outline' : 'secondary'}>
                              {payment.payment_method === 'cheque' ? 'Cheque' : 'Online'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/invoice/${payment.invoice_id}`)}
                            >
                              View
                            </Button>


                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
             
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-slate-500">
                  Showing {payments.length} invoices
                </div>
               
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/invoices')}
                >
                  <ListIcon className="h-4 w-4 mr-2" />
                  View All Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
       
        {/* Dues Tab */}
        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <CardTitle>Due Management</CardTitle>
                  <CardDescription>
                    Students with pending fee payments
                  </CardDescription>
                </div>
               
                <Button variant="outline" onClick={() => fetchDueStudents()}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center">
                            <CheckCircleIcon className="h-10 w-10 text-green-300 mb-2" />
                            <p className="font-medium">No due payments</p>
                            <p className="text-sm">
                              All students are up to date with their payments
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dueStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="font-medium">
                              {student.first_name} {student.surname}
                            </div>
                            <div className="text-xs text-slate-500">
                              Roll No: {student.roll_no}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(student.nextDueDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={student.daysOverdue > 30 ? "destructive" :
                                      student.daysOverdue > 15 ? "outline" : "secondary"}
                            >
                              {student.daysOverdue} days
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(student.dueAmount)}
                          </TableCell>
                          <TableCell>
                            {student.lastPayment ? (
                              <div className="text-sm">
                                <div>{formatDate(student.lastPayment.date)}</div>
                                <div className="text-xs text-slate-500">
                                  {formatCurrency(student.lastPayment.amount)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">No previous payment</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/create-invoice/${student.id}`)}
                            >
                              Create Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
             
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Total Due Amount</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(stats.totalDueAmount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
               
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Students with Dues</p>
                      <p className="text-xl font-bold">
                        {stats.studentsWithDues}
                      </p>
                    </div>
                  </CardContent>
                </Card>
               
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Collection Rate</p>
                      <p className="text-xl font-bold">
                        {stats.totalRevenue + stats.totalDueAmount > 0
                          ? `${Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalDueAmount)) * 100)}%`
                          : '100%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
             
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dues')}
                >
                  <AlertCircleIcon className="h-4 w-4 mr-2" />
                  Go to Due Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
     
      {/* Edit Hostel Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hostel</DialogTitle>
            <DialogDescription>
              Update the hostel information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateHostel}>
            {formErrors.submit && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Hostel Name
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
             
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fee_6_month">
                    6-Month Fee
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="fee_6_month"
                    name="fee_6_month"
                    type="number"
                    value={formData.fee_6_month}
                    onChange={handleInputChange}
                    className={formErrors.fee_6_month ? "border-red-500" : ""}
                  />
                  {formErrors.fee_6_month && (
                    <p className="text-sm text-red-500">{formErrors.fee_6_month}</p>
                  )}
                </div>
               
                <div className="grid gap-2">
                  <Label htmlFor="fee_12_month">
                    12-Month Fee
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="fee_12_month"
                    name="fee_12_month"
                    type="number"
                    value={formData.fee_12_month}
                    onChange={handleInputChange}
                    className={formErrors.fee_12_month ? "border-red-500" : ""}
                  />
                  {formErrors.fee_12_month && (
                    <p className="text-sm text-red-500">{formErrors.fee_12_month}</p>
                  )}
                </div>
              </div>
             
              <div className="grid gap-2">
                <Label>Administrator Username</Label>
                <Input
                  value={receptionAdmin?.username || ''}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Username cannot be changed. Use the reset password option to update credentials.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
     
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Administrator Password</DialogTitle>
            <DialogDescription>
              Change the password for the reception admin account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            {formErrors.submit && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Administrator Username</Label>
                <Input
                  value={receptionAdmin?.username || ''}
                  disabled
                  className="bg-slate-50"
                />
              </div>
             
              <div className="grid gap-2">
                <Label htmlFor="password">
                  New Password
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? "border-red-500" : ""}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>
             
              <Alert>
                <LockIcon className="h-4 w-4 mr-2" />
                <AlertDescription>
                  This will reset the password for the hostel reception admin account.
                  Make sure to communicate the new password to the relevant staff.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
     
      {/* Delete Hostel Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Hostel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this hostel? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="font-medium">{hostel.name}</p>
            <p className="text-sm text-slate-500">
              Type: {hostel.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
            </p>
           
            {stats.totalStudents > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircleIcon className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Warning: This hostel has {stats.totalStudents} active students.
                  Deleting it will affect these student accounts.
                </AlertDescription>
              </Alert>
            )}
           
            {payments.length > 0 && (
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800">
                  This hostel has {payments.length} payment records that will be deleted.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4">
              <Label htmlFor="confirmDelete" className="font-medium">
                Type "delete" to confirm
              </Label>
              <Input 
                id="confirmDelete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={formErrors.deleteConfirm ? "border-red-500 mt-2" : "mt-2"}
                placeholder="delete"
              />
              {formErrors.deleteConfirm && (
                <p className="text-sm text-red-500 mt-1">{formErrors.deleteConfirm}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHostel}
              disabled={deleteConfirmText !== 'delete'}
            >
              Delete Hostel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelDetail;
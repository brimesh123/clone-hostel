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
  CardFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Import recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Import icons
import {
  SearchIcon,
  BarChart2Icon,
  ChevronDownIcon,
  BuildingIcon,
  UsersIcon,
  CreditCardIcon,
  DownloadIcon,
  FilterIcon,
  PrinterIcon,
  EyeIcon,
  ArrowRight,
  ChevronRightIcon,
  AlertCircleIcon
} from "lucide-react";

// Utility function to export to CSV
const exportToCSV = (data, filename) => {
  // Convert data to CSV format
  const csvRows = [];
  
  // Add header row
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Handle special cases (strings with commas, quotes, etc.)
      if (val === null || val === undefined) {
        return '';
      }
      if (typeof val === 'string') {
        // Escape quotes and wrap in quotes if needed
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  
  // Create and download CSV file
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const MasterDueManagement = () => {
  const [dueSummary, setDueSummary] = useState([]);
  const [dueStudents, setDueStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hostelFilter, setHostelFilter] = useState('all');
  const [overdueFilter, setOverdueFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('dues-summary');
  const navigate = useNavigate();
  
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

  // Calculate total statistics
  const calculateTotals = () => {
    if (!dueSummary || dueSummary.length === 0) return {};
    
    const totalStudents = dueSummary.reduce((sum, hostel) => sum + hostel.total_students, 0);
    const totalDueStudents = dueSummary.reduce((sum, hostel) => sum + hostel.students_with_dues, 0);
    const totalDueAmount = dueSummary.reduce((sum, hostel) => sum + hostel.total_due_amount, 0);
    const averagePercentageWithDues = totalStudents > 0 
      ? Math.round((totalDueStudents / totalStudents) * 100)
      : 0;
    
    return {
      totalStudents,
      totalDueStudents,
      totalDueAmount,
      averagePercentageWithDues
    };
  };

  // Load dues summary
  const loadDuesSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/dues/summary`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch dues summary');
      
      const data = await response.json();
      setDueSummary(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dues summary. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Load all students with dues
  const loadDueStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/dues/all`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch students with dues');
      
      const data = await response.json();
      setDueStudents(data);
      setFilteredStudents(data); // Initialize filtered list
      setError(null);
    } catch (err) {
      setError('Failed to load students with dues. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadDuesSummary();
    loadDueStudents();
  }, []);

  // Filter students based on search, hostel, and overdue filters
  useEffect(() => {
    let filtered = [...dueStudents];
    
    // Apply hostel filter
    if (hostelFilter !== 'all') {
      filtered = filtered.filter(student => student.hostel_id.toString() === hostelFilter);
    }
    
    // Apply overdue filter
    if (overdueFilter !== 'all') {
      switch (overdueFilter) {
        case 'lt15':
          filtered = filtered.filter(student => student.daysOverdue < 15);
          break;
        case '15to30':
          filtered = filtered.filter(student => student.daysOverdue >= 15 && student.daysOverdue <= 30);
          break;
        case 'gt30':
          filtered = filtered.filter(student => student.daysOverdue > 30);
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        return (
          (student.first_name && student.first_name.toLowerCase().includes(lowercasedTerm)) ||
          (student.surname && student.surname.toLowerCase().includes(lowercasedTerm)) ||
          (student.roll_no && student.roll_no.toString().includes(lowercasedTerm)) ||
          (student.hostel_name && student.hostel_name.toLowerCase().includes(lowercasedTerm))
        );
      });
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, hostelFilter, overdueFilter, dueStudents]);

  // Generate data for bar chart
  const generateBarChartData = () => {
    return dueSummary.map(hostel => ({
      name: hostel.hostel_name,
      students: hostel.students_with_dues,
      amount: Math.round(hostel.total_due_amount / 1000) // Convert to thousands for better display
    }));
  };

  // Generate data for pie chart
  const generatePieChartData = () => {
    return dueSummary.map(hostel => ({
      name: hostel.hostel_name,
      value: hostel.students_with_dues
    }));
  };

  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Handle report generation
  const handleGenerateReport = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (reportType) {
      case 'dues-summary':
        // Prepare summary data for export
        const summaryData = dueSummary.map(hostel => ({
          HostelName: hostel.hostel_name,
          TotalStudents: hostel.total_students,
          StudentsWithDues: hostel.students_with_dues,
          PercentageWithDues: `${hostel.percentage_with_dues}%`,
          TotalDueAmount: hostel.total_due_amount
        }));
        
        exportToCSV(summaryData, `dues-summary-report-${today}.csv`);
        break;
        
      case 'all-due-students':
        // Prepare student data for export
        const studentData = dueStudents.map(student => ({
          Name: `${student.first_name} ${student.surname}`,
          RollNo: student.roll_no,
          Hostel: student.hostel_name,
          DueDate: formatDate(student.nextDueDate),
          DaysOverdue: student.daysOverdue,
          DueAmount: student.dueAmount,
          LastPaymentDate: student.lastPayment ? formatDate(student.lastPayment.date) : 'N/A',
          LastPaymentAmount: student.lastPayment ? student.lastPayment.amount : 'N/A'
        }));
        
        exportToCSV(studentData, `all-due-students-report-${today}.csv`);
        break;
        
      case 'filtered-students':
        // Prepare filtered student data for export
        const filteredData = filteredStudents.map(student => ({
          Name: `${student.first_name} ${student.surname}`,
          RollNo: student.roll_no,
          Hostel: student.hostel_name,
          DueDate: formatDate(student.nextDueDate),
          DaysOverdue: student.daysOverdue,
          DueAmount: student.dueAmount,
          LastPaymentDate: student.lastPayment ? formatDate(student.lastPayment.date) : 'N/A',
          LastPaymentAmount: student.lastPayment ? student.lastPayment.amount : 'N/A'
        }));
        
        exportToCSV(filteredData, `filtered-dues-report-${today}.csv`);
        break;
    }
    
    setReportDialogOpen(false);
  };
  
  // Calculate total overdue by category
  const calculateOverdueCategories = () => {
    if (!dueStudents || dueStudents.length === 0) return { lt15: 0, b15to30: 0, gt30: 0 };
    
    const lt15 = dueStudents.filter(student => student.daysOverdue < 15).length;
    const b15to30 = dueStudents.filter(student => student.daysOverdue >= 15 && student.daysOverdue <= 30).length;
    const gt30 = dueStudents.filter(student => student.daysOverdue > 30).length;
    
    return { lt15, b15to30, gt30 };
  };

  const totals = calculateTotals();
  const overdueCategories = calculateOverdueCategories();

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fee Due Management</h1>
          <p className="text-slate-500 mt-1">
            Monitor and manage fee dues across all hostels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button onClick={() => {
            loadDuesSummary();
            loadDueStudents();
          }}>
            Refresh Data
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-8">
          <TabsTrigger value="summary" className="flex-1">
            <BarChart2Icon className="w-4 h-4 mr-2" />
            Summary Dashboard
          </TabsTrigger>
          <TabsTrigger value="students" className="flex-1">
            <UsersIcon className="w-4 h-4 mr-2" />
            Due Students List
          </TabsTrigger>
        </TabsList>
        
        {/* Summary Dashboard Tab */}
        <TabsContent value="summary">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoadingSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array(4).fill().map((_, idx) => (
                <Skeleton key={idx} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">Total Due Students</p>
                        <p className="text-3xl font-bold">{totals.totalDueStudents}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Out of {totals.totalStudents} total students
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">Total Due Amount</p>
                        <p className="text-3xl font-bold text-red-600">
                          {formatCurrency(totals.totalDueAmount)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <CreditCardIcon className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Outstanding fee payments
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">Avg. Dues Rate</p>
                        <p className="text-3xl font-bold text-amber-600">
                          {totals.averagePercentageWithDues}%
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <ChevronDownIcon className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Students with pending dues
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">Overdue &gt; 30 Days</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {overdueCategories.gt30}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <AlertCircleIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Severely overdue payments
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Due Students by Hostel</CardTitle>
                    <CardDescription>
                      Distribution of students with dues across hostels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={generateBarChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="students" fill="#8884d8" name="Due Students" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Due Amount by Hostel (₹ thousands)</CardTitle>
                    <CardDescription>
                      Total outstanding due amount per hostel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={generateBarChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="amount" fill="#82ca9d" name="Due Amount (₹ thousands)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Hostel Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Hostel-wise Due Summary</CardTitle>
                  <CardDescription>
                    Detailed breakdown of dues by hostel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hostel</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Total Students</TableHead>
                          <TableHead>Due Students</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Total Due Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dueSummary.map((hostel) => (
                          <TableRow key={hostel.hostel_id}>
                            <TableCell className="font-medium">
                              {hostel.hostel_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant={hostel.hostel_type === 'boys' ? 'default' : 'secondary'}>
                                {hostel.hostel_type === 'boys' ? 'Boys' : 'Girls'}
                              </Badge>
                            </TableCell>
                            <TableCell>{hostel.total_students}</TableCell>
                            <TableCell>{hostel.students_with_dues}</TableCell>
                            <TableCell>
                              <Badge variant={
                                hostel.percentage_with_dues > 30 ? "destructive" : 
                                hostel.percentage_with_dues > 20 ? "outline" : 
                                "secondary"
                              }>
                                {hostel.percentage_with_dues}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(hostel.total_due_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Students List Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students with Pending Dues</CardTitle>
              <CardDescription>
                Comprehensive list of all students with pending fee payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search students by name, roll number, or hostel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select
                  value={hostelFilter}
                  onValueChange={setHostelFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2" />
                      <span>Hostel</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {dueSummary.map((hostel) => (
                      <SelectItem key={hostel.hostel_id} value={hostel.hostel_id.toString()}>
                        {hostel.hostel_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={overdueFilter}
                  onValueChange={setOverdueFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center">
                      <FilterIcon className="h-4 w-4 mr-2" />
                      <span>Overdue</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Overdue</SelectItem>
                    <SelectItem value="lt15">&lt; 15 days</SelectItem>
                    <SelectItem value="15to30">15-30 days</SelectItem>
                    <SelectItem value="gt30">&gt; 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isLoadingStudents ? (
                <div className="space-y-2">
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Overdue</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                            <div className="flex flex-col items-center">
                              <AlertCircleIcon className="h-8 w-8 text-slate-300 mb-2" />
                              <p className="font-medium">No due payments found</p>
                              <p className="text-sm">
                                {searchTerm || hostelFilter !== 'all' || overdueFilter !== 'all' 
                                  ? 'Try adjusting your filters' 
                                  : 'All students are up to date with payments'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                                  <UsersIcon className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {student.first_name} {student.surname}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Roll No: {student.roll_no}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={student.hostel_type === 'boys' ? 'default' : 'secondary'}>
                                {student.hostel_name}
                              </Badge>
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center"
                                onClick={() => navigate(`/student/${student.id}`)}
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                                <ChevronRightIcon className="h-4 w-4 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-slate-500">
                Showing {filteredStudents.length} of {dueStudents.length} students with dues
              </div>
              <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export List
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Report Generation Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Select the type of report you want to generate
            </DialogDescription>
          </DialogHeader>
          <Select
            value={reportType}
            onValueChange={setReportType}
          >
            <SelectTrigger>
              <span>Select report type</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dues-summary">Hostel Dues Summary</SelectItem>
              <SelectItem value="all-due-students">All Due Students</SelectItem>
              <SelectItem value="filtered-students">Filtered Students List</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Generate CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterDueManagement;
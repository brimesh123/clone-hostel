// components/r_components/DueManagement.jsx
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

// Import icons
import {
  SearchIcon,
  MoreHorizontalIcon,
  EyeIcon,
  FileTextIcon,
  UserIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  SortAscIcon,
  SortDescIcon,
  FilterIcon
} from "lucide-react";

const DueManagement = () => {
  const [dueStudents, setDueStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('daysDesc'); // Default: most overdue first
  const [hostelInfo, setHostelInfo] = useState(null);
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

  // Fetch hostel info
  const fetchHostelInfo = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/current`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch hostel information');
      return await response.json();
    } catch (error) {
      console.error('Error fetching hostel info:', error);
      throw error;
    }
  };

  // Load due students
  const loadDueStudents = async () => {
    setIsLoading(true);
    try {
      // Get hostel info first
      const hostelData = await fetchHostelInfo();
      setHostelInfo(hostelData);
      
      // Then get students with dues for this hostel
      const response = await fetch(`${config.backendUrl}/api/dues/hostel/${hostelData.hostel_id}`, {
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDueStudents();
  }, []);

  // Handle search and sort
  useEffect(() => {
    let filtered = [...dueStudents];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        return (
          student.first_name.toLowerCase().includes(lowercasedTerm) ||
          student.surname.toLowerCase().includes(lowercasedTerm) ||
          student.roll_no.toString().includes(lowercasedTerm) ||
          (student.personal_phone && student.personal_phone.toString().includes(lowercasedTerm)) ||
          (student.college && student.college.toLowerCase().includes(lowercasedTerm))
        );
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'daysDesc':
          return b.daysOverdue - a.daysOverdue;
        case 'daysAsc':
          return a.daysOverdue - b.daysOverdue;
        case 'nameAsc':
          return `${a.first_name} ${a.surname}`.localeCompare(`${b.first_name} ${b.surname}`);
        case 'nameDesc':
          return `${b.first_name} ${b.surname}`.localeCompare(`${a.first_name} ${a.surname}`);
        case 'amountDesc':
          return b.dueAmount - a.dueAmount;
        case 'amountAsc':
          return a.dueAmount - b.dueAmount;
        default:
          return b.daysOverdue - a.daysOverdue;
      }
    });
    
    setFilteredStudents(filtered);
  }, [searchTerm, sortOrder, dueStudents]);

  // Handle view student details
  const handleViewStudent = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  // Handle create invoice
  const handleCreateInvoice = (studentId) => {
    navigate(`/create-invoice/${studentId}`);
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Due Management</h1>
          <p className="text-slate-500 mt-1">Track and manage students with pending fee payments</p>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Students with Pending Dues</CardTitle>
          <CardDescription>
            Students who have pending fee payments for your hostel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <SortAscIcon className="h-4 w-4 mr-2" />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daysDesc">Most Overdue First</SelectItem>
                <SelectItem value="daysAsc">Least Overdue First</SelectItem>
                <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                <SelectItem value="amountDesc">Amount (High-Low)</SelectItem>
                <SelectItem value="amountAsc">Amount (Low-High)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadDueStudents}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
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
                    <TableHead>Due Date</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            {searchTerm ? 'Try adjusting your search' : 'All students are up to date with payments'}
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
                              <UserIcon className="h-5 w-5 text-slate-600" />
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
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-slate-400 mr-1" />
                            <span>{formatDate(student.nextDueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
  <Badge 
    variant={student.daysOverdue > 30 ? "destructive" : 
           student.daysOverdue > 15 ? "outline" : "secondary"}
  >
    {student.daysOverdue} days
  </Badge>
  {!student.lastPayment && (
    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600">
      New Student
    </Badge>
  )}
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
                              <DropdownMenuItem onClick={() => handleCreateInvoice(student.id)}>
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                Create Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!isLoading && filteredStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Due Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-500">Total Students with Dues</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-500">Total Outstanding Amount</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(
                    filteredStudents.reduce((sum, student) => sum + student.dueAmount, 0)
                  )}
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-500">Average Days Overdue</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    filteredStudents.reduce((sum, student) => sum + student.daysOverdue, 0) / 
                    filteredStudents.length
                  )} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DueManagement;
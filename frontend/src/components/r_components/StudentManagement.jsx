// src/components/r_components/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import MarkStudentLeftDialog from './MarkStudentLeftDialog';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import icons
import { 
  PlusIcon, 
  SearchIcon, 
  MoreHorizontalIcon, 
  FileTextIcon, 
  UserIcon, 
  EyeIcon, 
  LogOutIcon,
  CalendarIcon,
  FilterIcon
} from "lucide-react";

const fetchStudents = async (hostelId, status = 'active') => {
  try {
    const response = await fetch(`${config.backendUrl}/api/students/hostel/${hostelId}?status=${status}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch students');
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

const fetchAcademicYears = async () => {
  try {
    const response = await fetch(`${config.backendUrl}/api/students/academic-years`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch academic years');
    return await response.json();
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

const fetchCurrentAcademicYear = async () => {
  try {
    const response = await fetch(`${config.backendUrl}/api/students/current-academic-year`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch current academic year');
    const data = await response.json();
    return data.academicYear;
  } catch (error) {
    console.error('Error fetching current academic year:', error);
    throw error;
  }
};

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

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('current');
  const [academicYears, setAcademicYears] = useState([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('');
  const [hostelInfo, setHostelInfo] = useState(null);
  const [markLeftDialogOpen, setMarkLeftDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      // Get hostel info first
      const hostelData = await fetchHostelInfo();
      setHostelInfo(hostelData);

      // Fetch academic years for filtering
      const years = await fetchAcademicYears();
      setAcademicYears(years);

      // Get current academic year
      const currentYear = await fetchCurrentAcademicYear();
      setCurrentAcademicYear(currentYear);

      // Set default academic year filter to current
      if (academicYearFilter === 'current') {
        setAcademicYearFilter(currentYear);
      }

      // Fetch students
      const data = await fetchStudents(hostelData.hostel_id);
      setStudents(data);
      setFilteredStudents(data);
      setError(null);
    } catch (err) {
      setError('Failed to load students. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Handle search functionality
  useEffect(() => {
    let filtered = [...students];
    
    // Apply academic year filter if not set to all
    if (academicYearFilter !== 'all') {
      filtered = filtered.filter(student => student.academic_year === academicYearFilter);
    }

    // Apply search term
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
    
    setFilteredStudents(filtered);
  }, [searchTerm, academicYearFilter, students]);

  const handleAddStudent = () => {
    navigate('/add-student');
  };

  const handleViewDetails = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  const handleCreateInvoice = (studentId) => {
    navigate(`/create-invoice/${studentId}`);
  };

  const handleViewLeftStudents = () => {
    navigate('/left-students');
  };

  const handleMarkAsLeft = (student) => {
    setSelectedStudent(student);
    setMarkLeftDialogOpen(true);
  };

  const handleMarkLeftSuccess = async () => {
    // Refresh the student list after marking a student as left
    await loadStudents();
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-slate-500 mt-1">Manage hostel students, view details, and create invoices</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleViewLeftStudents} variant="outline">
            <LogOutIcon className="mr-2 h-4 w-4" />
            View Left Students
          </Button>
          <Button onClick={handleAddStudent}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add New Student
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Students</CardTitle>
          <CardDescription>A list of all active students in your hostel.</CardDescription>
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
              value={academicYearFilter}
              onValueChange={setAcademicYearFilter}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>Academic Year</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadStudents}>
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
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Badge variant="outline">{student.roll_no}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.first_name} {student.surname}
                        </TableCell>
                        <TableCell>{student.college}</TableCell>
                        <TableCell>{student.personal_phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.academic_year}</Badge>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(student.id)}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateInvoice(student.id)}>
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                Create Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkAsLeft(student)}>
                                <LogOutIcon className="mr-2 h-4 w-4" />
                                Mark as Left
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

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Student Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Total Active Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Academic Year</p>
              <p className="text-2xl font-bold">
                {academicYearFilter === 'all' 
                  ? 'All Years' 
                  : academicYearFilter}
                {academicYearFilter === currentAcademicYear 
                  ? ' (Current)' 
                  : ''}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Filtered Results</p>
              <p className="text-2xl font-bold">{filteredStudents.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Student as Left Dialog */}
      {selectedStudent && (
        <MarkStudentLeftDialog
          isOpen={markLeftDialogOpen}
          onClose={() => setMarkLeftDialogOpen(false)}
          student={selectedStudent}
          onSuccess={handleMarkLeftSuccess}
        />
      )}
    </div>
  );
};

export default StudentManagement;
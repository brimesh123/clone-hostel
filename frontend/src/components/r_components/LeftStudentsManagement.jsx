// src/components/r_components/LeftStudentsManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import RetrieveStudentDialog from './RetrieveStudentDialog';

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
import { SearchIcon, MoreHorizontalIcon, EyeIcon, ArrowLeftIcon, Calendar, School, UndoIcon } from "lucide-react";

const fetchLeftStudents = async (hostelId) => {
  try {
    const response = await fetch(`${config.backendUrl}/api/students/hostel/${hostelId}?status=left`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch left students');
    return await response.json();
  } catch (error) {
    console.error('Error fetching left students:', error);
    throw error;
  }
};

const LeftStudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [academicYears, setAcademicYears] = useState([]);
  const [hostelInfo, setHostelInfo] = useState(null);
  const navigate = useNavigate();
  
  // State for retrieve student dialog
  const [retrieveDialogOpen, setRetrieveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch hostel info for current receptionist
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

  // Fetch academic years
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

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      // First get the hostel info
      const hostelData = await fetchHostelInfo();
      setHostelInfo(hostelData);
      
      // Then fetch left students for this hostel
      const data = await fetchLeftStudents(hostelData.hostel_id);
      setStudents(data);
      setFilteredStudents(data);
      
      // Get academic years for filtering
      const years = await fetchAcademicYears();
      setAcademicYears(years);
      
      setError(null);
    } catch (err) {
      setError('Failed to load left students. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Handle search and filter functionality
  useEffect(() => {
    let filtered = [...students];
    
    // Apply academic year filter
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
          student.phone?.toString().includes(lowercasedTerm) ||
          student.college?.toLowerCase().includes(lowercasedTerm)
        );
      });
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, academicYearFilter, students]);

  const handleViewDetails = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  // Handle retrieve student (un-mark as left)
  const handleRetrieveStudent = (student) => {
    setSelectedStudent(student);
    setRetrieveDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle successful retrieval
  const handleRetrieveSuccess = async () => {
    await loadStudents();
    // Show success message or notification if desired
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold">Left Students</h1>
            <p className="text-slate-500 mt-1">Students who have left the hostel</p>
          </div>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Left Students List</CardTitle>
          <CardDescription>Students who are no longer residing in the hostel</CardDescription>
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
                placeholder="Search by name, roll number, or college..."
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
                  <Calendar className="h-4 w-4 mr-2" />
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
                    <TableHead>Academic Year</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Left Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                        No left students found
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
                        <TableCell>
                          <Badge variant="secondary">{student.academic_year}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <School className="h-4 w-4 mr-1 text-slate-400" />
                            <span>{student.college}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(student.left_date)}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleRetrieveStudent(student)}>
                                <UndoIcon className="mr-2 h-4 w-4" />
                                Retrieve Student
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
      
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Total Left Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Current Filter</p>
              <p className="text-2xl font-bold">
                {academicYearFilter === 'all' ? 'All Years' : academicYearFilter}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm text-slate-500">Filtered Results</p>
              <p className="text-2xl font-bold">{filteredStudents.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retrieve Student Dialog */}
      {selectedStudent && (
        <RetrieveStudentDialog
          isOpen={retrieveDialogOpen}
          onClose={() => setRetrieveDialogOpen(false)}
          student={selectedStudent}
          onSuccess={handleRetrieveSuccess}
        />
      )}
    </div>
  );
};

export default LeftStudentsManagement;
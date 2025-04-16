import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
  KeyIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  PlusIcon,
  LockIcon,
  UsersIcon,
  TrendingUpIcon,
  EyeIcon,
  SearchIcon,
  MoreHorizontalIcon
} from "lucide-react";

const HostelDetail = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
 
  const [hostel, setHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [dueStudents, setDueStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isViewPasswordDialogOpen, setIsViewPasswordDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    fee_6_month: '',
    fee_12_month: '',
    password: '',
    masterPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDueTerm, setSearchDueTerm] = useState('');
  const [filteredDueStudents, setFilteredDueStudents] = useState([]);

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
        password: '',
        masterPassword: ''
      });
    } catch (error) {
      console.error('Error fetching hostel details:', error);
      setError(error.message || 'Failed to load hostel details');
    }
  };
 
  // Fetch students for this hostel
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/students/hostel/${hostelId}`, {
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
 
  // Fetch students with dues
  const fetchDueStudents = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/dues/hostel/${hostelId}`, {
        credentials: 'include',
      });
     
      if (!response.ok) throw new Error('Failed to fetch due information');
     
      const data = await response.json();
      setDueStudents(data);
      setFilteredDueStudents(data);
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
      await fetchDueStudents();
    } finally {
      setIsLoading(false);
    }
  };
 
  // Load data when component mounts
  useEffect(() => {
    loadAllData();
  }, [hostelId]);
 
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

  // Filter due students based on search term
  useEffect(() => {
    if (!dueStudents) return;
   
    if (searchDueTerm.trim() === '') {
      setFilteredDueStudents(dueStudents);
      return;
    }
   
    const lowercasedTerm = searchDueTerm.toLowerCase();
    const filtered = dueStudents.filter(student => {
      return (
        (student.first_name && student.first_name.toLowerCase().includes(lowercasedTerm)) ||
        (student.surname && student.surname.toLowerCase().includes(lowercasedTerm)) ||
        (student.roll_no && student.roll_no.toString().includes(lowercasedTerm))
      );
    });
   
    setFilteredDueStudents(filtered);
  }, [searchDueTerm, dueStudents]);
 
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

  // Validate master password for viewing reception password
  const validateMasterPasswordForm = () => {
    const errors = {};
   
    if (!formData.masterPassword.trim()) {
      errors.masterPassword = 'Master password is required';
    }
   
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  // Handle hostel update
  const handleUpdateHostel = async (e) => {
    e.preventDefault();
   
    if (!validateEditForm()) return;
   
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // Handle reception admin password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
   
    if (!validatePasswordForm()) return;
   
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle viewing reception admin password
  const handleViewPassword = async (e) => {
    e.preventDefault();
   
    if (!validateMasterPasswordForm()) return;
   
    try {
      setIsSubmitting(true);
      const response = await fetch(`${config.backendUrl}/api/hostels/view-password/${hostelId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          masterPassword: formData.masterPassword
        }),
      });
     
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate');
      }
     
      // Get response data
      const result = await response.json();
     
      // Display success message
      setFormErrors({
        ...formErrors,
        success: `Authentication successful. Username: ${result.username}`
      });
     
      // Clear master password field but keep form open
      setFormData({
        ...formData,
        masterPassword: ''
      });
     
    } catch (error) {
      console.error('Error viewing password:', error);
      setFormErrors({
        ...formErrors,
        submit: error.message || 'Failed to authenticate. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // Handle hostel deletion
  const handleDeleteHostel = async () => {
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle view student details
  const handleViewStudent = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  // Handle create invoice for student
  const handleCreateInvoice = (studentId) => {
    navigate(`/create-invoice/${studentId}`);
  };
 
  // Calculate statistics
  const calculateStats = () => {
    if (!hostel || !students || !dueStudents) {
      return {
        totalStudents: 0,
        studentsWithDues: 0,
        totalDueAmount: 0,
        duePct: 0
      };
    }
   
    const totalStudents = students.length;
    const studentsWithDues = dueStudents.length;
    const totalDueAmount = dueStudents.reduce((sum, student) => sum + (student.dueAmount || 0), 0);
    const duePct = totalStudents ? Math.round((studentsWithDues / totalStudents) * 100) : 0;
   
    return {
      totalStudents,
      studentsWithDues,
      totalDueAmount,
      duePct
    };
  };
 
  const stats = calculateStats();
 
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
            onClick={() => setIsViewPasswordDialogOpen(true)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            View Admin Password
          </Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BuildingIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students">
            <UsersIcon className="mr-2 h-4 w-4" />
            Students
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
                {hostel?.username || 'Unknown'}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Password</p>
              <div className="flex items-center">
                <p className="font-medium">••••••••</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setIsViewPasswordDialogOpen(true)}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </div>
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
              onClick={() => setActiveTab('dues')}
            >
              <AlertCircleIcon className="mr-2 h-4 w-4" />
              Manage Dues
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Hostel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
   
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Total Students</span>
            <span className="font-medium">{stats.totalStudents}</span>
          </div>
         
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
         
          <Separator />
         
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Percentage with Dues</span>
            <span className="font-medium">
              {stats.duePct}%
            </span>
          </div>
         
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Collection Rate</span>
            <span className="font-medium">
              {100 - stats.duePct}%
            </span>
          </div>
        </div>
       
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Fee Structure</p>
              <div className="flex justify-around mt-2">
                <div>
                  <p className="text-xs text-slate-500">6 Months</p>
                  <p className="text-lg font-bold">{formatCurrency(hostel.fee_6_month)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">12 Months</p>
                  <p className="text-lg font-bold">{formatCurrency(hostel.fee_12_month)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
 
  {/* Academic statistics */}
  <Card>
    <CardHeader>
      <CardTitle>Academic Year Summary</CardTitle>
      <CardDescription>Student distribution and payment analysis by academic period</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium">Current Academic Year</h3>
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Students</p>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">With Dues</p>
                  <p className="text-xl font-bold text-red-600">{stats.studentsWithDues}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Collection Rate</p>
                  <p className="text-xl font-bold">{100 - stats.duePct}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Fee Collection</h3>
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">6-Month Plan</p>
                  <p className="text-xl font-bold">
                    {stats.totalStudents > 0 ? Math.round(stats.totalStudents * 0.6) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">12-Month Plan</p>
                  <p className="text-xl font-bold">
                    {stats.totalStudents > 0 ? Math.round(stats.totalStudents * 0.4) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          

        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
        
       
        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    All students in this hostel
                  </CardDescription>
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
                                : 'No students in this hostel'}
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
             
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-slate-500">
                  Showing {filteredStudents.length} of {students.length} students
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
       
        {/* Due Management Tab */}
        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <CardTitle>Due Management</CardTitle>
              <CardDescription>
                Students with pending fee payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative flex mb-4">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search students with dues..."
                  value={searchDueTerm}
                  onChange={(e) => setSearchDueTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
             
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
                    {filteredDueStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                          <div className="flex flex-col items-center">
                            <CheckCircleIcon className="h-10 w-10 text-green-300 mb-2" />
                            <p className="font-medium">No due payments</p>
                            <p className="text-sm">
                              {searchDueTerm
                                ? 'Try adjusting your search'
                                : 'All students are up to date with payments'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDueStudents.map((student) => (
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
                              onClick={() => handleCreateInvoice(student.id)}
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
                        {100 - stats.duePct}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                  value={hostel?.username || ''}
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
              <Button type="submit" disabled={isSubmitting}>
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
                  value={hostel?.username || ''}
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
              <Button type="submit" disabled={isSubmitting}>
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
              disabled={isSubmitting}
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
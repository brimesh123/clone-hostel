import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../config';
import StudentDueInfo from './StudentDueInfo';
import RetrieveStudentDialog from './RetrieveStudentDialog';

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import icons
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon,
  UndoIcon,
  BookOpenIcon,
  FileTextIcon,
  LogOutIcon,
  EditIcon,
  PlusIcon,
  TrashIcon
} from "lucide-react";
import MarkStudentLeftDialog from './MarkStudentLeftDialog';

const StudentDetail = () => {
  // Adjusting the parameter extraction based on the route definition.
  // If your route is defined as "/student/:id", then do the following:
  const { id } = useParams();
  const studentId = id; // Now studentId will have the correct value.
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    father_name: '',
    surname: '',
    address: '',
    city: '',
    personal_phone: '', // Changed from 'phone' to 'personal_phone' to match API
    parent_phone: '',
    college: '',
    stream: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // State for Mark Left and Retrieve dialogs
  const [markLeftDialogOpen, setMarkLeftDialogOpen] = useState(false);
  const [retrieveDialogOpen, setRetrieveDialogOpen] = useState(false);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        // Fetch student details
        const studentResponse = await fetch(`${config.backendUrl}/api/students/${studentId}`, {
          credentials: 'include',
        });
        
        if (!studentResponse.ok) {
          if (studentResponse.status === 404) {
            throw new Error('Student not found');
          }
          throw new Error('Failed to fetch student information');
        }
        
        const studentData = await studentResponse.json();
        setStudent(studentData);
        
        // Initialize edit form with student data
        setEditForm({
          first_name: studentData.first_name || '',
          father_name: studentData.father_name || '',
          surname: studentData.surname || '',
          address: studentData.address || '',
          city: studentData.city || '',
          personal_phone: studentData.personal_phone ? String(studentData.personal_phone) : '', // Ensure phone is a string
          parent_phone: studentData.parent_phone ? String(studentData.parent_phone) : '',
          college: studentData.college || '',
          stream: studentData.stream || ''
        });
        
        // Fetch invoices for this student
        const invoicesResponse = await fetch(`${config.backendUrl}/api/invoices/student/${studentId}`, {
          credentials: 'include',
        });
        
        if (!invoicesResponse.ok) throw new Error('Failed to fetch invoice information');
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(err.message || 'Failed to load student data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  // Handle form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle marking student as left
  const handleMarkAsLeft = () => {
    setMarkLeftDialogOpen(true);
  };

  // Handle retrieving student (unmarking as left)
  const handleRetrieveStudent = () => {
    setRetrieveDialogOpen(true);
  };

  // Handle success after marking left or retrieving
  const handleStudentStatusChange = async () => {
    // Refresh the student data after status change
    try {
      const studentResponse = await fetch(`${config.backendUrl}/api/students/${studentId}`, {
        credentials: 'include',
      });
      
      if (!studentResponse.ok) {
        if (studentResponse.status === 404) {
          throw new Error('Student not found');
        }
        throw new Error('Failed to fetch student information');
      }
      
      const studentData = await studentResponse.json();
      setStudent(studentData);
      
      // Close any open dialogs
      setMarkLeftDialogOpen(false);
      setRetrieveDialogOpen(false);
      setIsEditDialogOpen(false);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error fetching updated student data:', err);
      setError(err.message || 'Failed to load updated student data.');
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Helper function to safely check if a string field is empty
    const isEmptyField = (field) => {
      if (field === null || field === undefined) return true;
      return String(field).trim() === '';
    };
    
    // Helper function to safely validate phone numbers
    const isValidPhone = (phone) => {
      if (phone === null || phone === undefined) return false;
      const phoneStr = String(phone);
      return /^\d{10}$/.test(phoneStr);
    };
    
    if (isEmptyField(editForm.first_name)) errors.first_name = 'First name is required';
    if (isEmptyField(editForm.surname)) errors.surname = 'Surname is required';
    if (isEmptyField(editForm.address)) errors.address = 'Address is required';
    if (isEmptyField(editForm.city)) errors.city = 'City is required';
    
    // Validate phone numbers - updated to handle non-string values
    if (isEmptyField(editForm.personal_phone)) {
      errors.personal_phone = 'Phone number is required';
    } else if (!isValidPhone(editForm.personal_phone)) {
      errors.personal_phone = 'Phone number must be 10 digits';
    }
    
    if (isEmptyField(editForm.parent_phone)) {
      errors.parent_phone = 'Parent phone number is required';
    } else if (!isValidPhone(editForm.parent_phone)) {
      errors.parent_phone = 'Parent phone number must be 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/students/${studentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }
      
      // Update student state with new data
      setStudent({
        ...student,
        ...editForm
      });
      
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating student:', err);
      setFormErrors({
        submit: err.message || 'Failed to update student. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }
      
      // Navigate back to student list
      navigate('/students', { replace: true });
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err.message || 'Failed to delete student. Please try again.');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate total paid amount
  const getTotalPaidAmount = () => {
    return invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  };

  // Navigate to create invoice
  const handleCreateInvoice = () => {
    navigate(`/create-invoice/${studentId}`);
  };

  // View invoice details
  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoice/${invoiceId}`);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={() => navigate('/students')}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>Student not found</AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={() => navigate('/students')}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <header className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Student Profile</h1>
          <p className="text-slate-500 mt-1">View and manage student details</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditDialogOpen(true)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Personal details</CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">
                {student.first_name} {student.surname}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <p className="text-slate-500">
                  Roll No: {student.roll_no}
                </p>
                {student.status === 'left' ? (
                  <Badge variant="destructive">Left</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex">
                <PhoneIcon className="h-4 w-4 text-slate-500 mt-1 mr-2" />
                <div>
                  <p className="text-sm font-medium">Contact Information</p>
                  <p className="text-sm">{student.personal_phone}</p>
                  <p className="text-xs text-slate-500">Parent: {student.parent_phone}</p>
                </div>
              </div>
              
              <div className="flex">
                <MapPinIcon className="h-4 w-4 text-slate-500 mt-1 mr-2" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm">{student.address}</p>
                  <p className="text-xs text-slate-500">{student.city}</p>
                </div>
              </div>
              
              <div className="flex">
                <BookOpenIcon className="h-4 w-4 text-slate-500 mt-1 mr-2" />
                <div>
                  <p className="text-sm font-medium">Education</p>
                  <p className="text-sm">{student.college}</p>
                  <p className="text-xs text-slate-500">{student.stream}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Hostel Information</p>
              <p className="text-sm">
                {student.hostel_name}
                <Badge className="ml-2" variant={student.hostel_type === 'boys' ? 'default' : 'secondary'}>
                  {student.hostel_type === 'boys' ? 'Boys' : 'Girls'}
                </Badge>
              </p>
              <p className="text-xs text-slate-500">
                Academic Year: {student.academic_year}
              </p>
              <p className="text-xs text-slate-500">
                Admitted: {formatDate(student.admission_date)}
              </p>
              {student.due_date && (
                <p className="text-xs text-slate-500">
                  Due Date: {formatDate(student.due_date)}
                </p>
              )}
              {student.status === 'left' && (
                <p className="text-xs text-slate-500">
                  Left Date: {formatDate(student.left_date)}
                </p>
              )}
            </div>
            
            {/* Status action buttons based on current status */}
            {student.status === 'active' ? (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleMarkAsLeft}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Mark as Left
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleRetrieveStudent}
              >
                <UndoIcon className="mr-2 h-4 w-4" />
                Retrieve Student
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Main Content and Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Student Overview</CardTitle>
                  <CardDescription>
                    Summary and key information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Summary Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Payment Summary</h3>
                          <p className="text-sm text-slate-500">Total fee payments made</p>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(getTotalPaidAmount())}
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-slate-500">Total Invoices</p>
                          <p className="text-xl font-bold">{invoices.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Last Payment</p>
                          <p className="text-xl font-bold">
                            {invoices.length > 0 
                              ? formatDate(invoices[0].invoice_date) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Father's Name</h3>
                      <p>{student.father_name || 'Not provided'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Aadhar Number</h3>
                      <p>{student.aadhar || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md border mt-4">
                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-slate-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium">Additional Notes</h3>
                        <p className="text-sm mt-1">
                          No additional notes for this student.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button onClick={handleCreateInvoice}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create New Invoice
                    </Button>
                  </div>
                </CardContent>

                <div className="mt-6">
                  <StudentDueInfo 
                    studentId={studentId} 
                    onCreateInvoice={handleCreateInvoice} 
                  />
                </div>
              </Card>
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        All fee payments made by this student
                      </CardDescription>
                    </div>
                    <Button onClick={handleCreateInvoice}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      New Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileTextIcon className="mx-auto h-12 w-12 text-slate-300" />
                      <h3 className="mt-2 text-lg font-medium">No payments yet</h3>
                      <p className="mt-1 text-slate-500">
                        This student hasn't made any fee payments
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={handleCreateInvoice}
                      >
                        Create First Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.invoice_id}>
                              <TableCell>INV-{invoice.invoice_id}</TableCell>
                              <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                              <TableCell>{invoice.payment_period} months</TableCell>
                              <TableCell>
                                <Badge variant={invoice.payment_method === 'cheque' ? 'outline' : 'secondary'}>
                                  {invoice.payment_method === 'cheque' ? 'Cheque' : 'Online'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(invoice.amount)}
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update student details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit}>
            {formErrors.submit && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditFormChange}
                    className={formErrors.first_name ? "border-red-500" : ""}
                  />
                  {formErrors.first_name && (
                    <p className="text-sm text-red-500">{formErrors.first_name}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    name="surname"
                    value={editForm.surname}
                    onChange={handleEditFormChange}
                    className={formErrors.surname ? "border-red-500" : ""}
                  />
                  {formErrors.surname && (
                    <p className="text-sm text-red-500">{formErrors.surname}</p>
                  )}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="father_name">Father's Name</Label>
                <Input
                  id="father_name"
                  name="father_name"
                  value={editForm.father_name}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditFormChange}
                  className={formErrors.address ? "border-red-500" : ""}
                  rows={3}
                />
                {formErrors.address && (
                  <p className="text-sm text-red-500">{formErrors.address}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={editForm.city}
                  onChange={handleEditFormChange}
                  className={formErrors.city ? "border-red-500" : ""}
                />
                {formErrors.city && (
                  <p className="text-sm text-red-500">{formErrors.city}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="personal_phone">Phone Number</Label>
                  <Input
                    id="personal_phone"
                    name="personal_phone"
                    value={editForm.personal_phone}
                    onChange={handleEditFormChange}
                    className={formErrors.personal_phone ? "border-red-500" : ""}
                  />
                  {formErrors.personal_phone && (
                    <p className="text-sm text-red-500">{formErrors.personal_phone}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="parent_phone">Parent Phone</Label>
                  <Input
                    id="parent_phone"
                    name="parent_phone"
                    value={editForm.parent_phone}
                    onChange={handleEditFormChange}
                    className={formErrors.parent_phone ? "border-red-500" : ""}
                  />
                  {formErrors.parent_phone && (
                    <p className="text-sm text-red-500">{formErrors.parent_phone}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="college">College/Institution</Label>
                  <Input
                    id="college"
                    name="college"
                    value={editForm.college}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="stream">Stream/Course</Label>
                  <Input
                    id="stream"
                    name="stream"
                    value={editForm.stream}
                    onChange={handleEditFormChange}
                  />
                </div>
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="font-medium">
              Student: {student.first_name} {student.surname}
            </p>
            <p className="text-sm text-slate-500">
              Roll No: {student.roll_no}
            </p>
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
              onClick={handleDeleteStudent}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Student as Left Dialog */}
      {student && (
        <MarkStudentLeftDialog
          isOpen={markLeftDialogOpen}
          onClose={() => setMarkLeftDialogOpen(false)}
          student={student}
          onSuccess={handleStudentStatusChange}
        />
      )}

      {/* Retrieve Student Dialog */}
      {student && (
        <RetrieveStudentDialog
          isOpen={retrieveDialogOpen}
          onClose={() => setRetrieveDialogOpen(false)}
          student={student}
          onSuccess={handleStudentStatusChange}
        />
      )}
    </div>
  );
};

export default StudentDetail;
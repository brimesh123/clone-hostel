import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Import icons
import { SaveIcon, ArrowLeftIcon } from "lucide-react";

const AddStudentForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    fatherName: '',
    surname: '',
    address: '',
    city: '',
    aadhar: '',
    personal_phone: '',
    parentPhone: '',
    college: '',
    stream: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hostelInfo, setHostelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  
  const navigate = useNavigate();

  // Fetch hostel info for the logged-in receptionist
  useEffect(() => {
    const fetchHostelInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/api/hostels/current`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to fetch hostel information');
        const data = await response.json();
        setHostelInfo(data);
        setError(null);
      } catch (err) {
        setError('Failed to load hostel information. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostelInfo();
  }, []);

  // Format Aadhar number with spaces for better readability
  const formatAadhar = (value) => {
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format with spaces after every 4 digits
    if (cleaned.length > 8) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
    } else if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  // Handle form field changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Input validation and formatting based on field type
    if (name === 'aadhar') {
      // Remove non-digits and limit to 12 characters
      const digitsOnly = value.replace(/\D/g, '');
      newValue = digitsOnly.slice(0, 12);
      
      // Clear any specific error as user is typing
      if (errors.aadhar) {
        setErrors(prev => ({ ...prev, aadhar: '' }));
      }
    } 
    else if (name === 'personal_phone' || name === 'parentPhone') {
      // Allow only digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, '');
      newValue = digitsOnly.slice(0, 10);
      
      // Clear any specific error as user is typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    setFormData({ ...formData, [name]: newValue });
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    // Validate Aadhar (should be exactly 12 digits)
    if (!formData.aadhar) {
      newErrors.aadhar = 'Aadhar number is required';
    } else if (formData.aadhar.length !== 12) {
      newErrors.aadhar = 'Aadhar number must be exactly 12 digits';
    }
    
    // Validate phone numbers (should be exactly 10 digits)
    if (!formData.personal_phone) {
      newErrors.personal_phone = 'Phone number is required';
    } else if (formData.personal_phone.length !== 10) {
      newErrors.personal_phone = 'Phone number must be exactly 10 digits';
    }
    
    if (!formData.parentPhone) {
      newErrors.parentPhone = 'Parent phone number is required';
    } else if (formData.parentPhone.length !== 10) {
      newErrors.parentPhone = 'Parent phone number must be exactly 10 digits';
    }
    
    // Validate college and stream
    if (!formData.college.trim()) newErrors.college = 'College name is required';
    if (!formData.stream.trim()) newErrors.stream = 'Stream is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to the next tab
  const goToNextTab = () => {
    // Validate the personal tab fields before moving to next tab
    const personalFieldErrors = {};
    
    if (!formData.firstName.trim()) personalFieldErrors.firstName = 'First name is required';
    if (!formData.surname.trim()) personalFieldErrors.surname = 'Surname is required';
    if (!formData.address.trim()) personalFieldErrors.address = 'Address is required';
    if (!formData.city.trim()) personalFieldErrors.city = 'City is required';
    
    if (!formData.aadhar) {
      personalFieldErrors.aadhar = 'Aadhar number is required';
    } else if (formData.aadhar.length !== 12) {
      personalFieldErrors.aadhar = 'Aadhar number must be exactly 12 digits';
    }
    
    if (Object.keys(personalFieldErrors).length > 0) {
      setErrors(personalFieldErrors);
      return;
    }
    
    setActiveTab("academic");
  };

  // Navigate to the previous tab
  const goToPreviousTab = () => {
    setActiveTab("personal");
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // If there are errors in the personal tab, switch to that tab
      if (errors.firstName || errors.surname || errors.address || errors.city || errors.aadhar) {
        setActiveTab("personal");
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      // Compute admission_date as the first day of the current month (format: YYYY-MM-01)
      const admission_date = new Date(currentYear, now.getMonth(), 2).toISOString().split('T')[0];
      
      // Format data for backend
      const studentData = {
        first_name: formData.firstName,
        father_name: formData.fatherName,
        surname: formData.surname,
        address: formData.address,
        city: formData.city,
        aadhar: formData.aadhar,
        personal_phone: formData.personal_phone,
        parent_phone: formData.parentPhone,
        college: formData.college,
        stream: formData.stream,
        hostel_id: hostelInfo.hostel_id,
        admission_date: admission_date  // send admission_date with month and year
      };
      
      // Submit data to backend
      const response = await fetch(`${config.backendUrl}/api/students/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add student');
      }
      
      const result = await response.json();
      
      // Navigate to the student detail page
      navigate(`/student/${result.studentId}`);
      
    } catch (error) {
      console.error('Error adding student:', error);
      setErrors({ submit: error.message || 'Failed to add student. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <header className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/students')}
          className="mr-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Student</h1>
          <p className="text-slate-500 mt-1">Register a new student to the hostel</p>
        </div>
      </header>

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
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-8">
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="academic">Academic & Contact</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Enter the student's personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {errors.submit && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.submit}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-500">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="fatherName">Father's Name</Label>
                      <Input
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      className={errors.surname ? "border-red-500" : ""}
                    />
                    {errors.surname && (
                      <p className="text-sm text-red-500">{errors.surname}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={errors.address ? "border-red-500" : ""}
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500">{errors.address}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="aadhar">Aadhar Number *</Label>
                    <Input
                      id="aadhar"
                      name="aadhar"
                      value={formatAadhar(formData.aadhar)}
                      onChange={handleChange}
                      className={errors.aadhar ? "border-red-500" : ""}
                      placeholder="XXXX XXXX XXXX"
                      inputMode="numeric" // Brings up the numeric keyboard on mobile
                    />
                    {errors.aadhar && (
                      <p className="text-sm text-red-500">{errors.aadhar}</p>
                    )}
                    <p className="text-xs text-slate-500">Enter your 12-digit Aadhar card number</p>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={() => navigate('/students')}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="academic">
              <Card>
                <CardHeader>
                  <CardTitle>Academic & Contact Information</CardTitle>
                  <CardDescription>Enter educational and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="personal_phone">Phone Number *</Label>
                      <Input
                        id="personal_phone"
                        name="personal_phone"
                        value={formData.personal_phone}
                        onChange={handleChange}
                        className={errors.personal_phone ? "border-red-500" : ""}
                        placeholder="10-digit phone number"
                        inputMode="tel" // Brings up the telephone keyboard on mobile
                      />
                      {errors.personal_phone && (
                        <p className="text-sm text-red-500">{errors.personal_phone}</p>
                      )}
                      <p className="text-xs text-slate-500">Enter 10-digit mobile number without country code</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="parentPhone">Parent Phone Number *</Label>
                      <Input
                        id="parentPhone"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleChange}
                        className={errors.parentPhone ? "border-red-500" : ""}
                        placeholder="10-digit phone number"
                        inputMode="tel" // Brings up the telephone keyboard on mobile
                      />
                      {errors.parentPhone && (
                        <p className="text-sm text-red-500">{errors.parentPhone}</p>
                      )}
                      <p className="text-xs text-slate-500">Enter 10-digit mobile number without country code</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="college">College/Institution *</Label>
                    <Input
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className={errors.college ? "border-red-500" : ""}
                    />
                    {errors.college && (
                      <p className="text-sm text-red-500">{errors.college}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="stream">Stream/Course *</Label>
                    <Input
                      id="stream"
                      name="stream"
                      value={formData.stream}
                      onChange={handleChange}
                      className={errors.stream ? "border-red-500" : ""}
                      placeholder="E.g., Engineering, Medical, Arts"
                    />
                    {errors.stream && (
                      <p className="text-sm text-red-500">{errors.stream}</p>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="p-4 bg-slate-50 rounded-md border">
                    <h3 className="font-medium mb-2">Hostel Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Hostel Name:</span>
                        <span className="ml-2">{hostelInfo?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Hostel Type:</span>
                        <span className="ml-2 capitalize">{hostelInfo?.hostel_type}</span>
                      </div>
                      <div>
                        <span className="font-medium">6-Month Fee:</span>
                        <span className="ml-2">₹ {parseFloat(hostelInfo?.fee_6_month).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-medium">12-Month Fee:</span>
                        <span className="ml-2">₹ {parseFloat(hostelInfo?.fee_12_month).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousTab}
                  >
                    Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Student"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </div>
  );
};

export default AddStudentForm;
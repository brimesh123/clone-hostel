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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

// Import icons
import { FileTextIcon, ArrowLeftIcon, PrinterIcon, SaveIcon } from "lucide-react";

const InvoiceForm = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [hostelInfo, setHostelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentPeriod: '6',  // Default to 6 months
    paymentMethod: 'cheque',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    transactionId: '',
    transactionDate: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  
  // Calculate amount based on selected payment period
  const calculateAmount = () => {
    if (!hostelInfo) return 0;
    
    // Make sure we're parsing the fee values as floats
    const fee6Month = parseFloat(hostelInfo.fee_6_month || 0);
    const fee12Month = parseFloat(hostelInfo.fee_12_month || 0);
    
    // Return the appropriate fee based on the selected payment period
    return formData.paymentPeriod === '6' ? fee6Month : fee12Month;
  };
  
  // Format currency to display as Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Fetch student and hostel info
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch student details
        const studentResponse = await fetch(`${config.backendUrl}/api/students/${studentId}`, {
          credentials: 'include',
        });
        
        if (!studentResponse.ok) throw new Error('Failed to fetch student information');
        const studentData = await studentResponse.json();
        setStudent(studentData);
        
        // Fetch hostel details
        const hostelResponse = await fetch(`${config.backendUrl}/api/hostels/current`, {
          credentials: 'include',
        });
        
        if (!hostelResponse.ok) throw new Error('Failed to fetch hostel information');
        const hostelData = await hostelResponse.json();
        setHostelInfo(hostelData);
        
        console.log('Fetched hostel data:', hostelData); // Debug log
        
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    
    // Clear error
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate payment method specific fields
    if (formData.paymentMethod === 'cheque') {
      if (!formData.chequeNumber.trim()) newErrors.chequeNumber = 'Cheque number is required';
      if (!formData.chequeDate.trim()) newErrors.chequeDate = 'Cheque date is required';
      if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    } else if (formData.paymentMethod === 'online') {
      if (!formData.transactionId.trim()) newErrors.transactionId = 'Transaction ID is required';
      if (!formData.transactionDate.trim()) newErrors.transactionDate = 'Transaction date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const amount = calculateAmount();
      const invoiceDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      
      // Prepare invoice data
      const invoiceData = {
        student_id: parseInt(studentId),
        invoice_date: invoiceDate,
        amount: amount,
        payment_period: parseInt(formData.paymentPeriod),
        payment_method: formData.paymentMethod,
        payment_details: formData.paymentMethod === 'cheque' 
          ? {
              cheque_number: formData.chequeNumber,
              cheque_date: formData.chequeDate,
              bank_name: formData.bankName
            }
          : {
              transaction_id: formData.transactionId,
              transaction_date: formData.transactionDate
            },
        notes: formData.notes
      };
      
      // Submit invoice to backend
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
      
      // Navigate to invoice view page
      navigate(`/invoice/${result.invoiceId}`);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrors({ submit: error.message || 'Failed to create invoice. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate invoice number (just for display)
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV-${year}${month}${day}-${random}`;
  };
  
  // Debug function to check hostelInfo state
  const debugHostelInfo = () => {
    console.log('Current hostelInfo state:', hostelInfo);
    console.log('Calculated amount:', calculateAmount());
    return null;
  };
  
  return (
    <div className="container py-6">
      {debugHostelInfo()}
      
      <header className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/students')}
          className="mr-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-slate-500 mt-1">Generate a new payment invoice for the student</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Details of the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-slate-500">Full Name</label>
                <p className="font-medium">{student?.first_name} {student?.surname}</p>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">Roll Number</label>
                <p className="font-medium">{student?.roll_no}</p>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">College</label>
                <p>{student?.college}</p>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">Stream</label>
                <p>{student?.stream}</p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-xs text-slate-500">Contact Number</label>
                <p>{student?.personal_phone}</p>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">Parent Contact</label>
                <p>{student?.parent_phone}</p>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">Address</label>
                <p>{student?.address}, {student?.city}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Invoice Form Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Invoice #{generateInvoiceNumber()} | Date: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {errors.submit && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-6">
                  {/* Payment Period */}
                  <div className="space-y-2">
                    <Label>Payment Period</Label>
                    <RadioGroup 
                      defaultValue={formData.paymentPeriod}
                      onValueChange={(value) => handleSelectChange('paymentPeriod', value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6" id="period-6" />
                        <Label htmlFor="period-6" className="cursor-pointer">
                          6 Months ({hostelInfo && formatCurrency(hostelInfo.fee_6_month)})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="12" id="period-12" />
                        <Label htmlFor="period-12" className="cursor-pointer">
                          12 Months ({hostelInfo && formatCurrency(hostelInfo.fee_12_month)})
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup 
                      defaultValue={formData.paymentMethod}
                      onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cheque" id="method-cheque" />
                        <Label htmlFor="method-cheque" className="cursor-pointer">
                          Cheque
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="method-online" />
                        <Label htmlFor="method-online" className="cursor-pointer">
                          Online Transfer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Conditional fields based on payment method */}
                  {formData.paymentMethod === 'cheque' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="chequeNumber">Cheque Number *</Label>
                        <Input
                          id="chequeNumber"
                          name="chequeNumber"
                          value={formData.chequeNumber}
                          onChange={handleChange}
                          className={errors.chequeNumber ? "border-red-500" : ""}
                        />
                        {errors.chequeNumber && (
                          <p className="text-sm text-red-500">{errors.chequeNumber}</p>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="chequeDate">Cheque Date *</Label>
                        <Input
                          id="chequeDate"
                          name="chequeDate"
                          type="date"
                          value={formData.chequeDate}
                          onChange={handleChange}
                          className={errors.chequeDate ? "border-red-500" : ""}
                        />
                        {errors.chequeDate && (
                          <p className="text-sm text-red-500">{errors.chequeDate}</p>
                        )}
                      </div>
                      
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          className={errors.bankName ? "border-red-500" : ""}
                        />
                        {errors.bankName && (
                          <p className="text-sm text-red-500">{errors.bankName}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="transactionId">Transaction ID *</Label>
                        <Input
                          id="transactionId"
                          name="transactionId"
                          value={formData.transactionId}
                          onChange={handleChange}
                          className={errors.transactionId ? "border-red-500" : ""}
                        />
                        {errors.transactionId && (
                          <p className="text-sm text-red-500">{errors.transactionId}</p>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="transactionDate">Transaction Date *</Label>
                        <Input
                          id="transactionDate"
                          name="transactionDate"
                          type="date"
                          value={formData.transactionDate}
                          onChange={handleChange}
                          className={errors.transactionDate ? "border-red-500" : ""}
                        />
                        {errors.transactionDate && (
                          <p className="text-sm text-red-500">{errors.transactionDate}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional information or special instructions"
                      rows={3}
                    />
                  </div>
                  
                  {/* Amount Summary */}
                  <div className="bg-slate-50 p-4 rounded-md border">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Total Amount</h3>
                        <p className="text-sm text-slate-500">
                          {formData.paymentPeriod === '6' ? '6 months' : '12 months'} payment
                        </p>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(calculateAmount())}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => navigate('/students')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
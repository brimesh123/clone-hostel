// src/components/m_components/AddHostelModal.jsx
import React, { useState } from 'react';

// Import shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

const AddHostelModal = ({ isOpen, onClose, onAddHostel }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    fee_6_month: '',
    fee_12_month: '',
    hostel_type: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      hostel_type: value,
    });
    
    // Clear error
    if (errors.hostel_type) {
      setErrors({
        ...errors,
        hostel_type: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Hostel name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.hostel_type) newErrors.hostel_type = 'Hostel type is required';
    if (!formData.fee_6_month) newErrors.fee_6_month = '6-month fee is required';
    if (!formData.fee_12_month) newErrors.fee_12_month = '12-month fee is required';
    
    // Validate fee amounts are numbers
    if (formData.fee_6_month && isNaN(parseFloat(formData.fee_6_month))) {
      newErrors.fee_6_month = 'Must be a valid number';
    }
    
    if (formData.fee_12_month && isNaN(parseFloat(formData.fee_12_month))) {
      newErrors.fee_12_month = 'Must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Format fee values as decimals
      const submitData = {
        ...formData,
        fee_6_month: parseFloat(formData.fee_6_month),
        fee_12_month: parseFloat(formData.fee_12_month),
      };
      
      await onAddHostel(submitData);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        username: '',
        password: '',
        fee_6_month: '',
        fee_12_month: '',
        hostel_type: '',
      });
    } catch (error) {
      console.error('Error adding hostel:', error);
      setErrors({ submit: 'Failed to add hostel. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Hostel</DialogTitle>
          <DialogDescription>
            Create a new hostel and provide credentials for the reception admin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          {errors.submit && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Hostel Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter hostel name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username for hostel admin"
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password for hostel admin"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="hostel_type">Hostel Type</Label>
              <Select 
                value={formData.hostel_type} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger 
                  id="hostel_type"
                  className={errors.hostel_type ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select Hostel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
              {errors.hostel_type && (
                <p className="text-sm text-red-500">{errors.hostel_type}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fee_6_month">6-Month Fee</Label>
                <Input
                  id="fee_6_month"
                  name="fee_6_month"
                  value={formData.fee_6_month}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.fee_6_month ? "border-red-500" : ""}
                />
                {errors.fee_6_month && (
                  <p className="text-sm text-red-500">{errors.fee_6_month}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fee_12_month">12-Month Fee</Label>
                <Input
                  id="fee_12_month"
                  name="fee_12_month"
                  value={formData.fee_12_month}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.fee_12_month ? "border-red-500" : ""}
                />
                {errors.fee_12_month && (
                  <p className="text-sm text-red-500">{errors.fee_12_month}</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Hostel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHostelModal;
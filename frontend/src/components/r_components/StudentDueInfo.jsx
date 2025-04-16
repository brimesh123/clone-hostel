// components/r_components/StudentDueInfo.jsx
import React, { useState, useEffect } from 'react';
import config from '../../config';

// Import shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, AlertCircle, CheckCircle } from "lucide-react";

const StudentDueInfo = ({ studentId, onCreateInvoice }) => {
  const [dueInfo, setDueInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days until due or days overdue
  const getDueDaysText = () => {
    if (!dueInfo || !dueInfo.nextDueDate) return '';

    const nextDueDate = new Date(dueInfo.nextDueDate);
    const today = new Date();
   
    // Calculate difference in days
    const diffTime = nextDueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   
    if (diffDays > 0) {
      return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else {
      return 'Due today';
    }
  };

  // Fetch due information
  useEffect(() => {
    const fetchDueInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/api/dues/student/${studentId}`, {
          credentials: 'include',
        });
       
        if (!response.ok) throw new Error('Failed to fetch due information');
       
        const data = await response.json();
        setDueInfo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching due information:', err);
        setError('Failed to load due information.');
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchDueInfo();
    }
  }, [studentId]);

  if (isLoading) {
    return (
      
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='px-6'>
      <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          Payment Status
          {dueInfo?.hasDues ? (
            <Badge variant="destructive" className="ml-2">Due</Badge>
          ) : (
            <Badge variant="success" className="ml-2">Paid</Badge>
          )}
        </CardTitle>
        <CardDescription>Fee payment information</CardDescription>
      </CardHeader>
      <CardContent>
        {dueInfo?.hasDues ? (
          <>
            <div className="flex items-start mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium text-red-500">Payment Due</p>
                <p className="text-sm">{getDueDaysText()}</p>
              </div>
            </div>
           
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Due Amount:</span>
                <span className="font-bold text-red-500">
                  {formatCurrency(dueInfo.dueAmount)}
                </span>
              </div>
             
              <div className="flex justify-between">
                <span className="text-sm font-medium">Due Date:</span>
                <span>{formatDate(dueInfo.nextDueDate)}</span>
              </div>
             
              {dueInfo.lastPaymentDate && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Payment:</span>
                  <span>{formatDate(dueInfo.lastPaymentDate)}</span>
                </div>
              )}
              
              {dueInfo.daysOverdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Overdue By:</span>
                  <Badge variant="destructive">
                    {dueInfo.daysOverdue} days
                  </Badge>
                </div>
              )}
            </div>
           
            <Button
              className="w-full mt-4"
              onClick={onCreateInvoice}
            >
              Pay Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium text-green-500">Payment Up to Date</p>
                <p className="text-sm">No dues pending</p>
              </div>
            </div>
           
            <div className="space-y-3">
              {dueInfo.nextDueDate && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Next Due Date:</span>
                  <span>{formatDate(dueInfo.nextDueDate)}</span>
                </div>
              )}
             
              {dueInfo.lastPaymentDate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Payment:</span>
                    <span>{formatDate(dueInfo.lastPaymentDate)}</span>
                  </div>
                 
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Amount Paid:</span>
                    <span className="font-medium text-green-500">
                      {formatCurrency(dueInfo.lastPaymentAmount)}
                    </span>
                  </div>
                 
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Payment Period:</span>
                    <span>{dueInfo.paymentPeriod} months</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

export default StudentDueInfo;
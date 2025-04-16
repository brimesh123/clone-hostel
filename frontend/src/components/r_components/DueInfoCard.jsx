import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

// Import shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Import icons
import { AlertCircle, ArrowUpRight } from "lucide-react";

const DueInfoCard = ({ hostelId }) => {
  const [dueStats, setDueStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchDueInfo = async () => {
      if (!hostelId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/api/dues/hostel/${hostelId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to fetch due information');
        
        const data = await response.json();
        
        // Calculate stats
        const totalDueStudents = data.length;
        const totalDueAmount = data.reduce((sum, student) => sum + student.dueAmount, 0);
        const urgentDues = data.filter(student => student.daysOverdue > 30).length;
        
        setDueStats({
          totalDueStudents,
          totalDueAmount,
          urgentDues
        });
      } catch (err) {
        console.error('Error fetching due information:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDueInfo();
  }, [hostelId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dueStats || dueStats.totalDueStudents === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-green-600">
            <Badge variant="outline" className="bg-green-50">All Paid</Badge>
            <span className="text-sm">All students are up to date with payments</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={dueStats.urgentDues > 0 ? "border-red-200" : ""}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className={`mr-2 h-5 w-5 ${dueStats.urgentDues > 0 ? 'text-red-500' : 'text-amber-500'}`} />
          Payment Alerts
        </CardTitle>
        <CardDescription>
          Students with pending fee payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Students with dues:</span>
            <span className="font-medium">{dueStats.totalDueStudents}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Total due amount:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(dueStats.totalDueAmount)}
            </span>
          </div>
          
          {dueStats.urgentDues > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Urgent 30 days:</span>
              <Badge variant="destructive">{dueStats.urgentDues}</Badge>
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full mt-2"
            onClick={() => navigate('/dues')}
          >
            Manage Dues
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DueInfoCard;
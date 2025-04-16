// src/components/m_components/AcademicStatsSummary.jsx
import React, { useState, useEffect } from 'react';
import config from '../../../config';

// Import UI components
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Import icons
import { CalendarIcon, BarChartIcon } from "lucide-react";

const AcademicStatsSummary = ({ hostelId }) => {
  const [termData, setTermData] = useState([]);
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

  useEffect(() => {
    const fetchAcademicStatsSummary = async () => {
      if (!hostelId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/api/invoices/academic-stats/hostel/${hostelId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to fetch academic stats summary');
        
        const data = await response.json();
        setTermData(data);
      } catch (err) {
        console.error('Error fetching academic stats summary:', err);
        setError(err.message || 'Failed to load academic terms summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicStatsSummary();
  }, [hostelId]);

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 mt-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {Array(3).fill().map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (termData.length === 0) {
    return (
      <div className="rounded-md border p-4 mt-4">
        <h3 className="font-medium mb-2">Academic Terms Summary</h3>
        <p className="text-center py-6 text-slate-500">No academic terms data available yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4 mt-4">
      <h3 className="font-medium mb-4 flex items-center">
        <CalendarIcon className="mr-2 h-5 w-5" />
        Academic Terms Summary
      </h3>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Academic Term</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>6-Month</TableHead>
              <TableHead>12-Month</TableHead>
              <TableHead>Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {termData.map((term) => (
              <TableRow key={term.academic_stats}>
                <TableCell className="font-medium">
                  {term.term_display}
                  {term.academic_stats === getCurrentAcademicStats() && (
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600">Current</Badge>
                  )}
                </TableCell>
                <TableCell>{term.student_count}</TableCell>
                <TableCell>{term.invoice_count}</TableCell>
                <TableCell>{term.six_month_count}</TableCell>
                <TableCell>{term.twelve_month_count}</TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(term.total_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Helper function to get current academic stats
const getCurrentAcademicStats = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  // Academic year runs June-May
  const academicYearStart = month >= 6 ? year : year - 1;
  const academicYearEnd = academicYearStart + 1;
  
  // 1 = Jun-Nov, 2 = Dec-May
  const academicHalf = month >= 6 && month <= 11 ? 1 : 2;
  
  return `${academicYearStart.toString().slice(-2)}${academicYearEnd.toString().slice(-2)}${academicHalf}`;
};

export default AcademicStatsSummary;
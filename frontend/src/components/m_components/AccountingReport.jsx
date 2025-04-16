// components/m_components/AccountingReport.jsx
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

// Import icons
import {
  DownloadIcon,
  RefreshCwIcon,
  CalendarIcon,
  BarChart2Icon,
  BarChartIcon
} from "lucide-react";

const AccountingReport = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [currentAcademicYear, setCurrentAcademicYear] = useState('');
  const [accountingData, setAccountingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Load academic years
  const loadAcademicYears = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/students/academic-years`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch academic years');
      
      const years = await response.json();
      setAcademicYears(years);
      
      // Get current academic year
      const currentYearResponse = await fetch(`${config.backendUrl}/api/students/current-academic-year`, {
        credentials: 'include',
      });
      
      if (currentYearResponse.ok) {
        const { academicYear } = await currentYearResponse.json();
        setCurrentAcademicYear(academicYear);
        setSelectedYear(academicYear); // Default to current academic year
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      setError('Failed to load academic years. Please try again later.');
    }
  };

  // Fetch accounting data for selected academic year
  const fetchAccountingData = async () => {
    if (!selectedYear) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch hostel list first
      const hostelsResponse = await fetch(`${config.backendUrl}/api/hostels/list`, {
        credentials: 'include',
      });
      
      if (!hostelsResponse.ok) throw new Error('Failed to fetch hostels');
      
      const hostels = await hostelsResponse.ok ? await hostelsResponse.json() : [];
      
      // Get current active student counts for all hostels
      const studentCountResponse = await fetch(`${config.backendUrl}/api/students/count`, {
        credentials: 'include',
      });
      
      const studentCounts = studentCountResponse.ok ? await studentCountResponse.json() : [];
      
      // Get student counts and payment data per hostel
      const hostelData = await Promise.all(hostels.map(async (hostel) => {
        // Get current active student count
        const currentStudentCount = studentCounts.find(
          item => item.hostel_id === hostel.hostel_id
        )?.student_count || 0;
        
        // Get student counts by academic year
        const studentsResponse = await fetch(
          `${config.backendUrl}/api/students/academic-year/${selectedYear}?hostelId=${hostel.hostel_id}`,
          { credentials: 'include' }
        );
        
        const students = studentsResponse.ok ? await studentsResponse.json() : [];
        const academicYearStudents = students.length;
        
        // Get payment breakdown - first we'll split the academic year code
        // For academic year like "2023-2024", we need "2324"
        const yearCode = selectedYear.split('-').map(year => year.slice(2)).join('');
        
        // First half (June-Nov) is period 1, Second half (Dec-May) is period 2
        const firstHalfCode = `${yearCode}1`;  // e.g., "23241"
        const secondHalfCode = `${yearCode}2`; // e.g., "23242"
        
        // Get first half payment data
        const firstHalfResponse = await fetch(
          `${config.backendUrl}/api/invoices/summary/academic-stats/${firstHalfCode}?hostelId=${hostel.hostel_id}`,
          { credentials: 'include' }
        );
        
        const firstHalfData = firstHalfResponse.ok ? await firstHalfResponse.json() : {
          six_month_count: 0,
          twelve_month_count: 0,
          total_amount: 0
        };
        
        // Get second half payment data
        const secondHalfResponse = await fetch(
          `${config.backendUrl}/api/invoices/summary/academic-stats/${secondHalfCode}?hostelId=${hostel.hostel_id}`,
          { credentials: 'include' }
        );
        
        const secondHalfData = secondHalfResponse.ok ? await secondHalfResponse.json() : {
          six_month_count: 0,
          twelve_month_count: 0,
          total_amount: 0
        };
        
        // Calculate totals - ensure we handle null/undefined values to prevent NaN
        const sixMonthStudents = (parseInt(firstHalfData.six_month_count) || 0) + (parseInt(secondHalfData.six_month_count) || 0);
        const twelveMonthStudents = (parseInt(firstHalfData.twelve_month_count) || 0) + (parseInt(secondHalfData.twelve_month_count) || 0);
        const totalRevenue = (parseFloat(firstHalfData.total_amount) || 0) + (parseFloat(secondHalfData.total_amount) || 0);
        
        return {
          hostel_id: hostel.hostel_id,
          hostel_name: hostel.name,
          hostel_type: hostel.hostel_type,
          current_students: currentStudentCount,
          academic_year_students: academicYearStudents,
          six_month_fee: hostel.fee_6_month,
          twelve_month_fee: hostel.fee_12_month,
          six_month_first_half: firstHalfData.six_month_count || 0,
          six_month_second_half: secondHalfData.six_month_count || 0,
          twelve_month_students: twelveMonthStudents,
          total_revenue: totalRevenue
        };
      }));
      
      // Calculate overall totals
      const overall = {
        hostel_name: 'Overall',
        current_students: hostelData.reduce((sum, h) => sum + h.current_students, 0),
        academic_year_students: hostelData.reduce((sum, h) => sum + h.academic_year_students, 0),
        six_month_first_half: hostelData.reduce((sum, h) => sum + parseInt(h.six_month_first_half || 0), 0),
        six_month_second_half: hostelData.reduce((sum, h) => sum + parseInt(h.six_month_second_half || 0), 0),
        twelve_month_students: hostelData.reduce((sum, h) => sum + h.twelve_month_students, 0),
        total_revenue: hostelData.reduce((sum, h) => sum + (parseFloat(h.total_revenue) || 0), 0)
      };
      
      // Combine overall with hostel data
      setAccountingData([overall, ...hostelData]);
      
    } catch (err) {
      console.error('Error fetching accounting data:', err);
      setError('Failed to load accounting data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Fetch accounting data when academic year changes
  useEffect(() => {
    if (selectedYear) {
      fetchAccountingData();
    }
  }, [selectedYear]);

  // Generate CSV for report export
  const handleExportCSV = () => {
    if (!accountingData.length) return;
    
    // Create CSV headers
    const headers = [
      'Hostel',
      'Current Students',
      'Academic Year Students',
      '6-Month Fee',
      '12-Month Fee',
      '6-Month Plan (First Half)',
      '6-Month Plan (Second Half)',
      '12-Month Plan Students',
      'Total Revenue'
    ];
    
    // Create CSV rows
    const rows = accountingData.map(item => [
      item.hostel_name,
      item.current_students,
      item.academic_year_students,
      item.six_month_fee || '',
      item.twelve_month_fee || '',
      item.six_month_first_half,
      item.six_month_second_half,
      item.twelve_month_students,
      item.total_revenue
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Accounting_Report_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Accounting Report</h1>
          <p className="text-slate-500 mt-1">
            Financial summary across all hostels by academic year
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={isLoading || !accountingData.length}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchAccountingData} disabled={isLoading || !selectedYear}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle>Select Academic Year</CardTitle>
              <CardDescription>
                View accounting data for a specific academic year
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-[200px]">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{selectedYear || 'Select Year'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year} {year === currentAcademicYear ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Hostel</TableHead>
                    <TableHead className="font-bold text-right">Current Students</TableHead>
                    
                    <TableHead className="font-bold text-right">6-Month Fee</TableHead>
                    <TableHead className="font-bold text-right">12-Month Fee</TableHead>
                    <TableHead className="font-bold text-right">6-Month (First Half)</TableHead>
                    <TableHead className="font-bold text-right">6-Month (Second Half)</TableHead>
                    <TableHead className="font-bold text-right">12-Month Plan</TableHead>
                    <TableHead className="font-bold text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!accountingData.length ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                        No accounting data available for the selected academic year
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountingData.map((item, index) => (
                      <TableRow 
                        key={index} 
                        className={item.hostel_name === 'Overall' ? 'bg-blue-50 font-medium' : ''}
                      >
                        <TableCell className="font-medium">
                          {item.hostel_name}
                          {item.hostel_type && (
                            <Badge className="ml-2" variant={item.hostel_type === 'boys' ? 'default' : 'secondary'}>
                              {item.hostel_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.current_students}</TableCell>
                      
                        <TableCell className="text-right">
                          {item.six_month_fee ? formatCurrency(item.six_month_fee) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.twelve_month_fee ? formatCurrency(item.twelve_month_fee) : '-'}
                        </TableCell>
                        <TableCell className="text-right">{item.six_month_first_half}</TableCell>
                        <TableCell className="text-right">{item.six_month_second_half}</TableCell>
                        <TableCell className="text-right">{item.twelve_month_students}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_revenue)}
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

      {/* Visual representation */}
      {!isLoading && accountingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visual Summary</CardTitle>
            <CardDescription>
              Academic year {selectedYear} financial breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500">Current Students</p>
                      <p className="text-3xl font-bold">
                        {accountingData[0].current_students}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedYear} Students: {accountingData[0].academic_year_students}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChartIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500">6-Month Plans</p>
                      <p className="text-3xl font-bold">
                        {accountingData[0].six_month_first_half + accountingData[0].six_month_second_half}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <BarChart2Icon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500">12-Month Plans</p>
                      <p className="text-3xl font-bold">
                        {accountingData[0].twelve_month_students}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <BarChart2Icon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(accountingData[0].total_revenue)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <BarChart2Icon className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown by Hostel</CardTitle>
                </CardHeader>
                <CardContent className="h-60 flex items-center justify-center">
                  <div className="w-full space-y-4">
                    {accountingData.slice(1).map((hostel, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{hostel.hostel_name}</span>
                          <span>{formatCurrency(hostel.total_revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`${index % 2 === 0 ? 'bg-blue-600' : 'bg-amber-500'} h-2.5 rounded-full`} 
                            style={{ 
                              width: `${accountingData[0].total_revenue ? 
                                (hostel.total_revenue / accountingData[0].total_revenue) * 100 : 0}%` 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccountingReport;
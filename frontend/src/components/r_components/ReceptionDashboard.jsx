// src/components/r_components/ReceptionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { useAuth } from '../../contexts/authContext';
import DueInfoCard from './DueInfoCard';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import icons
import { 
  Users, Home, FileText, CreditCard, 
  TrendingUp, Calendar, PlusCircle, Search
} from "lucide-react";

const ReceptionDashboard = () => {
  const [hostelInfo, setHostelInfo] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    newStudentsThisMonth: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    sixMonthPayments: 0,
    twelveMonthPayments: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch current hostel info
        const hostelResponse = await fetch(`${config.backendUrl}/api/hostels/current`, {
          credentials: 'include',
        });
        
        if (!hostelResponse.ok) throw new Error('Failed to fetch hostel information');
        const hostelData = await hostelResponse.json();
        setHostelInfo(hostelData);
        
        // Fetch student statistics
        const studentsResponse = await fetch(`${config.backendUrl}/api/students/hostel/${hostelData.hostel_id}`, {
          credentials: 'include',
        });
        
        if (!studentsResponse.ok) throw new Error('Failed to fetch student statistics');
        const studentStats = await studentsResponse.json();
        
        // Fetch payment statistics
        const paymentResponse = await fetch(`${config.backendUrl}/api/invoices/summary/${hostelData.hostel_id}`, {
          credentials: 'include',
        });
        
        if (!paymentResponse.ok) throw new Error('Failed to fetch payment statistics');
        const paymentStats = await paymentResponse.json();
        
        // Fetch recent students
        const recentStudentsResponse = await fetch(`${config.backendUrl}/api/students/recent/${hostelData.hostel_id}?limit=5`, {
          credentials: 'include',
        });
        
        if (!recentStudentsResponse.ok) throw new Error('Failed to fetch recent students');
        const recentStudentsData = await recentStudentsResponse.json();
        setRecentStudents(recentStudentsData);
        
        // Fetch recent invoices
        const recentInvoicesResponse = await fetch(`${config.backendUrl}/api/invoices/recent/${hostelData.hostel_id}?limit=5`, {
          credentials: 'include',
        });
        
        if (!recentInvoicesResponse.ok) throw new Error('Failed to fetch recent invoices');
        const recentInvoicesData = await recentInvoicesResponse.json();
        setRecentInvoices(recentInvoicesData);

        // Call the active student count API
        const countResponse = await fetch(`${config.backendUrl}/api/students/count`, {
          credentials: 'include',
        });
        if (!countResponse.ok) throw new Error('Failed to fetch active student count');
        const countData = await countResponse.json();

        // Since countData is an array, find the count for the current hostel
        const currentCountObj = countData.find(
          (item) => item.hostel_id === hostelData.hostel_id
        );
        const activeStudentCount = currentCountObj ? currentCountObj.student_count : 0;

        // Combine stats
        setStats({
          totalStudents: activeStudentCount || 0,
          newStudentsThisMonth: studentStats.newStudentsThisMonth || 0,
          totalInvoices: paymentStats.invoice_count || 0,
          totalRevenue: paymentStats.total_amount || 0,
          sixMonthPayments: paymentStats.six_month_count || 0,
          twelveMonthPayments: paymentStats.twelve_month_count || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle navigation to student detail page
  const handleViewStudentDetail = (studentId) => {
    navigate(`/student/${studentId}`);
  };
  
  // Handle navigation to invoice detail page
  const handleViewInvoiceDetail = (invoiceId) => {
    navigate(`/invoice/${invoiceId}`);
  };

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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Quick actions
  const quickActions = [
    {
      title: 'Add Student',
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: () => navigate('/add-student'),
      color: 'bg-blue-500'
    },
    {
      title: 'Search Student',
      icon: <Search className="h-5 w-5" />,
      onClick: () => navigate('/search'),
      color: 'bg-green-500'
    },
    {
      title: 'Create Invoice',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => navigate('/students'),
      color: 'bg-purple-500'
    },
    {
      title: 'View All Invoices',
      icon: <CreditCard className="h-5 w-5" />,
      onClick: () => navigate('/invoices'),
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="container py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.username || 'Reception Admin'}
        </h1>
        <p className="text-slate-500 mt-1">
          {hostelInfo ? `${hostelInfo.name} (${hostelInfo.hostel_type === 'boys' ? 'Boys' : 'Girls'} Hostel)` : 'Loading hostel information...'}
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill().map((_, idx) => (
            <Card key={idx} className="w-full">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.onClick}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className={`p-3 rounded-full ${action.color} text-white mb-3`}>
                    {action.icon}
                  </div>
                  <p className="font-medium">{action.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/*  <DueInfoCard /> */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div className="text-3xl font-bold">{stats.totalStudents}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Current living in Hostel
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  From {stats.totalInvoices} invoices
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">6-Month Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-500 mr-3" />
                  <div className="text-3xl font-bold">{stats.sixMonthPayments}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Students with 6-month payment
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">12-Month Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-amber-500 mr-3" />
                  <div className="text-3xl font-bold">{stats.twelveMonthPayments}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Students with 12-month payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="students">Recent Students</TabsTrigger>
              <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Recently Added Students</CardTitle>
                  <CardDescription>
                    New students added to the hostel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentStudents.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No recent students found</p>
                  ) : (
                    <div className="space-y-4">
                      {recentStudents.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleViewStudentDetail(student.id)}
                        >
                          <div className="flex items-center">
                            <div className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                              <Users className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium">{student.first_name} {student.surname}</p>
                              <p className="text-xs text-slate-500">Roll No: {student.roll_no}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{student.college}</p>
                            <p className="text-xs text-slate-500">{formatDate(student.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/students')}
                  >
                    View All Students
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>
                    Latest payment invoices generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentInvoices.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No recent invoices found</p>
                  ) : (
                    <div className="space-y-4">
                      {recentInvoices.map((invoice) => (
                        <div 
                          key={invoice.invoice_id} 
                          className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleViewInvoiceDetail(invoice.invoice_id)}
                        >
                          <div className="flex items-center">
                            <div className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                              <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium">{invoice.first_name} {invoice.surname}</p>
                              <p className="text-xs text-slate-500">
                                {invoice.payment_method === 'cheque' ? 'Cheque Payment' : 'Online Payment'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">{formatCurrency(invoice.amount)}</p>
                            <p className="text-xs text-slate-500">{formatDate(invoice.invoice_date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/invoices')}
                  >
                    View All Invoices
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ReceptionDashboard;
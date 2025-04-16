import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import AddHostelModal from './AddHostelModal';

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import icons
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  BuildingIcon,
  UsersIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  InfoIcon
} from "lucide-react";

const HostelManagement = () => {
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [hostelStats, setHostelStats] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch hostels
  const fetchHostels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/list`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch hostels');
      
      const data = await response.json();
      setHostels(data);
      setFilteredHostels(data);
      setError(null);
    } catch (err) {
      setError('Failed to load hostels. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch hostel statistics
  const fetchHostelStats = async () => {
    try {
      // Get student counts
      const countResponse = await fetch(`${config.backendUrl}/api/students/count`, {
        credentials: 'include',
      });
      
      if (!countResponse.ok) throw new Error('Failed to fetch student counts');
      
      const countData = await countResponse.json();
      
      // Get dues info
      const duesResponse = await fetch(`${config.backendUrl}/api/dues/summary`, {
        credentials: 'include',
      });
      
      if (!duesResponse.ok) throw new Error('Failed to fetch dues summary');
      
      const duesData = await duesResponse.json();
      
      // Combine data
      const stats = {};
      
      countData.forEach(hostelCount => {
        stats[hostelCount.hostel_id] = {
          studentCount: hostelCount.student_count || 0,
          dueCount: 0,
          dueAmount: 0
        };
      });
      
      duesData.forEach(hostelDue => {
        if (stats[hostelDue.hostel_id]) {
          stats[hostelDue.hostel_id].dueCount = hostelDue.students_with_dues || 0;
          stats[hostelDue.hostel_id].dueAmount = hostelDue.total_due_amount || 0;
        }
      });
      
      setHostelStats(stats);
    } catch (err) {
      console.error('Error fetching hostel statistics:', err);
    }
  };

  // Load data
  useEffect(() => {
    fetchHostels();
    fetchHostelStats();
  }, []);

  // Filter hostels based on search term and active tab
  useEffect(() => {
    let filtered = [...hostels];
    
    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(hostel => hostel.hostel_type === activeTab);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(hostel => {
        return (
          hostel.name.toLowerCase().includes(lowercasedTerm) ||
          hostel.username.toLowerCase().includes(lowercasedTerm)
        );
      });
    }
    
    setFilteredHostels(filtered);
  }, [searchTerm, activeTab, hostels]);

  // Handle hostel add
  const handleAddHostel = async (hostelData) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hostelData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hostel');
      }
      
      // Refresh the list
      fetchHostels();
      return true;
    } catch (error) {
      console.error('Error adding hostel:', error);
      throw error;
    }
  };

  // Handle hostel edit
  const handleEditHostel = async (hostelId, hostelData) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/${hostelId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hostelData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hostel');
      }
      
      // Refresh the list
      fetchHostels();
      setSelectedHostel(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating hostel:', error);
      throw error;
    }
  };

  // Handle hostel delete
  const handleDeleteHostel = async () => {
    if (!selectedHostel) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/hostels/${selectedHostel.hostel_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hostel');
      }
      
      // Refresh the list
      fetchHostels();
      setSelectedHostel(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting hostel:', error);
      setError(error.message || 'Failed to delete hostel. Please try again.');
    }
  };

  // Handle view hostel details
  const handleViewHostel = (hostel) => {
    setSelectedHostel(hostel);
    // In a real app, you might navigate to a detailed view
    // For now, we'll just use an edit modal
    setIsEditModalOpen(true);
    navigate(`/hostel/${hostel.hostel_id}`);
  };

  // Handle edit hostel
  const handleEditClick = (hostel) => {
    setSelectedHostel(hostel);
    setIsEditModalOpen(true);
  };

  // Handle delete hostel click
  const handleDeleteClick = (hostel) => {
    setSelectedHostel(hostel);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Hostel Management</h1>
          <p className="text-slate-500 mt-1">
            Create and manage hostels in the system
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add New Hostel
        </Button>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle>Hostels</CardTitle>
              <CardDescription>
                List of all hostels in the system
              </CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 md:mt-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="boys">Boys</TabsTrigger>
                <TabsTrigger value="girls">Girls</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search hostels by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button variant="outline" onClick={fetchHostels}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill().map((_, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Fee Structure</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHostels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                        <div className="flex flex-col items-center">
                          <BuildingIcon className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="font-medium">No hostels found</p>
                          <p className="text-sm">
                            {searchTerm
                              ? 'Try adjusting your search'
                              : 'Get started by adding your first hostel'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHostels.map((hostel) => (
                      <TableRow key={hostel.hostel_id}>
                        <TableCell>
                          <div className="font-medium">{hostel.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={hostel.hostel_type === 'boys' ? 'default' : 'secondary'}>
                            {hostel.hostel_type === 'boys' ? 'Boys' : 'Girls'}
                          </Badge>
                        </TableCell>
                        <TableCell>{hostel.username}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center">
                              <UsersIcon className="h-3.5 w-3.5 text-slate-400 mr-1" />
                              <span className="text-sm">{
                                hostelStats[hostel.hostel_id]?.studentCount || 0
                              } students</span>
                            </div>
                            {(hostelStats[hostel.hostel_id]?.dueCount > 0) && (
                              <div className="flex items-center text-red-500 text-xs">
                                <InfoIcon className="h-3 w-3 mr-1" />
                                {hostelStats[hostel.hostel_id]?.dueCount} with dues
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>6 months:</span>
                              <span className="font-medium">{formatCurrency(hostel.fee_6_month)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>12 months:</span>
                              <span className="font-medium">{formatCurrency(hostel.fee_12_month)}</span>
                            </div>
                          </div>
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
                              <DropdownMenuItem onClick={() => handleViewHostel(hostel)}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(hostel)}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit Hostel
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(hostel)}
                                className="text-red-600"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Delete Hostel
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
          )}
        </CardContent>
      </Card>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hostel Types</CardTitle>
            <CardDescription>Distribution of hostel types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-xs text-slate-500 mb-1">Boys Hostels</div>
                <div className="text-2xl font-bold">
                  {filteredHostels.filter(h => h.hostel_type === 'boys').length}
                </div>
              </div>
              <div className="bg-pink-50 p-4 rounded-md">
                <div className="text-xs text-slate-500 mb-1">Girls Hostels</div>
                <div className="text-2xl font-bold">
                  {filteredHostels.filter(h => h.hostel_type === 'girls').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Distribution</CardTitle>
            <CardDescription>Total students in all hostels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold">
                {Object.values(hostelStats).reduce((sum, stat) => sum + (stat.studentCount || 0), 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Students across {filteredHostels.length} hostels
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Hostel Modal */}
      <AddHostelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHostel={handleAddHostel}
      />

      {/* Edit Hostel Modal */}
      {selectedHostel && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Hostel</DialogTitle>
              <DialogDescription>
                Update the hostel information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Hostel Name</Label>
                <Input
                  defaultValue={selectedHostel.name}
                  placeholder="Enter hostel name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>6-Month Fee</Label>
                  <Input
                    defaultValue={selectedHostel.fee_6_month}
                    placeholder="0.00"
                    type="number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>12-Month Fee</Label>
                  <Input
                    defaultValue={selectedHostel.fee_12_month}
                    placeholder="0.00"
                    type="number"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Administrator Username</Label>
                <Input
                  defaultValue={selectedHostel.username}
                  placeholder="Enter admin username"
                  disabled
                />
                <p className="text-xs text-slate-500">
                  Username cannot be changed
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this hostel? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedHostel && (
            <div className="py-4">
              <p className="font-medium">{selectedHostel.name}</p>
              <p className="text-sm text-slate-500">
                Type: {selectedHostel.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
              </p>
              {hostelStats[selectedHostel.hostel_id]?.studentCount > 0 && (
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-800">
                    Warning: This hostel has {hostelStats[selectedHostel.hostel_id]?.studentCount} active students. 
                    Deleting it will affect these student accounts.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHostel}>
              Delete Hostel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelManagement;
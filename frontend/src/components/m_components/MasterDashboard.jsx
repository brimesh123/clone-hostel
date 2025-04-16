// src/components/m_components/MasterDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddHostelModal from './AddHostelModal';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Import icons
import { 
  PlusIcon, 
  BuildingIcon,
  BarChartIcon,
  UsersIcon,
  AlertCircleIcon,
} from "lucide-react";

const fetchHostels = async () => {
  try {
    const response = await fetch(`${config.backendUrl}/api/hostels/list`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch hostels');
    return await response.json();
  } catch (error) {
    console.error('Error fetching hostels:', error);
    throw error;
  }
};

const createHostel = async (hostelData) => {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error creating hostel:', error);
    throw error;
  }
};

const MasterDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();

  const loadHostels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHostels();
      setHostels(data);
    } catch (err) {
      setError('Failed to load hostels. Please try again later.');
      setIsAlertOpen(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
  }, []);

  const handleAddHostel = async (hostelData) => {
    try {
      await createHostel(hostelData);
      await loadHostels(); // Refresh the list after adding a hostel
      return true;
    } catch (error) {
      console.error('Error adding hostel:', error);
      throw error;
    }
  };

  // Fixed: Moved handleViewHostel inside the component
  const handleViewHostel = (hostel) => {
    navigate(`/hostel/${hostel.hostel_id}`);
  };

  return (
    <div className="container py-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Master Admin Dashboard</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add New Hostel
        </Button>
      </header>

      {error && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error</AlertDialogTitle>
              <AlertDialogDescription>
                {error}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Okay</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Skeleton loading states
          Array(4).fill().map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual hostel cards with numbering
          hostels.map((hostel, index) => (
            <Card key={hostel.hostel_id} className="overflow-hidden relative">
              {/* Added Badge for hostel ID */}
              <Badge className="absolute top-2 right-2 bg-blue-500 text-white">ID: {hostel.hostel_id}</Badge>
              <CardHeader className="pb-2">
                <CardTitle>{hostel.name}</CardTitle>
                <CardDescription>
                  Type: {hostel.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{hostel.username}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">6-Month Fee:</span>
                    <span>₹ {parseFloat(hostel.fee_6_month).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">12-Month Fee:</span>
                    <span>₹ {parseFloat(hostel.fee_12_month).toFixed(2)}</span>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => handleViewHostel(hostel)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}

        {/* Add Hostel Card */}
        <Card 
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          <BuildingIcon className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-sm font-medium text-slate-600">Add New Hostel</p>
        </Card>
      </div>

      <AddHostelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddHostel={handleAddHostel}
      />
    </div>
  );
};

export default MasterDashboard;
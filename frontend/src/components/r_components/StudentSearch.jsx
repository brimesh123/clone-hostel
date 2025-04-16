// src/components/r_components/StudentSearch.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import icons
import { 
  SearchIcon, 
  UserIcon, 
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";

const StudentSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchBy, setSearchBy] = useState('all'); // all, name, rollno, phone, college
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentStudentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing saved searches:', e);
        localStorage.removeItem('recentStudentSearches');
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveSearch = (term) => {
    const updatedSearches = [
      { term, timestamp: new Date().toISOString() },
      ...recentSearches.filter(s => s.term !== term).slice(0, 9) // Keep only 10 most recent searches
    ];
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentStudentSearches', JSON.stringify(updatedSearches));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle search
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      let apiUrl = `${config.backendUrl}/api/students/search?query=${encodeURIComponent(searchTerm)}`;
      
      if (searchBy !== 'all') {
        apiUrl += `&type=${searchBy}`;
      }
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to search students');
      
      const data = await response.json();
      setSearchResults(data);
      
      // Save successful search to recent searches
      if (data.length > 0) {
        saveSearch(searchTerm);
      }
      
    } catch (err) {
      console.error('Error searching students:', err);
      setError('Failed to search students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view student details
  const handleViewStudent = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  // Handle clicking on a recent search
  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    setActiveTab('search');
    
    // We need to wait for the state update to complete
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentStudentSearches');
  };

  return (
    <div className="container py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Student Search</h1>
        <p className="text-slate-500 mt-1">
          Find students by name, roll number, phone, or college
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-8">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="recent">Recent Searches</TabsTrigger>
        </TabsList>
        
        {/* Search Tab */}
        <TabsContent value="search">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Students</CardTitle>
              <CardDescription>
                Enter search criteria to find students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search for a student..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select
                    value={searchBy}
                    onValueChange={setSearchBy}
                  >
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center">
                        <FilterIcon className="h-4 w-4 mr-2" />
                        <span>Search by</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="rollno">Roll Number</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button type="submit">
                    Search
                  </Button>
                </div>
              </form>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  {searchResults.length === 0 
                    ? 'No students found matching your search criteria' 
                    : `Found ${searchResults.length} students matching "${searchTerm}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill().map((_, idx) => (
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
                  <>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <XCircleIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-lg font-medium">No students found</h3>
                        <p className="mt-1 text-slate-500">
                          Try adjusting your search or using different keywords
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>College</TableHead>
                              <TableHead>Hostel</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((student) => (
                              <TableRow 
                                key={student.id} 
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => handleViewStudent(student.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                                      <UserIcon className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{student.first_name} {student.surname}</div>
                                      <div className="text-xs text-slate-500">
                                        {formatDate(student.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{student.roll_no}</TableCell>
                                <TableCell>{student.personal_phone}</TableCell>
                                <TableCell>
                                  <div>
                                    <div>{student.college}</div>
                                    <div className="text-xs text-slate-500">{student.stream}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={student.hostel_type === 'boys' ? 'default' : 'secondary'}>
                                    {student.hostel_name}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Recent Searches Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Searches</CardTitle>
                  <CardDescription>
                    Your previously searched terms
                  </CardDescription>
                </div>
                {recentSearches.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearRecentSearches}>
                    Clear History
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentSearches.length === 0 ? (
                <div className="text-center py-8">
                  <SearchIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-lg font-medium">No recent searches</h3>
                  <p className="mt-1 text-slate-500">
                    Your recent search history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleRecentSearchClick(search.term)}
                    >
                      <div className="flex items-center">
                        <SearchIcon className="h-4 w-4 text-slate-500 mr-2" />
                        <span>{search.term}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(search.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Search Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Search Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Search by Name</p>
                <p className="text-sm text-slate-500">
                  Enter first name or surname to find matching students
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Search by Roll Number</p>
                <p className="text-sm text-slate-500">
                  Enter complete or partial roll number
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Search by Phone</p>
                <p className="text-sm text-slate-500">
                  Find students by their phone or parent's phone number
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Search by College</p>
                <p className="text-sm text-slate-500">
                  Find students from a specific college or institution
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSearch;
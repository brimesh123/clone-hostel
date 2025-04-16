// src/App.jsx - Updated with shared routes for both admin types
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authContext';

// Auth Component
import LoginForm from './components/LoginForm';

// Layout Component
import Layout from './components/layout/Layout';

// Existing pages
import M_Admin from './pages/m_admin';
import R_Admin from './pages/r_admin';

// Master Admin components
import MasterDueManagement from './components/m_components/MasterDueManagement';
import HostelManagement from './components/m_components/HostelManagement';

import HostelDetail from './components/m_components/HostelDetail';
import AccountingReport from './components/m_components/AccountingReport';
import Test from './components/m_components/Test';

// Reception Admin pages
import StudentManagement from './components/r_components/StudentManagement';
import AddStudentForm from './components/r_components/AddStudentForm';
import StudentDetail from './components/r_components/StudentDetail';
import InvoiceManagement from './components/r_components/InvoiceManagement';
import InvoiceForm from './components/r_components/InvoiceForm';
import InvoiceView from './components/r_components/InvoiceView';
import StudentSearch from './components/r_components/StudentSearch';
import DueManagement from './components/r_components/DueManagement.jsx';
import LeftStudentsManagement from './components/r_components/LeftStudentsManagement';

import Url from './tools/url';

// Protected Route Component (as a wrapper component for React Router 7)
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// Role Redirect component
const RoleRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'master') {
    return <Navigate to="/m_dashboard" replace />;
  }

  if (user.role === 'receptionist') {
    return <Navigate to="/r_dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const handleGoBack = () => {
  return <Navigate to="/login" />;
};

// Unauthorized page
const Unauthorized = () => (
  <div className="flex flex-col justify-center items-center min-h-screen">
    <h1 className="text-2xl font-bold">Access Denied</h1>
    <p>You don't have permission to access this page.</p>
    <button onClick={handleGoBack} className="px-4 py-2 bg-blue-500 text-white rounded mt-4">Go Back</button>
  </div>
);

// Not Found Page
const NotFound = () => (
  <div className="flex flex-col justify-center items-center min-h-screen">
    <h1 className="text-xl font-bold mb-2">Page Not Found</h1>
    <button onClick={() => window.history.back()} className="px-4 py-2 bg-blue-500 text-white rounded mt-4">Go Back</button>
  </div>
);

// Main App Component
const App = () => {
  const router = createBrowserRouter([
    {
      path: "/login",
      element: <LoginForm />
    },
    {
      path: "/unauthorized",
      element: <Unauthorized />
    },
    {
      path: "/",
      element: <RoleRedirect />
    },
    
    // Shared Routes (accessible by both master admin and receptionists)
    {
      path: "/",
      element: <ProtectedRoute allowedRoles={['master', 'receptionist']} />,
      children: [
        {
          path: "student/:id",
          element: <Layout><StudentDetail /></Layout>
        },
        {
          path: "invoice/:invoiceId",
          element: <Layout><InvoiceView /></Layout>
        }
      ]
    },
    
    // Master Admin Routes
    {
      path: "/",
      element: <ProtectedRoute allowedRoles={['master']} />,
      children: [
        {
          path: "m_dashboard",
          element: <Layout><M_Admin /></Layout>
        },
        {
          path: "hostels",
          element: <Layout><HostelManagement /></Layout>
        },
        {
          path: "accounting",
          element: <Layout><AccountingReport /></Layout>
        },
        {
          path: "hostel/:hostelId",
          element: <Layout><HostelDetail /></Layout>
        },
        {
          path: "due-master",
          element: <Layout><MasterDueManagement /></Layout>
        }
      ]
    },
    
    // Reception Admin Routes
    {
      path: "/",
      element: <ProtectedRoute allowedRoles={['receptionist']} />,
      children: [
        {
          path: "r_dashboard",
          element: <Layout><R_Admin /></Layout>
        },
        {
          path: "students",
          element: <Layout><StudentManagement /></Layout>
        },
        {
          path: "add-student",
          element: <Layout><AddStudentForm /></Layout>
        },
        {
          path: "invoices",
          element: <Layout><InvoiceManagement /></Layout>
        },
        {
          path: "create-invoice/:studentId",
          element: <Layout><InvoiceForm /></Layout>
        },
        {
          path: "search",
          element: <Layout><StudentSearch /></Layout>
        },
        {
          path: "left-students",
          element: <Layout><LeftStudentsManagement /></Layout>
        },
        {
          path: "due",
          element: <Layout><DueManagement /></Layout>
        },
        {
          path: "test",
          element: <Layout><Test /></Layout>
        }
      ]
    },
    
    // Catch all route
    {
      path: "*",
      element: <NotFound />
    }
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
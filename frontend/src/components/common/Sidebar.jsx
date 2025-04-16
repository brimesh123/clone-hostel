// src/components/common/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import icons
import {
  HomeIcon,
  BuildingIcon,
  BarChartIcon,
  UsersIcon,
  UserIcon,
  AlertCircle,
  FileTextIcon,
  LogOutIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  SettingsIcon,
  CalculatorIcon
} from "lucide-react";

const SidebarHeader = ({ collapsed }) => {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'master';

  return (
    <Card className="rounded-none border-none bg-gray-800 shadow-md">
      <CardHeader className={cn("pb-2", collapsed ? "items-center px-2" : "px-4")}>
        {!collapsed && (
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <GraduationCapIcon className="h-5 w-5 mr-2" />
            HMS
          </CardTitle>
        )}
        {collapsed ? (
          <Badge variant="outline" className="bg-gray-700 text-white border-gray-600">
            {isMasterAdmin ? 'MA' : 'RA'}
          </Badge>
        ) : (
          <>
            <CardDescription className="text-gray-300 text-sm">
              Hostel Management System
            </CardDescription>
            <Badge variant="outline" className="mt-1 capitalize bg-gray-700 text-white border-gray-600">
              {isMasterAdmin ? 'Master Admin' : 'Reception Admin'}
            </Badge>
          </>
        )}
      </CardHeader>
    </Card>
  );
};

const NavItem = ({ to, icon, children, collapsed, tooltip }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
 
  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg p-2 text-sm transition-all hover:bg-gray-700/20",
          collapsed ? "justify-center px-2" : "px-3",
          isActive
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-300 hover:text-white"
        )
      }
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "")}>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          isActive ? "bg-gray-600" : "bg-gray-800"
        )}>
          {icon}
        </div>
        {!collapsed && <span className="ml-2">{children}</span>}
      </div>
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip || children}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

const SidebarSection = ({ title, children, collapsed }) => {
  if (collapsed) {
    return <div className="my-2">{children}</div>;
  }
 
  return (
    <div className="space-y-1">
      <h2 className="px-3 py-2 text-xs uppercase tracking-wider text-gray-400 font-medium">
        {title}
      </h2>
      {children}
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMasterAdmin = user?.role === 'master';
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-gray-900 text-gray-100 transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        className="absolute -right-3 top-20 z-10 rounded-full bg-gray-700 p-1 text-white shadow-md hover:bg-gray-600"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ?
          <ChevronRightIcon className="h-4 w-4" /> :
          <ChevronLeftIcon className="h-4 w-4" />
        }
      </button>
     
      <SidebarHeader collapsed={collapsed} />
     
      <ScrollArea className="flex-1">
        <div className={cn("p-2 space-y-6", collapsed ? "px-1" : "p-3")}>
          <SidebarSection title="Main" collapsed={collapsed}>
            <NavItem
              to={isMasterAdmin ? "/m_dashboard" : "/r_dashboard"}
              icon={<HomeIcon className="h-4 w-4" />}
              collapsed={collapsed}
              tooltip="Dashboard"
            >
              Dashboard
            </NavItem>
          </SidebarSection>
         
          {isMasterAdmin ? (
            <SidebarSection title="Administration" collapsed={collapsed}>
              <NavItem
                to="/hostels"
                icon={<BuildingIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Manage Hostels"
              >
                Hostel Management
              </NavItem>
              
              <NavItem
                to="/accounting"
                icon={<CalculatorIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Accounting"
              >
                Accounting
              </NavItem>

              <NavItem
                to="/due-master"
                icon={<AlertCircle className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Due Management"
              >
                Due Management
              </NavItem>
            </SidebarSection>
          ) : (
            <SidebarSection title="Reception Tasks" collapsed={collapsed}>
              <NavItem
                to="/students"
                icon={<UsersIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Manage Students"
              >
                Students
              </NavItem>
             
              <NavItem
                to="/invoices"
                icon={<FileTextIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Manage Invoices"
              >
                Invoices
              </NavItem>
             
              <NavItem
                to="/search"
                icon={<SearchIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Search Students"
              >
                Search
              </NavItem>
              <NavItem
                to="/left-students"
                icon={<LogOutIcon className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Left Student"
              >
                Left Students
              </NavItem>
              <NavItem
                to="/due"
                icon={<AlertCircle className="h-4 w-4" />}
                collapsed={collapsed}
                tooltip="Due Management"
              >
                Due Management
              </NavItem>
            </SidebarSection>
          )}
        </div>
      </ScrollArea>
     
      <Separator className="bg-gray-800" />
     
      <div className={cn("p-3", collapsed ? "items-center flex flex-col" : "p-4 space-y-4")}>
        <Button
          variant="destructive"
          className={cn("hover:bg-red-600", collapsed ? "w-10 h-10 p-0" : "w-full")}
          onClick={handleLogout}
        >
          <LogOutIcon className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
       
        {!collapsed && (
          <div className="flex items-center p-2 bg-gray-800 rounded-lg mt-3">
            <Avatar className="h-9 w-9 mr-2 border-2 border-gray-600">
              <AvatarImage src="/user-avatar.png" />
              <AvatarFallback className="bg-gray-700 text-white">
                {isMasterAdmin ? 'MA' : 'RA'}
              </AvatarFallback>
            </Avatar>
           
            <div>
              <p className="text-sm font-medium text-white">{isMasterAdmin ? 'Master Admin' : 'Reception Admin'}</p>
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                <p className="text-xs text-gray-300">Online</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
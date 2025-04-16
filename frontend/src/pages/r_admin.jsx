// src/pages/r_admin.jsx
import React from 'react';
import ReceptionDashboard from '../components/r_components/ReceptionDashboard';

const R_Admin = () => {
  return (
    <div className="admin-layout" style={{ display: 'flex' }}>
      
      <div className="content" style={{ flex: 1, padding: '0px' }}>
        <ReceptionDashboard />
      </div>
    </div>
  );
};

export default R_Admin;

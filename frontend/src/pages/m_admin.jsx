// src/pages/m_admin.jsx
import React from 'react';
import MasterDashboard from '../components/m_components/MasterDashboard.jsx';

const M_Admin = () => {
  return (
    <div className="admin-layout" style={{ display: 'flex' }}>
      <div className="content" style={{ flex: 1, padding: '20px' }}>
        <MasterDashboard />
      </div>
    </div>
  );
};

export default M_Admin;

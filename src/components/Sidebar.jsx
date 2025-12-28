import React, { useState } from 'react';
import { LayoutDashboard, Users, Home, CreditCard, LogOut, BarChart3, UserCheck, Database, Building, ChevronDown, ChevronRight, Settings } from 'lucide-react';

const Sidebar = ({ darkMode, activeTab, setActiveTab, user, onLogout, isOpen, toggleSidebar }) => {
  const isAdmin = user?.role === 'admin';
  const [expanded, setExpanded] = useState({ properties: true, rentals: true });

  const toggleGroup = (group) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navItem = (id, label, Icon) => (
    <div 
      onClick={() => {
         setActiveTab(id);
         if (window.innerWidth <= 768 && toggleSidebar) toggleSidebar(); // Close sidebar on mobile item click
      }}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', 
        cursor: 'pointer', borderRadius: '12px', marginBottom: '5px', transition: '0.2s',
        backgroundColor: activeTab === id ? '#3b82f6' : 'transparent',
        color: activeTab === id ? 'white' : '#94a3b8',
        fontSize: '13px',
        fontWeight: activeTab === id ? '700' : '500',
        marginLeft: '10px'
      }}
    >
      <Icon size={18}/> <span>{label}</span>
    </div>
  );

  const groupHeader = (groupKey, label, Icon) => (
    <div 
      onClick={() => toggleGroup(groupKey)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 15px', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#f8fafc',
        fontWeight: '700', fontSize: '14px', marginTop: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon size={18} color="#3b82f6"/> {label}
      </div>
      {expanded[groupKey] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
    </div>
  );

  return (
    <div 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{ 
        background: darkMode ? '#0f172a' : '#1e293b', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: '30px', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '1px' }}>ESTATE<span style={{color: '#3b82f6'}}>PRO</span></h2>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Property Management System</p>
      </div>
      
      <nav className="custom-scroll" style={{ padding: '0 15px', flex: 1, overflowY: 'auto' }}>
        <div 
          onClick={() => setActiveTab('dashboard')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', 
            cursor: 'pointer', borderRadius: '12px', marginBottom: '5px',
            backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : 'transparent',
            color: activeTab === 'dashboard' ? 'white' : '#94a3b8',
            fontWeight: activeTab === 'dashboard' ? '700' : '500',
            fontSize: '14px'
          }}
        >
          <LayoutDashboard size={18}/> <span>Dashboard</span>
        </div>

        {/* --- Properties Group --- */}
        {groupHeader('properties', 'Property Management', Home)}
        {expanded.properties && (
          <div style={{ borderLeft: '1px solid #334155', marginLeft: '22px', paddingLeft: '5px' }}>
            {navItem('inventory', 'Property Inventory', Building)}
            {navItem('customers', 'Buyers / Clients', UserCheck)}
            {isAdmin && navItem('payments', 'Installments / Payments', CreditCard)}
            {isAdmin && navItem('reports', 'Analysis Reports', BarChart3)}
          </div>
        )}

        {/* --- Rentals Group --- */}
        {groupHeader('rentals', 'Rental Management', Building)}
        {expanded.rentals && (
          <div style={{ borderLeft: '1px solid #334155', marginLeft: '22px', paddingLeft: '5px' }}>
             {navItem('rent-inventory', 'Rental Properties', Home)}
             {navItem('rent-customers', 'Tenants Directory', Users)}
             {isAdmin && navItem('rent-reports', 'Rental Reports', BarChart3)}
          </div>
        )}

        {/* --- Admin Section --- */}
        {isAdmin && (
          <>
            <div style={{ margin: '20px 0 10px 15px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Administration</div>
            <div 
              onClick={() => setActiveTab('users')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', 
                cursor: 'pointer', borderRadius: '12px', marginBottom: '5px',
                backgroundColor: activeTab === 'users' ? '#3b82f6' : 'transparent',
                color: activeTab === 'users' ? 'white' : '#94a3b8',
                fontSize: '14px', fontWeight: activeTab === 'users' ? '700' : '500'
              }}
            >
              <Users size={18}/> <span>Employees</span>
            </div>
            <div 
              onClick={() => setActiveTab('backup')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', 
                cursor: 'pointer', borderRadius: '12px', marginBottom: '5px',
                backgroundColor: activeTab === 'backup' ? '#3b82f6' : 'transparent',
                color: activeTab === 'backup' ? 'white' : '#94a3b8',
                fontSize: '14px', fontWeight: activeTab === 'backup' ? '700' : '500'
              }}
            >
              <Database size={18}/> <span>Backup & Restore</span>
            </div>
          </>
        )}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid #334155', background: darkMode ? '#0f172a' : '#1e293b' }}>
        <button 
          onClick={onLogout}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
            width: '100%', padding: '12px', borderRadius: '12px', 
            background: '#ef4444', color: 'white', border: 'none', 
            cursor: 'pointer', fontWeight: '700', fontSize: '14px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          <LogOut size={18}/> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
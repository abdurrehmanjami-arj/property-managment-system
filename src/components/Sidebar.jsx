import React from 'react';
import { LayoutDashboard, Users, Home, CreditCard, LogOut, BarChart3, UserCheck, Database } from 'lucide-react';

const Sidebar = ({ darkMode, activeTab, setActiveTab, user, onLogout }) => {
  const isAdmin = user?.role === 'admin';

  const navItem = (id, label, Icon) => (
    <div 
      onClick={() => setActiveTab(id)}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', 
        cursor: 'pointer', borderRadius: '16px', marginBottom: '8px', transition: '0.2s',
        backgroundColor: activeTab === id ? '#3b82f6' : 'transparent',
        color: activeTab === id ? 'white' : '#94a3b8',
        boxShadow: activeTab === id ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
      }}
    >
      <Icon size={20}/> <span style={{ fontWeight: activeTab === id ? '700' : '500' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ width: '280px', background: darkMode ? '#0f172a' : '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '40px 30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '1px' }}>ESTATE<span style={{color: '#3b82f6'}}>PRO</span></h2>
      </div>
      
      <nav style={{ padding: '0 20px', flex: 1 }}>
        {navItem('customers', 'Customers', UserCheck)}
        {navItem('inventory', 'Property List', Home)}
        {isAdmin && navItem('payments', 'Installments', CreditCard)}
        {isAdmin && navItem('reports', 'Reports', BarChart3)}
        {isAdmin && navItem('users', 'Employees', Users)}
        {isAdmin && navItem('backup', 'Backup & Restore', Database)}
      </nav>

      <div style={{ padding: '30px', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }} onClick={onLogout}>
          <LogOut size={20}/> <span>Sign Out System</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
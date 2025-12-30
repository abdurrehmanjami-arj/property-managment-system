import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import Inventory from './components/Inventory';
import Payments from './components/Payments';
import Reports from './components/Reports';
import Customers from './components/Customers';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import BackupRestore from './components/BackupRestore';
import RentInventory from './components/RentInventory';
import RentCustomers from './components/RentCustomers';
import RentReports from './components/RentReports';
import DashboardHome from './components/DashboardHome';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import api from './api';
import './styles/layout.css';
import { Bell, Moon, Sun, UserCheck, LogOut, CheckCircle, AlertCircle, Trash2, Menu } from 'lucide-react';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const askConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogin = async (email, password, forceLogin = false) => {
    const response = await api.post('/auth/login', { email, password, forceLogin });
    const { token, user: loggedUser } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Shhh... silent clean
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleForgotPasswordVerify = async (email, cnic) => {
    await api.post('/auth/forgot-password', { email, cnic });
  };

  const handleResetPassword = async (token, password) => {
    await api.post(`/auth/reset-password/${token}`, { password });
  };

  if (loading) return null;

  return (
    <SocketProvider user={user}>
      <Router>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" /> : 
            <Login 
              onLogin={handleLogin} 
              onForgotPassword={() => window.location.href = '/forgot-password'}
              darkMode={darkMode} 
            />
          } />
          
          <Route path="/forgot-password" element={
            <ForgotPassword 
              onBack={() => window.location.href = '/login'} 
              onVerify={handleForgotPasswordVerify}
              darkMode={darkMode}
            />
          } />

          <Route path="/reset-password/:token" element={<ResetWrapper onReset={handleResetPassword} darkMode={darkMode} />} />

          <Route path="/" element={
            user ? <Dashboard user={user} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} toast={toast} showToast={showToast} askConfirm={askConfirm} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> : <Navigate to="/login" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Global Confirmation Modal */}
        {confirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' }}>
             <div className="modal-content" style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', width: '420px', padding: '40px', borderRadius: '30px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}` }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                   <Trash2 size={40}/>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>{confirmDialog.title}</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>{confirmDialog.message}</p>
                <div style={{ display: 'flex', gap: '15px' }}>
                   <button 
                      onClick={() => setConfirmDialog(null)}
                      style={{ flex: 1, padding: '14px', borderRadius: '15px', border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, background: 'transparent', color: darkMode ? '#f8fafc' : '#1e293b', fontWeight: '700', cursor: 'pointer' }}
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={() => { if (confirmDialog.onConfirm) confirmDialog.onConfirm(); setConfirmDialog(null); }}
                      style={{ flex: 1, padding: '14px', borderRadius: '15px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                   >
                      Confirm
                   </button>
                </div>
             </div>
          </div>
        )}
      </Router>
    </SocketProvider>
  );
};

const ResetWrapper = ({ onReset, darkMode }) => {
  const { token } = useParams();
  return <ResetPassword token={token} onReset={onReset} darkMode={darkMode} />;
};

const Dashboard = ({ user, darkMode, setDarkMode, onLogout, toast, showToast, askConfirm, sidebarOpen, toggleSidebar }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const socket = useSocket();

  // Listen for force logout events
  useEffect(() => {
    if (socket) {
      socket.on('force-logout', (data) => {

        showToast(data.reason || 'You have been logged out', 'error');
        setTimeout(() => {
          onLogout();
        }, 2000);
      });

      return () => {
        socket.off('force-logout');
      };
    }
  }, [socket, onLogout, showToast]);

  const theme = {
    bg: darkMode ? '#020617' : '#f8fafc',
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#f1f5f9'
  };

  return (
    <div className="app-container" style={{ backgroundColor: theme.bg }}>
      <div className="no-print">
        {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
        <Sidebar darkMode={darkMode} activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Global Notification Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '25px', right: '25px', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '16px 24px', borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
          <span style={{ fontWeight: '700' }}>{toast.message}</span>
        </div>
      )}

      <main className="main-content">
        <header className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ color: theme.text, background: theme.card, border: `1px solid ${theme.border}` }}>
              <Menu size={24} />
            </button>
            <h1 className="header-title" style={{ fontSize: '26px', fontWeight: '800', color: theme.text }}>
              {activeTab === 'dashboard' && 'Analytics Dashboard'}
              {activeTab === 'customers' && 'Property Customers'}
              {activeTab === 'inventory' && 'Property List'}
              {activeTab === 'rent-inventory' && 'Rental Properties'}
              {activeTab === 'rent-customers' && 'Rent Customer Directory'}
              {activeTab === 'users' && 'Employees'}
              {activeTab === 'payments' && 'Installments'}
              {activeTab === 'reports' && 'Property Reports'}
              {activeTab === 'rent-reports' && 'Rent Reports'}
              {activeTab === 'backup' && 'Database'}
            </h1>
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div onClick={() => setDarkMode(!darkMode)} style={{ background: theme.card, padding: '10px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${theme.border}` }}>
              {darkMode ? <Sun size={22} color="#fbbf24"/> : <Moon size={22} color="#64748b"/>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `2px solid ${theme.border}`, paddingLeft: '20px' }}>
               <div className="user-info-text" style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: theme.text }}>{user.name.toUpperCase()}</p>
                  <span style={{ fontSize: '10px', color: '#3b82f6' }}>{user.role.toUpperCase()}</span>
               </div>
               <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20}/>
               </div>
               <div onClick={onLogout} style={{ background: theme.card, padding: '10px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center' }}>
                  <LogOut size={18} color="#ef4444"/>
               </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && <DashboardHome darkMode={darkMode} setActiveTab={setActiveTab} showToast={showToast} />}
          {activeTab === 'customers' && <Customers darkMode={darkMode} currentUser={user} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'inventory' && <Inventory darkMode={darkMode} currentUser={user} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'rent-inventory' && <RentInventory darkMode={darkMode} currentUser={user} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'rent-customers' && <RentCustomers darkMode={darkMode} currentUser={user} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'users' && <UserManagement darkMode={darkMode} currentUser={user} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'payments' && <Payments darkMode={darkMode} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'reports' && <Reports darkMode={darkMode} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'rent-reports' && <RentReports darkMode={darkMode} showToast={showToast} askConfirm={askConfirm} />}
          {activeTab === 'backup' && <BackupRestore darkMode={darkMode} showToast={showToast} askConfirm={askConfirm} />}
        </div>
      </main>
    </div>
  );
};

export default App;
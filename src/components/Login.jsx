import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, AlertCircle, LogOut, Loader2, ShieldCheck, Mail, Phone, CreditCard } from 'lucide-react';
import api from '../api';

const Login = ({ onLogin, onForgotPassword, darkMode }) => {
  const [isInitialized, setIsInitialized] = useState(null); // null = loading check
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Setup Mode State
  const [setupData, setSetupData] = useState({
    name: '', email: '', password: '', cnic: '', phone: '',
    birthPlace: '', favoritePet: '', motherName: '', favoriteColor: ''
  });

  // Force Login State
  const [showForceLoginModal, setShowForceLoginModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      const response = await api.get('/auth/setup-status');
      setIsInitialized(response.data.isInitialized);
    } catch (err) {
      console.error("Failed to check system status", err);
      // Fallback to login mode if check fails (assume system is up)
      setIsInitialized(true); 
    }
  };

  const handleLoginSubmit = async (forceLogin = false) => {
    if (!email || !password) {
      setError('Please enter both email/ID and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password, forceLogin);
      setShowForceLoginModal(false);
    } catch (error) {
      console.error('Login error:', error);
      // Check if error is "already logged in"
      if (error.response?.status === 409 && error.response?.data?.code === 'ALREADY_LOGGED_IN') {
        setSessionInfo(error.response.data.sessionInfo);
        setShowForceLoginModal(true);
      } else {
        setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  const formatCNIC = (value) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    if (val.length > 12) return `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    if (val.length > 5) return `${val.slice(0, 5)}-${val.slice(5)}`;
    return val;
  };

  const formatPhone = (value) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 4) return `${val.slice(0, 4)}-${val.slice(4)}`;
    return val;
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: setupData.name,
        email: setupData.email,
        password: setupData.password,
        cnic: setupData.cnic,
        phone: setupData.phone
      };

      const response = await api.post('/auth/register', payload);
      
      // Auto-login after setup
      if (response.data.token) {
        // Just reload logic or call onLogin manually if needed, 
        // but typically register returns user/token.
        // We'll effectively "log them in" by calling onLogin with these credentials 
        // OR better: reload page to standard flow? No, seamless is better.
        // Since `onLogin` expects email/pass, we call it.
        await onLogin(setupData.email, setupData.password);
        setIsInitialized(true);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password, forceLogin: true, onlyLogout: true });
      setShowForceLoginModal(false);
      // Retain password/email for easy re-login
      setError('');
    } catch (err) {
      setError('Failed to process logout.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLoginSubmit();
  };

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const inputStyle = (t) => ({
    width: '100%', padding: '14px 15px 14px 45px', borderRadius: '15px', 
    border: `1px solid ${t.border}`, background: t.input, color: t.text, 
    outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: '0.3s'
  });

  const setupInputStyle = (t) => ({
    width: '100%', padding: '12px', borderRadius: '12px', 
    border: `1px solid ${t.border}`, background: t.input, color: t.text, 
    outline: 'none', fontSize: '13px', boxSizing: 'border-box'
  });

  if (isInitialized === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#020617' : '#f0f2f5' }}>
        <Loader2 className="animate-spin" color="#3b82f6" size={40} />
      </div>
    );
  }

  // --- SETUP MODE (No Users Exist) ---
  if (!isInitialized) {
    return (
      <div style={{ 
        minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', background: darkMode ? '#020617' : 'linear-gradient(135deg, #f0f2f5 0%, #c3dafe 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          background: theme.card, padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '600px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: `1px solid ${theme.border}`,
          maxHeight: '90vh', overflowY: 'auto'
        }} className="custom-scroll">
          
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ 
              width: '60px', height: '60px', background: '#3b82f6', borderRadius: '18px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px'
            }}>
              <ShieldCheck color="white" size={30}/>
            </div>
            <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px' }}>System Setup</h2>
            <p style={{ color: theme.subText, fontSize: '14px', marginTop: '5px' }}>Create the first Admin account to initialize the system.</p>
          </div>

          <form onSubmit={handleSetupSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             {error && (
              <div style={{ gridColumn: 'span 2', background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '10px', fontSize: '13px' }}>
                {error}
              </div>
            )}
            
            <div style={{ gridColumn: 'span 2' }}>
               <label style={{display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: theme.subText}}>Full Name</label>
               <input required placeholder="E.g. System Admin" style={setupInputStyle(theme)} value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
               <label style={{display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: theme.subText}}>Admin Email</label>
               <input required type="email" placeholder="admin@example.com" style={setupInputStyle(theme)} value={setupData.email} onChange={e => setSetupData({...setupData, email: e.target.value})} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
               <label style={{display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: theme.subText}}>Secure Password</label>
               <input required type="password" placeholder="••••••••" style={setupInputStyle(theme)} value={setupData.password} onChange={e => setSetupData({...setupData, password: e.target.value})} />
            </div>



            <div>
               <label style={{display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: theme.subText}}>CNIC</label>
               <input 
                 required 
                 placeholder="00000-0000000-0" 
                 style={setupInputStyle(theme)} 
                 value={setupData.cnic} 
                 onChange={e => setSetupData({...setupData, cnic: formatCNIC(e.target.value)})} 
                 maxLength={15}
               />
            </div>
            <div>
               <label style={{display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: theme.subText}}>Phone</label>
               <input 
                 required 
                 placeholder="0300-0000000" 
                 style={setupInputStyle(theme)} 
                 value={setupData.phone} 
                 onChange={e => setSetupData({...setupData, phone: formatPhone(e.target.value)})} 
                 maxLength={12}
               />
            </div>



            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                gridColumn: 'span 2', marginTop: '15px', padding: '15px', borderRadius: '15px', 
                background: '#3b82f6', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating Admin...' : 'Initialize System'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- LOGIN MODE (Standard) ---
  return (
    <div style={{ 
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', background: darkMode ? '#020617' : 'linear-gradient(135deg, #f0f2f5 0%, #c3dafe 100%)',
      position: 'fixed', top: 0, left: 0
    }}>
      <div style={{ 
        background: theme.card, padding: '50px', borderRadius: '35px', width: '400px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', textAlign: 'center',
        border: `1px solid ${theme.border}`
      }}>
        {/* Logo Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            width: '60px', height: '60px', background: '#3b82f6', borderRadius: '18px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.5)'
          }}>
            <User color="white" size={30}/>
          </div>
          <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px', letterSpacing: '1px' }}>ESTATE<span style={{color: '#3b82f6'}}>PRO</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Management Portal Login</p>
        </div>
        
        {/* Form Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ 
              background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '12px', 
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} size={18}/>
            <input 
              placeholder="Email / ID" 
              style={inputStyle(theme)}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} size={18}/>
            <input 
              type="password" 
              placeholder="Password" 
              style={inputStyle(theme)}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-10px' }}>
            <span 
              onClick={onForgotPassword}
              style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Forgot Password?
            </span>
          </div>

          <button 
            onClick={() => handleLoginSubmit()}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', 
              border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', 
              cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '10px', fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In Now'} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Force Login Modal */}
      {showForceLoginModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' 
        }}>
          <div style={{ 
            background: theme.card, color: theme.text, width: '450px', padding: '40px', 
            borderRadius: '30px', textAlign: 'center', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
            border: `1px solid ${theme.border}` 
          }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: '#f59e0b15', color: '#f59e0b', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 25px' 
            }}>
              <AlertCircle size={40}/>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>
              Active Session Detected
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              This account is currently active on another device.
              {sessionInfo && (
                <span style={{ display: 'block', marginTop: '10px', fontSize: '12px' }}>
                  Last login: {new Date(sessionInfo.loginTime).toLocaleString()}
                </span>
              )}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '30px' }}>
              Do you want to log out all other sessions?
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  setShowForceLoginModal(false);
                  setLoading(false);
                }}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '15px', 
                  border: `1px solid ${theme.border}`, background: 'transparent', 
                  color: theme.text, fontWeight: '700', cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleForceLogout}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '15px', border: 'none', 
                  background: '#ef4444', color: 'white', fontWeight: '700', 
                  cursor: 'pointer', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <LogOut size={18}/> Logout All Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
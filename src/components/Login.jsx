import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

const Login = ({ onLogin, onGoogleSuccess, onForgotPassword, darkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForceLoginModal, setShowForceLoginModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  const [error, setError] = useState('');

  const handleSubmit = async (forceLogin = false) => {
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
        setError(error.response?.data?.message || 'Login failed. Please check your credentials and server status.');
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0'
  };

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
            <User style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} size={18}/>
            <input 
              placeholder="Employee Email / ID" 
              style={inputStyle(theme)}
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
            onClick={() => handleSubmit()}
            style={{...loginBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In Now'} <ArrowRight size={18} />
          </button>


        </div>

        {/* Footer Info */}
        <p style={{ marginTop: '25px', fontSize: '13px', color: '#94a3b8' }}>
          Don't have an account? <br/>
          <span style={{ color: '#3b82f6', fontWeight: '600', cursor: 'not-allowed' }}>Contact Admin to Register</span>
        </p>
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
              Already Logged In
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
              Do you want to logout from all devices and login here?
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
                onClick={() => handleSubmit(true)}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '15px', border: 'none', 
                  background: '#f59e0b', color: 'white', fontWeight: '700', 
                  cursor: 'pointer', boxShadow: '0 5px 15px rgba(245, 158, 11, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <LogOut size={18}/> Logout All & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Styles
const inputStyle = (t) => ({
  width: '100%', padding: '14px 15px 14px 45px', borderRadius: '15px', 
  border: `1px solid ${t.border}`, background: t.input, color: t.text, 
  outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: '0.3s'
});

const loginBtnStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', 
  border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', 
  cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', 
  justifyContent: 'center', gap: '10px', fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
};

const googleBtnStyle = (t) => ({
  background: t.card, color: t.text, border: `1px solid ${t.border}`,
  padding: '12px', borderRadius: '15px', fontWeight: '600', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: '0.3s'
});

export default Login;
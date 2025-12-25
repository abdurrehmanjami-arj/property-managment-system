import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

const ResetPassword = ({ token, onReset, darkMode }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReset(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Reset failed');
    }
    setLoading(false);
  };

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0'
  };

  if (success) {
    return (
      <div style={overlayStyle(darkMode)}>
        <div style={{ ...cardStyle(theme), textAlign: 'center' }}>
          <CheckCircle size={60} color="#10b981" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: theme.text, fontWeight: '800' }}>Password Reset!</h2>
          <p style={{ color: '#94a3b8', margin: '10px 0 25px' }}>Your password has been updated successfully.</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={btnStyle}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle(darkMode)}>
      <div style={cardStyle(theme)}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <Lock size={40} color="#3b82f6" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px' }}>New Password</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Enter your new secure password</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} size={18}/>
            <input 
              required
              type="password"
              placeholder="New Password" 
              style={inputStyle(theme)}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} size={18}/>
            <input 
              required
              type="password"
              placeholder="Confirm New Password" 
              style={inputStyle(theme)}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <button 
            type="submit"
            style={{...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = (darkMode) => ({
  height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', 
  justifyContent: 'center', background: darkMode ? '#020617' : 'linear-gradient(135deg, #f0f2f5 0%, #c3dafe 100%)',
  position: 'fixed', top: 0, left: 0
});

const cardStyle = (theme) => ({
  background: theme.card, padding: '50px', borderRadius: '35px', width: '400px', 
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
  border: `1px solid ${theme.border}`
});

const inputStyle = (t) => ({
  width: '100%', padding: '14px 15px 14px 45px', borderRadius: '15px', 
  border: `1px solid ${t.border}`, background: t.input, color: t.text, 
  outline: 'none', fontSize: '14px', boxSizing: 'border-box'
});

const btnStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', 
  border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', width: '100%', cursor: 'pointer'
};

export default ResetPassword;

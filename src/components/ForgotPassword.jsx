import React, { useState } from 'react';
import { Mail, Shield, ArrowRight, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import api from '../api';

const ForgotPassword = ({ onBack, darkMode }) => {
  const [step, setStep] = useState(1); // 1: Verify, 3: Reset (Step 2 skipped)
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const formatCNIC = (value) => {
    const val = value.replace(/\D/g, '');
    if (val.length <= 5) return val;
    if (val.length <= 12) return `${val.slice(0, 5)}-${val.slice(5)}`;
    return `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12, 13)}`;
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Step 1: Check Identity & Get Token Directly
      const response = await api.post('/auth/forgot-password', { email, cnic });
      if (response.data.success && response.data.resetToken) {
         setResetToken(response.data.resetToken);
         setStep(3); // Move to Reset Password immediately
      } else {
         setError(response.data.message || 'Verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
       await api.post(`/auth/reset-password/${resetToken}`, { password: newPassword });
       setSuccessMsg("Password reset successfully! Redirecting...");
       setTimeout(() => {
          onBack(); // Go back to login
       }, 2000);
    } catch (err) {
       setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
       setLoading(false);
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
      position: 'fixed', top: 0, left: 0, zIndex: 50
    }}>
      <div style={{ 
        background: theme.card, padding: '40px', borderRadius: '35px', width: '450px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', textAlign: 'center',
        border: `1px solid ${theme.border}`
      }}>
        
        {step === 1 && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <div style={iconBox}>
                <Shield color="white" size={30}/>
              </div>
              <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px' }}>Reset Password</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Verify your identity to proceed</p>
            </div>

            <form onSubmit={handleVerifyIdentity} style={formStyle}>
              <div style={inputWrapper}>
                <Mail style={inputIcon} size={18}/>
                <input required type="email" placeholder="Registered Email" style={inputStyle(theme)} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={inputWrapper}>
                <Shield style={inputIcon} size={18}/>
                <input 
                  required 
                  placeholder="CNIC Number (00000-0000000-0)" 
                  style={inputStyle(theme)} 
                  value={cnic}
                  onChange={(e) => setCnic(formatCNIC(e.target.value))} 
                />
              </div>
              {error && <p style={errorText}>{error}</p>}
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Verifying...' : 'Reset Password'} <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {step === 3 && (
           <>
              {!successMsg ? (
                 <>
                    <div style={{ marginBottom: '30px' }}>
                       <div style={{ ...iconBox, background: '#10b981' }}>
                          <Lock color="white" size={30}/>
                       </div>
                       <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px' }}>New Password</h2>
                       <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Set a new secure password</p>
                    </div>

                    <form onSubmit={handleResetPassword} style={formStyle}>
                       <div style={inputWrapper}>
                          <Lock style={inputIcon} size={18}/>
                          <input 
                             required 
                             type="password"
                             placeholder="New Password" 
                             style={inputStyle(theme)} 
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)} 
                          />
                       </div>
                       {error && <p style={errorText}>{error}</p>}
                       <button type="submit" style={btnStyle} disabled={loading}>
                          {loading ? 'Updating...' : 'Confirm Change'} <CheckCircle size={18} />
                       </button>
                    </form>
                 </>
              ) : (
                 <div style={{ padding: '20px 0' }}>
                    <div style={{ margin: '0 auto 20px', width: '80px', height: '80px', borderRadius: '50%', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                       <CheckCircle size={40} />
                    </div>
                    <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '800' }}>Success!</h3>
                    <p style={{ color: '#94a3b8', marginTop: '10px' }}>{successMsg}</p>
                 </div>
              )}
           </>
        )}

        <button onClick={onBack} style={backBtn}>
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
};

const iconBox = { width: '60px', height: '60px', background: '#3b82f6', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputWrapper = { position: 'relative' };
const inputIcon = { position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' };
const inputStyle = (t, noIcon = false) => ({ width: '100%', padding: noIcon ? '12px 15px' : '14px 15px 14px 45px', borderRadius: '15px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', fontSize: '14px', boxSizing: 'border-box' });
const btnStyle = { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', cursor: 'pointer' };
const backBtn = { marginTop: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '14px', margin: '20px auto 0' };
const errorText = { color: '#ef4444', fontSize: '13px', margin: 0 };

export default ForgotPassword;

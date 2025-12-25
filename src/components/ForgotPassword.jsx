import React, { useState } from 'react';
import { Mail, Shield, ArrowRight, ArrowLeft, Lock, HelpCircle } from 'lucide-react';
import api from '../api';

const ForgotPassword = ({ onBack, darkMode }) => {
  const [step, setStep] = useState(1); // 1: Email/CNIC, 2: Security Questions, 3: Success
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [answers, setAnswers] = useState({
    birthPlace: '',
    favoritePet: '',
    motherName: '',
    favoriteColor: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Step 1 check email & CNIC logic (or just move to questions for simplicity)
      // For now, let's assume we move to step 2 to ask questions
      setStep(2);
    } catch (err) {
      setError('Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQuestions = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/verify-security', { email, answers });
      const { resetToken } = response.data;
      // Redirect to reset password page with token
      window.location.href = `/reset-password/${resetToken}`;
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect answers to security questions.');
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
      position: 'fixed', top: 0, left: 0
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
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Step 1: Verify your identity</p>
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
                {loading ? 'Verifying...' : 'Next Step'} <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <div style={{ ...iconBox, background: '#10b981' }}>
                <HelpCircle color="white" size={30}/>
              </div>
              <h2 style={{ color: theme.text, fontWeight: '800', fontSize: '24px' }}>Security Questions</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Answer the following to reset</p>
            </div>

            <form onSubmit={handleVerifyQuestions} style={formStyle}>
              <div style={questionGroup}>
                <label style={labelStyle}>What is your place of birth?</label>
                <input required style={inputStyle(theme, true)} onChange={(e) => setAnswers({...answers, birthPlace: e.target.value})} />
              </div>
              <div style={questionGroup}>
                <label style={labelStyle}>What is your favorite pet?</label>
                <input required style={inputStyle(theme, true)} onChange={(e) => setAnswers({...answers, favoritePet: e.target.value})} />
              </div>
              <div style={questionGroup}>
                <label style={labelStyle}>What is your mother's name?</label>
                <input required style={inputStyle(theme, true)} onChange={(e) => setAnswers({...answers, motherName: e.target.value})} />
              </div>
              <div style={questionGroup}>
                <label style={labelStyle}>What is your favorite color?</label>
                <input required style={inputStyle(theme, true)} onChange={(e) => setAnswers({...answers, favoriteColor: e.target.value})} />
              </div>

              {error && <p style={errorText}>{error}</p>}
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Checking...' : 'Reset Password'} <ArrowRight size={18} />
              </button>
            </form>
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
const questionGroup = { textAlign: 'left' };
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', display: 'block' };
const errorText = { color: '#ef4444', fontSize: '13px', margin: 0 };

export default ForgotPassword;

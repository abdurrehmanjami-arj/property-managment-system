import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, ShieldCheck, X, Search, UserCircle, CreditCard, Pencil } from 'lucide-react';
import api from '../api';

const UserManagement = ({ darkMode, showToast, askConfirm, currentUser }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmp, setNewEmp] = useState({ 
    name: '', email: '', password: '', role: 'employee', cnic: '', phone: '',
    securityQuestions: { birthPlace: '', favoritePet: '', motherName: '', favoriteColor: '' }
  });
  const [editEmp, setEditEmp] = useState(null); 
  const [showEditForm, setShowEditForm] = useState(false);
  const [verificationPass, setVerificationPass] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000); // Har 10 second bad refresh
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setEmployees(response.data);
    } catch (err) {
      // Slient error handling
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/add-user', newEmp);
      setShowAddForm(false);
      setNewEmp({ 
        name: '', email: '', password: '', role: 'employee', cnic: '', phone: '',
        securityQuestions: { birthPlace: '', favoritePet: '', motherName: '', favoriteColor: '' }
      });
      fetchUsers();
      showToast("User added successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create user", "error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd(e);
    }
  };

  const handleDelete = async (id) => {
    askConfirm(
      "Remove Team Member",
      "Are you sure you want to delete this user? They will immediately lose access to the system.",
      async () => {
        try {
          await api.delete(`/auth/users/${id}`);
          fetchUsers();
          showToast("User deleted successfully", "success");
        } catch (err) {
          showToast("Failed to delete user", "error");
        }
      }
    );
  };

  const handleEditClick = (emp) => {
    setEditEmp(emp);
    setShowEditForm(true);
    setShowQuestions(false);
    setVerificationPass('');
  };

  const handleVerifyEditPassword = async () => {
    if (!verificationPass || verificationPass.trim() === '') {
      showToast("Please enter your password", "error");
      return;
    }
    
    try {
      const response = await api.post('/auth/verify-password', { password: verificationPass });
      console.log('Password verification response:', response.data);
      
      if (response.data.success) {
        setShowQuestions(true);
        showToast("Password verified successfully", "success");
      } else {
        showToast("Incorrect password. Please try again.", "error");
      }
    } catch (err) {
      console.error("Password verification error:", err);
      showToast(err.response?.data?.message || "Verification failed. Please try again.", "error");
    }
  };

  const formatCNIC = (value) => {
    const val = value.replace(/\D/g, '');
    if (val.length <= 5) return val;
    if (val.length <= 12) return `${val.slice(0, 5)}-${val.slice(5)}`;
    return `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12, 13)}`;
  };

  const formatPhone = (value) => {
    const val = value.replace(/\D/g, '');
    if (val.length <= 4) return val;
    return `${val.slice(0, 4)}-${val.slice(4, 11)}`;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${editEmp._id}`, editEmp);
      setShowEditForm(false);
      setEditEmp(null);
      fetchUsers();
      showToast("User updated successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user", "error");
    }
  };

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     emp.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div style={{ color: theme.text, padding: '20px' }}>Loading team members...</div>;

  return (
    <div style={{ padding: '0 5px' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '22px', fontWeight: '800' }}>Employee Directory</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>
            Manage access and reset credentials. 
            <span style={{ marginLeft: '10px', padding: '4px 10px', background: '#10b98115', color: '#10b981', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
              {employees.filter(e => e.isOnline).length} Active Now
            </span>
          </p>
        </div>
        
        {/* Compact Search Bar & Add Button Row */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} size={16}/>
            <input 
              placeholder="Search team..." 
              style={searchBarStyle(theme)}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowAddForm(true)} style={compactAddBtn}>
            <UserPlus size={16}/> <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.text }}>
          <thead>
            <tr style={{ textAlign: 'left', background: darkMode ? '#0f172a' : '#f8fafc', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <th style={{ padding: '20px' }}>Employee</th>
              <th>CNIC Number</th>
              <th>System Role</th>
              <th>Security Password</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp._id || emp.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: '0.2s' }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: '#3b82f615', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCircle size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: theme.subText }}>{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '13px', color: theme.text, fontWeight: '600' }}>
                    {emp.cnic || 'N/A'}
                  </div>
                </td>
                <td>
                  <span style={roleBadge(emp.role)}>
                    <ShieldCheck size={12}/> {emp.role}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: theme.input, padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '13px', color: theme.subText }}>
                      ••••••••
                    </span>
                  </div>
                </td>
                <td>
                  <span style={statusBadgeStyle(emp.isOnline ? 'Online' : 'Offline')}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: emp.isOnline ? '#10b981' : '#94a3b8' }}></div>
                    {emp.isOnline ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    <button onClick={() => handleEditClick(emp)} style={iconEditBtn}>
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp._id || emp.id)} style={iconDeleteBtn}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Add Employee Modal --- */}
      {showAddForm && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, background: theme.card, color: theme.text, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{fontSize: '18px', fontWeight: '800'}}>New Team Member</h3>
              <X onClick={() => setShowAddForm(false)} cursor="pointer" size={20} />
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input required placeholder="Full Name" style={formInput(theme)} value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} onKeyDown={handleKeyDown} />
              <input required placeholder="Email / ID" style={formInput(theme)} value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} onKeyDown={handleKeyDown} />
              <input required placeholder="Mobile Number (0000-0000000)" style={formInput(theme)} value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: formatPhone(e.target.value)})} onKeyDown={handleKeyDown} />
              <input required placeholder="CNIC Number (00000-0000000-0)" style={formInput(theme)} value={newEmp.cnic} onChange={e => setNewEmp({...newEmp, cnic: formatCNIC(e.target.value)})} onKeyDown={handleKeyDown} />
              <input required placeholder="System Password" type="password" style={formInput(theme)} onChange={e => setNewEmp({...newEmp, password: e.target.value})} onKeyDown={handleKeyDown} />
              <select style={formInput(theme)} onChange={e => setNewEmp({...newEmp, role: e.target.value})}>
                <option value="employee">Employee Access</option>
                <option value="admin">Admin Access</option>
              </select>

              {newEmp.role === 'admin' && (
                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '10px', marginTop: '5px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', marginBottom: '10px' }}>Security Recovery Questions (Admin Only):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <input required placeholder="Birth Place" style={{...formInput(theme), width: '100%'}} onChange={e => setNewEmp({...newEmp, securityQuestions: {...newEmp.securityQuestions, birthPlace: e.target.value}})} />
                    <input required placeholder="Favorite Pet" style={{...formInput(theme), width: '100%'}} onChange={e => setNewEmp({...newEmp, securityQuestions: {...newEmp.securityQuestions, favoritePet: e.target.value}})} />
                    <input required placeholder="Mother Name" style={{...formInput(theme), width: '100%'}} onChange={e => setNewEmp({...newEmp, securityQuestions: {...newEmp.securityQuestions, motherName: e.target.value}})} />
                    <input required placeholder="Favorite Color" style={{...formInput(theme), width: '100%'}} onChange={e => setNewEmp({...newEmp, securityQuestions: {...newEmp.securityQuestions, favoriteColor: e.target.value}})} />
                  </div>
                </div>
              )}

              <button type="submit" style={modalSubmitBtn}>Create Account</button>
            </form>
          </div>
        </div>
      )}
      {/* --- Edit Employee Modal --- */}
      {showEditForm && editEmp && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, background: theme.card, color: theme.text, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{fontSize: '18px', fontWeight: '800'}}>Edit Member Info</h3>
              <X onClick={() => setShowEditForm(false)} cursor="pointer" size={20} />
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input required value={editEmp.name || ''} placeholder="Full Name" style={formInput(theme)} onChange={e => setEditEmp({...editEmp, name: e.target.value})} />
              <input required value={editEmp.email || ''} placeholder="Email / ID" style={formInput(theme)} onChange={e => setEditEmp({...editEmp, email: e.target.value})} />
              <input required value={editEmp.cnic || ''} placeholder="CNIC Number" style={formInput(theme)} onChange={e => setEditEmp({...editEmp, cnic: e.target.value})} disabled />
              <input type="password" value={editEmp.password || ''} placeholder="New Password (Optional)" style={formInput(theme)} onChange={e => setEditEmp({...editEmp, password: e.target.value})} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyleSmall}>System Access Level</label>
                <select 
                  value={editEmp.role || 'employee'} 
                  style={{ ...formInput(theme), opacity: 0.7 }} 
                  onChange={e => setEditEmp({...editEmp, role: e.target.value})}
                  disabled={true}
                >
                  <option value="employee">Employee Access</option>
                  {editEmp.role === 'admin' && <option value="admin">Admin Access</option>}
                </select>
                <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                  {editEmp.role === 'admin' 
                    ? '* Admin roles cannot be changed for security reasons.' 
                    : '* Employee roles are fixed and cannot be promoted to Admin.'}
                </p>
              </div>

              {editEmp.role === 'admin' && (
                 <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '15px', marginTop: '10px' }}>
                    {/* Check if editing own account */}
                    {currentUser && editEmp.email === currentUser.email ? (
                       <>
                          {!showQuestions ? (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}>🔒 Enter your password to view/edit security questions:</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                   <input 
                                      type="password" 
                                      placeholder="Current Password" 
                                      style={{...formInput(theme), flex: 1}} 
                                      value={verificationPass}
                                      onChange={(e) => setVerificationPass(e.target.value)}
                                   />
                                   <button 
                                      type="button" 
                                      onClick={handleVerifyEditPassword}
                                      style={{ ...modalSubmitBtn, width: 'auto', padding: '0 20px', background: '#10b981' }}
                                   >
                                      Verify
                                   </button>
                                </div>
                             </div>
                          ) : (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>✓ Recovery Questions (Admin):</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                   <div>
                                      <label style={labelStyleSmall}>Birth Place</label>
                                      <input placeholder="Not set yet" style={{...formInput(theme), width: '100%'}} value={editEmp.securityQuestions?.birthPlace || ''} onChange={e => setEditEmp({...editEmp, securityQuestions: {...(editEmp.securityQuestions || {}), birthPlace: e.target.value}})} />
                                   </div>
                                   <div>
                                      <label style={labelStyleSmall}>Favorite Pet</label>
                                      <input placeholder="Not set yet" style={{...formInput(theme), width: '100%'}} value={editEmp.securityQuestions?.favoritePet || ''} onChange={e => setEditEmp({...editEmp, securityQuestions: {...(editEmp.securityQuestions || {}), favoritePet: e.target.value}})} />
                                   </div>
                                   <div>
                                      <label style={labelStyleSmall}>Mother Name</label>
                                      <input placeholder="Not set yet" style={{...formInput(theme), width: '100%'}} value={editEmp.securityQuestions?.motherName || ''} onChange={e => setEditEmp({...editEmp, securityQuestions: {...(editEmp.securityQuestions || {}), motherName: e.target.value}})} />
                                   </div>
                                   <div>
                                      <label style={labelStyleSmall}>Favorite Color</label>
                                      <input placeholder="Not set yet" style={{...formInput(theme), width: '100%'}} value={editEmp.securityQuestions?.favoriteColor || ''} onChange={e => setEditEmp({...editEmp, securityQuestions: {...(editEmp.securityQuestions || {}), favoriteColor: e.target.value}})} />
                                   </div>
                                </div>
                             </div>
                          )}
                       </>
                    ) : (
                       <p style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}>
                          Security questions can only be viewed/edited by the admin themselves.
                       </p>
                    )}
                 </div>
              )}

              <button type="submit" style={modalSubmitBtn}>Update Information</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Professional UI Styles ---
const searchBarStyle = (t) => ({
  width: '220px', // Fixed width for professional look
  padding: '10px 15px 10px 38px',
  borderRadius: '12px',
  border: `1px solid ${t.border}`,
  background: t.card,
  color: t.text,
  outline: 'none',
  fontSize: '13px',
  transition: '0.3s'
});

const compactAddBtn = {
  background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', 
  borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '8px', 
  alignItems: 'center', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
};

const formInput = (t) => ({ padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', fontSize: '14px' });
const modalSubmitBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' };
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px', display: 'block' };
const labelStyleSmall = { fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '3px', display: 'block' };
const badge = { background: '#3b82f615', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' };
const roleBadge = (role) => ({ display: 'flex', alignItems: 'center', gap: '5px', background: role === 'admin' ? '#ef444410' : '#3b82f610', color: role === 'admin' ? '#ef4444' : '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', width: 'fit-content', fontWeight: '800', textTransform: 'uppercase' });
const iconDeleteBtn = { background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px' };
const iconEditBtn = { background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '8px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' };
const modalContent = { padding: '30px', borderRadius: '25px', width: '450px', boxShadow: '0 20px 25px rgba(0,0,0,0.2)' };
const statusBadgeStyle = (status) => ({
  display: 'flex', alignItems: 'center', gap: '8px', 
  background: status === 'Online' ? '#10b98115' : '#94a3b815', 
  color: status === 'Online' ? '#10b981' : '#94a3b8', 
  padding: '6px 12px', borderRadius: '10px', fontSize: '12px', 
  fontWeight: '700', width: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.5px'
});

export default UserManagement;
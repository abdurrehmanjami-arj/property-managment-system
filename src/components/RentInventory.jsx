import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Eye, X, Trash2, Home, Key, User, Phone, MapPin, Building, DollarSign, Edit2 } from 'lucide-react';
import RentDetails from './RentDetails';
import api from '../api';
import { useSocket } from '../contexts/SocketContext';

const houseCard = { padding: '25px', borderRadius: '24px', cursor: 'pointer', transition: '0.3s', position: 'relative' };
const badge = { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' };
const primaryBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const viewBtn = { background: '#3b82f615', color: '#3b82f6', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' };
const inputStyle = (t) => ({ padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', width: '100%', boxSizing: 'border-box' });
const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px', display: 'block' };
const inputGroup = { display: 'flex', flexDirection: 'column' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 };
const modalContent = { width: '600px', maxWidth: '95%', padding: '40px', borderRadius: '30px', maxHeight: '90vh', overflowY: 'auto' };
const paginationBtn = {
  padding: '8px 16px',
  borderRadius: '10px',
  background: 'transparent',
  border: '1px solid transparent',
  fontSize: '13px',
  fontWeight: '700',
  transition: '0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const RentInventory = ({ darkMode, currentUser, showToast, askConfirm }) => {
  const [rents, setRents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRent, setSelectedRent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const isAdmin = currentUser?.role === 'admin';
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingId, setEditingId] = useState(null);
  const initialRentState = {
    houseNumber: '', address: '', type: 'House', ownerName: '', ownerPhone: '',
    tenantName: '', tenantFatherName: '', tenantPhone: '', tenantCnic: '',
    tenantAddress: '', monthlyRent: '', securityDeposit: '', status: 'Occupied'
  };
  const [newRent, setNewRent] = useState(initialRentState);

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f8fafc',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const fetchRents = async () => {
    try {
      const response = await api.get('/rents');
      setRents(response.data);
    } catch (err) {
      showToast('Failed to load rent records', 'error');
    }
  };

  const socket = useSocket();

  useEffect(() => {
    fetchRents();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('data-updated', (data) => {
        if (data.type === 'rent') {
          fetchRents();
        }
      });
      return () => socket.off('data-updated');
    }
  }, [socket]);

  // Sync selectedRent when list updates
  useEffect(() => {
    if (selectedRent) {
      const updated = rents.find(r => r._id === selectedRent._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedRent)) {
        setSelectedRent(updated);
      }
    }
  }, [rents]);

  const handleAddRent = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/rents/${editingId}`, newRent);
        showToast('Rent record updated successfully', 'success');
      } else {
        await api.post('/rents', newRent);
        showToast('Rent record added successfully', 'success');
      }
      fetchRents();
      setShowForm(false);
      setEditingId(null);
      setNewRent(initialRentState);
    } catch (err) {
      showToast(editingId ? 'Failed to update rent record' : 'Failed to add rent record', 'error');
    }
  };

  const handleEditRent = (r, e) => {
    e.stopPropagation();
    setEditingId(r._id);
    setNewRent({
      houseNumber: r.houseNumber || '',
      address: r.address || '',
      type: r.type || 'House',
      ownerName: r.ownerName || '',
      ownerPhone: r.ownerPhone || '',
      tenantName: r.tenantName || '',
      tenantFatherName: r.tenantFatherName || '',
      tenantPhone: r.tenantPhone || '',
      tenantCnic: r.tenantCnic || '',
      tenantAddress: r.tenantAddress || '',
      monthlyRent: r.monthlyRent || '',
      securityDeposit: r.securityDeposit || '',
      status: r.status || 'Occupied'
    });
    setShowForm(true);
  };

  const handleDeleteRent = (id, e) => {
    e.stopPropagation();
    askConfirm(
      "Delete Rent Record",
      "Are you sure you want to delete this rent record? This is irreversible.",
      async () => {
        try {
          await api.delete(`/rents/${id}`);
          fetchRents();
          showToast('Rent record deleted', 'success');
        } catch (err) {
          showToast('Failed to delete rent record', 'error');
        }
      }
    );
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

  const filteredRents = rents.filter(r => {
    const matchesSearch = r.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (r.tenantName && r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Pagination Logic
  const totalItems = filteredRents.length;
  const isShowAll = itemsPerPage === 'All';
  const effectiveItemsPerPage = isShowAll ? totalItems : itemsPerPage;
  const totalPages = isShowAll ? 1 : Math.ceil(totalItems / effectiveItemsPerPage);
  
  const indexOfLastItem = isShowAll ? totalItems : currentPage * effectiveItemsPerPage;
  const indexOfFirstItem = isShowAll ? 0 : indexOfLastItem - effectiveItemsPerPage;
  const currentItems = filteredRents.slice(indexOfFirstItem, indexOfLastItem);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, itemsPerPage]);

  return (
    <div style={{ padding: '0 5px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '24px', fontWeight: '800' }}>Rental Property Management</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} properties</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={16}/>
            <input 
              placeholder="Search house or tenant..." 
              style={{ ...inputStyle(theme), paddingLeft: '40px' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            style={{ ...inputStyle(theme), width: '150px' }}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Shop">Shop</option>
            <option value="Office">Office</option>
          </select>

          <button onClick={() => { setShowForm(true); setEditingId(null); setNewRent(initialRentState); }} style={primaryBtn}>
            <PlusCircle size={18}/> Add Property
          </button>
        </div>
      </div>

      {/* Grid of Rent Houses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {currentItems.map(r => (
          <div key={r._id} onClick={() => setSelectedRent(r)} style={{ ...houseCard, background: theme.card, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
               <span style={{ ...badge, background: '#3b82f615', color: '#3b82f6' }}>{r.type}</span>
               <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ ...badge, 
                    background: r.status === 'Occupied' ? '#10b98115' : '#f59e0b15', 
                    color: r.status === 'Occupied' ? '#10b981' : '#f59e0b' 
                  }}>{r.status}</span>
                  {isAdmin && (
                    <>
                      <Edit2 size={16} style={{ color: '#3b82f6', cursor: 'pointer', marginRight: '5px' }} onClick={(e) => handleEditRent(r, e)}/>
                      <Trash2 size={16} style={{ color: '#ef4444', cursor: 'pointer' }} onClick={(e) => handleDeleteRent(r._id, e)}/>
                    </>
                  )}
               </div>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: theme.text, margin: '0 0 5px 0' }}>{r.houseNumber}</h3>
            <p style={{ fontSize: '12px', color: theme.subText, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}>
               <MapPin size={12}/> {r.address || 'No address'}
            </p>

            <div style={{ background: theme.input, borderRadius: '16px', padding: '15px', marginBottom: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f615', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <User size={16}/>
                  </div>
                  <div>
                     <p style={{ margin: 0, fontSize: '10px', color: theme.subText, textTransform: 'uppercase' }}>Tenant</p>
                     <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.text }}>{r.tenantName || 'VACANT'}</p>
                     {r.tenantName && r.tenantFatherName && (
                       <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: '600', color: theme.subText }}>S/O {r.tenantFatherName.toUpperCase()}</p>
                     )}
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: '20px' }}>
               <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                     <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>Monthly Rent</p>
                     <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#3b82f6', whiteSpace: 'nowrap' }}>PKR {(r.monthlyRent || 0).toLocaleString()}</p>
                  </div>
                  <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
                     <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>Security</p>
                     <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#10b981', whiteSpace: 'nowrap' }}>PKR {(r.securityDeposit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <button style={viewBtn}><Eye size={14}/> Details</button>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Pagination Controls */}
      {totalItems > 0 && (
        <div style={{ 
          marginTop: '40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px',
          padding: '20px',
          background: theme.card,
          borderRadius: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: theme.subText, fontWeight: '600' }}>Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '10px', 
                background: theme.input, 
                color: theme.text, 
                border: `1px solid ${theme.border}`,
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10 Records</option>
              <option value={20}>20 Records</option>
              <option value={50}>50 Records</option>
              <option value={100}>100 Records</option>
              <option value="All">All Data</option>
            </select>
          </div>

          {!isShowAll && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ ...paginationBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                {[...Array(totalPages)].map((_, i) => {
                  const pg = i + 1;
                  if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1)) {
                    return (
                      <button 
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        style={{ 
                          ...paginationBtn, 
                          background: currentPage === pg ? '#3b82f6' : theme.input,
                          color: currentPage === pg ? 'white' : theme.text,
                          border: currentPage === pg ? 'none' : `1px solid ${theme.border}`,
                          minWidth: '35px'
                        }}
                      >
                        {pg}
                      </button>
                    );
                  } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                    return <span key={pg} style={{ color: theme.subText }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ ...paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
          
          <div style={{ fontSize: '13px', color: theme.subText, fontWeight: '600' }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Add New Rent Form Modal */}
      {showForm && (
        <div style={modalOverlay}>
          <div className="modal-content animate-slide-up" style={{ 
            ...modalContent, 
            background: theme.card, 
            color: theme.text,
            padding: '0',
            width: '700px',
            maxWidth: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '35px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: `1px solid ${theme.border}`,
            position: 'relative'
          }}>
             {/* Modal Header */}
             <div style={{ 
                padding: '30px 40px', 
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: `linear-gradient(to right, ${darkMode ? '#065f4620' : '#10b98110'}, transparent)`
             }}>
               <div>
                 <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{editingId ? 'Edit Rent Property' : 'List New Rent Property'}</h3>
                 <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: theme.subText }}>Add a house, shop or office to rental inventory</p>
               </div>
               <div 
                onClick={() => setShowForm(false)} 
                style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
               >
                 <X style={{ color: theme.subText }} size={20}/>
               </div>
             </div>
             
             <form onSubmit={handleAddRent} style={{ padding: '40px' }}>
                {/* Section 1: Property Info */}
                <div style={{ marginBottom: '30px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <Building size={18} style={{ color: '#10b981' }}/>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Property Basics</h4>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <label style={labelStyle}>House / Shop Number</label>
                         <input required placeholder="e.g. H-45" style={inputStyle(theme)} value={newRent.houseNumber} onChange={e => setNewRent({...newRent, houseNumber: e.target.value})}/>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <label style={labelStyle}>Property Type</label>
                         <select style={inputStyle(theme)} value={newRent.type} onChange={e => setNewRent({...newRent, type: e.target.value})}>
                            <option value="House">House</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Shop">Shop</option>
                            <option value="Office">Office</option>
                         </select>
                      </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>Complete Location / Address</label>
                      <input placeholder="e.g. Street 4, Phase 2, Blue World" style={inputStyle(theme)} value={newRent.address} onChange={e => setNewRent({...newRent, address: e.target.value})}/>
                   </div>
                </div>

                {/* Section 2: Financials */}
                <div style={{ marginBottom: '30px', padding: '25px', background: theme.input, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <DollarSign size={18} style={{ color: '#3b82f6' }}/>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Rental Terms</h4>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                         <label style={labelStyle}>Monthly Rent (PKR)</label>
                         <input required type="number" placeholder="0.00" style={{...inputStyle(theme), background: theme.card}} value={newRent.monthlyRent} onChange={e => setNewRent({...newRent, monthlyRent: e.target.value})}/>
                      </div>
                      <div>
                         <label style={labelStyle}>Security Deposit (PKR)</label>
                         <input type="number" placeholder="0.00" style={{...inputStyle(theme), background: theme.card}} value={newRent.securityDeposit} onChange={e => setNewRent({...newRent, securityDeposit: e.target.value})}/>
                      </div>
                   </div>
                   

                </div>

                {/* Section 3: Tenant Details (Customer) */}
                <div style={{ marginBottom: '35px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                     <User size={18} style={{ color: '#f59e0b' }}/>
                     <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Rent Customer (Tenant) Information</h4>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                     <div style={inputGroup}>
                        <label style={labelStyle}>Full Name</label>
                        <input placeholder="Full Name" style={inputStyle(theme)} value={newRent.tenantName} onChange={e => setNewRent({...newRent, tenantName: e.target.value})}/>
                     </div>
                     <div style={inputGroup}>
                        <label style={labelStyle}>Father's Name</label>
                        <input placeholder="Father's Name" style={inputStyle(theme)} value={newRent.tenantFatherName} onChange={e => setNewRent({...newRent, tenantFatherName: e.target.value})}/>
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                     <div style={inputGroup}>
                        <label style={labelStyle}>Phone Number</label>
                        <input placeholder="03xx-xxxxxxx" style={inputStyle(theme)} value={newRent.tenantPhone} onChange={e => setNewRent({...newRent, tenantPhone: formatPhone(e.target.value)})}/>
                     </div>
                     <div style={inputGroup}>
                        <label style={labelStyle}>CNIC / ID Number</label>
                        <input placeholder="00000-0000000-0" style={inputStyle(theme)} value={newRent.tenantCnic} onChange={e => setNewRent({...newRent, tenantCnic: formatCNIC(e.target.value)})}/>
                     </div>
                  </div>

                   <div style={inputGroup}>
                      <label style={labelStyle}>Full Address</label>
                      <input placeholder="Current / Home Address" style={inputStyle(theme)} value={newRent.tenantAddress} onChange={e => setNewRent({...newRent, tenantAddress: e.target.value})}/>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="submit" style={{ ...primaryBtn, flex: 2, padding: '18px', borderRadius: '18px', fontSize: '16px' }}>
                    {editingId ? 'Update Rent Record' : 'Save Rent Record'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.subText, borderRadius: '18px', fontWeight: '700', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {selectedRent && <RentDetails rent={selectedRent} onClose={() => { setSelectedRent(null); fetchRents(); }} darkMode={darkMode} currentUser={currentUser} showToast={showToast} askConfirm={askConfirm} onRentUpdate={(updated) => {
        setRents(prev => prev.map(r => r._id === updated._id ? updated : r));
        setSelectedRent(updated);
      }} />}
    </div>
  );
};

export default RentInventory;

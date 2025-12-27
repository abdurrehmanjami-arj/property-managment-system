import React, { useState, useEffect } from 'react';
import { Search, User, Phone, MapPin, Building, FileText, Calendar, CreditCard, Trash2, Edit } from 'lucide-react';
import api from '../api';
import RentDetails from './RentDetails';
import { useSocket } from '../contexts/SocketContext';

const RentCustomers = ({ darkMode, currentUser, showToast, askConfirm }) => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRent, setSelectedRent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const handleDeleteRent = async (id, e) => {
    e.stopPropagation();
    askConfirm(
      "Delete Rent Record",
      "Are you sure you want to delete this rent record? This will remove all payment history for this house and tenant.",
      async () => {
        try {
          await api.delete(`/rents/${id}`);
          fetchData();
          showToast('Rent record deleted successfully', 'success');
        } catch (err) {
          showToast('Failed to delete rent record', 'error');
        }
      }
    );
  };
  const fetchData = async () => {
    try {
      const response = await api.get('/rents');
      // Only show those with a tenant Name
      setRents(response.data.filter(r => r.tenantName));
    } catch (err) {
      showToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('data-updated', (data) => {
        if (data.type === 'rent') {
          fetchData();
        }
      });
      return () => socket.off('data-updated');
    }
  }, [socket]);

  // Sync selectedRent when data updates
  useEffect(() => {
    if (selectedRent) {
      const updated = rents.find(r => r._id === selectedRent._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedRent)) {
        setSelectedRent(updated);
      }
    }
  }, [rents]);

  const filtered = rents.filter(r => 
    r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalItems = filtered.length;
  const isShowAll = itemsPerPage === 'All';
  const effectiveItemsPerPage = isShowAll ? totalItems : itemsPerPage;
  const totalPages = isShowAll ? 1 : Math.ceil(totalItems / effectiveItemsPerPage);
  
  const indexOfLastItem = isShowAll ? totalItems : currentPage * effectiveItemsPerPage;
  const indexOfFirstItem = isShowAll ? 0 : indexOfLastItem - effectiveItemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Reset pagination on search or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <div style={{ padding: '0 5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '24px', fontWeight: '800' }}>Rent Customer Directory</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} customers</p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={16}/>
          <input 
            placeholder="Search tenant or house..." 
            style={inputStyle(theme)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {currentItems.map(r => (
          <div key={r._id} onClick={() => setSelectedRent(r)} style={{ ...tenantCard, background: theme.card, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
               <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#3b82f615', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={22}/>
               </div>
                <div style={{ flex: 1 }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: theme.text }}>{r.tenantName}</h3>
                   <div style={{ fontSize: '12px', color: theme.subText, marginBottom: '5px', fontWeight: '600' }}>
                      S/O: {r.tenantFatherName || 'N/A'}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '12px' }}>
                      <Phone size={12}/> {r.tenantPhone}
                   </div>
                </div>
                 <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '-5px' }}>
                    <div 
                       style={{ background: '#3b82f615', color: '#3b82f6', padding: '8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                       onClick={(e) => { e.stopPropagation(); setSelectedRent(r); }}
                    >
                       <Edit size={16}/>
                    </div>
                    {currentUser?.role === 'admin' && (
                       <div 
                          style={{ background: '#ef444415', color: '#ef4444', padding: '8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => handleDeleteRent(r._id, e)}
                       >
                          <Trash2 size={16}/>
                       </div>
                    )}
                 </div>
             </div>

            <div style={{ background: theme.input, borderRadius: '16px', padding: '15px', marginBottom: '15px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: theme.text }}>
                     <Building size={14} style={{ color: '#3b82f6' }}/> {r.houseNumber}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>Active Tenant</span>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
               <div>
                  <p style={{ margin: 0, fontSize: '10px', color: theme.subText }}>Monthly Rent</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.text }}>PKR {r.monthlyRent.toLocaleString()}</p>
               </div>
               <button style={reportBtn}><FileText size={14}/> View Ledger</button>
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

      {selectedRent && <RentDetails rent={selectedRent} onClose={() => { setSelectedRent(null); fetchData(); }} darkMode={darkMode} currentUser={currentUser} showToast={showToast} askConfirm={askConfirm} onRentUpdate={(updated) => {
        setRents(prev => prev.map(r => r._id === updated._id ? updated : r));
        setSelectedRent(updated);
      }} />}
    </div>
  );
};

const tenantCard = { padding: '25px', borderRadius: '24px', cursor: 'pointer', transition: '0.2s' };
const inputStyle = (t) => ({ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.card, color: t.text, outline: 'none' });
const reportBtn = { background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };

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

export default RentCustomers;

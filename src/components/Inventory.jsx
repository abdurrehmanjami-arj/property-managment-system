import React, { useState } from 'react';
import { PlusCircle, User, Home, DollarSign, Search, Filter, Eye, X, Trash2, Edit2 } from 'lucide-react';
import PropertyDetails from './PropertyDetails';
import api from '../api';

import { useSocket } from '../contexts/SocketContext';

const Inventory = ({ darkMode, currentUser, showToast, askConfirm }) => {
  const socket = useSocket();
  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f8fafc',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScheme, setFilterScheme] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const initialPlotState = { 
    plot: '', 
    sizeNum: '', 
    sizeUnit: 'Marla', 
    size: '', 
    scheme: '', 
    price: '', 
    advancePayment: '', // Token
    downPayment: '',    // Actual Down Payment
    installments: '', 
    years: '', 
    rawYears: 0, 
    monthly: '',
    buyerName: '',
    buyerPhone: '',
    buyerCnic: '',
    buyerAddress: ''
  };
  const [newPlot, setNewPlot] = useState(initialPlotState);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (err) {
      // Silent error
    }
  };

  React.useEffect(() => {
    fetchProperties();
  }, []);

  React.useEffect(() => {
    if (socket) {
      socket.on('data-updated', (data) => {
        fetchProperties();
      });
      return () => {
        socket.off('data-updated');
      };
    }
  }, [socket]);

  // Sync selectedProperty when properties list updates
  React.useEffect(() => {
    if (selectedProperty) {
      const updated = properties.find(p => p._id === selectedProperty._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProperty)) {
        setSelectedProperty(updated);
      }
    }
  }, [properties]);

  const handleAddPlot = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        plotNumber: newPlot.plot,
        size: newPlot.size,
        scheme: newPlot.scheme,
        totalPrice: Number(newPlot.price),
        advancePayment: Number(newPlot.advancePayment), // Token
        downPayment: Number(newPlot.downPayment),       // Down Payment
        numInstallments: Number(newPlot.installments),
        numYears: Number(newPlot.rawYears),
        monthlyInstallment: Number(newPlot.monthly),
        agent: currentUser.name,
        buyerName: newPlot.buyerName,
        buyerPhone: newPlot.buyerPhone,
        buyerCnic: newPlot.buyerCnic,
        buyerAddress: newPlot.buyerAddress
      };

      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
        showToast("Property updated successfully", "success");
      } else {
        await api.post('/properties', payload);
        showToast("Property added successfully", "success");
      }

      fetchProperties();
      setShowForm(false);
      setEditingId(null);
      setNewPlot(initialPlotState);
    } catch (err) {
      showToast(err.response?.data?.message || (editingId ? 'Failed to update plot' : 'Failed to add plot'), "error");
    }
  };

  const handleEditProperty = (p, e) => {
    e.stopPropagation();
    setEditingId(p._id);

    // Parse size "5 Marla" -> num: 5, unit: Marla
    const sizeParts = (p.size || '').split(' ');
    const sizeNum = sizeParts[0] || '';
    const sizeUnit = sizeParts[1] || 'Marla';

    // Recalculate installments logic for display
    const { inst, yrs, rawYears } = calculateInstallments(p.totalPrice, p.advancePayment, p.downPayment, p.monthlyInstallment);

    setNewPlot({
        plot: p.plotNumber,
        sizeNum: sizeNum,
        sizeUnit: sizeUnit,
        size: p.size,
        scheme: p.scheme,
        price: p.totalPrice,
        advancePayment: p.advancePayment,
        downPayment: p.downPayment,
        installments: inst,
        years: yrs,
        rawYears: rawYears || p.numYears,
        monthly: p.monthlyInstallment,
        buyerName: p.buyerName || '',
        buyerPhone: p.buyerPhone || '',
        buyerCnic: p.buyerCnic || '',
        buyerAddress: p.buyerAddress || ''
    });

    setShowForm(true);
  };

  const handleDeleteProperty = async (id, e) => {
    e.stopPropagation();
    askConfirm(
      "Remove Property",
      "Are you sure you want to delete this property plot? This will also remove all associated payment logs for this buyer.",
      async () => {
        try {
          await api.delete(`/properties/${id}`);
          fetchProperties();
          showToast("Property deleted successfully", "success");
        } catch (err) {
          showToast("Failed to delete property", "error");
        }
      }
    );
  };

  const calculateInstallments = (price, advance, down, monthly) => {
    const p = Number(price) || 0;
    const a = Number(advance) || 0;
    const d = Number(down) || 0;
    const m = Number(monthly) || 0;
    
    if (m > 0) {
      const remaining = p - (a + d);
      const inst = Math.ceil(remaining / m);
      
      const yrs = Math.floor(inst / 12);
      const months = inst % 12;
      
      let formattedYears = "";
      if (yrs > 0) formattedYears += `${yrs} year${yrs > 1 ? 's' : ''}`;
      if (months > 0) formattedYears += `${formattedYears ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
      
      return { inst, yrs: formattedYears || "0 months", rawYears: (inst / 12).toFixed(1) };
    }
    return { inst: '', yrs: '', rawYears: 0 };
  };

  const onFinanceChange = (field, value) => {
    const updatedPlot = { ...newPlot, [field]: value };
    const { inst, yrs, rawYears } = calculateInstallments(updatedPlot.price, updatedPlot.advancePayment, updatedPlot.downPayment, updatedPlot.monthly);
    setNewPlot({ ...updatedPlot, installments: inst, years: yrs, rawYears: rawYears });
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddPlot(e);
    }
  };



  const filteredProperties = properties.filter(p => {
    const plotNum = p.plotNumber || '';
    const schemeName = p.scheme || '';
    const matchesSearch = plotNum.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         schemeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterScheme === 'All' || p.scheme === filterScheme;
    return matchesSearch && matchesFilter;
  });

  const uniqueSchemes = ['All', ...new Set(properties.map(p => p.scheme))];

  return (
    <div style={{ padding: '0 5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: theme.text, fontWeight: '800' }}>Property Inventory</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>{filteredProperties.length} properties available</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} size={16}/>
            <input 
              placeholder="Search plot or scheme..." 
              style={searchBarStyle(theme)}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div style={{ position: 'relative' }}>
            <Filter style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} size={16}/>
            <select 
              style={{ ...searchBarStyle(theme), paddingLeft: '38px', cursor: 'pointer' }}
              onChange={(e) => setFilterScheme(e.target.value)}
            >
              {uniqueSchemes.map(scheme => (
                <option key={scheme} value={scheme}>{scheme}</option>
              ))}
            </select>
          </div>

          {currentUser?.role === 'admin' && (
            <button onClick={() => { setShowForm(true); setEditingId(null); setNewPlot(initialPlotState); }} style={primaryBtn}>
              <PlusCircle size={18}/> Add New Plot
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredProperties.map(p => (
          <div key={p._id} style={{ padding: '20px', borderRadius: '20px', background: theme.card, border: `1px solid ${theme.border}`, transition: '0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start' }}>
              <span style={badge}>{p.scheme}</span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                   color: (p.status === 'Completed' || (p.totalPrice - ((p.advancePayment || 0) + (p.downPayment || 0) + (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0)) <= 0)) ? '#ffffff' : '#10b981', 
                   background: (p.status === 'Completed' || (p.totalPrice - ((p.advancePayment || 0) + (p.downPayment || 0) + (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0)) <= 0)) ? '#10b981' : 'transparent',
                   padding: (p.status === 'Completed' || (p.totalPrice - ((p.advancePayment || 0) + (p.downPayment || 0) + (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0)) <= 0)) ? '2px 8px' : '0',
                   borderRadius: '6px',
                   fontWeight: '900', 
                   fontSize: '11px', 
                   whiteSpace: 'nowrap',
                   textTransform: 'uppercase'
                }}>
                   {(p.totalPrice - ((p.advancePayment || 0) + (p.downPayment || 0) + (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0)) <= 0) ? 'Completed' : p.status}
                </span>
                {currentUser?.role === 'admin' && (
                  <>
                    <Edit2 
                      size={16} 
                      style={{ color: '#3b82f6', cursor: 'pointer' }} 
                      onClick={(e) => handleEditProperty(p, e)}
                    />
                    <Trash2 
                      size={16} 
                      style={{ color: '#ef4444', cursor: 'pointer' }} 
                      onClick={(e) => handleDeleteProperty(p._id, e)}
                    />
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: theme.text, fontSize: '20px', margin: 0 }}>Plot # {p.plotNumber}</h3>
              <span style={{ background: '#3b82f615', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{p.size}</span>
            </div>
            
            {/* Customer Name Tag */}
            <div style={{ marginBottom: '15px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', background: '#3b82f610', padding: '6px 12px', borderRadius: '10px', width: 'fit-content' }}>
                  <User size={14}/>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>{p.buyerName || 'Unsold'}</span>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Price:</span> <span style={{ color: theme.text, fontWeight: '600' }}>PKR {p.totalPrice?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid (Token+DP):</span> <span style={{ color: '#3b82f6' }}>PKR {((p.advancePayment || 0) + (p.downPayment || 0))?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', padding: '8px', background: theme.input, borderRadius: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Remaining:</span>
                <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '13px' }}>
                  PKR {(p.totalPrice - ((p.advancePayment || 0) + (p.downPayment || 0) + (p.payments?.reduce((s, pay) => s + pay.amount, 0) || 0)))?.toLocaleString()}
                </span>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={14}/> <span style={{fontSize: '12px'}}>Sold By: {p.agent}</span>
              </div>
              <button 
                onClick={() => setSelectedProperty(p)}
                style={viewDetailsBtn}
              >
                <Eye size={14}/> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={{ padding: '30px', borderRadius: '25px', width: '600px', background: theme.card, color: theme.text, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: '800', margin: 0 }}>{editingId ? 'Edit Plot Details' : 'Plot Booking Form'}</h3>
              <X onClick={() => setShowForm(false)} style={{ cursor: 'pointer', color: theme.subText }} size={24}/>
            </div>
            <form onSubmit={handleAddPlot} style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '10px' }}>
              
              {/* Section 1: Property Details */}
              <div style={{ padding: '20px', background: theme.input, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Home size={18} style={{ color: '#3b82f6' }}/>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Property Details</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div>
                      <label style={labelStyle}>Plot Number / ID</label>
                      <input required placeholder="e.g. Plot 45-A" style={inputStyle(theme)} value={newPlot.plot} onChange={e => setNewPlot({...newPlot, plot: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Scheme / Project Name</label>
                      <input required placeholder="e.g. Royal Orchard" style={inputStyle(theme)} value={newPlot.scheme} onChange={e => setNewPlot({...newPlot, scheme: e.target.value})} />
                   </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                   <label style={labelStyle}>Area Size</label>
                   <div style={{ display: 'flex', gap: '10px' }}>
                      <input required type="number" placeholder="Size (e.g. 5)" style={{...inputStyle(theme), flex: 1}} value={newPlot.sizeNum} onChange={e => {
                        const num = e.target.value;
                        setNewPlot({...newPlot, sizeNum: num, size: `${num} ${newPlot.sizeUnit}`});
                      }} />
                      <select style={{...inputStyle(theme), width: '120px'}} value={newPlot.sizeUnit} onChange={e => {
                        const unit = e.target.value;
                        setNewPlot({...newPlot, sizeUnit: unit, size: `${newPlot.sizeNum} ${unit}`});
                      }}>
                        <option value="Marla">Marla</option>
                        <option value="Kanal">Kanal</option>
                        <option value="Sq Ft">Sq Ft</option>
                        <option value="Acre">Acre</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Section 2: Financials */}
              <div style={{ padding: '20px', background: theme.input, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <DollarSign size={18} style={{ color: '#10b981' }}/>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Plan</h4>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Total Property Price (PKR)</label>
                  <input required type="number" placeholder="0.00" style={{...inputStyle(theme), background: theme.card, fontSize: '16px', fontWeight: '700', color: '#10b981'}} value={newPlot.price} onChange={e => onFinanceChange('price', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                   <div>
                      <label style={labelStyle}>Token / Advance (Optional)</label>
                      <input type="number" placeholder="Initial Token" style={inputStyle(theme)} value={newPlot.advancePayment} onChange={e => onFinanceChange('advancePayment', e.target.value)} /> 
                      <p style={{ fontSize: '10px', color: theme.subText, marginTop: '5px' }}>Booking amount (if any)</p>
                   </div>
                   <div>
                      <label style={labelStyle}>Down Payment (Optional)</label>
                      <input type="number" placeholder="Lump sum payment" style={inputStyle(theme)} value={newPlot.downPayment} onChange={e => onFinanceChange('downPayment', e.target.value)} />
                      <p style={{ fontSize: '10px', color: theme.subText, marginTop: '5px' }}>Major payment after booking</p>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center', background: theme.card, padding: '15px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
                   <div>
                      <label style={labelStyle}>Monthly Installment</label>
                      <input type="number" placeholder="0.00" style={inputStyle(theme)} value={newPlot.monthly} onChange={e => onFinanceChange('monthly', e.target.value)} />
                   </div>
                   <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '11px', color: theme.subText }}>Estimated Tenure</div>
                       <div style={{ fontSize: '14px', fontWeight: '800', color: theme.text }}>{newPlot.installments || 0} Installments</div>
                       <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700' }}>{newPlot.years || '0 months'}</div>
                   </div>
                </div>
              </div>

              {/* Section 3: Buyer Info */}
              <div style={{ padding: '20px', background: theme.input, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <User size={18} style={{ color: '#f59e0b' }}/>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Buyer Information</h4>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div>
                      <label style={labelStyle}>Full Name</label>
                      <input required placeholder="Buyer Name" style={inputStyle(theme)} value={newPlot.buyerName} onChange={e => setNewPlot({...newPlot, buyerName: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input required placeholder="03xx-xxxxxxx" style={inputStyle(theme)} value={newPlot.buyerPhone} onChange={e => setNewPlot({...newPlot, buyerPhone: formatPhone(e.target.value)})} />
                   </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                   <label style={labelStyle}>CNIC Number</label>
                   <input required placeholder="00000-0000000-0" style={inputStyle(theme)} value={newPlot.buyerCnic} onChange={e => setNewPlot({...newPlot, buyerCnic: formatCNIC(e.target.value)})} />
                </div>

                <div>
                   <label style={labelStyle}>Residential Address</label>
                   <textarea required placeholder="Full Address" style={{...inputStyle(theme), height: '80px', resize: 'none'}} value={newPlot.buyerAddress} onChange={e => setNewPlot({...newPlot, buyerAddress: e.target.value})} />
                </div>
              </div>

               {/* Summary Footer */}
              <div style={{ background: '#3b82f610', padding: '20px', borderRadius: '15px', border: '1px solid #3b82f630', textAlign: 'center' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: theme.subText, marginBottom: '5px' }}>Net Payable Balance</p>
                 <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>
                    PKR {(Number(newPlot.price) - (Number(newPlot.advancePayment || 0) + Number(newPlot.downPayment || 0))).toLocaleString()}
                 </h3>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={{ ...primaryBtn, flex: 1, padding: '15px', fontSize: '16px' }}>{editingId ? 'Update Property' : 'Confirm & Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${theme.border}`, padding: '15px', borderRadius: '12px', color: theme.subText, fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProperty && (
        <PropertyDetails 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
          darkMode={darkMode}
          currentUser={currentUser}
          showToast={showToast}
          askConfirm={askConfirm}
          onPropertyUpdate={(updatedProperty) => {
            // Update the property in the list
            setProperties(prev => prev.map(p => 
              p._id === updatedProperty._id ? updatedProperty : p
            ));
            // Update selected property to reflect changes
            setSelectedProperty(updatedProperty);
          }}
        />
      )}
    </div>
  );
};

const searchBarStyle = (t) => ({
  width: '200px',
  padding: '10px 15px 10px 38px',
  borderRadius: '12px',
  border: `1px solid ${t.border}`,
  background: t.card,
  color: t.text,
  outline: 'none',
  fontSize: '13px',
  transition: '0.3s'
});

const primaryBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' };
const viewDetailsBtn = { background: '#3b82f615', color: '#3b82f6', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '10px', fontSize: '13px', width: '100%' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(5px)' };
const inputStyle = (t) => ({ padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', width: '100%', boxSizing: 'border-box' });
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px', display: 'block' };
const badge = { background: '#3b82f615', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' };

export default Inventory;
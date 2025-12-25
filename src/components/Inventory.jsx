import React, { useState } from 'react';
import { PlusCircle, User, Home, DollarSign, Search, Filter, Eye, X, Trash2 } from 'lucide-react';
import PropertyDetails from './PropertyDetails';
import api from '../api';

const Inventory = ({ darkMode, currentUser, showToast, askConfirm }) => {
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
  const [newPlot, setNewPlot] = useState({ 
    plot: '', 
    sizeNum: '', 
    sizeUnit: 'Marla', 
    size: '', 
    scheme: '', 
    price: '', 
    downPayment: '', 
    installments: '', 
    years: '', 
    rawYears: 0, 
    monthly: '',
    buyerName: '',
    buyerPhone: '',
    buyerCnic: '',
    buyerAddress: ''
  });

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

  const handleAddPlot = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        plotNumber: newPlot.plot,
        size: newPlot.size,
        scheme: newPlot.scheme,
        totalPrice: Number(newPlot.price),
        advancePayment: Number(newPlot.downPayment),
        numInstallments: Number(newPlot.installments),
        numYears: Number(newPlot.rawYears),
        monthlyInstallment: Number(newPlot.monthly),
        agent: currentUser.name,
        buyerName: newPlot.buyerName,
        buyerPhone: newPlot.buyerPhone,
        buyerCnic: newPlot.buyerCnic,
        buyerAddress: newPlot.buyerAddress
      };
      await api.post('/properties', payload);
      fetchProperties();
      setShowForm(false);
      setNewPlot({ plot: '', sizeNum: '', sizeUnit: 'Marla', size: '', scheme: '', price: '', downPayment: '', installments: '', years: '', rawYears: 0, monthly: '', buyerName: '', buyerPhone: '', buyerCnic: '', buyerAddress: '' });
      showToast("Property added successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add plot', "error");
    }
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

  const calculateInstallments = (price, downPayment, monthly) => {
    const p = Number(price) || 0;
    const d = Number(downPayment) || 0;
    const m = Number(monthly) || 0;
    
    if (m > 0) {
      const remaining = p - d;
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
    const { inst, yrs, rawYears } = calculateInstallments(updatedPlot.price, updatedPlot.downPayment, updatedPlot.monthly);
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
            <button onClick={() => setShowForm(true)} style={primaryBtn}>
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
                   color: (p.status === 'Completed' || (p.totalPrice - (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '#ffffff' : '#10b981', 
                   background: (p.status === 'Completed' || (p.totalPrice - (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '#10b981' : 'transparent',
                   padding: (p.status === 'Completed' || (p.totalPrice - (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '2px 8px' : '0',
                   borderRadius: '6px',
                   fontWeight: '900', 
                   fontSize: '11px', 
                   whiteSpace: 'nowrap',
                   textTransform: 'uppercase'
                }}>
                   {(p.totalPrice - (p.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0) ? 'Completed' : p.status}
                </span>
                {currentUser?.role === 'admin' && (
                  <Trash2 
                    size={16} 
                    style={{ color: '#ef4444', cursor: 'pointer' }} 
                    onClick={(e) => handleDeleteProperty(p._id, e)}
                  />
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
                <span>Down Payment:</span> <span style={{ color: '#3b82f6' }}>PKR {p.advancePayment?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', padding: '8px', background: theme.input, borderRadius: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Remaining:</span>
                <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '13px' }}>
                  PKR {(p.totalPrice - (p.payments?.reduce((s, pay) => s + pay.amount, 0) || p.advancePayment))?.toLocaleString()}
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
              <h3 style={{ fontWeight: '800', margin: 0 }}>Plot Booking Form</h3>
              <X onClick={() => setShowForm(false)} style={{ cursor: 'pointer', color: theme.subText }} size={24}/>
            </div>
            <form onSubmit={handleAddPlot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Plot & Scheme</label>
                  <input required placeholder="Plot Number" style={inputStyle(theme)} onChange={e => setNewPlot({...newPlot, plot: e.target.value})} />
                  <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                    <input required type="number" placeholder="Size" style={{...inputStyle(theme), flex: 1}} onChange={e => {
                      const num = e.target.value;
                      setNewPlot({...newPlot, sizeNum: num, size: `${num} ${newPlot.sizeUnit}`});
                    }} />
                    <select style={{...inputStyle(theme), width: '100px'}} value={newPlot.sizeUnit} onChange={e => {
                      const unit = e.target.value;
                      setNewPlot({...newPlot, sizeUnit: unit, size: `${newPlot.sizeNum} ${unit}`});
                    }}>
                      <option value="Marla">Marla</option>
                      <option value="Kanal">Kanal</option>
                      <option value="Sq Ft">Sq Ft</option>
                      <option value="Acre">Acre</option>
                    </select>
                  </div>
                  <input required placeholder="Scheme Name" style={{...inputStyle(theme), marginTop: '10px'}} onChange={e => setNewPlot({...newPlot, scheme: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Pricing</label>
                  <input required type="number" placeholder="Total Price" style={inputStyle(theme)} onChange={e => onFinanceChange('price', e.target.value)} />
                  <input required type="number" placeholder="Advance Payment" style={{...inputStyle(theme), marginTop: '10px'}} onChange={e => onFinanceChange('downPayment', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr', gap: '15px', background: theme.input, padding: '15px', borderRadius: '15px', alignItems: 'center' }}>
                <div>
                  <label style={labelStyle}>Monthly Amount</label>
                  <input required type="number" placeholder="Amount" style={inputStyle(theme)} onChange={e => onFinanceChange('monthly', e.target.value)} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <label style={labelStyle}>Installments</label>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: '#3b82f6' }}>{newPlot.installments || '0'}</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
                  <label style={labelStyle}>Total Tenure (Years/Months)</label>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: '#10b981', whiteSpace: 'nowrap' }}>{newPlot.years || 'Auto Calculate'}</div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>Buyer Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input required placeholder="Buyer Name" style={inputStyle(theme)} value={newPlot.buyerName} onChange={e => setNewPlot({...newPlot, buyerName: e.target.value})} />
                  <input required placeholder="Buyer Phone (0000-0000000)" style={inputStyle(theme)} value={newPlot.buyerPhone} onChange={e => setNewPlot({...newPlot, buyerPhone: formatPhone(e.target.value)})} />
                </div>
                <input required placeholder="Buyer CNIC Number (00000-0000000-0)" style={{...inputStyle(theme), marginTop: '10px'}} value={newPlot.buyerCnic} onChange={e => setNewPlot({...newPlot, buyerCnic: formatCNIC(e.target.value)})} />
                <textarea required placeholder="Buyer Complete Address" style={{...inputStyle(theme), marginTop: '10px', height: '60px'}} onChange={e => setNewPlot({...newPlot, buyerAddress: e.target.value})} />
              </div>

              <div style={{ fontSize: '13px', color: '#10b981', background: '#10b98110', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                Remaining Balance: <b>PKR {(Number(newPlot.price) - Number(newPlot.downPayment)).toLocaleString()}</b>
              </div>

              <button type="submit" style={primaryBtn}>Confirm Booking</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
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
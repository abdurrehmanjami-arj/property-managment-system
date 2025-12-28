import React, { useState, useEffect } from 'react';
import { Users, Home, Search, MapPin, Phone, CreditCard, X, Edit, Trash2, FileText, Download, User, Calendar, DollarSign } from 'lucide-react';
import api from '../api';
import PropertyDetails from './PropertyDetails';

const Customers = ({ darkMode, currentUser, showToast, askConfirm }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (err) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    askConfirm(
      "Delete Customer Record",
      "Are you sure you want to permanently delete this customer and all their property history? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/properties/${id}`);
          fetchData();
          showToast("Customer record deleted successfully", "success");
        } catch (err) {
          showToast('Failed to delete customer', "error");
        }
      }
    );
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/properties/${editCustomer._id}`, editCustomer);
      setEditCustomer(null);
      fetchData();
      showToast('Customer updated successfully!', "success");
    } catch (err) {
      showToast('Failed to update customer', "error");
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

  const generateReport = (p, e) => {
    e.stopPropagation();
    const totalPaid = p.payments?.reduce((s, pay) => s + pay.amount, 0) || 0;
    const remaining = p.totalPrice - totalPaid;
    
    const reportWindow = window.open('', '_blank');
    const reportHTML = `
      <html>
        <head>
          <title>Customer Ledger - ${p.buyerName}</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; background: #fff; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 900; }
            .logo span { color: #3b82f6; }
            .report-title { text-align: right; }
            .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; margin-top: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 8px; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .info-value { font-size: 13px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #64748b; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .summary-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 25px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; break-inside: avoid; }
            .summary-item h3 { margin: 2px 0 0 0; font-size: 18px; }
            
            .signature-section { margin-top: 50px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; break-inside: avoid; }
            .sig-box { display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .sig-line { border-top: 1px solid #94a3b8; width: 140px; margin-bottom: 8px; }
            .sig-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .official-stamp { width: 80px; height: 80px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; letter-spacing: 1px; margin: 0 auto; }
            
            @media print { .no-print { display: none; } }
            .btn-print { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center;">
            <button class="btn-print" onclick="window.print()">Download / Print Ledger</button>
          </div>
          <div class="header">
            <div class="logo">ESTATE<span>PRO</span></div>
            <div class="report-title">
               <h2 style="margin:0;">Customer Statement</h2>
               <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Ref: PLOT-${p.plotNumber}</p>
            </div>
          </div>

          <div class="grid">
             <div>
                <div class="section-title">Customer Info</div>
                <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${p.buyerName?.toUpperCase()}</div></div>
                <div class="info-item"><div class="info-label">Phone / CNIC</div><div class="info-value">${p.buyerPhone} / ${p.buyerCnic}</div></div>
                <div class="info-item"><div class="info-label">Address</div><div class="info-value" style="font-size: 11px;">${p.buyerAddress?.toUpperCase()}</div></div>
             </div>
             <div>
                <div class="section-title">Property Details</div>
                <div class="info-item"><div class="info-label">Plot & Size</div><div class="info-value"># ${p.plotNumber} (${p.size})</div></div>
                <div class="info-item"><div class="info-label">Location</div><div class="info-value">${p.scheme?.toUpperCase()}</div></div>
                <div class="info-item"><div class="info-label">Agent</div><div class="info-value">${p.agent?.toUpperCase()}</div></div>
             </div>
          </div>

          <div class="section-title">Payment History</div>
          <table>
             <thead>
                <tr>
                   <th>Date</th>
                   <th>Invoice No</th>
                   <th>Month</th>
                   <th>Type</th>
                   <th>Agent</th>
                   <th>Amount</th>
                </tr>
             </thead>
             <tbody>
                ${p.payments?.map(pay => `
                   <tr>
                      <td>${new Date(pay.date).toLocaleDateString()}</td>
                      <td style="font-family: monospace; color: #3b82f6; font-weight: 700;">#${pay._id ? pay._id.toString().toUpperCase().slice(-6) : 'INV'}</td>
                      <td>${pay.month?.toUpperCase()}</td>
                      <td><b>${pay.type?.toUpperCase()}</b></td>
                      <td>${pay.agent?.toUpperCase()}</td>
                      <td style="font-weight: 700;">PKR ${pay.amount.toLocaleString()}</td>
                   </tr>
                `).join('')}
             </tbody>
          </table>

          <div class="summary-box">
             <div class="summary-item">
                <div class="info-label">Booking Price</div>
                <h3 style="color: #1e293b;">PKR ${p.totalPrice?.toLocaleString()}</h3>
             </div>
             <div class="summary-item">
                <div class="info-label">Total Paid</div>
                <h3 style="color: #10b981;">PKR ${totalPaid.toLocaleString()}</h3>
             </div>
             <div class="summary-item">
                <div class="info-label">Balance Due</div>
                <h3 style="color: ${remaining <= 0 ? '#10b981' : '#ef4444'};">PKR ${remaining.toLocaleString()}</h3>
             </div>
          </div>

          ${remaining <= 0 ? `
          <div style="margin-top: 20px; background: #f0fdf4; border: 2px solid #16a34a; padding: 15px; border-radius: 10px; text-align: center; break-inside: avoid;">
             <div style="color: #16a34a; font-size: 18px; font-weight: 900; letter-spacing: 2px;">PAYMENT COMPLETED</div>
          </div>
          ` : ''}

          <div class="signature-section">
             <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Customer Signature</div>
             </div>
             <div class="sig-box">
                <div class="official-stamp">OFFICIAL<br/>STAMP</div>
             </div>
             <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signature</div>
             </div>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
             This is a computer-generated statement. EstatePro Management System. Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  const filtered = properties.filter(p => 
    p.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.plotNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ color: theme.text, padding: '20px' }}>Loading Customers...</div>;

  return (
    <div style={{ padding: '0 5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '22px', fontWeight: '800' }}>Active Customers</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>Manage buyers and their property associations</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} size={16}/>
          <input 
            placeholder="Search by name or plot..." 
            style={searchBarStyle(theme)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filtered.map((customer, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedProperty(customer)}
            style={{ background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}`, padding: '25px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: '0.2s', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}
          >
             {/* Action Buttons */}
             {isAdmin && (
               <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                  <div 
                     onClick={(e) => { e.stopPropagation(); setEditCustomer(customer); }}
                     style={{ background: '#3b82f615', color: '#3b82f6', padding: '8px', borderRadius: '10px', transition: '0.2s' }}
                  >
                     <Edit size={16}/>
                  </div>
                  <div 
                     onClick={(e) => handleDelete(customer._id, e)}
                     style={{ background: '#ef444415', color: '#ef4444', padding: '8px', borderRadius: '10px', transition: '0.2s' }}
                  >
                     <Trash2 size={16}/>
                  </div>
               </div>
             )}

             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#3b82f615', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Users size={24}/>
                </div>
                <div style={{ paddingRight: '60px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.text, margin: 0 }}>{customer.buyerName}</h3>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '12px', marginTop: '4px' }}>
                      <Phone size={12}/> {customer.buyerPhone}
                   </div>
                </div>
             </div>

             <div style={{ background: theme.input, borderRadius: '16px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.subText }}>
                      <Home size={14}/> <span>Plot # {customer.plotNumber} ({customer.size})</span>
                   </div>
                   <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      color: (customer.status === 'Completed' || (customer.totalPrice - (customer.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '#ffffff' : '#10b981', 
                      background: (customer.status === 'Completed' || (customer.totalPrice - (customer.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '#10b981' : '#10b98115', 
                      padding: '4px 12px', 
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      boxShadow: (customer.status === 'Completed' || (customer.totalPrice - (customer.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0)) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                   }}>
                      {(customer.totalPrice - (customer.payments?.reduce((s,pay)=>s+pay.amount,0)||0) <= 0) ? 'Completed' : customer.status}
                   </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.subText }}>
                   <MapPin size={14}/> <span>{customer.scheme}</span>
                </div>
             </div>

             <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
                <div style={{ paddingRight: '15px' }}>
                   <p style={{ fontSize: '11px', color: theme.subText, margin: 0 }}>Total Investment</p>
                   <p style={{ fontSize: '12px', fontWeight: '800', color: theme.text, margin: 0, whiteSpace: 'nowrap' }}>PKR {customer.totalPrice?.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: 'right', paddingRight: '15px' }}>
                   <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginBottom: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                         <p style={{ fontSize: '10px', color: theme.subText, margin: 0 }}>Paid So Far</p>
                         <p style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', margin: 0, whiteSpace: 'nowrap' }}>
                           PKR {customer.payments?.reduce((s,p)=>s+p.amount, 0).toLocaleString()}
                         </p>
                      </div>
                      <div style={{ textAlign: 'right', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
                         <p style={{ fontSize: '10px', color: theme.subText, margin: 0 }}>Remaining</p>
                         <p style={{ fontSize: '12px', fontWeight: '900', color: '#ef4444', margin: 0, whiteSpace: 'nowrap' }}>
                           PKR {(customer.totalPrice - (customer.payments?.reduce((s,p)=>s+p.amount, 0))).toLocaleString()}
                         </p>
                      </div>
                   </div>
                   <button 
                      onClick={(e) => generateReport(customer, e)}
                      style={{ border: 'none', background: '#10b981', color: 'white', padding: '6px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}
                   >
                      <FileText size={14}/> View Detailed Report
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div style={modalOverlay}>
           <div style={{ background: theme.card, color: theme.text, padding: '30px', borderRadius: '24px', width: '500px', maxWidth: '95%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <h2 style={{ fontWeight: '800' }}>Edit Customer Info</h2>
                 <X style={{ cursor: 'pointer' }} onClick={() => setEditCustomer(null)}/>
              </div>
              <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle(theme)} value={editCustomer.buyerName} onChange={e => setEditCustomer({...editCustomer, buyerName: e.target.value})}/>
                 </div>
                  <div>
                    <label style={labelStyle}>Phone Number (0000-0000000)</label>
                    <input style={inputStyle(theme)} value={editCustomer.buyerPhone} onChange={e => setEditCustomer({...editCustomer, buyerPhone: formatPhone(e.target.value)})}/>
                 </div>
                 <div>
                    <label style={labelStyle}>CNIC (00000-0000000-0)</label>
                    <input style={inputStyle(theme)} value={editCustomer.buyerCnic} onChange={e => setEditCustomer({...editCustomer, buyerCnic: formatCNIC(e.target.value)})}/>
                 </div>
                 <div>
                    <label style={labelStyle}>Complete Address</label>
                    <textarea style={{...inputStyle(theme), height: '80px'}} value={editCustomer.buyerAddress} onChange={e => setEditCustomer({...editCustomer, buyerAddress: e.target.value})}/>
                 </div>
                 <button type="submit" style={primaryBtn}>Save Changes</button>
              </form>
           </div>
        </div>
      )}

      {selectedProperty && (
        <PropertyDetails 
          property={selectedProperty} 
          onClose={() => { setSelectedProperty(null); fetchData(); }} 
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

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
};

const labelStyle = { fontSize: '12px', fontWeight: '700', marginBottom: '5px', display: 'block', color: '#94a3b8' };

const inputStyle = (t) => ({
  width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`,
  background: t.input, color: t.text, outline: 'none'
});

const primaryBtn = {
  background: '#3b82f6', color: 'white', border: 'none', padding: '12px',
  borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '10px'
};

const searchBarStyle = (t) => ({
  width: '250px',
  padding: '10px 15px 10px 38px',
  borderRadius: '12px',
  border: `1px solid ${t.border}`,
  background: t.card,
  color: t.text,
  outline: 'none'
});

export default Customers;

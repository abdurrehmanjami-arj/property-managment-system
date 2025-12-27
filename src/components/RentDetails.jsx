import React, { useState } from 'react';
import { X, Calendar, DollarSign, User, Phone, MapPin, Plus, FileText, Trash2, Home, CreditCard, Building, Edit, Printer, Search } from 'lucide-react';
import api from '../api';

const RentDetails = ({ rent, onClose, darkMode, currentUser, showToast, askConfirm, onRentUpdate }) => {
  const [amount, setAmount] = useState(rent.monthlyRent || '');
  const [month, setMonth] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Rent');
  const [editMode, setEditMode] = useState(false);
  const [editedRent, setEditedRent] = useState({ ...rent });
  const [editPayment, setEditPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const isAdmin = currentUser?.role === 'admin';

  // Sync editedRent when rent prop changes (e.g. after update)
  React.useEffect(() => {
    setEditedRent({ ...rent });
    setAmount(rent.monthlyRent || '');
  }, [rent]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const d = new Date(month);
      const monthStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const resp = await api.post(`/rents/${rent._id}/pay`, { 
        amount: Number(amount), 
        date: month, 
        type: 'Rent',
        month: monthStr 
      });
      onRentUpdate(resp.data);
      setAmount(rent.monthlyRent || '');
      showToast('Payment recorded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to record payment', 'error');
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/rents/${rent._id}`, editedRent);
      onRentUpdate(response.data);
      setEditMode(false);
      showToast('Rent details updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update details', 'error');
    }
  };

  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(`/rents/${rent._id}/payments/${editPayment._id}`, {
        amount: Number(editPayment.amount),
        month: editPayment.month
      });
      onRentUpdate(response.data);
      setEditPayment(null);
      showToast("Payment updated successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    askConfirm(
      "Delete Payment",
      "Are you sure you want to delete this payment record?",
      async () => {
        try {
          await api.delete(`/rents/${rent._id}/payments/${paymentId}`);
          // Refetch rent data
          const response = await api.get(`/rents`);
          const updated = response.data.find(r => r._id === rent._id);
          onRentUpdate(updated);
          showToast('Payment record deleted', 'success');
        } catch (err) {
          showToast('Failed to delete payment', 'error');
        }
      }
    );
  };

  const printReceipt = (payment) => {
    const reportWindow = window.open('', '_blank', 'width=800,height=900');
    
    const receiptHTML = `
      <div class="receipt-container">
        <div class="header">
          <div class="logo">ESTATE<span style="color: #3b82f6;">PRO</span></div>
          <div class="invoice-badge">RENT RECEIPT</div>
        </div>
        
        <div class="copy-label">[[COPY_TYPE]]</div>
        <div class="date-row">Date: <b>${formatDate(payment.date)}</b></div>

        <div class="content-grid">
          <div class="section">
            <div class="section-title">Tenant Information</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${rent.tenantName?.toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Father Name:</span>
              <span class="value">${rent.tenantFatherName?.toUpperCase() || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">CNIC:</span>
              <span class="value">${rent.tenantCnic}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${rent.tenantPhone}</span>
            </div>
          </div>

          <div class="section">
             <div class="section-title">Property Details</div>
             <div class="row">
               <span class="label">Property No:</span>
               <span class="value">${rent.houseNumber?.toUpperCase()}</span>
             </div>
             <div class="row">
               <span class="label">Type:</span>
               <span class="value">${rent.type?.toUpperCase()}</span>
             </div>
             <div class="row">
               <span class="label">Location:</span>
               <span class="value" style="font-size: 11px; line-height: 1.2;">${rent.address || ''}</span>
             </div>
          </div>
        </div>

        <div class="payment-box">
           <div class="payment-title">PAYMENT RECEIVED FOR</div>
           <div class="payment-month">${payment.month?.toUpperCase() || 'RENT'}</div>
           <div class="payment-amount">
              <span style="font-size: 14px; font-weight: 600; vertical-align: top; margin-top: 5px; display: inline-block;">PKR</span> 
              ${payment.amount.toLocaleString()}
           </div>
           <div class="payment-id">Transaction ID: #${payment._id.toUpperCase().slice(-6)}</div>
        </div>

        <div class="paid-stamp">PAID</div>

        <div class="footer-row">
           <div class="signature-box">
              <div class="line"></div>
              <span>Tenant Signature</span>
           </div>
           
           <div class="stamp-box">
              <div class="stamp-circle" style="font-size: 10px; line-height: 1.2; text-align: center;">OFFICIAL<br/>STAMP</div>
           </div>

           <div class="signature-box">
              <div class="line"></div>
              <span>Authorized Signature</span>
           </div>
        </div>

        <div class="thank-you">Thank you for your payment!</div>
      </div>
    `;

    reportWindow.document.write(`
      <html>
        <head>
          <title>Rent Receipt - ${rent.houseNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 0; 
              margin: 0; 
              background: #fff; 
              color: #1e293b;
            }
            .receipt-container { 
              padding: 30px; 
              border: 1px solid #000; 
              position: relative; 
              height: 480px; 
              box-sizing: border-box;
              display: flex; 
              flex-direction: column; 
              background: #fff;
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 10px; 
            }
            .logo { 
              font-size: 22px; 
              font-weight: 900; 
              letter-spacing: -0.5px; 
            }
            .invoice-badge { 
              background: #000; 
              color: white; 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 11px; 
              font-weight: 700; 
              letter-spacing: 1px; 
            }
            .copy-label { 
              position: absolute; 
              top: 15px; 
              right: 20px; 
              font-size: 12px; 
              font-weight: 900; 
              color: #000; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              border: 1px solid #000;
              padding: 2px 8px;
            }
            .date-row { text-align: right; font-size: 11px; color: #000; margin-bottom: 10px; margin-top: 15px; }
            
            .content-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 30px; 
              margin-bottom: 15px;
            }
            .section-title { 
              font-size: 10px; 
              font-weight: 700; 
              text-transform: uppercase; 
              color: #000; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 4px; 
              margin-bottom: 8px; 
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 4px; 
              font-size: 12px;
            }
            .label { color: #555; font-weight: 500; }
            .value { font-weight: 700; color: #000; text-align: right; }

            .payment-box { 
              background: #f8fafc; 
              border: 1px solid #000; 
              border-radius: 8px; 
              padding: 10px; 
              text-align: center; 
              margin-bottom: auto; 
            }
            .payment-title { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #555; margin-bottom: 5px; }
            .payment-month { font-size: 16px; font-weight: 800; color: #000; margin-bottom: 5px; }
            .payment-amount { font-size: 32px; font-weight: 900; color: #000; line-height: 1; }
            .payment-id { font-size: 10px; color: #555; margin-top: 5px; font-family: monospace; }
            
            .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
            .signature-box { text-align: center; width: 120px; }
            .line { border-top: 1px solid #000; margin-bottom: 4px; }
            .signature-box span { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #000; }
            
            .stamp-box { flex: 1; display: flex; justify-content: center; }
            .stamp-circle { 
              width: 70px; 
              height: 70px; 
              border: 2px solid #000; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: #000; 
              font-weight: 900; 
              transform: rotate(0deg);
              background: #fff;
            }

            .paid-stamp {
              position: absolute;
              top: 45%;
              right: 60px;
              transform: translateY(-50%) rotate(-20deg);
              border: 5px double #cc0000;
              color: #cc0000;
              font-size: 50px;
              font-weight: 900;
              padding: 10px 20px;
              border-radius: 8px;
              opacity: 0.25;
              font-family: 'Courier New', Courier, monospace;
              text-transform: uppercase;
              z-index: 0;
              pointer-events: none;
            }

            .thank-you { font-size: 10px; text-align: center; color: #555; margin-top: 10px; font-style: italic; }

            .separator { border-top: 2px dashed #000; margin: 0; position: relative; opacity: 1; }
            .separator::after { content: '✂'; position: absolute; left: 50%; top: -10px; background: #fff; padding: 0 5px; color: #000; }
            
            @media print { 
               .no-print { display: none; } 
               body { background: #fff; -webkit-print-color-adjust: exact; } 
               @page { size: A4; margin: 0.5cm; }
               .receipt-container { border: 1px solid #000; }
            }
            .btn-print { background: #000; color: white; padding: 12px 25px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; padding: 15px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px;">
            <button class="btn-print" onclick="window.print()">Print Receipt</button>
          </div>
          <div style="max-width: 800px; margin: 0 auto;">
            ${receiptHTML.replace('[[COPY_TYPE]]', 'CUSTOMER COPY')}
            <div class="separator"></div>
            <div style="height: 20px;"></div>
            ${receiptHTML.replace('[[COPY_TYPE]]', 'OFFICE COPY')}
          </div>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const generateFullReport = () => {
    const reportWindow = window.open('', '_blank');
    const totalPaid = rent.payments?.reduce((s, p) => s + p.amount, 0) || 0;
    
    const reportHTML = `
      <html>
        <head>
          <title>Rent Ledger - ${rent.tenantName}</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; background: #fff; }
            .no-print { text-align: center; padding: 20px; background: #f1f5f9; margin-bottom: 30px; border-radius: 15px; }
            .btn-print { background: #3b82f6; color: white; padding: 15px 30px; border-radius: 12px; border: none; cursor: pointer; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 900; }
            .logo span { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .summary { margin-top: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .summary h3 { margin: 5px 0; color: #10b981; }
            .footer-signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding: 0 20px; }
            .sig-box { text-align: center; width: 200px; }
            .sig-line { border-top: 1px solid #334155; margin-bottom: 8px; }
            .sig-text { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .stamp-circle { width: 80px; height: 80px; border: 1px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; margin-bottom: 10px; }
            @media print { 
              .no-print { display: none; } 
              body { padding: 0.5cm; }
              @page { size: A4; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">Confirm & Print Full Ledger</button>
          </div>
          <div style="max-width: 900px; margin: 0 auto;">
            <div class="header">
              <div class="logo">ESTATE<span>PRO</span></div>
              <div style="text-align: right;">
                <h2 style="margin: 0; color: #3b82f6;">Rental Statement</h2>
                <p style="margin: 5px 0 0 0; font-weight: 700;">House: ${rent.houseNumber}</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
              <div style="background: #f8fafc; padding: 20px; borderRadius: 15px; border: 1px solid #e2e8f0;">
                 <h4 style="margin: 0 0 15px 0; color: #3b82f6; text-transform: uppercase; font-size: 12px;">Rent Customer Details</h4>
                 <p style="margin: 5px 0;"><b>Name:</b> ${rent.tenantName}</p>
                 <p style="margin: 5px 0;"><b>Father's Name:</b> ${rent.tenantFatherName || 'N/A'}</p>
                 <p style="margin: 5px 0;"><b>Phone:</b> ${rent.tenantPhone}</p>
                 <p style="margin: 5px 0;"><b>CNIC:</b> ${rent.tenantCnic}</p>
                 <p style="margin: 5px 0;"><b>Address:</b> ${rent.tenantAddress || 'N/A'}</p>
              </div>
              <div style="background: #f8fafc; padding: 20px; borderRadius: 15px; border: 1px solid #e2e8f0;">
                 <h4 style="margin: 0 0 15px 0; color: #3b82f6; text-transform: uppercase; font-size: 12px;">Rental Agreement</h4>
                 <p style="margin: 5px 0;"><b>Property:</b> ${rent.houseNumber}</p>
                 <p style="margin: 5px 0;"><b>Monthly Rent:</b> PKR ${(rent.monthlyRent || 0).toLocaleString()}</p>
                 <p style="margin: 5px 0;"><b>Security:</b> PKR ${rent.securityDeposit?.toLocaleString() || 0}</p>
                 <p style="margin: 5px 0;"><b>Agreement Type:</b> ${rent.type}</p>
                 <p style="margin: 5px 0;"><b>Status:</b> ${rent.status}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Month/Month</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                ${rent.payments?.map(p => `
                  <tr>
                    <td>${formatDate(p.date)}</td>
                    <td>${p.month}</td>
                    <td><b>${p.type}</b></td>
                    <td style="font-weight: 800;">PKR ${p.amount.toLocaleString()}</td>
                    <td>${p.agent}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary">
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Total Payments Received</p>
                <h3>PKR ${totalPaid.toLocaleString()}</h3>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">Statement Generated On</p>
                <h3 style="color: #1e293b;">${new Date().toLocaleDateString()}</h3>
              </div>
            </div>

            <div class="footer-signatures">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-text">Tenant Signature</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div class="stamp-circle">OFFICIAL<br/>STAMP</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-text">Authorized Signature</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth <= 1024 && window.innerWidth > 768;

  return (
    <div style={modalOverlay}>
      <div style={{ 
        background: theme.card, 
        color: theme.text, 
        width: isMobile ? '100%' : isTablet ? '90%' : '1000px', 
        maxWidth: '95%', 
        borderRadius: isMobile ? '20px 20px 0 0' : '30px', 
        maxHeight: isMobile ? '100vh' : '95vh', 
        height: isMobile ? '100vh' : 'auto',
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto'
      }}>
         {/* Header */}
         <div style={{ 
           padding: isMobile ? '20px 15px' : '30px', 
           borderBottom: `1px solid ${theme.border}`, 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center',
           flexWrap: 'wrap',
           gap: '10px'
         }}>
            <div style={{ flex: isMobile ? '1 1 100%' : '1' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <Building size={isMobile ? 20 : 24} style={{ color: '#3b82f6' }}/>
                  <h2 style={{ margin: 0, fontWeight: '800', fontSize: isMobile ? '18px' : '24px' }}>House # {rent.houseNumber}</h2>
               </div>
               <p style={{ margin: 0, color: theme.subText, fontSize: isMobile ? '12px' : '14px' }}>{rent.address || 'No address provided'}</p>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', flex: isMobile ? '1 1 100%' : 'none', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
               <button onClick={generateFullReport} style={{ 
                 ...actionBtn, 
                 background: '#10b981', 
                 color: 'white',
                 fontSize: isMobile ? '12px' : '14px',
                 padding: isMobile ? '8px 12px' : '10px 20px',
                 flex: isMobile ? 1 : 'none'
               }}>
                  <FileText size={isMobile ? 14 : 18}/> {isMobile ? 'Report' : 'Full Report'}
               </button>
               <div onClick={onClose} style={{ 
                 cursor: 'pointer', 
                 padding: isMobile ? '8px' : '10px', 
                 borderRadius: '12px', 
                 background: theme.input,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                  <X size={isMobile ? 20 : 24}/>
               </div>
            </div>
         </div>

         <div style={{ 
           flex: 1, 
           overflowY: 'auto', 
           padding: isMobile ? '15px' : '30px', 
           display: 'grid', 
           gridTemplateColumns: isMobile ? '1fr' : isTablet ? '300px 1fr' : '350px 1fr', 
           gap: isMobile ? '20px' : '30px' 
         }}>
            {/* Left Column: Details & Add Payment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
               {/* Info Cards */}
               <div style={{ background: theme.input, padding: '20px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                     <h4 style={{ margin: 0, fontSize: '14px', color: theme.subText, textTransform: 'uppercase' }}>Rent Customer Information</h4>
                     {isAdmin && <button onClick={() => setEditMode(!editMode)} style={{ background: '#3b82f615', color: '#3b82f6', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>{editMode ? 'Cancel' : 'Edit Details'}</button>}
                  </div>
                  
                  {editMode ? (
                     <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input style={inputSmall(theme)} value={editedRent.tenantName} onChange={e => setEditedRent({...editedRent, tenantName: e.target.value})} placeholder="Name"/>
                        <input style={inputSmall(theme)} value={editedRent.tenantFatherName} onChange={e => setEditedRent({...editedRent, tenantFatherName: e.target.value})} placeholder="Father's Name"/>
                        <input style={inputSmall(theme)} value={editedRent.tenantPhone} onChange={e => setEditedRent({...editedRent, tenantPhone: e.target.value})} placeholder="Phone"/>
                        <input style={inputSmall(theme)} value={editedRent.tenantCnic} onChange={e => setEditedRent({...editedRent, tenantCnic: e.target.value})} placeholder="CNIC"/>
                        <input style={inputSmall(theme)} value={editedRent.tenantAddress} onChange={e => setEditedRent({...editedRent, tenantAddress: e.target.value})} placeholder="Address"/>
                        <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', marginTop: '10px' }}>Save Changes</button>
                     </form>
                  ) : (
                     <div style={infoGrid}>
                        <div style={infoItem}>
                           <User size={16}/> 
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '800', fontSize: '16px' }}>{rent.tenantName}</span>
                              <span style={{ fontSize: '12px', color: theme.subText }}>S/O: {rent.tenantFatherName || 'Not Provided'}</span>
                           </div>
                        </div>
                        <div style={infoItem}><Phone size={16}/> <span>{rent.tenantPhone}</span></div>
                        <div style={infoItem}><CreditCard size={16}/> <span>{rent.tenantCnic}</span></div>
                        <div style={{...infoItem, fontSize: '13px', color: theme.subText}}><MapPin size={14}/> <span>{rent.tenantAddress || 'Address N/A'}</span></div>
                     </div>
                  )}
               </div>

                <div style={{ background: '#3b82f610', padding: '20px', borderRadius: '24px', border: '1px solid #3b82f620' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#3b82f6', textTransform: 'uppercase' }}>Rent Details</h4>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '10px', color: theme.subText }}>Monthly Rent</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>PKR {(rent.monthlyRent || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '10px', color: theme.subText }}>Security</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#10b981' }}>PKR {(rent.securityDeposit || 0).toLocaleString()}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Add Payment (Top) & History (Bottom) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
               {/* Add Payment Form */}
               <div style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: isMobile ? '20px' : '30px', borderRadius: isMobile ? '20px' : '35px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '20px' : '25px' }}>
                    <div style={{ padding: '8px', background: '#3b82f615', color: '#3b82f6', borderRadius: '10px' }}>
                       <CreditCard size={isMobile ? 16 : 18}/>
                    </div>
                    <h4 style={{ margin: 0, fontWeight: '900', fontSize: isMobile ? '14px' : '16px' }}>Record Payment</h4>
                  </div>

                  <form onSubmit={handlePayment} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '15px' : '20px', alignItems: 'end' }}>
                     <div style={inputGroup}>
                         <label style={labelStyle}>Amount (PKR)</label>
                         <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>Rs</span>
                            <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inputStyle(theme), paddingLeft: '40px', fontSize: '16px', fontWeight: '800', background: theme.input }} placeholder="0.00"/>
                        </div>
                     </div>
                      <div style={inputGroup}>
                         <label style={labelStyle}>Payment Date</label>
                         <div style={{ position: 'relative' }}>
                            <Calendar style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} size={16}/>
                            <input required type="date" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle(theme), paddingLeft: '40px', background: theme.input, cursor: 'pointer' }}/>
                         </div>
                      </div>
                      <div style={inputGroup}>
                         <label style={labelStyle}>Type</label>
                         <select disabled value="Rent" style={{ ...inputStyle(theme), background: theme.input, opacity: 0.8, appearance: 'none' }}>
                            <option value="Rent">Monthly Rent</option>
                         </select>
                      </div>
                     <button type="submit" style={{ ...submitBtn, padding: isMobile ? '14px' : '16px', borderRadius: '18px', gridColumn: isMobile ? '1' : 'span 3' }}>
                        Confirm & Save Payment Record
                     </button>
                  </form>
               </div>

            </div>
         </div>

         {/* Full Width Payment History (At the bottom) */}
         <div style={{ padding: isMobile ? '0 15px 20px 15px' : '0 30px 40px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
               <h4 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: theme.text }}>Payment History</h4>
               <div style={{ position: 'relative', width: isMobile ? '100%' : '250px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} size={16}/>
                  <input 
                     placeholder="Search ID or Month..." 
                     value={paymentSearch}
                     onChange={(e) => setPaymentSearch(e.target.value)}
                     style={{ ...inputSmall(theme), paddingLeft: '35px', borderRadius: '12px' }}
                  />
               </div>
            </div>
            <div className="responsive-table-container" style={{ border: `1px solid ${theme.border}`, borderRadius: isMobile ? '16px' : '24px', overflow: 'hidden', background: theme.card }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: theme.input }}>
                     <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Month</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {rent.payments?.length > 0 ? (
                        rent.payments.slice().reverse().filter(pay => {
                           const s = paymentSearch.toLowerCase();
                           const invId = pay._id ? pay._id.toString().toLowerCase().slice(-6) : '';
                           const m = pay.month ? pay.month.toLowerCase() : '';
                           const t = pay.type ? pay.type.toLowerCase() : '';
                           return m.includes(s) || invId.includes(s) || t.includes(s);
                        }).map((pay, i) => (
                           <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                              <td style={tdStyle}>{formatDate(pay.date)}</td>
                              <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: '700', fontSize: '12px' }}>#{pay._id ? pay._id.toString().toUpperCase().slice(-6) : 'N/A'}</td>
                              <td style={tdStyle}>{pay.month || 'N/A'}</td>
                              <td style={tdStyle}><span style={{ ...badge, background: '#3b82f610', color: '#3b82f6' }}>{pay.type || 'Rent'}</span></td>
                              <td style={{ ...tdStyle, fontWeight: '800' }}>PKR {(pay.amount || 0).toLocaleString()}</td>
                              <td style={tdStyle}>
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => printReceipt(pay)} style={{ ...iconBtn, color: theme.subText, background: 'none' }} title="Print Receipt"><Printer size={18}/></button>
                                    {isAdmin && (
                                       <>
                                          <button onClick={() => setEditPayment(pay)} style={{ ...iconBtn, color: '#3b82f6', background: '#3b82f615' }} title="Edit Payment"><Edit size={16}/></button>
                                          <button onClick={() => handleDeletePayment(pay._id)} style={{ ...iconBtn, color: '#ef4444', background: '#ef444415' }} title="Delete Payment"><Trash2 size={16}/></button>
                                       </>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))
                     ) : (
                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>No matching payments found.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

            {/* Edit Payment Modal */}
            {editPayment && (
               <div style={{ ...modalOverlay, zIndex: 6000 }}>
                  <div style={{ background: theme.card, padding: '30px', borderRadius: '25px', width: '400px', maxWidth: '95%' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontWeight: '800' }}>Edit Payment</h3>
                        <X style={{ cursor: 'pointer' }} onClick={() => setEditPayment(null)}/>
                     </div>
                     <form onSubmit={handleEditPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                           <label style={labelStyle}>Amount</label>
                           <input type="number" style={inputStyle(theme)} value={editPayment.amount} onChange={e => setEditPayment({...editPayment, amount: e.target.value})} required />
                        </div>
                        <div>
                           <label style={labelStyle}>Month</label>
                           <input style={inputStyle(theme)} value={editPayment.month} onChange={e => setEditPayment({...editPayment, month: e.target.value})} required />
                        </div>
                        <button type="submit" disabled={loading} style={submitBtn}>
                           {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                     </form>
                  </div>
               </div>
            )}
       <style>{`
         input[type="date"]::-webkit-calendar-picker-indicator {
            filter: ${darkMode ? 'invert(1)' : 'invert(0.3)'};
            cursor: pointer;
         }
      `}</style>
      </div>
    </div>
  );
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 };
const inputStyle = (t) => ({ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', fontSize: '14px', boxSizing: 'border-box' });
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'block' };
const submitBtn = { width: '100%', padding: '14px', borderRadius: '14px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' };
const actionBtn = { border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' };
const iconBtn = { border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const infoGrid = { display: 'flex', flexDirection: 'column', gap: '12px' };
const infoItem = { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600' };
const thStyle = { padding: '15px', textAlign: 'left', fontSize: '12px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', fontSize: '14px' };
const badge = { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' };
const inputSmall = (t) => ({ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.card, color: t.text, outline: 'none', fontSize: '13px' });

const inputGroup = { display: 'flex', flexDirection: 'column' };

export default RentDetails;

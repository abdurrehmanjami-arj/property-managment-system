import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Calendar, User, FileText, TrendingUp, Home, CheckCircle, Printer, Download, UserCheck, Edit, Trash2, CreditCard } from 'lucide-react';
import api from '../api';

const PropertyDetails = ({ property: initialProperty, onClose, darkMode, currentUser, showToast, askConfirm, onPropertyUpdate }) => {
  const [property, setProperty] = useState(initialProperty);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [editPayment, setEditPayment] = useState(null); // For editing an installment
  const isAdmin = currentUser?.role === 'admin';

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  // Sync property state when parent updates initialProperty
  useEffect(() => {
    setProperty(initialProperty);
  }, [initialProperty]);

  const payments = property.payments || [];
  const isCompleted = property.status === 'Completed' || (property.totalPrice - payments.reduce((sum, p) => sum + p.amount, 0)) <= 0;
  
  // Fallback: If no payments array exists or it's empty, count the advance manually
  const totalPaid = payments.length > 0 
    ? payments.reduce((sum, p) => sum + p.amount, 0)
    : (property.advancePayment || 0);

  const totalRemaining = Math.max(0, property.totalPrice - totalPaid);
  const progress = Math.min(100, Math.round((totalPaid / property.totalPrice) * 100));

  // Dynamic Installment Calculation
  const monthlyAmount = property.monthlyInstallment || 0;
  const paidAboveAdvance = Math.max(0, totalPaid - (property.advancePayment || 0));
  const paidSlots = monthlyAmount > 0 ? Math.floor(paidAboveAdvance / monthlyAmount) : 0;
  const totalSlots = property.numInstallments || 0;
  const remainingSlots = Math.max(0, totalSlots - paidSlots);

  // Remaining Tenure Calculation
  const remainingYears = Math.floor(remainingSlots / 12);
  const remainingMonths = remainingSlots % 12;
  const remainingTenureText = `${remainingYears > 0 ? remainingYears + 'y ' : ''}${remainingMonths}m`;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const monthLabel = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
      const url = `/properties/${property._id}/pay`;
      const response = await api.post(url, {
        amount: Number(paymentAmount),
        month: monthLabel,
        type: 'Installment'
      });
      setProperty(response.data);
      
      // Notify parent component
      if (onPropertyUpdate) {
        onPropertyUpdate(response.data);
      }
      
      setShowPayModal(false);
      showToast('Payment recorded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = (payId) => {
    if (!payId) {
      showToast("Invalid Payment ID", "error");
      return;
    }
    askConfirm(
      "Delete Payment Record",
      "Are you sure you want to permanently remove this payment? This will update the property balance.",
      async () => {
        try {
          const response = await api.delete(`/properties/${property._id}/payments/${payId}`);
          setProperty(response.data);
          
          // Notify parent component
          if (onPropertyUpdate) {
            onPropertyUpdate(response.data);
          }
          
          showToast("Payment deleted successfully", "success");
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete payment", "error");
        }
      }
    );
  };

  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(`/properties/${property._id}/payments/${editPayment._id}`, {
        amount: Number(editPayment.amount),
        month: editPayment.month
      });
      
      // Update property with fresh data from backend
      const updatedProperty = response.data;
      setProperty({...updatedProperty}); // Force re-render with spread operator
      
      // Notify parent component to refresh its list
      if (onPropertyUpdate) {
        onPropertyUpdate(updatedProperty);
      }
      
      setEditPayment(null);
      setLoading(false);
      showToast("Payment updated successfully", "success");
    } catch (err) {
      console.error("Edit payment error:", err);
      setLoading(false);
      showToast(err.response?.data?.message || "Failed to update payment", "error");
    }
  };

  const printInvoice = (pay) => {
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
    
    const receiptHTML = `
      <div class="receipt-container">
        <div class="header">
          <div class="logo">ESTATE<span>PRO</span></div>
          <div class="invoice-title">Payment Receipt</div>
        </div>
        <div class="copy-label">[[COPY_TYPE]]</div>
        <div class="details-grid">
          <div>
            <div class="label">Customer Name</div>
            <div class="value">${property.buyerName?.toUpperCase()}</div>
            <div class="label" style="margin-top: 15px;">Phone / CNIC</div>
            <div class="value">${property.buyerPhone} / ${property.buyerCnic}</div>
          </div>
          <div>
            <div class="label">Property Details</div>
            <div class="value">Plot #${property.plotNumber} - ${property.size?.toUpperCase()}</div>
            <div class="value">${property.scheme?.toUpperCase()}</div>
            <div class="label" style="margin-top: 15px;">Transaction Date</div>
            <div class="value">${new Date(pay.date).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="amount-box">
          <div class="label">Amount Received (${pay.month?.toUpperCase()})</div>
          <div class="amount-value">PKR ${pay.amount.toLocaleString()}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
             <div class="label">Received By</div>
             <div class="value">${(pay.agent || 'Administrator')?.toUpperCase()}</div>
             <div class="label" style="margin-top: 5px;">Invoice No: ${pay._id ? pay._id.toString().toUpperCase().slice(-6) : 'REC-' + Math.floor(1000 + Math.random() * 9000)}</div>
          </div>
          <div class="stamp">PAID</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 35px; padding: 0 10px;">
          <div style="text-align: center;">
             <div style="border-top: 1px solid #334155; width: 150px; margin-bottom: 8px;"></div>
             <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Customer Signature</div>
          </div>
          <div style="text-align: center; position: relative; bottom: -10px;">
             <div style="width: 70px; height: 70px; border: 1px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; margin: 0 auto; letter-spacing: 1px;">
                OFFICIAL<br/>STAMP
             </div>
          </div>
          <div style="text-align: center;">
             <div style="border-top: 1px solid #334155; width: 150px; margin-bottom: 8px;"></div>
             <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Authorized Signature</div>
          </div>
        </div>
      </div>
    `;

    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Plot #${property.plotNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px; color: #333; margin: 0; }
            .receipt-container { padding: 15px 25px; border: 1px solid #eee; position: relative; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 15px; }
            .logo { font-size: 20px; font-weight: 800; color: #1e293b; }
            .logo span { color: #3b82f6; }
            .invoice-title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #3b82f6; }
            .copy-label { position: absolute; top: 10px; right: 25px; font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-size: 13px; font-weight: 700; }
            .amount-box { background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 15px; }
            .amount-value { font-size: 24px; font-weight: 800; color: #10b981; }
            .stamp { border: 2px solid #ef4444; color: #ef4444; width: 80px; padding: 3px; transform: rotate(-15deg); font-weight: 800; text-align: center; border-radius: 8px; opacity: 0.8; font-size: 12px; }
            .separator { border-top: 2px dashed #cbd5e1; margin: 20px 0; position: relative; }
            .separator::after { content: '✂ CUT HERE'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 9px; color: #94a3b8; }
            @media print { 
               .no-print { display: none; } 
               body { padding: 0; } 
               .receipt-container { border: 1px solid #eee; }
               @page { margin: 0.5cm; }
            }
            .btn-print { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2); }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; padding: 15px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; margin-bottom: 15px;">
            <button class="btn-print" onclick="window.print()">Confirm & Print Full Page</button>
            <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Both Customer and Office copies will print on a single A4 sheet.</p>
          </div>
          
          <div style="max-width: 800px; margin: 0 auto;">
            ${receiptHTML.replace('[[COPY_TYPE]]', 'CUSTOMER COPY')}
            
            <div class="separator"></div>
            
            ${receiptHTML.replace('[[COPY_TYPE]]', 'OFFICE COPY')}
            
            <div style="font-size: 9px; color: #94a3b8; text-align: center; margin-top: 15px;">
              EstatePro Management System - Computer Generated Receipt
            </div>
          </div>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  const downloadInvoice = (pay) => {
    const fileName = `Receipt_${property.plotNumber}_${pay.month.replace(' ', '_')}.pdf`;
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; background: white;">
        <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #3b82f6; padding-bottom:15px; margin-bottom:20px;">
           <h1 style="margin:0; color:#1e293b;">ESTATE<span style="color:#3b82f6">PRO</span></h1>
           <h2 style="margin:0; color:#3b82f6;">PAYMENT RECEIPT</h2>
        </div>
        
        <p style="text-align:right; font-size:12px; color:#64748b;">CUSTOMER COPY</p>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; margin-bottom:30px;">
           <div>
              <p style="font-size:11px; color:#64748b; margin:0;">CUSTOMER NAME</p>
              <p style="font-weight:bold; margin:2px 0 15px 0;">${property.buyerName?.toUpperCase()}</p>
              <p style="font-size:11px; color:#64748b; margin:0;">PHONE / CNIC</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">${property.buyerPhone} / ${property.buyerCnic}</p>
           </div>
           <div>
              <p style="font-size:11px; color:#64748b; margin:0;">PROPERTY DETAILS</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">Plot #${property.plotNumber} - ${property.size?.toUpperCase()}</p>
              <p style="margin:2px 0 15px 0;">${property.scheme?.toUpperCase()}</p>
              <p style="font-size:11px; color:#64748b; margin:0;">DATE</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">${new Date(pay.date).toLocaleDateString()}</p>
           </div>
        </div>
        
        <div style="background:#f8fafc; padding:20px; border-radius:10px; border:1px solid #e2e8f0; text-align:center; margin-bottom:30px;">
           <p style="font-size:11px; color:#64748b; margin:0;">AMOUNT RECEIVED (${pay.month?.toUpperCase()})</p>
           <h1 style="font-size:32px; color:#10b981; margin:5px 0;">PKR ${pay.amount.toLocaleString()}</h1>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
           <div>
              <p style="font-size:11px; color:#64748b; margin:0;">RECEIVED BY</p>
              <p style="font-weight:bold; margin:0;">${(pay.agent || 'Administrator')?.toUpperCase()}</p>
           </div>
           <div style="border:2px solid #ef4444; color:#ef4444; padding:5px 15px; font-weight:800; transform:rotate(-15deg); border-radius:5px;">PAID</div>
        </div>
        <p style="font-size:11px; margin-top:5px; color:#64748b;">Invoice No: ${pay._id ? pay._id.toString().toUpperCase().slice(-6) : 'REC-' + Math.floor(1000 + Math.random() * 9000)}</p>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div style="text-align: center;">
             <div style="border-top: 1px solid #000; width: 140px; margin-bottom: 5px;"></div>
             <p style="font-size: 9px; font-weight: bold; margin: 0;">CUSTOMER SIGNATURE</p>
          </div>
          <div style="text-align: center;">
             <div style="width: 60px; height: 60px; border: 1px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #aaa; margin: 0 auto;">STAMP</div>
          </div>
          <div style="text-align: center;">
             <div style="border-top: 1px solid #000; width: 140px; margin-bottom: 5px;"></div>
             <p style="font-size: 9px; font-weight: bold; margin: 0;">OFFICE SIGNATURE</p>
          </div>
        </div>

        <div style="border-top:2px dashed #cbd5e1; margin:40px 0;"></div>

        <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #3b82f6; padding-bottom:15px; margin-bottom:20px;">
           <h1 style="margin:0; color:#1e293b;">ESTATE<span style="color:#3b82f6">PRO</span></h1>
           <h2 style="margin:0; color:#3b82f6;">OFFICE COPY</h2>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; margin-bottom:30px;">
           <div>
              <p style="font-size:11px; color:#64748b; margin:0;">CUSTOMER NAME</p>
              <p style="font-weight:bold; margin:2px 0 15px 0;">${property.buyerName?.toUpperCase()}</p>
              <p style="font-size:11px; color:#64748b; margin:0;">PHONE / CNIC</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">${property.buyerPhone} / ${property.buyerCnic}</p>
           </div>
           <div>
              <p style="font-size:11px; color:#64748b; margin:0;">PROPERTY DETAILS</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">Plot #${property.plotNumber} - ${property.size?.toUpperCase()}</p>
              <p style="font-size:11px; color:#64748b; margin:0; margin-top:10px;">DATE</p>
              <p style="font-weight:bold; margin:2px 0 0 0;">${new Date(pay.date).toLocaleDateString()}</p>
           </div>
        </div>
        
        <div style="background:#f8fafc; padding:20px; border-radius:10px; border:1px solid #e2e8f0; text-align:center; margin-bottom:30px;">
           <p style="font-size:11px; color:#64748b; margin:0;">AMOUNT RECEIVED</p>
           <h1 style="font-size:32px; color:#10b981; margin:5px 0;">PKR ${pay.amount.toLocaleString()}</h1>
        </div>

        <p style="text-align:center; font-size:10px; color:#94a3b8;">Generated by EstatePro Management System</p>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Fix for html2pdf not being loaded yet
    if (window.html2pdf) {
      window.html2pdf().from(element).set(opt).save();
    } else {
      alert("System is still loading PDF components. Please wait a second and try again.");
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalContent, background: theme.card, color: theme.text, maxWidth: '850px', width: '95%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', paddingBottom: '20px', borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '5px' }}>Plot # {property.plotNumber}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.subText, fontSize: '14px' }}>
              <MapPin size={16}/>
              <span>{property.scheme} • <b>{property.size}</b></span>
            </div>
          </div>
          <X onClick={onClose} style={{ cursor: 'pointer' }} size={24}/>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: `1px solid ${theme.border}` }}>
          <Tab label="Dashboard" id="overview" active={activeTab} setActive={setActiveTab} />
          <Tab label="Installment History" id="payments" active={activeTab} setActive={setActiveTab} />
          <Tab label="Buyer Profile" id="buyer" active={activeTab} setActive={setActiveTab} />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <InfoCard icon={<DollarSign size={20}/>} label="Total Price" value={`PKR ${property.totalPrice?.toLocaleString()}`} color="#3b82f6" theme={theme} />
              <InfoCard icon={<TrendingUp size={20}/>} label="Total Paid" value={`PKR ${totalPaid.toLocaleString()}`} color="#10b981" theme={theme} />
              <InfoCard icon={<Calendar size={20}/>} label="Remaining" value={`PKR ${totalRemaining.toLocaleString()}`} color="#ef4444" theme={theme} />
            </div>

            <div style={{ background: theme.input, padding: '25px', borderRadius: '20px', marginBottom: '20px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                   <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Payment Progress</h3>
                   <p style={{ fontSize: '12px', color: theme.subText, marginTop: '5px' }}>Overall recovery percentage</p>
                </div>
                {totalRemaining > 0 ? (
                  <button 
                     onClick={() => {
                       setPaymentAmount(property.monthlyInstallment || '');
                       setShowPayModal(true);
                     }}
                     style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CreditCard size={18}/> Pay Installment
                  </button>
                ) : (
                  <div style={{ background: '#10b98115', color: '#10b981', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #10b98130' }}>
                    <UserCheck size={18}/> Payment Completed
                  </div>
                )}
              </div>
              
              <div style={{ width: '100%', height: '14px', background: theme.border, borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', transition: '0.8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px' }}>
                <span style={{ fontWeight: '700' }}>{progress}% Completed</span>
                <span style={{ color: theme.subText }}>{paidSlots} Slots Paid / {remainingSlots} Pending</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div style={{ background: theme.input, padding: '20px', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '15px', color: theme.subText, textTransform: 'uppercase', fontWeight: '700' }}>Contract Details</h4>
                  <DetailRow label="Monthly Amount" value={`PKR ${property.monthlyInstallment?.toLocaleString()}`} theme={theme} />
                  <DetailRow label="Total Tenure" value={`${property.numInstallments} Months`} theme={theme} />
                  <DetailRow label="Paid Installments" value={`${paidSlots} Months`} theme={theme} />
                  <DetailRow label="Remaining Time" value={remainingTenureText} theme={theme} />
                  <DetailRow label="Creation Date" value={new Date(property.createdAt).toLocaleDateString()} theme={theme} />
               </div>
               <div style={{ background: theme.input, padding: '20px', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '15px', color: theme.subText, textTransform: 'uppercase', fontWeight: '700' }}>Sales Info</h4>
                  <DetailRow label="Booking Agent" value={property.agent} theme={theme} />
                  <DetailRow label="Account Status" value={
                    <span style={{ 
                      color: (property.status === 'Completed' || (property.totalPrice - (property.payments?.reduce((s,p)=>s+p.amount,0)||0) <= 0)) ? '#10b981' : theme.text,
                      background: (property.status === 'Completed' || (property.totalPrice - (property.payments?.reduce((s,p)=>s+p.amount,0)||0) <= 0)) ? '#10b98115' : 'transparent',
                      padding: (property.status === 'Completed' || (property.totalPrice - (property.payments?.reduce((s,p)=>s+p.amount,0)||0) <= 0)) ? '4px 12px' : '0',
                      borderRadius: '8px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      fontSize: (property.status === 'Completed' || (property.totalPrice - (property.payments?.reduce((s,p)=>s+p.amount,0)||0) <= 0)) ? '12px' : '15px'
                    }}>
                      {(property.totalPrice - (property.payments?.reduce((s,p)=>s+p.amount,0)||0) <= 0) ? 'Completed' : property.status}
                    </span>
                  } theme={theme} />
               </div>
            </div>
          </div>
        )}

        {/* Payments History Tab */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
               <input 
                 placeholder="Search by Invoice ID or Month (e.g. Dec)..."
                 value={paymentSearch}
                 onChange={(e) => setPaymentSearch(e.target.value)}
                 style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, outline: 'none' }}
               />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {payments.filter(p => {
                const search = paymentSearch.toLowerCase();
                const invId = p._id ? p._id.toString().toLowerCase().slice(-6) : '';
                const dateStr = new Date(p.date).toLocaleDateString().toLowerCase(); // Convert date string to lowercase for comparison
                return p.month.toLowerCase().includes(search) || invId.includes(search) || dateStr.includes(search);
              }).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: theme.subText, background: theme.input, borderRadius: '15px' }}>
                   No matching payments found.
                </div>
              ) : (
                payments.filter(p => {
                    const search = paymentSearch.toLowerCase();
                    const invId = p._id ? p._id.toString().toLowerCase().slice(-6) : '';
                    const dateStr = new Date(p.date).toLocaleDateString();
                    return p.month.toLowerCase().includes(search) || invId.includes(search) || dateStr.includes(search);
                }).map((p, idx) => (
                  <div key={idx} style={{ padding: '16px', background: theme.input, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: p.type === 'Advance' ? '#3b82f615' : '#10b98115', color: p.type === 'Advance' ? '#3b82f6' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <CreditCard size={20}/>
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '14px' }}>
                          {p.month} <span style={{ color: '#3b82f6', fontSize: '11px', marginLeft: '5px' }}>#ID: {p._id ? p._id.toString().toUpperCase().slice(-6) : 'INV'}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: theme.subText }}>{new Date(p.date).toLocaleDateString()} • {p.agent}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#10b981' }}>PKR {p.amount.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: theme.subText, fontWeight: '700' }}>{p.type.toUpperCase()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }} className="no-print">
                        {isAdmin && (
                          <>
                            <div 
                              onClick={() => setEditPayment(p)}
                              style={{ padding: '6px', borderRadius: '8px', background: '#3b82f615', color: '#3b82f6', cursor: 'pointer' }}
                            >
                              <Edit size={14}/>
                            </div>
                            <div 
                              onClick={() => handleDeletePayment(p._id)}
                              style={{ padding: '6px', borderRadius: '8px', background: '#ef444415', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={14}/>
                            </div>
                          </>
                        )}
                        <button onClick={() => printInvoice(p)} style={{ border: 'none', background: 'none', color: theme.subText, cursor: 'pointer' }} title="Print Bill"><Printer size={16}/></button>
                        <button onClick={() => downloadInvoice(p)} style={{ border: 'none', background: 'none', color: theme.subText, cursor: 'pointer' }} title="Download Bill"><Download size={16}/></button>
                      </div>
                    </div>
                  </div>
                )).reverse()
              )}
            </div>
          </div>
        )}

        {/* Buyer Details Tab */}
        {activeTab === 'buyer' && (
          <div style={{ background: theme.input, padding: '25px', borderRadius: '20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div>
                   <h4 style={{ color: '#3b82f6', marginBottom: '20px', borderBottom: `2px solid #3b82f6`, paddingBottom: '10px', width: 'fit-content' }}>Buyer Information</h4>
                   <DetailRow label="Full Name" value={property.buyerName?.toUpperCase()} theme={theme} />
                   <DetailRow label="CNIC Number" value={property.buyerCnic} theme={theme} />
                   <DetailRow label="Phone Number" value={property.buyerPhone} theme={theme} />
                </div>
                <div>
                   <h4 style={{ color: '#3b82f6', marginBottom: '20px', borderBottom: `2px solid #3b82f6`, paddingBottom: '10px', width: 'fit-content' }}>Contact & Address</h4>
                   <DetailRow label="Physical Address" value={property.buyerAddress?.toUpperCase()} theme={theme} />
                </div>
             </div>
          </div>
        )}

        {/* Pay Installment Modal */}
        {showPayModal && (
          <div style={{ ...modalOverlay, zIndex: 6000 }}>
            <div style={{ ...modalContent, background: theme.card, width: '400px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '800' }}>Confirm Installment</h3>
                <X onClick={() => setShowPayModal(false)} cursor="pointer" size={20} />
              </div>
              <form onSubmit={handleRecordPayment}>
                <div style={{ background: theme.input, padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
                   <p style={{ fontSize: '12px', color: theme.subText, margin: '0 0 5px 0' }}>Plot # {property.plotNumber}</p>
                   <p style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>{property.buyerName}</p>
                </div>
                <label style={{ fontSize: '12px', color: theme.subText, display: 'block', marginBottom: '8px', fontWeight: '700' }}>RECEIVING AMOUNT (PKR)</label>
                <input 
                  type="number" 
                  autoFocus
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, marginBottom: '25px', fontSize: '18px', fontWeight: '800' }}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}
                >
                  {loading ? 'Generating Receipt...' : 'Confirm & Save Payment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Payment Modal */}
        {editPayment && (
          <div style={{ ...modalOverlay, zIndex: 6000 }}>
             <div style={{ ...modalContent, background: theme.card, color: theme.text, padding: '30px', borderRadius: '25px', width: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                   <h3 style={{ fontWeight: '800' }}>Update Receipt Information</h3>
                   <X style={{ cursor: 'pointer' }} onClick={() => setEditPayment(null)}/>
                </div>
                <form onSubmit={handleEditPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div>
                      <label style={labelStyle}>Received Amount (PKR)</label>
                      <input type="number" style={inputStyle(theme)} value={editPayment.amount} onChange={e => setEditPayment({...editPayment, amount: e.target.value})} required />
                   </div>
                   <div>
                      <label style={labelStyle}>Payment Month/Label</label>
                      <input style={inputStyle(theme)} value={editPayment.month} onChange={e => setEditPayment({...editPayment, month: e.target.value})} required />
                   </div>
                   <button type="submit" style={primaryBtn}>
                      {loading ? 'Updating...' : 'Save Changes'}
                   </button>
                </form>
             </div>
          </div>
        )}


      </div>
    </div>
  );
};

const Tab = ({ label, id, active, setActive }) => (
  <div onClick={() => setActive(id)} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: active === id ? '3px solid #3b82f6' : '3px solid transparent', color: active === id ? '#3b82f6' : '#94a3b8', fontWeight: active === id ? '700' : '500', fontSize: '14px', transition: '0.2s' }}>
    {label}
  </div>
);

const InfoCard = ({ icon, label, value, color, theme }) => (
  <div style={{ background: theme.input, padding: '18px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <div style={{ color: color }}>{icon}</div>
      <span style={{ fontSize: '11px', color: theme.subText, fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontSize: '18px', fontWeight: '800' }}>{value}</div>
  </div>
);

const DetailRow = ({ label, value, theme }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '10px', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', fontWeight: '600' }}>{label}</div>
    <div style={{ fontSize: '15px', fontWeight: '700' }}>{value || 'N/A'}</div>
  </div>
);

const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, backdropFilter: 'blur(10px)' };
const modalContent = { padding: '30px', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' };

const inputStyle = (t) => ({ padding: '12px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.input, color: t.text, outline: 'none', width: '100%', boxSizing: 'border-box' });
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px', display: 'block' };
const primaryBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' };

function CreditCardIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>; }

export default PropertyDetails;

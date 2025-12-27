import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Home, Users, DollarSign, Download, Calendar, Filter, PieChart } from 'lucide-react';
import api from '../api';

import { useSocket } from '../contexts/SocketContext';

const RentReports = ({ darkMode, showToast }) => {
  const socket = useSocket();
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('All Time');
  
  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

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

  const fetchData = async () => {
    try {
      const response = await api.get('/rents');
      setRents(response.data);
      setLoading(false);
    } catch (err) {
      showToast('Failed to load reports data', 'error');
    }
  };

  const calculateStats = () => {
    const totalRentRevenue = rents.reduce((sum, r) => sum + (r.payments?.filter(p => p.type === 'Rent').reduce((s, p) => s + p.amount, 0) || 0), 0);
    const totalSecurity = rents.reduce((sum, r) => sum + (r.payments?.filter(p => p.type === 'Security').reduce((s, p) => s + p.amount, 0) || 0), 0);
    const totalOther = rents.reduce((sum, r) => sum + (r.payments?.filter(p => !['Rent', 'Security'].includes(p.type)).reduce((s, p) => s + p.amount, 0) || 0), 0);
    const activeTenants = rents.filter(r => r.status === 'Occupied').length;
    const vacantHouses = rents.filter(r => r.status === 'Vacant').length;
    
    return { totalRentRevenue, totalSecurity, totalOther, activeTenants, vacantHouses };
  };

  const printSummaryReport = () => {
    const stats = calculateStats();
    const reportWindow = window.open('', '_blank');
    const reportHTML = `
      <html>
        <head>
          <title>Rent Summary Report</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 900; }
            .logo span { color: #3b82f6; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; }
            .stat-value { font-size: 20px; fontWeight: 900; color: #3b82f6; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: auto; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            @media print { 
              .no-print { display: none; } 
              body { padding: 0.5cm; }
              @page { size: A4; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;"><button onclick="window.print()" style="padding: 10px 20px; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 700;">Print Report</button></div>
          <div class="header">
            <div class="logo">ESTATE<span>PRO</span></div>
            <h2>Rental Performance Report</h2>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Total Rent Collected</div><div class="stat-value">PKR ${stats.totalRentRevenue.toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-label">Security Deposits</div><div class="stat-value">PKR ${stats.totalSecurity.toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-label">Total Utilities/Misc</div><div class="stat-value">PKR ${stats.totalOther.toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-label">Active Tenants</div><div class="stat-value">${stats.activeTenants}</div></div>
            <div class="stat-card"><div class="stat-label">Vacant Units</div><div class="stat-value">${stats.vacantHouses}</div></div>
            <div class="stat-card"><div class="stat-label">Total Inventory</div><div class="stat-value">${rents.length}</div></div>
          </div>
          <h3>Property Wise Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>House #</th>
                <th>Tenant</th>
                <th>Monthly Rent</th>
                <th>Paid So Far</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rents.map(r => `
                <tr>
                  <td>${r.houseNumber}</td>
                  <td>${r.tenantName || 'N/A'}</td>
                  <td>PKR ${r.monthlyRent.toLocaleString()}</td>
                  <td>PKR ${r.payments?.reduce((s, p) => s + p.amount, 0).toLocaleString() || 0}</td>
                  <td style="font-weight: 700; color: ${r.status === 'Occupied' ? '#10b981' : '#f59e0b'}">${r.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

   const stats = calculateStats();

   const tableThStyle = { ...thStyle, color: theme.subText };
   const tableTdStyle = { ...tdStyle, color: theme.text };

   if (loading) return <div style={{ color: theme.text, padding: '20px' }}>Analyzing data...</div>;

   return (
     <div style={{ padding: '0 5px' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
         <div>
           <h2 style={{ color: theme.text, fontSize: '24px', fontWeight: '800' }}>Rental Analytics & Reports</h2>
           <p style={{ color: theme.subText, fontSize: '13px' }}>General performance and revenue tracking</p>
         </div>
         <button onClick={printSummaryReport} style={printBtn}>
            <Download size={18}/> Export PDF Report
         </button>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <StatCard title="Total Rent Revenue" value={`PKR ${stats.totalRentRevenue.toLocaleString()}`} icon={TrendingUp} color="#3b82f6" theme={theme} />
         <StatCard title="Security Deposits" value={`PKR ${stats.totalSecurity.toLocaleString()}`} icon={DollarSign} color="#10b981" theme={theme} />
         <StatCard title="Active Tenants" value={stats.activeTenants} icon={Users} color="#8b5cf6" theme={theme} />
         <StatCard title="Vacant Houses" value={stats.vacantHouses} icon={Home} color="#f59e0b" theme={theme} />
       </div>

       {/* Breakdown Section */}
       <div style={{ background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}`, padding: '30px' }}>
          <h3 style={{ margin: '0 0 25px 0', fontWeight: '800', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
             <PieChart size={20} style={{ color: '#3b82f6' }}/> Revenue Breakdown by House
          </h3>
          <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: theme.input }}>
                       <th style={{ ...tableThStyle, padding: '15px 20px' }}>House Number</th>
                       <th style={{ ...tableThStyle, padding: '15px 20px' }}>Type</th>
                       <th style={{ ...tableThStyle, padding: '15px 20px' }}>Monthly Rent</th>
                       <th style={{ ...tableThStyle, padding: '15px 20px' }}>Total Collected</th>
                       <th style={{ ...tableThStyle, padding: '15px 20px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                   {rents.map((r, i) => (
                       <tr key={i} style={{ borderBottom: i === rents.length - 1 ? 'none' : `1px solid ${theme.border}` }}>
                          <td style={{ ...tableTdStyle, padding: '15px 20px', verticalAlign: 'middle', fontWeight: '600' }}>{r.houseNumber || 'N/A'}</td>
                          <td style={{ ...tableTdStyle, padding: '15px 20px', verticalAlign: 'middle' }}>{r.type || 'N/A'}</td>
                          <td style={{ ...tableTdStyle, padding: '15px 20px', verticalAlign: 'middle', fontWeight: '800' }}>PKR {(r.monthlyRent || 0).toLocaleString()}</td>
                          <td style={{ ...tableTdStyle, padding: '15px 20px', verticalAlign: 'middle', fontWeight: '800', color: '#10b981' }}>PKR {r.payments?.reduce((s, p) => s + p.amount, 0).toLocaleString()}</td>
                          <td style={{ ...tableTdStyle, padding: '15px 20px', verticalAlign: 'middle' }}>
                             <span style={{ 
                               padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', 
                               background: r.status === 'Occupied' ? '#10b98115' : '#f59e0b15',
                               color: r.status === 'Occupied' ? '#10b981' : '#f59e0b'
                             }}>{r.status}</span>
                          </td>
                       </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, theme }) => (
  <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
    <div style={{ width: '55px', height: '55px', borderRadius: '16px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={26}/>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '12px', color: theme.subText, fontWeight: '700', textTransform: 'uppercase' }}>{title}</p>
      <h3 style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: '900', color: theme.text }}>{value}</h3>
    </div>
  </div>
);

const thStyle = { padding: '15px', textAlign: 'left', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' };
const tdStyle = { padding: '15px', fontSize: '14px' };
const printBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' };

export default RentReports;

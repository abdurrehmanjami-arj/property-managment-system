import React, { useState, useEffect, useCallback } from 'react';
import { Home, Users, Key, TrendingUp, DollarSign, Activity, ChevronRight, ArrowUpRight, ArrowDownRight, Building } from 'lucide-react';
import api from '../api';
import { useSocket } from '../contexts/SocketContext';

const DashboardHome = ({ darkMode, setActiveTab, showToast }) => {
  const socket = useSocket();
  const [stats, setStats] = useState({
    totalProperties: 0,
    propertyCustomers: 0,
    propertyRevenue: 0,
    totalRents: 0,
    rentCustomers: 0,
    rentRevenue: 0,
    recentActivities: [],
    dailyRevenue: []
  });
  const [loading, setLoading] = useState(true);

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f8fafc',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [propRes, rentRes] = await Promise.all([
        api.get('/properties'),
        api.get('/rents')
      ]);

      const properties = propRes.data;
      const rents = rentRes.data;

      const pRevenue = properties.reduce((sum, p) => sum + (p.payments?.reduce((s, pay) => s + pay.amount, 0) || 0), 0);
      const rRevenue = rents.reduce((sum, r) => sum + (r.payments?.reduce((s, pay) => s + pay.amount, 0) || 0), 0);
      
      const allPayments = [
        ...properties.flatMap(p => (p.payments || []).map(pay => ({ 
           date: pay.date || p.createdAt || new Date(), 
           month: pay.month || 'N/A', 
           amount: pay.amount || 0,
           source: 'Property', 
           identifier: p.plotNumber || 'N/A', 
           size: p.size || '',
           owner: p.buyerName || 'Unknown'
        }))),
        ...rents.flatMap(r => (r.payments || []).map(pay => ({ 
           date: pay.date || r.createdAt || new Date(), 
           month: pay.month || 'N/A', 
           amount: pay.amount || 0,
           source: 'Rent', 
           identifier: r.houseNumber || 'N/A', 
           owner: r.tenantName || 'Unknown' 
        })))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

      const getLocalDate = (d) => {
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return null;
          // Returns YYYY-MM-DD in local time
          return dt.toLocaleDateString('sv'); 
        } catch (e) {
          return null;
        }
      };

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return getLocalDate(d);
      }).reverse();

      const dailyRevenue = last7Days.map(dateStr => {
        const pDay = properties.flatMap(p => (p.payments || []).filter(pay => getLocalDate(pay.date || p.createdAt) === dateStr));
        const rDay = rents.flatMap(r => (r.payments || []).filter(pay => getLocalDate(pay.date || r.createdAt) === dateStr));
        
        const dayTotal = [...pDay, ...rDay].reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return { date: dateStr, amount: dayTotal };
      });

      setStats({
        totalProperties: properties.length,
        propertyCustomers: properties.filter(p => p.buyerName).length,
        propertyRevenue: pRevenue,
        totalRents: rents.length,
        rentCustomers: rents.filter(r => r.tenantName).length,
        rentRevenue: rRevenue,
        recentActivities: allPayments,
        dailyRevenue: dailyRevenue
      });
    } catch (err) {
      if (!isSilent) showToast("Failed to load dashboard data", "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (socket) {
      socket.on('data-updated', (data) => {
        console.log('Live Update Received:', data);
        fetchDashboardData(true); // Silent refresh
      });

      return () => {
        socket.off('data-updated');
      };
    }
  }, [socket, fetchDashboardData]);

  if (loading) return <div style={{ color: theme.text, padding: '40px', fontWeight: '800', textAlign: 'center' }}>Loading Estate Insights...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* 1. Header with Pulse */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.text, margin: 0 }}>Business Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <p style={{ color: theme.subText, fontSize: '14px', margin: 0 }}>System is live and tracking financial performance</p>
        </div>
      </div>

      {/* 2. Primary Stat Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px', marginBottom: '40px' }}>
         {/* Property Card */}
         <div 
            onClick={() => setActiveTab('customers')}
            style={{ ...statBox, background: `linear-gradient(135deg, ${darkMode ? '#1e3a8a' : '#3b82f6'}, ${darkMode ? '#1e40af' : '#2563eb'})`, transform: 'scale(1)', transition: '0.3s' }}
            className="hover-card"
         >
            <div style={boxHeader}>
               <div style={iconCircle}><Home size={24} color="#fff"/></div>
               <ArrowUpRight size={20} color="#ffffff80"/>
            </div>
            <div style={{ marginTop: '20px' }}>
               <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: 0 }}>{stats.propertyCustomers || 0}</h3>
               <p style={{ color: '#ffffffb0', fontSize: '14px', fontWeight: '700', margin: '5px 0 0 0' }}>Property Customers</p>
               <div style={{ marginTop: '15px', padding: '10px', background: '#ffffff15', borderRadius: '12px', fontSize: '12px', color: 'white' }}>
                  Total Plots Managed: <b>{stats.totalProperties || 0}</b>
               </div>
            </div>
         </div>

         {/* Rent Card */}
         <div 
            onClick={() => setActiveTab('rent-customers')}
            style={{ ...statBox, background: `linear-gradient(135deg, ${darkMode ? '#065f46' : '#10b981'}, ${darkMode ? '#064e3b' : '#059669'})`, transform: 'scale(1)', transition: '0.3s' }}
            className="hover-card"
         >
            <div style={boxHeader}>
               <div style={iconCircle}><Key size={24} color="#fff"/></div>
               <ArrowUpRight size={20} color="#ffffff80"/>
            </div>
            <div style={{ marginTop: '20px' }}>
               <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: 0 }}>{stats.rentCustomers || 0}</h3>
               <p style={{ color: '#ffffffb0', fontSize: '14px', fontWeight: '700', margin: '5px 0 0 0' }}>Active Tenants</p>
               <div style={{ marginTop: '15px', padding: '10px', background: '#ffffff15', borderRadius: '12px', fontSize: '12px', color: 'white' }}>
                  Total Rental Units: <b>{stats.totalRents || 0}</b>
               </div>
            </div>
         </div>

         {/* Total Revenue Area */}
         <div style={{ ...statBox, background: theme.card, border: `1px solid ${theme.border}` }}>
            <div style={boxHeader}>
               <div style={{ ...iconCircle, background: '#8b5cf615' }}><TrendingUp size={24} color="#8b5cf6"/></div>
            </div>
            <div style={{ marginTop: '20px' }}>
               <p style={{ color: theme.subText, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Gross Revenue</p>
               <h3 style={{ fontSize: '24px', fontWeight: '900', color: theme.text, margin: '5px 0 0 0' }}>PKR {(stats.propertyRevenue + stats.rentRevenue).toLocaleString()}</h3>
               <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <div style={{ flex: 1, padding: '10px', background: theme.input, borderRadius: '12px' }}>
                     <span style={{ fontSize: '10px', color: theme.subText }}>Property</span>
                     <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#3b82f6' }}>{Math.round((stats.propertyRevenue/(stats.propertyRevenue+stats.rentRevenue||1))*100)}%</p>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: theme.input, borderRadius: '12px' }}>
                     <span style={{ fontSize: '10px', color: theme.subText }}>Rent</span>
                     <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#10b981' }}>{Math.round((stats.rentRevenue/(stats.propertyRevenue+stats.rentRevenue||1))*100)}%</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 3. Middle Section: Charts & Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px' }}>
         {/* Visual Revenue Performance Chart (SVG) */}
         <div style={{ background: theme.card, borderRadius: '30px', border: `1px solid ${theme.border}`, padding: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
               <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: theme.text, margin: 0 }}>Revenue Performance</h3>
                  <p style={{ color: theme.subText, fontSize: '13px', margin: '5px 0 0 0' }}>Overall growth across all sectors</p>
               </div>
               <div style={{ background: '#3b82f615', color: '#3b82f6', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                  Live Data
               </div>
            </div>

            {/* Simple Dynamic SVG Chart */}
            <div style={{ height: '200px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '4%' }}>
               {(stats.dailyRevenue?.length > 0 ? stats.dailyRevenue : [...Array(7)].map(() => ({ amount: 0, date: '' }))).map((day, i) => {
                  const maxAmt = Math.max(...(stats.dailyRevenue?.map(d => d.amount) || []), 1000);
                  const h = Math.max((day.amount / maxAmt) * 100, 4); // Minimum 4% height
                  const label = day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }) : `D${i+1}`;
                  
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div 
                          title={`PKR ${day.amount.toLocaleString()}`}
                          style={{ 
                            width: '100%', 
                            height: `${h}%`, 
                            background: i === 6 ? '#3b82f6' : '#3b82f640', 
                            borderRadius: '10px 10px 4px 4px',
                            transition: 'all 0.4s ease-out',
                            border: day.amount > 0 ? '1px solid #3b82f650' : 'none'
                          }}
                       ></div>
                       <span style={{ fontSize: '10px', color: theme.subText, marginTop: '8px', fontWeight: '600' }}>{label}</span>
                    </div>
                  );
               })}
               <style>{`
                  @keyframes growUp {
                     from { height: 0; }
                  }
               `}</style>
            </div>
         </div>

         {/* Inventory Health Section */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: theme.card, borderRadius: '30px', border: `1px solid ${theme.border}`, padding: '30px' }}>
               <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>Asset Health</h4>
               <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <span style={{ fontSize: '12px', color: theme.subText }}>Sold Plots</span>
                     <span style={{ fontSize: '12px', fontWeight: '800' }}>{Math.round((stats.propertyCustomers/stats.totalProperties||0)*100)}%</span>
                  </div>
                  <div style={{ height: '8px', background: theme.input, borderRadius: '10px', overflow: 'hidden' }}>
                     <div style={{ height: '100%', background: '#3b82f6', width: `${(stats.propertyCustomers/stats.totalProperties||0)*100}%` }}></div>
                  </div>
               </div>
               <div style={{ marginBottom: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <span style={{ fontSize: '12px', color: theme.subText }}>Occupied Houses</span>
                     <span style={{ fontSize: '12px', fontWeight: '800' }}>{Math.round((stats.rentCustomers/stats.totalRents||0)*100)}%</span>
                  </div>
                  <div style={{ height: '8px', background: theme.input, borderRadius: '10px', overflow: 'hidden' }}>
                     <div style={{ height: '100%', background: '#10b981', width: `${(stats.rentCustomers/stats.totalRents||0)*100}%` }}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. Bottom Section: Recent Activities Table */}
      <div style={{ background: theme.card, borderRadius: '30px', border: `1px solid ${theme.border}`, padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: theme.text, margin: 0 }}>Recent Payment Stream</h3>
         </div>
         
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: theme.input }}>
                     <th style={{ ...thStyle, padding: '15px 20px' }}>Source</th>
                     <th style={{ ...thStyle, padding: '15px 20px' }}>Buyer / Units</th>
                     <th style={{ ...thStyle, padding: '15px 20px' }}>Date</th>
                     <th style={{ ...thStyle, padding: '15px 20px' }}>Month</th>
                     <th style={{ ...thStyle, padding: '15px 20px' }}>Amount</th>
                  </tr>
               </thead>
               <tbody>
                  {stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((act, i) => (
                       <tr key={i} style={{ borderBottom: i === stats.recentActivities.length - 1 ? 'none' : `1px solid ${theme.border}` }}>
                          <td style={{ ...tdStyle, padding: '15px 20px', verticalAlign: 'middle' }}>
                             <span style={{ 
                                padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', 
                                background: act.source === 'Property' ? '#3b82f615' : '#10b98115',
                                color: act.source === 'Property' ? '#3b82f6' : '#10b981'
                             }}>{act.source}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '15px 20px', verticalAlign: 'middle' }}>
                             <div style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>#{act.identifier} {act.source === 'Property' && act.size ? `(${act.size})` : ''}</div>
                             <div style={{ fontSize: '11px', color: theme.subText }}>{act.owner || 'N/A'}</div>
                          </td>
                          <td style={{ ...tdStyle, padding: '15px 20px', verticalAlign: 'middle', fontSize: '12px', color: theme.text }}>
                             {new Date(act.date).toLocaleDateString()}
                          </td>
                          <td style={{ ...tdStyle, padding: '15px 20px', verticalAlign: 'middle', fontSize: '12px', color: theme.text }}>
                             {act.month || 'N/A'}
                          </td>
                          <td style={{ ...tdStyle, padding: '15px 20px', verticalAlign: 'middle', fontWeight: '800', color: theme.text }}>PKR {act.amount.toLocaleString()}</td>
                       </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: theme.subText }}>No recent transactions found.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const statBox = { padding: '30px', borderRadius: '35px', cursor: 'pointer', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.1)' };
const boxHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const iconCircle = { width: '50px', height: '50px', borderRadius: '18px', background: '#ffffff30', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const textBtn = { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' };
const thStyle = { padding: '15px', textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' };
const tdStyle = { padding: '18px 15px', fontSize: '13px' };
const badgeStyle = { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' };

export default DashboardHome;

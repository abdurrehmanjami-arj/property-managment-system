import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, Search, Download, Filter, X, User } from 'lucide-react';
import api from '../api';

const Payments = ({ darkMode }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Flatten all payments from all properties for the list
  const allPayments = properties.flatMap(prop => 
    (prop.payments || []).map(pay => ({
      ...pay,
      plotNumber: prop.plotNumber,
      buyerName: prop.buyerName,
      propertyId: prop._id
    }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredPayments = allPayments.filter(p => {
    const search = searchTerm.toLowerCase();
    const invId = p._id ? p._id.toString().toUpperCase().slice(-6) : '';
    const dateStr = new Date(p.date).toLocaleDateString();
    return p.buyerName.toLowerCase().includes(search) || 
           p.plotNumber.toLowerCase().includes(search) || 
           invId.includes(search) || 
           p.month.toLowerCase().includes(search) ||
           dateStr.includes(search);
  });

  const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPayments = allPayments.filter(p => {
    const d = new Date(p.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) return <div style={{ color: theme.text, padding: '20px' }}>Loading payment records...</div>;

  return (
    <div style={{ padding: '0 5px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard label="Total Cash In" value={`PKR ${totalCollected.toLocaleString()}`} color="#10b981" icon={<DollarSign size={24}/>} theme={theme} />
        <StatCard label="Payments This Month" value={thisMonthPayments.toString()} color="#3b82f6" icon={<Calendar size={24}/>} theme={theme} />
        <StatCard label="Active Clients" value={properties.length.toString()} color="#f59e0b" icon={<User size={24}/>} theme={theme} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '22px', fontWeight: '800' }}>Recent Transactions</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>A complete log of all received payments</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} size={16}/>
          <input 
            placeholder="Search by plot or name..." 
            style={searchBarStyle(theme)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div style={{ background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.text }}>
          <thead>
            <tr style={{ textAlign: 'left', background: darkMode ? '#0f172a' : '#f8fafc', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <th style={{ padding: '20px' }}>Buyer / Plot</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Month</th>
              <th>Type</th>
              <th>Received By</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: '700' }}>{p.buyerName}</div>
                    <span style={{ fontSize: '10px', color: '#3b82f6', background: '#3b82f615', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>INV: {p._id ? p._id.toString().toUpperCase().slice(-6) : 'N/A'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: theme.subText }}>Plot # {p.plotNumber}</div>
                </td>
                <td><span style={{ fontWeight: '800', color: '#10b981' }}>PKR {p.amount.toLocaleString()}</span></td>
                <td style={{ fontSize: '13px' }}>{new Date(p.date).toLocaleDateString()}</td>
                <td style={{ fontSize: '13px' }}>{p.month}</td>
                <td><span style={typeBadge(p.type)}>{p.type}</span></td>
                <td style={{ fontSize: '13px', color: theme.subText }}>{p.agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.subText }}>No transactions found.</div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon, theme }) => (
  <div style={{ background: theme.card, padding: '20px', borderRadius: '20px', border: `1px solid ${theme.border}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <p style={{ color: theme.subText, fontSize: '12px', fontWeight: '600' }}>{label}</p>
        <h3 style={{ fontSize: '24px', marginTop: '5px', fontWeight: '800', color: theme.text }}>{value}</h3>
      </div>
      <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px', color: color }}>{icon}</div>
    </div>
  </div>
);

const typeBadge = (type) => ({
  background: type === 'Advance' ? '#3b82f615' : '#10b98115',
  color: type === 'Advance' ? '#3b82f6' : '#10b981',
  padding: '4px 10px',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: '800'
});

const searchBarStyle = (t) => ({
  width: '250px',
  padding: '10px 15px 10px 38px',
  borderRadius: '12px',
  border: `1px solid ${t.border}`,
  background: t.card,
  color: t.text,
  outline: 'none'
});

export default Payments;

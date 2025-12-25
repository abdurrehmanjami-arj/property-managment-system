import React, { useState, useEffect } from 'react';
import { TrendingUp, Home, Users, DollarSign, Download, BarChart3, PieChart, Loader2 } from 'lucide-react';
import api from '../api';

const Reports = ({ darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyRevenue: [],
    topAgents: [],
    allAgents: [],
    propertyTypes: [],
    metrics: {
      totalRevenue: 0,
      totalSales: 0,
      activeClients: 0,
      avgDealSize: 0
    }
  });

  const theme = {
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    input: darkMode ? '#0f172a' : '#f1f5f9',
    border: darkMode ? '#334155' : '#e2e8f0',
    subText: darkMode ? '#94a3b8' : '#64748b'
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await api.get('/properties');
      const properties = response.data;

      // 1. Process Monthly Revenue
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      const revenueByMonth = {};
      
      const allPayments = properties.flatMap(p => p.payments || []);
      allPayments.forEach(pay => {
        const date = new Date(pay.date);
        if (date.getFullYear() === currentYear) {
          const m = months[date.getMonth()];
          revenueByMonth[m] = (revenueByMonth[m] || 0) + pay.amount;
        }
      });

      const monthlyData = months.slice(0, new Date().getMonth() + 1).map(m => ({
        month: m,
        revenue: revenueByMonth[m] || 0
      }));

      // 2. Employee Performance (Sales & Collections)
      const agentStats = {};
      properties.forEach(p => {
        // Sales credit: goes to the person who booked the plot
        const plotAgent = p.agent || 'Direct Sale';
        if (!agentStats[plotAgent]) agentStats[plotAgent] = { name: plotAgent, sales: 0, revenue: 0 };
        agentStats[plotAgent].sales += 1;

        // Revenue credit: goes to the person who actually collected the payment
        (p.payments || []).forEach(pay => {
          const collector = pay.agent || 'Admin';
          if (!agentStats[collector]) agentStats[collector] = { name: collector, sales: 0, revenue: 0 };
          agentStats[collector].revenue += pay.amount;
        });
      });

      const processedAgents = Object.values(agentStats)
        .sort((a, b) => b.revenue - a.revenue);

      // 3. Scheme/Property Distribution
      const schemes = {};
      properties.forEach(p => {
        schemes[p.scheme] = (schemes[p.scheme] || 0) + 1;
      });
      const totalProps = properties.length;
      const processedTypes = Object.entries(schemes).map(([scheme, count]) => ({
        type: scheme,
        count: count,
        percentage: Math.round((count / totalProps) * 100)
      })).slice(0, 3);

      // 4. Summary Metrics
      const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalSales = properties.length;
      
      setData({
        monthlyRevenue: monthlyData,
        topAgents: processedAgents.slice(0, 4),
        allAgents: processedAgents,
        propertyTypes: processedTypes,
        metrics: {
          totalRevenue: totalRevenue,
          totalSales: totalSales,
          activeClients: totalSales, // Each plot usually belongs to a client
          avgDealSize: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0
        }
      });
    } catch (err) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '20px' }}>
       <Loader2 className="animate-spin" size={40} color="#3b82f6"/>
       <p style={{ color: theme.subText }}>Generating analytical reports...</p>
    </div>
  );

  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div style={{ padding: '0 5px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: '22px', fontWeight: '800' }}>Analytics & Reports</h2>
          <p style={{ color: theme.subText, fontSize: '13px' }}>Business insights derived from real database records</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <MetricCard 
          icon={<DollarSign size={24}/>} 
          label="Total Revenue" 
          value={`PKR ${(data.metrics.totalRevenue / 1000000).toFixed(2)}M`} 
          change="Lifetime" 
          color="#10b981" 
          theme={theme} 
        />
        <MetricCard 
          icon={<Home size={24}/>} 
          label="Properties Sold" 
          value={data.metrics.totalSales.toString()} 
          change="Total" 
          color="#3b82f6" 
          theme={theme} 
        />
        <MetricCard 
          icon={<Users size={24}/>} 
          label="Active Clients" 
          value={data.metrics.activeClients.toString()} 
          change="Linked" 
          color="#f59e0b" 
          theme={theme} 
        />
        <MetricCard 
          icon={<TrendingUp size={24}/>} 
          label="Avg. Revenue/Plot" 
          value={`PKR ${(data.metrics.avgDealSize / 1000).toFixed(0)}k`} 
          change="Current" 
          color="#8b5cf6" 
          theme={theme} 
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        {/* Revenue Chart */}
        <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <BarChart3 size={20} color="#3b82f6"/>
            <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '800' }}>Monthly Revenue (Current Year)</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '200px' }}>
            {data.monthlyRevenue.map((m, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: theme.subText, fontWeight: '600' }}>
                  {m.revenue > 100000 ? `${(m.revenue / 1000000).toFixed(1)}M` : `${(m.revenue / 1000).toFixed(0)}k`}
                </div>
                <div 
                  style={{ 
                    width: '100%', 
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)', 
                    borderRadius: '8px 8px 0 0',
                    height: `${(m.revenue / maxRevenue) * 100}%`,
                    minHeight: m.revenue > 0 ? '5px' : '0px',
                    transition: '0.8s ease-out'
                  }}
                  title={`PKR ${m.revenue.toLocaleString()}`}
                />
                <div style={{ fontSize: '11px', color: theme.subText, fontWeight: '700' }}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Types */}
        <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PieChart size={20} color="#10b981"/>
            <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '800' }}>Scheme Distribution</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.propertyTypes.length > 0 ? data.propertyTypes.map((scheme, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{scheme.type}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6' }}>{scheme.count} Plots ({scheme.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: theme.input, borderRadius: '10px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${scheme.percentage}%`, 
                      height: '100%', 
                      background: idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f59e0b',
                      borderRadius: '10px',
                      transition: '1s ease-in-out'
                    }}
                  />
                </div>
              </div>
            )) : <p style={{ color: theme.subText, textAlign: 'center', padding: '20px' }}>No property data available.</p>}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Top Sales Performers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {data.topAgents.length > 0 ? data.topAgents.map((agent, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '20px', 
                background: theme.input, 
                borderRadius: '16px',
                border: idx === 0 ? '2px solid #fbbf24' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {idx === 0 ? <span style={{ fontSize: '24px' }}>🏆</span> : <Users size={24} color="#64748b"/>}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: theme.text }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: theme.subText }}>Collections Leader</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: theme.subText }}>Plot Sales:</span>
                <span style={{ fontWeight: '700', color: '#3b82f6' }}>{agent.sales}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '5px' }}>
                <span style={{ color: theme.subText }}>Total Collection:</span>
                <span style={{ fontWeight: '700', color: '#10b981' }}>PKR {(agent.revenue / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          )) : <p style={{ color: theme.subText, textAlign: 'center', width: '100%', padding: '20px' }}>Add property bookings to see rankings.</p>}
        </div>
      </div>

      {/* Detailed Employee Performance Table */}
      <div style={{ marginTop: '30px', background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} color="#3b82f6"/> Employee Work Summary
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.text }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}`, color: theme.subText, fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 10px' }}>Employee Name</th>
                <th>Plots Sold</th>
                <th>Revenue Collected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.allAgents?.map((agent, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}`, fontSize: '14px' }}>
                  <td style={{ padding: '15px 10px', fontWeight: '700' }}>{agent.name}</td>
                  <td>{agent.sales} Properties</td>
                  <td style={{ fontWeight: '800', color: '#10b981' }}>PKR {agent.revenue.toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      background: (agent.sales > 0 || agent.revenue > 0) ? '#10b98115' : '#94a3b815', 
                      color: (agent.sales > 0 || agent.revenue > 0) ? '#10b981' : '#94a3b8',
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700'
                    }}>
                      {(agent.sales > 0 || agent.revenue > 0) ? 'Active' : 'Inactive'}
                    </span>
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

// Metric Card Component
const MetricCard = ({ icon, label, value, change, color, theme }) => (
  <div style={{ 
    background: theme.card, 
    padding: '20px', 
    borderRadius: '20px', 
    border: `1px solid ${theme.border}`,
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
      <div style={{ background: `${color}15`, padding: '10px', borderRadius: '12px', color: color }}>
        {icon}
      </div>
      <span style={{ 
        background: change.startsWith('+') ? '#10b98115' : '#ef444415', 
        color: change.startsWith('+') ? '#10b981' : '#ef4444',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '800'
      }}>
        {change}
      </span>
    </div>
    <p style={{ color: theme.subText, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
    <h3 style={{ fontSize: '22px', marginTop: '5px', fontWeight: '800', color: theme.text }}>{value}</h3>
  </div>
);

const exportBtn = {
  background: '#10b981', 
  color: 'white', 
  border: 'none', 
  padding: '10px 18px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  display: 'flex', 
  gap: '8px', 
  alignItems: 'center', 
  fontWeight: '700', 
  fontSize: '13px',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
};

export default Reports;

import React from 'react';

const StatsCard = ({ label, value, color, darkMode, trend }) => {
  return (
    <div style={{ 
      background: darkMode ? '#1e293b' : '#ffffff', 
      padding: '25px', borderRadius: '24px', flex: 1, 
      boxShadow: darkMode ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.05)',
      border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9',
      transition: '0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <h2 style={{ fontSize: '28px', marginTop: '10px', fontWeight: '800', color: darkMode ? 'white' : '#1e293b' }}>{value}</h2>
        </div>
        <div style={{ background: `${color}15`, padding: '8px 12px', borderRadius: '10px', color: color, fontSize: '12px', fontWeight: 'bold' }}>
          {trend}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
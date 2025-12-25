import React from 'react';
import { X } from 'lucide-react';

const BookingModal = ({ onClose, darkMode }) => {
  const inputStyle = {
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    background: darkMode ? '#0f172a' : '#f9fafb',
    color: darkMode ? 'white' : 'black',
    outline: 'none'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: darkMode ? '#1e293b' : 'white', padding: '30px', borderRadius: '20px', width: '400px', color: darkMode ? 'white' : 'black' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '700' }}>Add New Booking</h3>
          <X onClick={onClose} cursor="pointer" />
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input placeholder="Customer Name" style={inputStyle} />
          <input placeholder="Plot Number" style={inputStyle} />
          <input placeholder="Amount (PKR)" type="number" style={inputStyle} />
          <button type="button" onClick={onClose} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
            Save Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
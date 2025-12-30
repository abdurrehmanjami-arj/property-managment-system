import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../api';

const BackupRestore = ({ darkMode, showToast, askConfirm }) => {
  const [stats, setStats] = useState({ users: 0, properties: 0, payments: 0 });
  const [loading, setLoading] = useState(false);
  const [backupFile, setBackupFile] = useState(null);

  const theme = {
    bg: darkMode ? '#020617' : '#f8fafc',
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#1e293b',
    subText: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input: darkMode ? '#0f172a' : '#f8fafc',
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/backup/backup-stats');
      setStats(response.data.stats);
    } catch (err) {

    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup/create-backup');
      
      if (response.data.success) {
        // Create downloadable file
        const backup = response.data.backup;
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estatepro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`Backup created successfully! ${backup.metadata.totalUsers} users, ${backup.metadata.totalProperties} properties`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target.result);
          setBackupFile(backup);
          showToast('Backup file loaded successfully', 'success');
        } catch (err) {
          showToast('Invalid backup file format', 'error');
          setBackupFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreBackup = () => {
    if (!backupFile) {
      showToast('Please select a backup file first', 'error');
      return;
    }

    askConfirm(
      'Restore Database?',
      `⚠️ WARNING: This will DELETE all current data and restore from backup.\n\nBackup contains:\n• ${backupFile.metadata?.totalUsers || 0} Users\n• ${backupFile.metadata?.totalProperties || 0} Properties\n\nCreated: ${new Date(backupFile.metadata?.createdAt).toLocaleString()}\n\nAre you absolutely sure?`,
      async () => {
        setLoading(true);
        try {
          const response = await api.post('/backup/restore-backup', { backup: backupFile });
          
          if (response.data.success) {
            showToast(`Database restored! ${response.data.restored.users} users, ${response.data.restored.properties} properties`, 'success');
            setBackupFile(null);
            fetchStats();
            
            // Reload page after 2 seconds
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to restore backup', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const statCard = (icon, label, value, color) => (
    <div style={{ 
      background: theme.card, 
      padding: '25px', 
      borderRadius: '20px', 
      border: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        borderRadius: '15px', 
        background: `${color}15`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '12px', color: theme.subText, fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '800', color: theme.text, margin: '5px 0 0 0' }}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: theme.text, fontSize: '22px', fontWeight: '800', marginBottom: '5px' }}>
          Backup & Restore
        </h2>
        <p style={{ color: theme.subText, fontSize: '13px' }}>
          Create complete database backups and restore from previous backups
        </p>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {statCard(<Database size={28}/>, 'Total Users', stats.users, '#3b82f6')}
        {statCard(<Database size={28}/>, 'Total Properties', stats.properties, '#10b981')}
        {statCard(<Database size={28}/>, 'Total Payments', stats.payments, '#f59e0b')}
      </div>

      {/* Backup Section */}
      <div style={{ 
        background: theme.card, 
        padding: '30px', 
        borderRadius: '24px', 
        border: `1px solid ${theme.border}`,
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: '#3b82f615', 
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Download size={24}/>
          </div>
          <div>
            <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '800', margin: 0 }}>
              Create Backup
            </h3>
            <p style={{ color: theme.subText, fontSize: '13px', margin: '3px 0 0 0' }}>
              Download complete database backup as JSON file
            </p>
          </div>
        </div>

        <div style={{ 
          background: theme.input, 
          padding: '20px', 
          borderRadius: '15px', 
          marginBottom: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertCircle size={18} color="#3b82f6"/>
            <p style={{ fontSize: '13px', fontWeight: '700', color: theme.text, margin: 0 }}>
              Backup includes:
            </p>
          </div>
          <ul style={{ margin: '10px 0 0 30px', padding: 0, color: theme.subText, fontSize: '13px' }}>
            <li>All user accounts (with encrypted passwords)</li>
            <li>All properties and their details</li>
            <li>Complete payment history</li>
            <li>Security questions (encrypted)</li>
          </ul>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={loading}
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: loading ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          {loading ? <Loader size={18} className="spin"/> : <Download size={18}/>}
          {loading ? 'Creating Backup...' : 'Download Backup'}
        </button>
      </div>

      {/* Restore Section */}
      <div style={{ 
        background: theme.card, 
        padding: '30px', 
        borderRadius: '24px', 
        border: `1px solid ${theme.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: '#ef444415', 
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Upload size={24}/>
          </div>
          <div>
            <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '800', margin: 0 }}>
              Restore from Backup
            </h3>
            <p style={{ color: theme.subText, fontSize: '13px', margin: '3px 0 0 0' }}>
              Upload and restore database from backup file
            </p>
          </div>
        </div>

        <div style={{ 
          background: '#ef444410', 
          padding: '20px', 
          borderRadius: '15px', 
          marginBottom: '20px',
          border: '1px solid #ef444430'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertCircle size={18} color="#ef4444"/>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', margin: 0 }}>
              ⚠️ WARNING: Destructive Operation
            </p>
          </div>
          <p style={{ margin: '10px 0 0 0', color: theme.subText, fontSize: '13px' }}>
            Restoring will <strong>DELETE ALL CURRENT DATA</strong> and replace it with the backup. This action cannot be undone. Make sure you have a recent backup before proceeding.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            padding: '20px',
            background: theme.input,
            border: `2px dashed ${theme.border}`,
            borderRadius: '15px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: '0.2s'
          }}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Upload size={32} color={theme.subText} style={{ margin: '0 auto 10px' }}/>
            <p style={{ color: theme.text, fontWeight: '700', fontSize: '14px', margin: '0 0 5px 0' }}>
              {backupFile ? '✓ Backup file loaded' : 'Click to select backup file'}
            </p>
            <p style={{ color: theme.subText, fontSize: '12px', margin: 0 }}>
              {backupFile 
                ? `${backupFile.metadata?.totalUsers || 0} users, ${backupFile.metadata?.totalProperties || 0} properties`
                : 'Only .json backup files are accepted'
              }
            </p>
          </label>
        </div>

        <button
          onClick={handleRestoreBackup}
          disabled={loading || !backupFile}
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: (loading || !backupFile) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: (loading || !backupFile) ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          {loading ? <Loader size={18} className="spin"/> : <Upload size={18}/>}
          {loading ? 'Restoring...' : 'Restore Database'}
        </button>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BackupRestore;

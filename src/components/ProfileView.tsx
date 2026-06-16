import React, { useRef, useState, useEffect } from 'react';
import { Trade } from '@/lib/db';
import { DownloadIcon, UploadIcon, TrashIcon, InfoIcon } from './Icons';

interface ProfileViewProps {
  trades: Trade[];
  user: any;
  onSignOut: () => Promise<void>;
  onResetDb: () => Promise<void>;
  onClearDb: () => Promise<void>;
  onImportDb: (importedTrades: Trade[]) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

function ProfileView({ trades, user, onSignOut, onResetDb, onClearDb, onImportDb, onShowToast }: ProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Monitor PWA installation status
  useEffect(() => {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Export JSON database file
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify({ trades }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alphatrader_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Trades backup exported successfully!', 'success');
    } catch (error) {
      onShowToast('Failed to export trades.', 'error');
    }
  };

  // Import JSON database file
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const importedData = JSON.parse(text);
        if (Array.isArray(importedData.trades)) {
          await onImportDb(importedData.trades);
          onShowToast(`Successfully imported ${importedData.trades.length} trades!`, 'success');
        } else if (Array.isArray(importedData)) {
          await onImportDb(importedData);
          onShowToast(`Successfully imported ${importedData.length} trades!`, 'success');
        } else {
          onShowToast('Invalid backup file format.', 'error');
        }
      } catch (err) {
        onShowToast('Failed to parse backup file.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow importing same file again if needed
    e.target.value = '';
  };

  const currentBalance = trades.length > 0 ? trades[0].accountBalance : 0;

  const totalPnL = trades.filter(t => t.closed).reduce((sum, t) => sum + (t.pnl || 0), 0);
  const startingCapital = currentBalance - totalPnL;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile &amp; Settings</h1>
        <p className="page-subtitle">Manage your account balance, PWA status, and trade backups.</p>
      </div>

      {/* PWA Install Banner */}
      {!isInstalled && deferredPrompt && (
        <div className="install-banner">
          <div className="install-text">
            <span className="install-title">Install AlphaTrader App</span>
            <span className="install-desc">Install on your home screen for quick, offline-capable access.</span>
          </div>
          <button className="btn btn-primary" onClick={handleInstallClick}>
            Install
          </button>
        </div>
      )}

      <div className="profile-section">
        {/* Account Profile Card */}
        <div className="glass-panel profile-card">
          <div className="profile-header-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-hover)' }} 
              />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                {user?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
            )}
            <div className="profile-name-info" style={{ marginLeft: '14px', display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.name || 'Trader Portfolio'}</span>
              <span className="profile-tier" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email || 'PRO Account'}</span>
            </div>
          </div>

          <div className="stat-row">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value" style={{ color: 'var(--color-success)' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentBalance)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Starting Capital</span>
            <span className="stat-value">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(startingCapital)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Closed Trades</span>
            <span className="stat-value">{trades.filter(t => t.closed).length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Active Open Trades</span>
            <span className="stat-value">{trades.filter(t => !t.closed).length}</span>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={onSignOut}>
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Data Utilities */}
        <div className="glass-panel profile-card">
          <h2 className="detail-section-title">Data Backup &amp; Portability</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Export your entire trading history as a JSON file or import a previous backup.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <DownloadIcon size={16} />
              Export Backup
            </button>
            <button className="btn btn-secondary" onClick={handleImportClick}>
              <UploadIcon size={16} />
              Import Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImportFileChange}
            />
          </div>
        </div>

        {/* Database Control Card */}
        <div className="glass-panel profile-card">
          <h2 className="detail-section-title" style={{ color: 'var(--color-danger)' }}>Danger Zone</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Actions to reset or clear your journal. They cannot be undone.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (confirm('Are you sure you want to reset the database to sample trades? This will overwrite your current trades.')) {
                  onResetDb();
                }
              }}
            >
              Reset to Sample Data
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => {
                if (confirm('CRITICAL WARNING: Are you sure you want to delete ALL trades in your database? This action is permanent!')) {
                  onClearDb();
                }
              }}
            >
              <TrashIcon size={16} />
              Wipe Database
            </button>
          </div>
        </div>

        {/* System Info */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <InfoIcon size={14} />
          <span>AlphaTrader PWA v1.0.0 • Offline Capable</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProfileView);

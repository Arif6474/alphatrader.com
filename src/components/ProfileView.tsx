import React, { useRef, useState, useEffect } from 'react';
import { Trade } from '@/lib/db';
import { DownloadIcon, UploadIcon, TrashIcon } from './Icons';
import { confirmAction } from '@/lib/toast';

interface ProfileViewProps {
  trades: Trade[];
  user: any;
  onSignOut: () => Promise<void>;
  onResetDb: () => Promise<void>;
  onClearDb: () => Promise<void>;
  onImportDb: (importedTrades: Trade[]) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

/* ── Inline icons ── */
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconWallet = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconDatabase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IconSmartphone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ── Section wrapper ── */
function Section({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px', overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: `linear-gradient(90deg, ${accent}10 0%, transparent 100%)`,
      }}>
        <div style={{ color: accent }}>{icon}</div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 22px' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Stat tile ── */
function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      flex: '1 1 140px', padding: '14px 16px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
      <span style={{ fontSize: '1.15rem', fontWeight: 900, color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.3px' }}>{value}</span>
    </div>
  );
}

/* ── Action button ── */
function ActionBtn({ children, onClick, variant = 'secondary', icon }: {
  children: React.ReactNode; onClick: () => void; variant?: 'secondary' | 'danger' | 'primary'; icon?: React.ReactNode;
}) {
  const styles = {
    secondary: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', hover: 'rgba(255,255,255,0.08)' },
    danger:    { bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.25)', color: '#ff3366', hover: 'rgba(255,51,102,0.15)' },
    primary:   { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: 'var(--color-primary-hover)', hover: 'rgba(99,102,241,0.2)' },
  }[variant];
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '10px 18px', borderRadius: '10px', border: `1px solid ${styles.border}`,
        background: hovered ? styles.hover : styles.bg, color: styles.color,
        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
      }}>
      {icon}
      {children}
    </button>
  );
}

function ProfileView({ trades, user, onSignOut, onResetDb, onClearDb, onImportDb, onShowToast }: ProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }
    const handleBeforeInstall = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); setDeferredPrompt(null); }
  };

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify({ trades }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `alphatrader_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      onShowToast('Backup exported successfully!', 'success');
    } catch { onShowToast('Failed to export trades.', 'error'); }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(data.trades) ? data.trades : Array.isArray(data) ? data : null;
        if (arr) { await onImportDb(arr); onShowToast(`Imported ${arr.length} trades!`, 'success'); }
        else onShowToast('Invalid backup format.', 'error');
      } catch { onShowToast('Failed to parse backup file.', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const closedTrades = trades.filter(t => t.closed);
  const activeTrades = trades.filter(t => !t.closed);
  const netPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const currentBalance = trades.length > 0 ? trades[0].accountBalance : 0;
  const startingCapital = currentBalance - netPnl;
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'AT';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your profile, account data, and app preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── PWA Banner ── */}
        {!isInstalled && deferredPrompt && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
            borderRadius: '14px', border: '1px solid rgba(99,102,241,0.25)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-hover)', flexShrink: 0 }}>
              <IconSmartphone />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Install AlphaTrader App</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Get instant access from your home screen with offline support.</p>
            </div>
            <button onClick={handleInstallClick} style={{
              padding: '9px 20px', borderRadius: '9px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)', flexShrink: 0,
            }}>
              Install
            </button>
          </div>
        )}

        {/* ── Profile Hero Card ── */}
        <div style={{
          borderRadius: '16px', overflow: 'hidden',
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Hero banner gradient */}
          <div style={{
            height: '80px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.2) 50%, rgba(16,185,129,0.15) 100%)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 60%)', pointerEvents: 'none' }} />
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '64px', height: '64px', borderRadius: '14px', border: '3px solid rgba(10,12,22,0.9)', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '14px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: '3px solid rgba(10,12,22,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 900, color: '#fff',
                  }}>
                    {initials}
                  </div>
                )}
                <div style={{ paddingBottom: '4px' }}>
                  <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{user?.name || 'Trader'}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'PRO Account'}</p>
                </div>
              </div>
              <button onClick={onSignOut}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '9px 16px', borderRadius: '9px',
                  border: '1px solid rgba(255,51,102,0.25)', background: 'rgba(255,51,102,0.07)',
                  color: '#ff3366', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,51,102,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,51,102,0.07)'}
              >
                <IconLogOut /> Sign Out
              </button>
            </div>

            {/* Stats tiles */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <StatTile label="Current Balance" value={fmt(currentBalance)} color={netPnl >= 0 ? '#10b981' : '#ff3366'} />
              <StatTile label="Starting Capital" value={fmt(startingCapital)} color="var(--text-primary)" />
              <StatTile label="Closed Trades" value={String(closedTrades.length)} color="var(--color-primary-hover)" />
              <StatTile label="Open Positions" value={String(activeTrades.length)} color={activeTrades.length > 0 ? '#f59e0b' : 'var(--text-muted)'} />
              <StatTile label="Net P&L" value={`${netPnl >= 0 ? '+' : ''}${fmt(netPnl)}`} color={netPnl >= 0 ? '#10b981' : '#ff3366'} />
            </div>
          </div>
        </div>

        {/* ── Data Backup Section ── */}
        <Section icon={<IconDatabase />} title="Data Backup & Portability" accent="#6366f1">
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Export your entire trading history as a JSON file, or restore from a previous backup. Exports are encrypted-ready and portable across devices.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <ActionBtn onClick={handleExport} icon={<DownloadIcon size={15} />} variant="secondary">
              Export Backup
            </ActionBtn>
            <ActionBtn onClick={() => fileInputRef.current?.click()} icon={<UploadIcon size={15} />} variant="primary">
              Import Backup
            </ActionBtn>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImportFileChange} />
          </div>
        </Section>

        {/* ── App Info Section ── */}
        <Section icon={<IconShield />} title="App Information" accent="#10b981">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Version', value: 'v1.0.0' },
              { label: 'Storage', value: 'Cloud Synced' },
              { label: 'Status', value: 'Offline Capable' },
              { label: 'Plan', value: 'PRO' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Danger Zone ── */}
        <Section icon={<IconAlertTriangle />} title="Danger Zone" accent="#ff3366">
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            These actions are <strong style={{ color: '#ff3366' }}>irreversible</strong>. Please make sure you have exported a backup before proceeding.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <ActionBtn
              onClick={() => confirmAction('Reset the database to sample trades? This will overwrite your current trades.', () => onResetDb())}
              icon={<span style={{ fontSize: '0.8rem' }}>↺</span>}
              variant="secondary"
            >
              Reset to Sample Data
            </ActionBtn>
            <ActionBtn
              onClick={() => confirmAction('CRITICAL: Delete ALL trades permanently? This cannot be undone!', () => onClearDb())}
              icon={<TrashIcon size={15} />}
              variant="danger"
            >
              Wipe Database
            </ActionBtn>
          </div>
        </Section>

        {/* ── Footer note ── */}
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          AlphaTrader &nbsp;·&nbsp; Professional Trading Journal &nbsp;·&nbsp; v1.0.0
        </div>

      </div>
    </div>
  );
}

export default React.memo(ProfileView);

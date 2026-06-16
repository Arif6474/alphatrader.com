'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trade } from '@/lib/db';
import DashboardView from '@/components/DashboardView';
import TradesView from '@/components/TradesView';
import AnalyticsView from '@/components/AnalyticsView';
import ProfileView from '@/components/ProfileView';
import TradeModal from '@/components/TradeModal';
import TradeDetailModal from '@/components/TradeDetailModal';
import AuthView from '@/components/AuthView';
import AccountManagerModal, { Account } from '@/components/AccountManagerModal';
import toast from 'react-hot-toast';
import { 
  DashboardIcon, 
  TradesIcon, 
  AnalyticsIcon, 
  ProfileIcon, 
  PlusIcon,
  CheckIcon,
  WarningIcon
} from '@/components/Icons';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Accounts State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Modals States
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Toast wrapper using react-hot-toast
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message, {
        style: { background: '#10b981', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#10b981' }
      });
    } else {
      toast.error(message, {
        style: { background: '#ef4444', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#ef4444' }
      });
    }
  }, []);

  // Check user session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkSession();
  }, []);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        setSelectedAccountId(prev => (prev === 'all' && data.length > 0 ? data[0].id : prev));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, []);

  // Fetch all trades from Next.js server API
  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trades');
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      } else if (res.status === 401) {
        // Token expired or cleared, log out client side
        setUser(null);
      } else {
        showToast('Failed to load trades from server.', 'error');
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      showToast('Connection error. Server offline.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch trades when user shifts to authenticated state
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchTrades();
      fetchAccounts();
    }
  }, [fetchTrades, fetchAccounts, user]);

  // Save/Create/Update trade handler
  const handleSaveTrade = useCallback(async (tradeData: any) => {
    try {
      let res;
      if (editingTrade) {
        // Edit Mode
        res = await fetch(`/api/trades/${editingTrade.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData)
        });
      } else {
        // Create Mode
        res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData)
        });
      }

      if (res.ok) {
        showToast(
          editingTrade ? 'Trade updated successfully!' : 'Trade logged successfully!', 
          'success'
        );
        fetchTrades();
        
        // Close modals
        setIsAddOpen(false);
        setIsEditOpen(false);
        setIsDetailOpen(false);
        setEditingTrade(null);
        setSelectedTrade(null);
      } else if (res.status === 401) {
        setUser(null);
        showToast('Session expired. Please log in again.', 'error');
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to save trade.', 'error');
      }
    } catch (err) {
      showToast('Failed to save trade due to server issue.', 'error');
    }
  }, [editingTrade, showToast, fetchTrades]);

  // Delete trade handler
  const handleDeleteTrade = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Trade record deleted.', 'success');
        fetchTrades();
        setIsDetailOpen(false);
        setSelectedTrade(null);
      } else if (res.status === 401) {
        setUser(null);
        showToast('Session expired. Please log in again.', 'error');
      } else {
        showToast('Failed to delete trade record.', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting trade.', 'error');
    }
  }, [showToast, fetchTrades]);

  // Database Administration actions
  const handleResetDb = useCallback(async () => {
    try {
      const res = await fetch('/api/db?action=reset', { method: 'POST' });
      if (res.ok) {
        showToast('Database reset to sample trades.', 'success');
        fetchTrades();
      } else if (res.status === 401) {
        setUser(null);
      } else {
        showToast('Failed to reset database.', 'error');
      }
    } catch (err) {
      showToast('Server admin call failed.', 'error');
    }
  }, [showToast, fetchTrades]);

  const handleClearDb = useCallback(async () => {
    try {
      const res = await fetch('/api/db?action=clear', { method: 'POST' });
      if (res.ok) {
        showToast('All trades wiped out.', 'success');
        fetchTrades();
      } else if (res.status === 401) {
        setUser(null);
      } else {
        showToast('Failed to wipe database.', 'error');
      }
    } catch (err) {
      showToast('Server admin call failed.', 'error');
    }
  }, [showToast, fetchTrades]);

  const handleImportDb = useCallback(async (importedTrades: Trade[]) => {
    try {
      const res = await fetch('/api/db?action=import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: importedTrades })
      });
      if (res.ok) {
        fetchTrades();
      } else if (res.status === 401) {
        setUser(null);
      } else {
        showToast('Failed to import backup.', 'error');
      }
    } catch (err) {
      showToast('Import server call failed.', 'error');
    }
  }, [fetchTrades, showToast]);

  const handleSignOut = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setTrades([]);
        setAccounts([]);
        setSelectedAccountId('all');
        showToast('Signed out successfully.', 'success');
      } else {
        showToast('Sign out failed.', 'error');
      }
    } catch (err) {
      showToast('Connection error during sign out.', 'error');
    }
  }, [showToast]);

  // Open Edit wizard from details modal
  const handleTriggerEdit = useCallback((trade: Trade) => {
    setEditingTrade(trade);
    setIsDetailOpen(false); // Close the view modal
    setIsEditOpen(true); // Open the edit modal
  }, []);

  const handleViewTrade = useCallback((t: Trade) => {
    setSelectedTrade(t);
    setIsDetailOpen(true);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setIsAddOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditOpen(false);
    setEditingTrade(null);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedTrade(null);
  }, []);

  // Compute filtered trades based on selected account
  const filteredTrades = selectedAccountId === 'all'
    ? trades
    : trades.filter(t => t.accountId === selectedAccountId);

  // Selected account object
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Compute current balance from filtered trades
  const currentBalance = selectedAccount
    ? selectedAccount.startingCapital
    : (filteredTrades.length > 0 ? filteredTrades[0].accountBalance : 0);

  // Spinner loader for overall initialization
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59, 130, 246, 0.1)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.85rem' }}>Loading AlphaTrader...</span>
      </div>
    );
  }

  // Not Logged In -> Show Auth Form
  if (!user) {
    return (
      <>
        <AuthView onAuthSuccess={(usr) => setUser(usr)} />
      </>
    );
  }

  return (
    <div className="app-container">

      {/* Top Header */}
      <header className="app-header">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
            <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="logo-text">AlphaTrader</span>
        </div>
        
        <div className="header-actions" style={{ gap: '12px' }}>
          {/* Account Selector */}
          <div className="header-account-selector">
            <select
              id="account-filter-select"
              className="account-select"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              title="Filter by account"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.firmName ? ` · ${a.firmName}` : ''}
                </option>
              ))}
            </select>
            <button
              className="btn-icon-sm"
              onClick={() => setIsAccountModalOpen(true)}
              title="Manage accounts"
            >
              ⚙️
            </button>
          </div>

          <div className="account-summary">
            <div className="account-label">
              {selectedAccount ? selectedAccount.name : 'Total Capital'}
            </div>
            <div className="account-balance">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(currentBalance)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-primary-hover)' }} 
              />
            ) : (
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }} className="desktop-only-user">
              {user.name.split(' ')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg className="logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
            <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sidebar-logo-text">AlphaTrader</span>
        </div>

        {/* Sidebar Account Selector */}
        <div className="sidebar-account-section">
          <div className="sidebar-account-label">Active Account</div>
          <select
            className="account-select account-select--full"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            className="sidebar-manage-accounts-btn"
            onClick={() => setIsAccountModalOpen(true)}
          >
            <span>⚙️</span> Manage Accounts
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ul className="nav-links" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li className="nav-item">
              <a 
                href="#dashboard" 
                className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
              >
                <DashboardIcon className="nav-icon" />
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#trades" 
                className={`nav-link ${activeView === 'trades' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('trades'); }}
              >
                <TradesIcon className="nav-icon" />
                Trades Directory
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#analytics" 
                className={`nav-link ${activeView === 'analytics' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('analytics'); }}
              >
                <AnalyticsIcon className="nav-icon" />
                Analytics
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#profile" 
                className={`nav-link ${activeView === 'profile' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('profile'); }}
              >
                <ProfileIcon className="nav-icon" />
                Settings
              </a>
            </li>
          </ul>
        </nav>

        {/* Desktop New Trade Button */}
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '16px' }}
          onClick={handleOpenAddModal}
        >
          <PlusIcon size={18} />
          Log Trade
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '50vh', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
            {/* Simple CSS Loading spinner */}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59, 130, 246, 0.1)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem' }}>Synchronizing trade data...</span>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView 
                trades={filteredTrades} 
                onViewTrade={handleViewTrade}
                onNavigate={setActiveView}
              />
            )}
            {activeView === 'trades' && (
              <TradesView 
                trades={filteredTrades} 
                onViewTrade={handleViewTrade}
                onOpenNewTrade={handleOpenAddModal}
              />
            )}
            {activeView === 'analytics' && (
              <AnalyticsView trades={filteredTrades} />
            )}
            {activeView === 'profile' && (
              <ProfileView 
                trades={filteredTrades}
                user={user}
                onSignOut={handleSignOut}
                onResetDb={handleResetDb}
                onClearDb={handleClearDb}
                onImportDb={handleImportDb}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav - Mobile Navigation */}
      <nav className="bottom-nav">
        <a 
          href="#dashboard" 
          className={`bottom-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
        >
          <DashboardIcon className="bottom-nav-icon" />
          <span>Dashboard</span>
        </a>
        <a 
          href="#trades" 
          className={`bottom-nav-item ${activeView === 'trades' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveView('trades'); }}
        >
          <TradesIcon className="bottom-nav-icon" />
          <span>Trades</span>
        </a>
        
        {/* Floating Action Button */}
        <button 
          className="fab-button"
          onClick={handleOpenAddModal}
          title="Log New Trade"
        >
          <PlusIcon size={24} />
        </button>

        <a 
          href="#analytics" 
          className={`bottom-nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveView('analytics'); }}
        >
          <AnalyticsIcon className="bottom-nav-icon" />
          <span>Analytics</span>
        </a>
        <a 
          href="#profile" 
          className={`bottom-nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveView('profile'); }}
        >
          <ProfileIcon className="bottom-nav-icon" />
          <span>Settings</span>
        </a>
      </nav>

      {/* Modals */}
      {/* Log Trade Modal */}
      {isAddOpen && (
        <TradeModal 
          isOpen={isAddOpen}
          onClose={handleCloseAddModal}
          onSave={handleSaveTrade}
          currentBalance={currentBalance}
          accounts={accounts}
          defaultAccountId={selectedAccountId === 'all' ? '' : selectedAccountId}
        />
      )}

      {/* Edit Trade Modal */}
      {isEditOpen && editingTrade && (
        <TradeModal 
          trade={editingTrade}
          isOpen={isEditOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveTrade}
          currentBalance={editingTrade ? editingTrade.accountBalance : currentBalance}
          accounts={accounts}
          defaultAccountId={editingTrade?.accountId || ''}
        />
      )}

      {/* View Detail Modal */}
      {isDetailOpen && selectedTrade && (
        <TradeDetailModal 
          trade={selectedTrade}
          isOpen={isDetailOpen}
          onClose={handleCloseDetailModal}
          onEdit={handleTriggerEdit}
          onDelete={handleDeleteTrade}
        />
      )}

      {/* Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        onAccountsChange={setAccounts}
      />
    </div>
  );
}

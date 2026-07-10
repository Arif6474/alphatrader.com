'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AuthView from './AuthView';
import TradeModal from './TradeModal';
import TradeDetailModal from './TradeDetailModal';
import AccountManagerModal from './AccountManagerModal';
import { 
  DashboardIcon, 
  TradesIcon, 
  AnalyticsIcon, 
  ProfileIcon, 
  PlusIcon
} from './Icons';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    user,
    setUser,
    authLoading,
    accounts,
    setAccounts,
    selectedAccountId,
    setSelectedAccountId,
    isAccountModalOpen,
    setIsAccountModalOpen,
    selectedTrade,
    isDetailOpen,
    editingTrade,
    isAddOpen,
    isEditOpen,
    currentBalance,
    handleSaveTrade,
    handleDeleteTrade,
    handleOpenAddModal,
    handleCloseAddModal,
    handleCloseEditModal,
    handleCloseDetailModal,
    handleOpenEditModal
  } = useApp();

  // Helper to get active page title
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/trades':
        return 'Trades Directory';
      case '/analytics':
        return 'Analytics';
      case '/settings':
        return 'Settings';
      default:
        return 'AlphaTrader';
    }
  };

  // If session is loading, show loading screen
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: '#07090e',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Initializing journal session...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // If user is not authenticated, show AuthView
  if (!user) {
    return <AuthView onAuthSuccess={setUser} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar - Desktop Layout */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg className="logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
            <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sidebar-logo-text">AlphaTrader</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ul className="nav-links" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li className="nav-item">
              <Link 
                href="/" 
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              >
                <DashboardIcon className="nav-icon" />
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/trades" 
                className={`nav-link ${pathname === '/trades' ? 'active' : ''}`}
              >
                <TradesIcon className="nav-icon" />
                Trades Directory
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/analytics" 
                className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}
              >
                <AnalyticsIcon className="nav-icon" />
                Analytics
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/settings" 
                className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}
              >
                <ProfileIcon className="nav-icon" />
                Settings
              </Link>
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
          Add New Trade
        </button>
      </aside>

      {/* Top Navbar */}
      <header className="app-header">
        {/* Mobile Logo Branding */}
        <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg className="logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px' }}>
            <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
            <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sidebar-logo-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>AlphaTrader</span>
        </div>

        {/* Desktop Page Title */}
        <h2 className="desktop-page-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          {getPageTitle()}
        </h2>

        {/* Right Section: Accounts & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Account Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="account-select"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={{ background: '#0b1220' }}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAccountModalOpen(true)}
              style={{ padding: '6px 10px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Manage Accounts"
            >
              <span>⚙️</span>
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }} className="desktop-username">
              {user?.email ? user.email.split('@')[0] : 'User'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Nav - Mobile Navigation */}
      <nav className="bottom-nav">
        <Link 
          href="/" 
          className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}
        >
          <DashboardIcon className="bottom-nav-icon" />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/trades" 
          className={`bottom-nav-item ${pathname === '/trades' ? 'active' : ''}`}
        >
          <TradesIcon className="bottom-nav-icon" />
          <span>Trades</span>
        </Link>
        
        {/* Floating Action Button */}
        <button 
          className="fab-button"
          onClick={handleOpenAddModal}
          title="Log New Trade"
        >
          <PlusIcon size={24} />
        </button>

        <Link 
          href="/analytics" 
          className={`bottom-nav-item ${pathname === '/analytics' ? 'active' : ''}`}
        >
          <AnalyticsIcon className="bottom-nav-icon" />
          <span>Analytics</span>
        </Link>
        <Link 
          href="/settings" 
          className={`bottom-nav-item ${pathname === '/settings' ? 'active' : ''}`}
        >
          <ProfileIcon className="bottom-nav-icon" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Global Modals */}
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

      {isDetailOpen && selectedTrade && (
        <TradeDetailModal 
          trade={selectedTrade}
          isOpen={isDetailOpen}
          onClose={handleCloseDetailModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteTrade}
        />
      )}

      <AccountManagerModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        onAccountsChange={setAccounts}
      />
    </div>
  );
}

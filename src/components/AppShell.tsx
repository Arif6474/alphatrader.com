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
  PlusIcon,
  PsychologyIcon,
  RulesIcon
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

  // Custom Account Switcher state
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = React.useState(false);
  const accountDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountDropdownOpen]);

  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const activeAccountLabel = selectedAccountId === 'all' 
    ? 'All Accounts' 
    : (activeAccount?.name || 'All Accounts');

  const isAnyModalOpen = Boolean(isAddOpen || isEditOpen || isDetailOpen || isAccountModalOpen);

  // Helper to get active page title
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/trades':
        return 'Trades Directory';
      case '/analytics':
        return 'Analytics';
      case '/rules':
        return 'Trading Rules';
      case '/psychology':
        return 'Trading Psychology';
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
                href="/rules" 
                className={`nav-link ${pathname === '/rules' ? 'active' : ''}`}
              >
                <RulesIcon className="nav-icon" style={{ color: pathname === '/rules' ? '#f59e0b' : undefined }} />
                Trading Rules
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/psychology" 
                className={`nav-link ${pathname === '/psychology' ? 'active' : ''}`}
                // style={pathname === '/psychology' ? {
                //   background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%)',
                //   color: '#c084fc',
                //   borderLeft: '3px solid #a855f7'
                // } : undefined}
              >
                <PsychologyIcon className="nav-icon" style={{ color: pathname === '/psychology' ? '#c084fc' : undefined }} />
                Psychology
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
      <header className="sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#070a12]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Mobile Brand & Desktop Breadcrumb / Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          {/* Mobile Logo Branding (visible on mobile < 768px) */}
          <div className="md:hidden flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <rect x="24" y="20" width="16" height="24" rx="3" fill="#10b981" />
              <path d="M12 48 L28 36 L44 42 L56 22" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-black tracking-tight text-white flex-shrink-0">
              Alpha<span className="text-indigo-400">Trader</span>
            </span>
          </div>

          {/* Desktop Page Title (from md: 768px up) */}
          <div className="hidden md:flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold text-white tracking-tight">
              {getPageTitle()}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 uppercase tracking-wider">
              AlphaTrader
            </span>
          </div>
        </div>

        {/* Right Section: Accounts & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Custom Account Dropdown */}
          <div ref={accountDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 text-slate-200 transition-all duration-200 cursor-pointer shadow-sm group flex-shrink-0"
              aria-label="Select Trading Account"
            >
              {/* Status Dot */}
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60 flex-shrink-0 animate-pulse" />
              
              {/* Account Label */}
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate max-w-[125px] xs:max-w-[155px] sm:max-w-[180px] md:max-w-[220px]">
                {activeAccountLabel}
              </span>

              {/* Capital badge on larger screens */}
              {activeAccount && activeAccount.startingCapital > 0 && (
                <span className="hidden md:inline-flex text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  ${(activeAccount.startingCapital / 1000).toFixed(0)}K
                </span>
              )}

              {/* Chevron Icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-slate-400 group-hover:text-white transition-transform duration-200 flex-shrink-0 ${isAccountDropdownOpen ? 'rotate-180 text-white' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Custom Popover Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 p-2 rounded-2xl bg-[#0b101d] border border-white/10 shadow-2xl shadow-black/95 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-1.5">
                  <span>Switch Trading Account</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[10px]">
                    {accounts.length} active
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {/* All Accounts Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId('all');
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedAccountId === 'all'
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                        ❖
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">All Accounts</div>
                        <div className="text-[10px] text-slate-400">Consolidated Portfolio</div>
                      </div>
                    </div>
                    {selectedAccountId === 'all' && (
                      <span className="text-xs text-indigo-400 font-bold ml-2">✓</span>
                    )}
                  </button>

                  {/* Individual Accounts */}
                  {accounts.map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setIsAccountDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : 'hover:bg-white/5 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
                            $
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{acc.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>{acc.firmName || 'Funded'}</span>
                              {acc.startingCapital > 0 && (
                                <span>· ${(acc.startingCapital / 1000).toFixed(0)}k</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-emerald-400 font-bold ml-2">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer: Manage Accounts Button */}
                <div className="pt-2 border-t border-white/5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      setIsAccountModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Manage Accounts</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear Button (Visible on sm+ screens, with smooth rotation hover) */}
          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-white items-center justify-center transition-all duration-150 cursor-pointer shadow-sm group flex-shrink-0"
            title="Manage Accounts & Prop Firms"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:rotate-45"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* User Profile Badge (Clickable to Settings) */}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 transition-all duration-150 cursor-pointer group flex-shrink-0"
            title="Profile & Settings"
          >
            <div className="w-6 h-6 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm shadow-indigo-600/30 flex-shrink-0">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-slate-300 group-hover:text-white truncate max-w-[120px]">
              {user?.email ? user.email.split('@')[0] : 'User'}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Perfectly Centered 2 + FAB + 2 (Hidden when modal is open) */}
      {!isAnyModalOpen && (
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
          
          {/* Floating Action Button (Dead Center) */}
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
            href="/psychology" 
            className={`bottom-nav-item ${pathname === '/psychology' ? 'active' : ''}`}
          >
            <PsychologyIcon className="bottom-nav-icon" />
            <span>Psych</span>
          </Link>
        </nav>
      )}

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

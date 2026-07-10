'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trade } from '@/lib/db';
import { Account } from '@/components/AccountManagerModal';
import toast from 'react-hot-toast';

interface AppContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authLoading: boolean;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  selectedAccountId: string;
  setSelectedAccountId: React.Dispatch<React.SetStateAction<string>>;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTrade: Trade | null;
  setSelectedTrade: React.Dispatch<React.SetStateAction<Trade | null>>;
  isDetailOpen: boolean;
  setIsDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingTrade: Trade | null;
  setEditingTrade: React.Dispatch<React.SetStateAction<Trade | null>>;
  isAddOpen: boolean;
  setIsAddOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEditOpen: boolean;
  setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentBalance: number;
  filteredTrades: Trade[];
  
  showToast: (message: string, type: 'success' | 'error') => void;
  fetchTrades: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  handleSaveTrade: (tradeData: any) => Promise<void>;
  handleDeleteTrade: (id: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleResetDb: () => Promise<void>;
  handleClearDb: () => Promise<void>;
  handleImportDb: (tradesToImport: Trade[]) => Promise<void>;
  
  // Navigation modal triggers
  handleOpenAddModal: () => void;
  handleCloseAddModal: () => void;
  handleOpenEditModal: (trade: Trade) => void;
  handleCloseEditModal: () => void;
  handleOpenDetailModal: (trade: Trade) => void;
  handleCloseDetailModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
        style: { background: '#ff3366', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#ff3366' }
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
    } else {
      setTrades([]);
      setAccounts([]);
    }
  }, [fetchTrades, fetchAccounts, user]);

  // Save/Create/Update trade handler
  const handleSaveTrade = useCallback(async (tradeData: any) => {
    try {
      let res;
      if (editingTrade) {
        res = await fetch(`/api/trades/${editingTrade.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData)
        });
      } else {
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
        showToast('Database reset to demo trades.', 'success');
        fetchTrades();
        fetchAccounts();
      } else {
        showToast('Failed to reset database.', 'error');
      }
    } catch (error) {
      showToast('Error resetting database.', 'error');
    }
  }, [showToast, fetchTrades, fetchAccounts]);

  const handleClearDb = useCallback(async () => {
    try {
      const res = await fetch('/api/db?action=clear', { method: 'POST' });
      if (res.ok) {
        showToast('All trade history cleared.', 'success');
        fetchTrades();
        fetchAccounts();
      } else {
        showToast('Failed to clear database.', 'error');
      }
    } catch (error) {
      showToast('Error clearing database.', 'error');
    }
  }, [showToast, fetchTrades, fetchAccounts]);

  const handleImportDb = useCallback(async (tradesToImport: Trade[]) => {
    try {
      const res = await fetch('/api/db?action=import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradesToImport)
      });
      if (res.ok) {
        showToast('Trades data imported successfully!', 'success');
        fetchTrades();
        fetchAccounts();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to import data.', 'error');
      }
    } catch (error) {
      showToast('Error importing database files.', 'error');
    }
  }, [showToast, fetchTrades, fetchAccounts]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        showToast('Successfully signed out.', 'success');
      }
    } catch (err) {
      showToast('Error signing out.', 'error');
    }
  }, [showToast]);

  // Modal open/close controllers
  const handleOpenAddModal = useCallback(() => setIsAddOpen(true), []);
  const handleCloseAddModal = useCallback(() => setIsAddOpen(false), []);
  const handleOpenEditModal = useCallback((trade: Trade) => {
    setEditingTrade(trade);
    setIsEditOpen(true);
  }, []);
  const handleCloseEditModal = useCallback(() => {
    setEditingTrade(null);
    setIsEditOpen(false);
  }, []);
  const handleOpenDetailModal = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setIsDetailOpen(true);
  }, []);
  const handleCloseDetailModal = useCallback(() => {
    setSelectedTrade(null);
    setIsDetailOpen(false);
  }, []);

  // Memoized current balance & filter
  const currentAccount = accounts.find(a => a.id === selectedAccountId);
  const currentBalance = currentAccount ? currentAccount.startingCapital : (accounts.length > 0 ? accounts[0].startingCapital : 0);

  const filteredTrades = React.useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        trades,
        setTrades,
        loading,
        setLoading,
        accounts,
        setAccounts,
        selectedAccountId,
        setSelectedAccountId,
        isAccountModalOpen,
        setIsAccountModalOpen,
        selectedTrade,
        setSelectedTrade,
        isDetailOpen,
        setIsDetailOpen,
        editingTrade,
        setEditingTrade,
        isAddOpen,
        setIsAddOpen,
        isEditOpen,
        setIsEditOpen,
        currentBalance,
        filteredTrades,
        showToast,
        fetchTrades,
        fetchAccounts,
        handleSaveTrade,
        handleDeleteTrade,
        handleSignOut,
        handleResetDb,
        handleClearDb,
        handleImportDb,
        handleOpenAddModal,
        handleCloseAddModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleOpenDetailModal,
        handleCloseDetailModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

'use client';

import React, { useState } from 'react';
import { CloseIcon } from './Icons';

export interface Account {
  id: string;
  name: string;
  firmName?: string;
  startingCapital: number;
  createdAt?: string;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
}

function AccountManagerModal({
  isOpen,
  onClose,
  accounts,
  onAccountsChange
}: AccountManagerModalProps) {
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [startingCapital, setStartingCapital] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function startEdit(account: Account) {
    setEditingId(account.id);
    setName(account.name);
    setFirmName(account.firmName || '');
    setStartingCapital(account.startingCapital);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setFirmName('');
    setStartingCapital(0);
    setError('');
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/accounts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, firmName, startingCapital })
        });
        if (!res.ok) throw new Error('Failed to update account');
        const updated = await res.json();
        onAccountsChange(accounts.map(a => (a.id === editingId ? updated : a)));
      } else {
        // Create
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, firmName, startingCapital })
        });
        if (!res.ok) throw new Error('Failed to create account');
        const created = await res.json();
        onAccountsChange([...accounts, created]);
      }
      cancelEdit();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account? Trades will not be deleted.')) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onAccountsChange(accounts.filter(a => a.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { cancelEdit(); onClose(); } }}>
      <div className="modal-container account-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Manage Accounts</h2>
            <p className="modal-subtitle">Add and manage your prop firm trading accounts</p>
          </div>
          <button className="modal-close-btn" onClick={() => { cancelEdit(); onClose(); }}>
            <CloseIcon />
          </button>
        </div>

        <div className="account-modal-body">
          {/* Accounts List */}
          <div className="account-list">
            {accounts.length === 0 && (
              <div className="account-empty">
                <span className="account-empty-icon">🏦</span>
                <p>No accounts yet. Add your first prop firm account below.</p>
              </div>
            )}
            {accounts.map(account => (
              <div
                key={account.id}
                className={`account-card ${editingId === account.id ? 'account-card--editing' : ''}`}
              >
                <div className="account-card-info">
                  <div className="account-card-name">{account.name}</div>
                  {account.firmName && (
                    <div className="account-card-firm">{account.firmName}</div>
                  )}
                  <div className="account-card-capital">
                    ${account.startingCapital.toLocaleString()} starting capital
                  </div>
                </div>
                <div className="account-card-actions">
                  <button
                    className="account-btn account-btn--edit"
                    onClick={() => startEdit(account)}
                    title="Edit account"
                  >
                    ✏️
                  </button>
                  <button
                    className="account-btn account-btn--delete"
                    onClick={() => handleDelete(account.id)}
                    title="Delete account"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="account-form">
            <h3 className="account-form-title">
              {editingId ? 'Edit Account' : 'Add New Account'}
            </h3>
            {error && <div className="account-form-error">{error}</div>}

            <div className="account-form-grid">
              <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Main FTMO, Challenge 1"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Firm / Broker</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. FTMO, MyForexFunds"
                  value={firmName}
                  onChange={e => setFirmName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Starting Capital ($)</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder="0"
                  value={startingCapital}
                  onChange={e => setStartingCapital(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="account-form-actions">
              {editingId && (
                <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountManagerModal;

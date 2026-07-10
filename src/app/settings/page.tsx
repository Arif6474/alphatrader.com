'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import ProfileView from '@/components/ProfileView';

export default function SettingsPage() {
  const { 
    filteredTrades, 
    user, 
    handleSignOut, 
    handleResetDb, 
    handleClearDb, 
    handleImportDb, 
    showToast 
  } = useApp();

  return (
    <ProfileView
      trades={filteredTrades}
      user={user}
      onSignOut={handleSignOut}
      onResetDb={handleResetDb}
      onClearDb={handleClearDb}
      onImportDb={handleImportDb}
      onShowToast={showToast}
    />
  );
}

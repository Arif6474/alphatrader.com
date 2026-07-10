'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardView from '@/components/DashboardView';

export default function Home() {
  const router = useRouter();
  const { filteredTrades, handleOpenDetailModal } = useApp();

  const handleNavigate = (view: string) => {
    if (view === 'trades') {
      router.push('/trades');
    } else if (view === 'analytics') {
      router.push('/analytics');
    } else if (view === 'profile') {
      router.push('/settings');
    }
  };

  return (
    <DashboardView 
      trades={filteredTrades} 
      onViewTrade={handleOpenDetailModal}
      onNavigate={handleNavigate}
    />
  );
}

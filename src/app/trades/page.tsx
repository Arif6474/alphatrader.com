'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import TradesView from '@/components/TradesView';

export default function TradesPage() {
  const { filteredTrades, handleOpenDetailModal, handleOpenAddModal } = useApp();

  return (
    <TradesView
      trades={filteredTrades}
      onViewTrade={handleOpenDetailModal}
      onOpenNewTrade={handleOpenAddModal}
    />
  );
}

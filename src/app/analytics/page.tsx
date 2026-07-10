'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import AnalyticsView from '@/components/AnalyticsView';

export default function AnalyticsPage() {
  const { filteredTrades } = useApp();

  return <AnalyticsView trades={filteredTrades} />;
}

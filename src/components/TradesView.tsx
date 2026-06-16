import React, { useState } from 'react';
import { Trade } from '@/lib/db';
import { SearchIcon, TradesIcon } from './Icons';

interface TradesViewProps {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onOpenNewTrade: () => void;
}

type DirectionFilter = 'All' | 'Long' | 'Short';
type StatusFilter = 'All' | 'Win' | 'Loss' | 'Active';

function TradesView({ trades, onViewTrade, onOpenNewTrade }: TradesViewProps) {
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  // Filter trades based on search, direction, and status
  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = 
        t.pair.toLowerCase().includes(search.toLowerCase()) ||
        t.strategy.toLowerCase().includes(search.toLowerCase()) ||
        (t.entryReason && t.entryReason.toLowerCase().includes(search.toLowerCase())) ||
        (t.lessonsLearned && t.lessonsLearned.toLowerCase().includes(search.toLowerCase()));
      
      const matchesDirection = directionFilter === 'All' || t.direction === directionFilter;
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchesSearch && matchesDirection && matchesStatus;
    });
  }, [trades, search, directionFilter, statusFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Trade Directory</h1>
        <p className="page-subtitle">Browse, search, and analyze your individual trades.</p>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="filter-search-container">
        <div className="search-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            className="input-control search-input"
            placeholder="Search by pair, strategy, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Direction Filters */}
        <div className="filter-pills-row">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '6px' }}>
            Direction:
          </span>
          {(['All', 'Long', 'Short'] as DirectionFilter[]).map((dir) => (
            <button
              key={dir}
              className={`pill-option ${directionFilter === dir ? 'selected' : ''}`}
              onClick={() => setDirectionFilter(dir)}
            >
              {dir}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="filter-pills-row">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '16px' }}>
            Result:
          </span>
          {(['All', 'Win', 'Loss', 'Active'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              className={`pill-option ${
                statusFilter === status 
                  ? `selected ${status === 'Win' ? 'positive' : status === 'Loss' ? 'negative' : ''}` 
                  : ''
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Trades List */}
      <div className="trades-list">
        {filteredTrades.length > 0 ? (
          filteredTrades.map((t) => (
            <div
              key={t.id}
              className="trade-item-card"
              onClick={() => onViewTrade(t)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`trade-direction-pill ${t.direction.toLowerCase()}`}>
                <span>{t.direction}</span>
                <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>{t.orderType}</span>
              </div>
              
              <div className="trade-info">
                <div className="trade-header-row">
                  <span className="trade-pair">{t.pair}</span>
                  <span className="trade-strategy">{t.strategy}</span>
                </div>
                <div className="trade-meta-row">
                  <span>{formatDate(t.entryDate)}</span>
                  <span>Lot: {t.lotSize}</span>
                  <span>Entry: {t.entryPrice}</span>
                </div>
              </div>

              <div className="trade-pnl-section">
                <span className={`trade-pnl ${t.status.toLowerCase()}`}>
                  {t.closed ? (
                    `${t.pnl && t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl || 0)}`
                  ) : (
                    'Active'
                  )}
                </span>
                {t.closed && (
                  <span className="trade-rr-ratio">
                    {((t.pnl || 0) / (t.riskAmount || 1)).toFixed(1)}R
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <TradesIcon className="empty-state-icon" />
            <p className="empty-state-title">No trades found</p>
            <p className="empty-state-desc">
              {trades.length === 0 
                ? "You haven't logged any trades yet."
                : "No trades match your search filters."}
            </p>
            {trades.length === 0 && (
              <button className="btn btn-primary" onClick={onOpenNewTrade}>
                Add Your First Trade
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(TradesView);

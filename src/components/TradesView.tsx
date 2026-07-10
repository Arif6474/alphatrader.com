import React, { useState } from 'react';
import { Trade } from '@/lib/db';
import { SearchIcon, TradesIcon, PlusIcon } from './Icons';

interface TradesViewProps {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onOpenNewTrade: () => void;
}

type DirectionFilter = 'All' | 'Long' | 'Short';
type StatusFilter = 'All' | 'Win' | 'Loss' | 'Active';
type TabType = 'all' | 'active' | 'closed' | 'gallery';
type AssetFilterType = 'All' | 'Forex' | 'Crypto' | 'Stock' | 'Futures';
type SortByType = 'newest' | 'oldest' | 'pnl_high' | 'pnl_low' | 'rr_high';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const FilterIcon = ({ size = 16, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);


function TradesView({ trades, onViewTrade, onOpenNewTrade }: TradesViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [assetFilter, setAssetFilter] = useState<AssetFilterType>('All');
  const [sessionFilter, setSessionFilter] = useState<string>('All');
  const [strategyFilter, setStrategyFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortByType>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique strategies and sessions dynamically from trades
  const uniqueStrategies = React.useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(t => {
      if (t.strategy) {
        strategies.add(t.strategy);
      }
    });
    return Array.from(strategies).sort();
  }, [trades]);

  const uniqueSessions = React.useMemo(() => {
    const sessions = new Set<string>();
    trades.forEach(t => {
      if (t.session) {
        sessions.add(t.session);
      }
    });
    return Array.from(sessions).sort();
  }, [trades]);

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearch('');
    setDirectionFilter('All');
    setStatusFilter('All');
    setAssetFilter('All');
    setSessionFilter('All');
    setStrategyFilter('All');
    setSortBy('newest');
  };

  // Filter & sort trades
  const filteredTrades = React.useMemo(() => {
    let result = trades.filter(t => {
      // Tab Category Filtering
      if (activeTab === 'active' && t.closed) return false;
      if (activeTab === 'closed' && !t.closed) return false;
      if (activeTab === 'gallery' && !t.chartBefore && !t.chartAfter) return false;

      // Text Search
      const matchesSearch = 
        t.pair.toLowerCase().includes(search.toLowerCase()) ||
        t.strategy.toLowerCase().includes(search.toLowerCase()) ||
        (t.entryReason && t.entryReason.toLowerCase().includes(search.toLowerCase())) ||
        (t.lessonsLearned && t.lessonsLearned.toLowerCase().includes(search.toLowerCase())) ||
        (t.broker && t.broker.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      // Direction Filter
      const matchesDirection = directionFilter === 'All' || t.direction === directionFilter;
      if (!matchesDirection) return false;

      // Status/Result Filter
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      if (!matchesStatus) return false;

      // Asset Class Filter
      const matchesAsset = assetFilter === 'All' || t.assetType === assetFilter;
      if (!matchesAsset) return false;

      // Session Filter
      const matchesSession = sessionFilter === 'All' || t.session === sessionFilter;
      if (!matchesSession) return false;

      // Strategy Filter
      const matchesStrategy = strategyFilter === 'All' || t.strategy === strategyFilter;
      if (!matchesStrategy) return false;

      return true;
    });

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      }
      if (sortBy === 'pnl_high') {
        return (b.pnl || 0) - (a.pnl || 0);
      }
      if (sortBy === 'pnl_low') {
        return (a.pnl || 0) - (b.pnl || 0);
      }
      if (sortBy === 'rr_high') {
        const rrA = a.riskAmount > 0 ? (a.pnl || 0) / a.riskAmount : 0;
        const rrB = b.riskAmount > 0 ? (b.pnl || 0) / b.riskAmount : 0;
        return rrB - rrA;
      }
      return 0;
    });
  }, [trades, activeTab, search, directionFilter, statusFilter, assetFilter, sessionFilter, strategyFilter, sortBy]);

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

  // Helper check if advanced filters are dirty (changed from default)
  const isFiltersDirty = 
    search !== '' ||
    directionFilter !== 'All' ||
    statusFilter !== 'All' ||
    assetFilter !== 'All' ||
    sessionFilter !== 'All' ||
    strategyFilter !== 'All' ||
    sortBy !== 'newest';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Trade Directory</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Browse, search, and analyze your individual trades.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={onOpenNewTrade}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <PlusIcon size={16} />
          <span>Add New Trade</span>
        </button>
      </div>

      {/* Directory Tab Selector */}
      <div className="directory-tabs">
        <button
          className={`directory-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 All Trades ({trades.length})
        </button>
        <button
          className={`directory-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          ⚡ Active Positions ({trades.filter(t => !t.closed).length})
        </button>
        <button
          className={`directory-tab ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          🏁 History ({trades.filter(t => t.closed).length})
        </button>
        <button
          className={`directory-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          🖼️ Chart Gallery ({trades.filter(t => t.chartBefore || t.chartAfter).length})
        </button>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="filter-search-container">
        <div className="directory-filters-primary">
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

          {/* Advanced Filter Toggle Button */}
          <button 
            type="button"
            className={`advanced-filters-btn ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <FilterIcon />
            <span>Filters & Sort</span>
          </button>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showAdvanced && (
          <div className="advanced-filters-panel">
            <div className="filters-grid">
              {/* Direction Filter */}
              <div className="filter-group">
                <span className="filter-label">Direction</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['All', 'Long', 'Short'] as DirectionFilter[]).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      className={`pill-option ${directionFilter === dir ? 'selected' : ''}`}
                      onClick={() => setDirectionFilter(dir)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="filter-group">
                <span className="filter-label">Result</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['All', 'Win', 'Loss', 'Active'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`pill-option ${
                        statusFilter === status 
                          ? `selected ${status === 'Win' ? 'positive' : status === 'Loss' ? 'negative' : ''}` 
                          : ''
                      }`}
                      onClick={() => setStatusFilter(status)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Class Filter */}
              <div className="filter-group">
                <span className="filter-label">Asset Class</span>
                <select
                  className="input-control"
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value as AssetFilterType)}
                  style={{ height: '36px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Assets</option>
                  <option value="Forex">Forex</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Stock">Stocks</option>
                  <option value="Futures">Futures</option>
                </select>
              </div>

              {/* Strategy Filter */}
              <div className="filter-group">
                <span className="filter-label">Strategy</span>
                <select
                  className="input-control"
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Strategies</option>
                  {uniqueStrategies.map(strat => (
                    <option key={strat} value={strat}>{strat}</option>
                  ))}
                </select>
              </div>

              {/* Session Filter */}
              <div className="filter-group">
                <span className="filter-label">Trading Session</span>
                <select
                  className="input-control"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Sessions</option>
                  {uniqueSessions.map(sess => (
                    <option key={sess} value={sess}>{sess}</option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="filter-group">
                <span className="filter-label">Sort By</span>
                <select
                  className="input-control"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortByType)}
                  style={{ height: '36px', fontSize: '0.8rem' }}
                >
                  <option value="newest">Newest Entry</option>
                  <option value="oldest">Oldest Entry</option>
                  <option value="pnl_high">Highest Profit (PnL)</option>
                  <option value="pnl_low">Lowest Profit (PnL)</option>
                  <option value="rr_high">Highest Risk Reward (R)</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {isFiltersDirty && (
              <button 
                type="button" 
                className="clear-filters-btn" 
                onClick={handleClearFilters}
              >
                Reset All Filters ↺
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trades Tab Views Rendering */}
      {activeTab === 'gallery' ? (
        /* Chart Gallery Grid Rendering */
        <div className="gallery-grid">
          {filteredTrades.length > 0 ? (
            filteredTrades.map((t) => {
              const displayChart = t.chartBefore || t.chartAfter || '';
              return (
                <div 
                  key={t.id} 
                  className="gallery-card"
                  onClick={() => onViewTrade(t)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="gallery-image-wrapper">
                    <img 
                      src={displayChart} 
                      alt={`${t.pair} Chart Setup`} 
                      className="gallery-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="gallery-card-content">
                    <div className="gallery-card-header">
                      <span className="gallery-card-pair">{t.pair}</span>
                      <span className="gallery-card-strategy">{t.strategy}</span>
                    </div>
                    <div className="gallery-card-meta">
                      <span>{formatDate(t.entryDate)}</span>
                      <span>Lot: {t.lotSize}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className={`trade-direction-pill ${t.direction.toLowerCase()}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                        {t.direction}
                      </span>
                      <span className={`gallery-card-pnl ${t.status.toLowerCase()}`}>
                        {t.closed ? (
                          `${t.pnl && t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl || 0)}`
                        ) : (
                          'Active'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <TradesIcon className="empty-state-icon" />
              <p className="empty-state-title">No charts found</p>
              <p className="empty-state-desc">
                {trades.filter(t => t.chartBefore || t.chartAfter).length === 0
                  ? "You haven't attached any chart screenshots to your trades yet."
                  : "No chart screenshots match your active search filters."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Standard List View Rendering */
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
      )}
    </div>
  );
}

export default React.memo(TradesView);

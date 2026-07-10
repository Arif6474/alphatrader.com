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

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
  </svg>
);

function TradesView({ trades, onViewTrade, onOpenNewTrade }: TradesViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [assetFilter, setAssetFilter] = useState<AssetFilterType>('All');
  const [sessionFilter, setSessionFilter] = useState<string>('All');
  const [strategyFilter, setStrategyFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortByType>('newest');

  const uniqueStrategies = React.useMemo(() => {
    const s = new Set<string>();
    trades.forEach(t => { if (t.strategy) s.add(t.strategy); });
    return Array.from(s).sort();
  }, [trades]);

  const uniqueSessions = React.useMemo(() => {
    const s = new Set<string>();
    trades.forEach(t => { if (t.session) s.add(t.session); });
    return Array.from(s).sort();
  }, [trades]);

  const handleClearFilters = () => {
    setSearch(''); setDirectionFilter('All'); setStatusFilter('All');
    setAssetFilter('All'); setSessionFilter('All'); setStrategyFilter('All'); setSortBy('newest');
  };

  const isFiltersDirty = search !== '' || directionFilter !== 'All' || statusFilter !== 'All' ||
    assetFilter !== 'All' || sessionFilter !== 'All' || strategyFilter !== 'All' || sortBy !== 'newest';

  const filteredTrades = React.useMemo(() => {
    let result = trades.filter(t => {
      if (activeTab === 'active' && t.closed) return false;
      if (activeTab === 'closed' && !t.closed) return false;
      if (activeTab === 'gallery' && !t.chartBefore && !t.chartAfter) return false;
      const q = search.toLowerCase();
      const matchSearch = !q || t.pair.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q) ||
        (t.entryReason && t.entryReason.toLowerCase().includes(q)) ||
        (t.lessonsLearned && t.lessonsLearned.toLowerCase().includes(q));
      if (!matchSearch) return false;
      if (directionFilter !== 'All' && t.direction !== directionFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (assetFilter !== 'All' && t.assetType !== assetFilter) return false;
      if (sessionFilter !== 'All' && t.session !== sessionFilter) return false;
      if (strategyFilter !== 'All' && t.strategy !== strategyFilter) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      if (sortBy === 'oldest') return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      if (sortBy === 'pnl_high') return (b.pnl || 0) - (a.pnl || 0);
      if (sortBy === 'pnl_low') return (a.pnl || 0) - (b.pnl || 0);
      if (sortBy === 'rr_high') {
        const rrA = a.riskAmount > 0 ? (a.pnl || 0) / a.riskAmount : 0;
        const rrB = b.riskAmount > 0 ? (b.pnl || 0) / b.riskAmount : 0;
        return rrB - rrA;
      }
      return 0;
    });
  }, [trades, activeTab, search, directionFilter, statusFilter, assetFilter, sessionFilter, strategyFilter, sortBy]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabCounts = {
    all: trades.length,
    active: trades.filter(t => !t.closed).length,
    closed: trades.filter(t => t.closed).length,
    gallery: trades.filter(t => t.chartBefore || t.chartAfter).length,
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>Trade Directory</h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0 0' }}>Browse, filter, and analyze every position you&apos;ve taken.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewTrade}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}>
          <PlusIcon size={15} />
          <span>Add New Trade</span>
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
        {(['all', 'active', 'closed', 'gallery'] as TabType[]).map(tab => {
          const labels: Record<TabType, string> = { all: '📋 All', active: '⚡ Active', closed: '🏁 History', gallery: '🖼️ Gallery' };
          const count = tabCounts[tab];
          return (
            <button key={tab} type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s ease',
                background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === tab ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none',
              }}>
              {labels[tab]}
              <span style={{
                marginLeft: '6px', padding: '1px 7px', borderRadius: '20px', fontSize: '0.68rem',
                background: activeTab === tab ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Toolbar */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px',
      }}>
        {/* Search input */}
        <div className="search-wrapper" style={{ flex: 1 }}>
          <SearchIcon className="search-icon" />
          <input type="text" className="input-control search-input"
            placeholder="Search pair, strategy, notes…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px', background: 'rgba(10,12,22,0.7)' }}
          />
        </div>

        {/* Sort selector */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortByType)}
          style={{
            height: '42px', paddingInline: '12px 30px', fontSize: '0.78rem', borderRadius: '10px',
            background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer',
            appearance: 'none', fontWeight: 600,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px',
            flexShrink: 0,
          }}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="pnl_high">Best PnL</option>
          <option value="pnl_low">Worst PnL</option>
          <option value="rr_high">Best R:R</option>
        </select>

        {/* Filter Toggle Icon Button */}
        <button
          type="button"
          onClick={() => setShowFilters(p => !p)}
          title="Toggle filters"
          style={{
            width: '42px', height: '42px', borderRadius: '10px', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            flexShrink: 0, transition: 'all 0.2s ease',
            background: showFilters || isFiltersDirty ? 'rgba(99,102,241,0.18)' : 'rgba(10,12,22,0.7)',
            boxShadow: showFilters || isFiltersDirty ? 'inset 0 0 0 1.5px rgba(99,102,241,0.5)' : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
            color: showFilters || isFiltersDirty ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
            position: 'relative',
          }}
        >
          {/* Filter funnel icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {/* Active indicator dot */}
          {isFiltersDirty && (
            <span style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--color-primary)', border: '1.5px solid #07090e',
            }} />
          )}
        </button>

        {/* Reset button — only when filters active */}
        {isFiltersDirty && (
          <button type="button" onClick={handleClearFilters}
            style={{
              height: '42px', padding: '0 14px', fontSize: '0.72rem', borderRadius: '10px',
              border: '1px solid rgba(255,51,102,0.3)',
              background: 'rgba(255,51,102,0.08)', color: 'var(--color-danger)',
              cursor: 'pointer', fontWeight: 700, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Results count row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: showFilters ? '0' : '16px', minHeight: '20px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{filteredTrades.length}</span> of {trades.length} trades
        </span>
        {isFiltersDirty && (
          <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(99,102,241,0.2)' }}>
            Filtered
          </span>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div style={{
          background: 'rgba(10,12,22,0.8)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '14px', padding: '18px 20px', marginBottom: '16px',
          backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-hover)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Filter Options</span>
            <button type="button" onClick={() => setShowFilters(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '2px 6px' }}>
              ✕
            </button>
          </div>

          {/* Row 1: Direction + Result pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Direction</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['All', 'Long', 'Short'] as DirectionFilter[]).map(d => (
                  <button key={d} type="button" onClick={() => setDirectionFilter(d)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                      background: directionFilter === d
                        ? (d === 'Long' ? 'rgba(16,185,129,0.15)' : d === 'Short' ? 'rgba(255,51,102,0.15)' : 'rgba(99,102,241,0.2)')
                        : 'rgba(255,255,255,0.03)',
                      color: directionFilter === d
                        ? (d === 'Long' ? 'var(--color-success)' : d === 'Short' ? 'var(--color-danger)' : 'var(--color-primary-hover)')
                        : 'var(--text-muted)',
                      boxShadow: directionFilter === d
                        ? `inset 0 0 0 1px ${d === 'Long' ? 'rgba(16,185,129,0.4)' : d === 'Short' ? 'rgba(255,51,102,0.4)' : 'rgba(99,102,241,0.4)'}`
                        : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'all 0.15s',
                    }}>{d}</button>
                ))}
              </div>
            </div>

            <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)', alignSelf: 'stretch' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Result</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['All', 'Win', 'Loss', 'Active'] as StatusFilter[]).map(s => (
                  <button key={s} type="button" onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                      background: statusFilter === s
                        ? (s === 'Win' ? 'rgba(16,185,129,0.15)' : s === 'Loss' ? 'rgba(255,51,102,0.15)' : s === 'Active' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.2)')
                        : 'rgba(255,255,255,0.03)',
                      color: statusFilter === s
                        ? (s === 'Win' ? 'var(--color-success)' : s === 'Loss' ? 'var(--color-danger)' : s === 'Active' ? 'var(--color-warning)' : 'var(--color-primary-hover)')
                        : 'var(--text-muted)',
                      boxShadow: statusFilter === s
                        ? `inset 0 0 0 1px ${s === 'Win' ? 'rgba(16,185,129,0.4)' : s === 'Loss' ? 'rgba(255,51,102,0.4)' : s === 'Active' ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)'}`
                        : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'all 0.15s',
                    }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Dropdown selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Asset Class', value: assetFilter, onChange: (v: string) => setAssetFilter(v as AssetFilterType), options: [['All', 'All Assets'], ['Forex', 'Forex'], ['Crypto', 'Crypto'], ['Stock', 'Stocks'], ['Futures', 'Futures']] },
              { label: 'Strategy', value: strategyFilter, onChange: setStrategyFilter, options: [['All', 'All Strategies'], ...uniqueStrategies.map(s => [s, s])] },
              { label: 'Session', value: sessionFilter, onChange: setSessionFilter, options: [['All', 'All Sessions'], ...uniqueSessions.map(s => [s, s])] },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
                <select value={value} onChange={e => onChange(e.target.value)}
                  style={{
                    height: '38px', paddingInline: '12px 28px', fontSize: '0.78rem', borderRadius: '8px',
                    background: value !== 'All' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                    border: value !== 'All' ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: value !== 'All' ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                    outline: 'none', cursor: 'pointer', appearance: 'none', fontWeight: 600,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center', backgroundSize: '13px',
                    width: '100%',
                  }}>
                  {options.map(([val, lbl]) => (
                    <option key={val} value={val} style={{ background: '#0a0c16' }}>{lbl}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade List / Gallery */}
      {activeTab === 'gallery' ? (
        <div className="gallery-grid">
          {filteredTrades.length > 0 ? filteredTrades.map(t => {
            const displayChart = t.chartBefore || t.chartAfter || '';
            return (
              <div key={t.id} className="gallery-card" onClick={() => onViewTrade(t)} style={{ cursor: 'pointer' }}>
                <div className="gallery-image-wrapper">
                  <img src={displayChart} alt={`${t.pair} Chart`} className="gallery-image" loading="lazy" />
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
                    <span className={`trade-direction-pill ${t.direction.toLowerCase()}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{t.direction}</span>
                    <span className={`gallery-card-pnl ${t.status.toLowerCase()}`}>
                      {t.closed ? `${(t.pnl || 0) >= 0 ? '+' : ''}${formatCurrency(t.pnl || 0)}` : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <TradesIcon className="empty-state-icon" />
              <p className="empty-state-title">No charts found</p>
              <p className="empty-state-desc">Attach chart screenshots when logging trades to see them here.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTrades.length > 0 ? filteredTrades.map(t => {
            const pnl = t.pnl || 0;
            const rr = t.riskAmount > 0 ? pnl / t.riskAmount : 0;
            const isWin = t.status === 'Win';
            const isLoss = t.status === 'Loss';

            return (
              <div key={t.id} onClick={() => onViewTrade(t)}
                style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center',
                  padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                  background: 'rgba(10,12,22,0.6)', border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.2s ease',
                  borderLeft: `3px solid ${isWin ? 'var(--color-success)' : isLoss ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(255,255,255,0.03)';
                  el.style.borderColor = isWin ? 'rgba(16,185,129,0.35)' : isLoss ? 'rgba(255,51,102,0.35)' : 'rgba(245,158,11,0.35)';
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(10,12,22,0.6)';
                  el.style.borderColor = 'rgba(255,255,255,0.04)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                {/* Direction Badge */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1px', flexShrink: 0,
                  background: t.direction === 'Long' ? 'rgba(16,185,129,0.1)' : 'rgba(255,51,102,0.1)',
                  border: `1px solid ${t.direction === 'Long' ? 'rgba(16,185,129,0.2)' : 'rgba(255,51,102,0.2)'}`,
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: t.direction === 'Long' ? 'var(--color-success)' : 'var(--color-danger)', letterSpacing: '0.3px' }}>
                    {t.direction.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t.orderType}
                  </span>
                </div>

                {/* Main Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>{t.pair}</span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-hover)',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}>{t.strategy}</span>
                    {!t.closed && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{formatDate(t.entryDate)}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lot: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.lotSize}</span></span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Entry: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.entryPrice}</span></span>
                    {t.session && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {t.session}</span>
                    )}
                  </div>
                </div>

                {/* PnL & RR */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {t.closed ? (
                    <>
                      <div style={{
                        fontSize: '1.05rem', fontWeight: 800,
                        color: isWin ? 'var(--color-success)' : 'var(--color-danger)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 700, marginTop: '3px',
                        color: rr >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(255,51,102,0.7)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {rr >= 0 ? '+' : ''}{rr.toFixed(1)}R
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)', background: 'rgba(245,158,11,0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                      OPEN
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <TradesIcon className="empty-state-icon" />
              <p className="empty-state-title">No trades found</p>
              <p className="empty-state-desc">
                {trades.length === 0 ? "You haven't logged any trades yet." : "No trades match your active filters."}
              </p>
              {trades.length === 0 && <button className="btn btn-primary" onClick={onOpenNewTrade}>Log Your First Trade</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(TradesView);

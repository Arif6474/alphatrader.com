import React, { useState } from 'react';
import { Trade } from '@/lib/db';
import { DashboardIcon, TradesIcon, AnalyticsIcon } from './Icons';

interface DashboardViewProps {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onNavigate: (view: string) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

function DashboardView({ trades, onViewTrade, onNavigate }: DashboardViewProps) {
  const [activeTooltip, setActiveTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  const {
    closedTrades,
    activeTrades,
    netPnl,
    winRate,
    avgRR,
    profitFactor,
    expectancy,
    maxDrawdown,
    balanceHistory,
    points,
    linePath,
    areaPath,
    recentTrades
  } = React.useMemo(() => {
    const closedTrades = trades.filter(t => t.closed);
    const activeTrades = trades.filter(t => !t.closed);
    
    // Calculate P&L
    const netPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Calculate Gross Profit, Gross Loss & Profit Factor
    const grossProfit = closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(closedTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '∞' : '0.00');

    // Calculate Expectancy
    const winTrades = closedTrades.filter(t => t.status === 'Win');
    const lossTrades = closedTrades.filter(t => t.status === 'Loss');
    const winRate = closedTrades.length > 0 ? Math.round((winTrades.length / closedTrades.length) * 100) : 0;
    
    const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;
    const expectancy = ((winRate / 100) * avgWin) - (((100 - winRate) / 100) * avgLoss);

    // Calculate Avg RR (Realized R-Multiple)
    const rMultiples = closedTrades.map(t => (t.pnl || 0) / (t.riskAmount || 1));
    const avgRR = rMultiples.length > 0
      ? (rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length).toFixed(2)
      : '0.00';

    // Start with 0 (starting balance) or the balance of the first trade minus its pnl
    const startBalance = trades.length > 0 ? trades[trades.length - 1].accountBalance : 0;
    
    const balanceHistory = [{ balance: startBalance, date: 'Start' }];
    
    // We sort trades chronologically (oldest first) to build the equity curve
    const chronoTrades = [...closedTrades].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    let currentBalance = startBalance;
    let peakBalance = startBalance;
    let maxDrawdown = 0;

    chronoTrades.forEach(t => {
      currentBalance += (t.pnl || 0);
      if (currentBalance > peakBalance) peakBalance = currentBalance;
      
      const currentDrawdown = peakBalance > 0 ? ((peakBalance - currentBalance) / peakBalance) * 100 : 0;
      if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

      balanceHistory.push({
        balance: currentBalance,
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    });

    // SVG Chart Dimensions
    const chartWidth = 500;
    const chartHeight = 160;
    const paddingX = 40;
    const paddingY = 20;

    const minBal = Math.min(...balanceHistory.map(h => h.balance)) * 0.999;
    const maxBal = Math.max(...balanceHistory.map(h => h.balance)) * 1.001;
    const balRange = maxBal - minBal === 0 ? 1 : maxBal - minBal;

    const points = balanceHistory.map((h, i) => {
      const x = paddingX + (i / (balanceHistory.length - 1 || 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((h.balance - minBal) / balRange) * (chartHeight - paddingY * 2);
      return { x, y, balance: h.balance, label: h.date };
    });

    // Build SVG Path strings
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
    }

    const recentTrades = trades.slice(0, 3); // Already sorted desc

    return {
      closedTrades,
      activeTrades,
      netPnl,
      winRate,
      avgRR,
      profitFactor,
      expectancy,
      maxDrawdown,
      balanceHistory,
      points,
      linePath,
      areaPath,
      recentTrades
    };
  }, [trades]);

  const winTrades = React.useMemo(() => {
    return closedTrades.filter(t => t.status === 'Win');
  }, [closedTrades]);

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your trading performance at a glance.</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Card 1: Net P&L */}
        <div className="glass-panel metric-card success">
          <div className="metric-header">
            <span className="metric-label">Net Profit &amp; Loss</span>
            <div className="metric-icon-container">
              <TradesIcon size={16} />
            </div>
          </div>
          <div className={`metric-value ${netPnl >= 0 ? 'trend-up' : 'trend-down'}`}>
            {netPnl >= 0 ? '+' : ''}{formatCurrency(netPnl)}
          </div>
          <div className="metric-trend">
            <span className={netPnl >= 0 ? 'trend-up' : 'trend-down'}>
              {netPnl >= 0 ? '▲ Profit' : '▼ Loss'} this period
            </span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="glass-panel metric-card primary">
          <div className="metric-header">
            <span className="metric-label">Win Rate</span>
            <div className="metric-icon-container">
              <DashboardIcon size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-primary-hover)' }}>
            {winRate}%
          </div>
          <div className="metric-trend">
            <span>{winTrades.length} of {closedTrades.length} won</span>
          </div>
        </div>

        {/* Card 3: Profit Factor */}
        <div className={`glass-panel metric-card ${Number(profitFactor) >= 1.5 || profitFactor === '∞' ? 'success' : Number(profitFactor) >= 1.0 ? 'primary' : 'danger'}`}>
          <div className="metric-header">
            <span className="metric-label">Profit Factor</span>
            <div className="metric-icon-container">
              <AnalyticsIcon size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: Number(profitFactor) >= 1.5 || profitFactor === '∞' ? 'var(--color-success)' : Number(profitFactor) >= 1.0 ? 'var(--color-primary-hover)' : 'var(--color-danger)' }}>
            {profitFactor}
          </div>
          <div className="metric-trend">
            <span>Ratio of Gross Win/Loss</span>
          </div>
        </div>

        {/* Card 4: Expectancy */}
        <div className={`glass-panel metric-card ${expectancy >= 0 ? 'success' : 'danger'}`}>
          <div className="metric-header">
            <span className="metric-label">Expectancy</span>
            <div className="metric-icon-container">
              <AnalyticsIcon size={16} />
            </div>
          </div>
          <div className={`metric-value ${expectancy >= 0 ? 'trend-up' : 'trend-down'}`}>
            {expectancy >= 0 ? '+' : ''}{formatCurrency(expectancy)}
          </div>
          <div className="metric-trend">
            <span>Expected value per trade</span>
          </div>
        </div>

        {/* Card 5: Max Drawdown */}
        <div className="glass-panel metric-card danger">
          <div className="metric-header">
            <span className="metric-label">Max Drawdown</span>
            <div className="metric-icon-container">
              <AnalyticsIcon size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
            {maxDrawdown.toFixed(2)}%
          </div>
          <div className="metric-trend">
            <span>Peak-to-valley drawdown</span>
          </div>
        </div>

        {/* Card 6: Avg Realized RR */}
        <div className="glass-panel metric-card warning">
          <div className="metric-header">
            <span className="metric-label">Avg Realized RR</span>
            <div className="metric-icon-container">
              <AnalyticsIcon size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-warning)' }}>
            {avgRR}R
          </div>
          <div className="metric-trend">
            <span>Average return multiple</span>
          </div>
        </div>

        {/* Card 7: Total Trades */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Trades</span>
            <div className="metric-icon-container">
              <TradesIcon size={16} />
            </div>
          </div>
          <div className="metric-value">
            {trades.length}
          </div>
          <div className="metric-trend">
            <span>Closed &amp; active records</span>
          </div>
        </div>

        {/* Card 8: Active Trades */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Trades</span>
            <div className="metric-icon-container">
              <TradesIcon size={16} />
            </div>
          </div>
          <div className="metric-value">
            {activeTrades.length}
          </div>
          <div className="metric-trend">
            <span>Currently open positions</span>
          </div>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="dashboard-grid">
        {/* Equity Curve Widget */}
        <div className="glass-panel widget-card">
          <div className="widget-header">
            <div>
              <h2 className="widget-title">
                <AnalyticsIcon size={18} style={{ color: 'var(--color-primary)' }} />
                Performance Curve
              </h2>
              <span className="widget-subtitle">Cumulative account growth over time</span>
            </div>
            <div className="account-balance" style={{ fontSize: '1.1rem' }}>
              {formatCurrency(balanceHistory[balanceHistory.length - 1].balance)}
            </div>
          </div>

          <div className="chart-container">
            {points.length > 1 ? (
              <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-gradient-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                  <linearGradient id="chart-gradient-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} className="grid-line" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} className="grid-line" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} className="grid-line" />

                {/* Area under the line */}
                <path d={areaPath} className="chart-area" />

                {/* The main line path */}
                <path d={linePath} className="chart-line" />

                {/* Dots on line */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={activeTooltip?.x === p.x ? 6 : 4}
                    fill={activeTooltip?.x === p.x ? '#00f2fe' : 'var(--color-primary)'}
                    className="chart-dot"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                      if (parentRect) {
                        setActiveTooltip({
                          x: p.x,
                          y: p.y,
                          val: p.balance,
                          label: p.label
                        });
                      }
                    }}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                ))}
              </svg>
            ) : (
              <div className="empty-state" style={{ height: '100%', margin: 0, padding: '20px' }}>
                <p className="empty-state-title">No chart data yet</p>
                <p className="empty-state-desc">Log your first closed trade to see the equity curve.</p>
              </div>
            )}

            {/* Custom Tooltip */}
            {activeTooltip && (
              <div 
                className="chart-tooltip" 
                style={{ 
                  left: `${(activeTooltip.x / chartWidth) * 100}%`, 
                  top: `${(activeTooltip.y / chartHeight) * 100}%` 
                }}
              >
                <div><strong>{activeTooltip.label}</strong></div>
                <div style={{ color: 'var(--color-success)', marginTop: '4px' }}>
                  {formatCurrency(activeTooltip.val)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades Widget */}
        <div className="glass-panel widget-card">
          <div className="widget-header">
            <h2 className="widget-title">
              <TradesIcon size={18} style={{ color: 'var(--color-success)' }} />
              Recent Trades
            </h2>
            <button className="view-all-link" onClick={() => onNavigate('trades')}>
              View All &rarr;
            </button>
          </div>

          <div className="trades-list">
            {recentTrades.length > 0 ? (
              recentTrades.map((t) => (
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
                      <span>{new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>Lot: {t.lotSize}</span>
                    </div>
                  </div>

                  <div className="trade-pnl-section">
                    <span className={`trade-pnl ${t.status.toLowerCase()}`}>
                      {t.closed ? (
                        `${t.pnl && t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}`
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
              <div className="empty-state" style={{ margin: 0 }}>
                <p className="empty-state-title">No trades logged</p>
                <p className="empty-state-desc">Click the + button below or at the bottom to add a trade.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardView);

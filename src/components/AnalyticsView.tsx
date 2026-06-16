import React from 'react';
import { Trade } from '@/lib/db';
import { AnalyticsIcon } from './Icons';

interface AnalyticsViewProps {
  trades: Trade[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

function AnalyticsView({ trades }: AnalyticsViewProps) {
  const {
    closedTrades,
    winTrades,
    lossTrades,
    totalTradesCount,
    winRate,
    totalProfit,
    totalLoss,
    profitFactor,
    avgWin,
    avgLoss,
    expectancyRatio,
    strategyList,
    pairList,
    factorList,
    maxStrategyPnl,
    maxPairPnl,
    maxFactorPnl
  } = React.useMemo(() => {
    const closedTrades = trades.filter(t => t.closed);
    const winTrades = closedTrades.filter(t => t.status === 'Win');
    const lossTrades = closedTrades.filter(t => t.status === 'Loss');
    
    // Basic Stats
    const totalTradesCount = closedTrades.length;
    const winRate = totalTradesCount > 0 ? Math.round((winTrades.length / totalTradesCount) * 100) : 0;
    
    const totalProfit = winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLoss = Math.abs(lossTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : totalProfit > 0 ? '∞' : '0.00';
    
    const avgWin = winTrades.length > 0 ? totalProfit / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? totalLoss / lossTrades.length : 0;
    const expectancyRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '0.00';

    // 1. Calculate Strategy Performance (PnL and Win Rate)
    const strategyStats: { [key: string]: { pnl: number; count: number; wins: number } } = {};
    closedTrades.forEach(t => {
      const strat = t.strategy || 'Other';
      if (!strategyStats[strat]) {
        strategyStats[strat] = { pnl: 0, count: 0, wins: 0 };
      }
      strategyStats[strat].pnl += (t.pnl || 0);
      strategyStats[strat].count += 1;
      if (t.status === 'Win') {
        strategyStats[strat].wins += 1;
      }
    });

    const strategyList = Object.entries(strategyStats).map(([name, stats]) => ({
      name,
      pnl: stats.pnl,
      winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      count: stats.count
    })).sort((a, b) => b.pnl - a.pnl);

    // 2. Calculate Pair Performance
    const pairStats: { [key: string]: { pnl: number; count: number; wins: number } } = {};
    closedTrades.forEach(t => {
      const pair = t.pair;
      if (!pairStats[pair]) {
        pairStats[pair] = { pnl: 0, count: 0, wins: 0 };
      }
      pairStats[pair].pnl += (t.pnl || 0);
      pairStats[pair].count += 1;
      if (t.status === 'Win') {
        pairStats[pair].wins += 1;
      }
    });

    const pairList = Object.entries(pairStats).map(([name, stats]) => ({
      name,
      pnl: stats.pnl,
      winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      count: stats.count
    })).sort((a, b) => b.pnl - a.pnl);

    // 3. Calculate Psychological Factor Impact (PnL per Factor)
    const factorStats: { [key: string]: { pnl: number; count: number } } = {};
    closedTrades.forEach(t => {
      const factors = t.psychologyFactors || [];
      factors.forEach(f => {
        if (!factorStats[f]) {
          factorStats[f] = { pnl: 0, count: 0 };
        }
        factorStats[f].pnl += (t.pnl || 0);
        factorStats[f].count += 1;
      });
    });

    const factorList = Object.entries(factorStats).map(([name, stats]) => ({
      name,
      pnl: stats.pnl,
      count: stats.count
    })).sort((a, b) => a.pnl - b.pnl); // Sort from most negative to positive

    // Maximum absolute PnL to scale charts
    const maxStrategyPnl = Math.max(...strategyList.map(s => Math.abs(s.pnl)), 1);
    const maxPairPnl = Math.max(...pairList.map(p => Math.abs(p.pnl)), 1);
    const maxFactorPnl = Math.max(...factorList.map(f => Math.abs(f.pnl)), 1);

    return {
      closedTrades,
      winTrades,
      lossTrades,
      totalTradesCount,
      winRate,
      totalProfit,
      totalLoss,
      profitFactor,
      avgWin,
      avgLoss,
      expectancyRatio,
      strategyList,
      pairList,
      factorList,
      maxStrategyPnl,
      maxPairPnl,
      maxFactorPnl
    };
  }, [trades]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep insights into your strategies, assets, and trading behavior.</p>
      </div>

      {totalTradesCount > 0 ? (
        <div className="analytics-grid">
          {/* Key Stats Card */}
          <div className="glass-panel analytics-card">
            <h2 className="detail-section-title">Performance Ratios</h2>
            
            <div className="stat-row">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value" style={{ color: 'var(--color-primary-hover)' }}>{winRate}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Profit Factor</span>
              <span className="stat-value" style={{ color: Number(profitFactor) >= 1.5 ? 'var(--color-success)' : 'inherit' }}>{profitFactor}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Expectancy Ratio</span>
              <span className="stat-value">{expectancyRatio}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Average Win</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(avgWin)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Average Loss</span>
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(avgLoss)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Wins / Losses</span>
              <span className="stat-value">{winTrades.length} W / {lossTrades.length} L</span>
            </div>
          </div>

          {/* Psychological Impact Card */}
          <div className="glass-panel analytics-card">
            <h2 className="detail-section-title">Psychology &amp; Discipline</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              P&amp;L impact of your emotions and discipline factors.
            </p>
            
            <div className="bar-chart">
              {factorList.length > 0 ? (
                factorList.map((f) => {
                  const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(f.pnl) / maxFactorPnl) * 100)));
                  const isPositive = f.pnl >= 0;
                  return (
                    <div key={f.name} className="bar-row">
                      <span className="bar-label" title={f.name}>{f.name}</span>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${isPositive ? 'win' : 'loss'}`}
                          style={{ 
                            width: `${percentage}%`,
                            float: isPositive ? 'left' : 'right',
                            marginLeft: isPositive ? '0' : 'auto' 
                          }}
                        />
                      </div>
                      <span className={`bar-value ${isPositive ? 'win' : 'loss'}`}>
                        {isPositive ? '+' : ''}{Math.round(f.pnl)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No psychological factors tagged. Tag factors under the 'Psychology' tab when logging trades.
                </div>
              )}
            </div>
          </div>

          {/* Strategy Performance */}
          <div className="glass-panel analytics-card">
            <h2 className="detail-section-title">Strategy Performance</h2>
            
            <div className="bar-chart">
              {strategyList.map((s) => {
                const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(s.pnl) / maxStrategyPnl) * 100)));
                const isPositive = s.pnl >= 0;
                return (
                  <div key={s.name} className="bar-row">
                    <span className="bar-label" title={s.name}>{s.name} ({s.winRate}%)</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isPositive ? 'win' : 'loss'}`}
                        style={{ 
                          width: `${percentage}%`,
                          float: isPositive ? 'left' : 'right',
                          marginLeft: isPositive ? '0' : 'auto' 
                        }}
                      />
                    </div>
                    <span className={`bar-value ${isPositive ? 'win' : 'loss'}`}>
                      {isPositive ? '+' : ''}{Math.round(s.pnl)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Tickers Performance */}
          <div className="glass-panel analytics-card">
            <h2 className="detail-section-title">Asset Tickers Performance</h2>
            
            <div className="bar-chart">
              {pairList.map((p) => {
                const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(p.pnl) / maxPairPnl) * 100)));
                const isPositive = p.pnl >= 0;
                return (
                  <div key={p.name} className="bar-row">
                    <span className="bar-label" title={p.name}>{p.name} ({p.winRate}%)</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isPositive ? 'win' : 'loss'}`}
                        style={{ 
                          width: `${percentage}%`,
                          float: isPositive ? 'left' : 'right',
                          marginLeft: isPositive ? '0' : 'auto' 
                        }}
                      />
                    </div>
                    <span className={`bar-value ${isPositive ? 'win' : 'loss'}`}>
                      {isPositive ? '+' : ''}{Math.round(p.pnl)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel empty-state" style={{ padding: '60px 20px' }}>
          <AnalyticsIcon className="empty-state-icon" />
          <p className="empty-state-title">No analytics available</p>
          <p className="empty-state-desc">You need at least one closed trade record to compile statistics.</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(AnalyticsView);

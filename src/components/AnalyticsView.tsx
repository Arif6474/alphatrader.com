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
  const [activeTab, setActiveTab] = React.useState<'overview' | 'strategies' | 'psychology' | 'sessions'>('overview');

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
    sessionList,
    maxStrategyPnl,
    maxPairPnl,
    maxFactorPnl,
    maxSessionPnl,
    maxStrategyPF,
    
    // New Advanced Stats
    avgRealizedRR,
    expectancyVal,
    kellyPercentage,
    maxWinStreak,
    maxLossStreak,
    maxSingleWin,
    maxSingleLoss
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

    // 1. Calculate Realized R:R (using riskAmount if populated, fallback to avgWin / avgLoss)
    const tradesWithRR = closedTrades.filter(t => t.riskAmount && t.riskAmount > 0);
    const avgRealizedRR = tradesWithRR.length > 0 
      ? tradesWithRR.reduce((sum, t) => sum + ((t.pnl || 0) / t.riskAmount!), 0) / tradesWithRR.length 
      : (avgLoss > 0 ? (avgWin / avgLoss) : 0);

    // 2. Expected Value per Trade ($)
    const expectancyVal = totalTradesCount > 0 
      ? closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / totalTradesCount 
      : 0;

    // 3. Kelly Criterion allocation (%)
    let kellyPercentage = 0;
    if (avgLoss > 0 && avgWin > 0) {
      const p = winTrades.length / totalTradesCount;
      const b = avgWin / avgLoss;
      const f = p - (1 - p) / b;
      kellyPercentage = Math.max(0, Math.round(f * 100));
    }

    // 4. Streaks (chronological order)
    const sortedTrades = [...closedTrades].sort((a, b) => {
      const dateA = a.exitDate || a.entryDate;
      const dateB = b.exitDate || b.entryDate;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    
    sortedTrades.forEach(t => {
      if (t.status === 'Win') {
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
        currentLossStreak = 0;
      } else if (t.status === 'Loss') {
        currentLossStreak++;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        currentWinStreak = 0;
      }
    });

    // 5. Extreme Trades
    const maxSingleWin = winTrades.length > 0 ? Math.max(...winTrades.map(t => t.pnl || 0)) : 0;
    const maxSingleLoss = lossTrades.length > 0 ? Math.max(...lossTrades.map(t => Math.abs(t.pnl || 0))) : 0;

    // 6. Calculate Strategy Performance
    const strategyStats: { [key: string]: { pnl: number; count: number; wins: number; grossProfit: number; grossLoss: number } } = {};
    closedTrades.forEach(t => {
      const strat = t.strategy || 'Other';
      if (!strategyStats[strat]) {
        strategyStats[strat] = { pnl: 0, count: 0, wins: 0, grossProfit: 0, grossLoss: 0 };
      }
      strategyStats[strat].pnl += (t.pnl || 0);
      strategyStats[strat].count += 1;
      if (t.status === 'Win') {
        strategyStats[strat].wins += 1;
        strategyStats[strat].grossProfit += (t.pnl || 0);
      } else if (t.status === 'Loss') {
        strategyStats[strat].grossLoss += Math.abs(t.pnl || 0);
      }
    });

    const strategyList = Object.entries(strategyStats).map(([name, stats]) => {
      const pfVal = stats.grossLoss > 0 ? (stats.grossProfit / stats.grossLoss) : (stats.grossProfit > 0 ? 99 : 0);
      return {
        name,
        pnl: stats.pnl,
        winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
        count: stats.count,
        profitFactor: pfVal
      };
    }).sort((a, b) => b.pnl - a.pnl);

    // 7. Calculate Pair Performance
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

    // 8. Calculate Psychological Factor Impact
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
    })).sort((a, b) => a.pnl - b.pnl);

    // 9. Calculate Session Performance
    const sessionStats: { [key: string]: { pnl: number; count: number; wins: number } } = {};
    closedTrades.forEach(t => {
      const sess = t.session || 'Unknown';
      if (!sessionStats[sess]) {
        sessionStats[sess] = { pnl: 0, count: 0, wins: 0 };
      }
      sessionStats[sess].pnl += (t.pnl || 0);
      sessionStats[sess].count += 1;
      if (t.status === 'Win') {
        sessionStats[sess].wins += 1;
      }
    });

    const sessionList = Object.entries(sessionStats).map(([name, stats]) => ({
      name,
      pnl: stats.pnl,
      winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      count: stats.count
    })).sort((a, b) => b.pnl - a.pnl);

    // Scaling bounds
    const maxStrategyPnl = Math.max(...strategyList.map(s => Math.abs(s.pnl)), 1);
    const maxPairPnl = Math.max(...pairList.map(p => Math.abs(p.pnl)), 1);
    const maxFactorPnl = Math.max(...factorList.map(f => Math.abs(f.pnl)), 1);
    const maxSessionPnl = Math.max(...sessionList.map(s => Math.abs(s.pnl)), 1);
    const maxStrategyPF = Math.max(...strategyList.map(s => s.profitFactor), 3);

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
      sessionList,
      maxStrategyPnl,
      maxPairPnl,
      maxFactorPnl,
      maxSessionPnl,
      maxStrategyPF,
      avgRealizedRR,
      expectancyVal,
      kellyPercentage,
      maxWinStreak,
      maxLossStreak,
      maxSingleWin,
      maxSingleLoss
    };
  }, [trades]);

  // Helper to grade Profit Factor
  const getProfitFactorGrade = () => {
    const pf = Number(profitFactor);
    if (isNaN(pf) || pf <= 0) return { label: 'No Trades', color: 'var(--text-muted)' };
    if (pf >= 2.0) return { label: 'Excellent (A+)', color: 'var(--color-success)' };
    if (pf >= 1.5) return { label: 'Good (B)', color: '#34d399' };
    if (pf >= 1.0) return { label: 'Mediocre (C)', color: 'var(--color-warning)' };
    return { label: 'Unprofitable (F)', color: 'var(--color-danger)' };
  };

  const pfGrade = getProfitFactorGrade();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep quantitative insights and psychological metrics from your history.</p>
      </div>

      {totalTradesCount > 0 ? (
        <>
          {/* Tab Navigation */}
          <div className="directory-tabs" style={{ marginBottom: '24px' }}>
            <button 
              type="button"
              className={`directory-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              type="button"
              className={`directory-tab ${activeTab === 'strategies' ? 'active' : ''}`}
              onClick={() => setActiveTab('strategies')}
            >
              🎯 Strategies
            </button>
            <button 
              type="button"
              className={`directory-tab ${activeTab === 'psychology' ? 'active' : ''}`}
              onClick={() => setActiveTab('psychology')}
            >
              🧠 Psychology
            </button>
            <button 
              type="button"
              className={`directory-tab ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              🕒 Sessions &amp; Assets
            </button>
          </div>

          {/* TAB CONTENTS */}
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                {/* Circular Win Rate Ring */}
                <div className="winrate-ring-container">
                  <svg className="winrate-ring-svg">
                    <defs>
                      <linearGradient id="indigo-violet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <circle className="winrate-ring-bg" cx="50" cy="50" r="40" />
                    <circle 
                      className="winrate-ring-fill" 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * winRate) / 100}
                    />
                  </svg>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-hover)' }}>{winRate}%</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Win rate calculated across {totalTradesCount} completed trades
                    </div>
                  </div>
                </div>

                {/* Extreme Records (Big Win / Big Loss) */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 className="detail-section-title" style={{ marginBottom: '14px' }}>Extreme Metrics</h3>
                  <div className="extreme-records-grid">
                    <div className="extreme-record-card win">
                      <span className="extreme-record-title">Max Single Win</span>
                      <span className="extreme-record-value win">{formatCurrency(maxSingleWin)}</span>
                    </div>
                    <div className="extreme-record-card loss">
                      <span className="extreme-record-title">Max Single Loss</span>
                      <span className="extreme-record-value loss">-{formatCurrency(maxSingleLoss)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Highlight cards grid */}
              <div className="analytics-grid-three">
                
                {/* Expected Value Card */}
                <div className="analytics-stat-highlight">
                  <div className="analytics-stat-glow success" />
                  <div className="analytics-stat-header">
                    <span className="analytics-stat-label">Expectancy (EV)</span>
                    <span style={{ fontSize: '1.2rem' }}>🧮</span>
                  </div>
                  <div 
                    className="analytics-stat-value" 
                    style={{ color: expectancyVal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                  >
                    {expectancyVal >= 0 ? '+' : ''}{formatCurrency(expectancyVal)}
                  </div>
                  <div className="analytics-stat-footer">
                    Expected net return for every trade taken.
                  </div>
                </div>

                {/* Kelly Criterion Card */}
                <div className="analytics-stat-highlight">
                  <div className="analytics-stat-glow" />
                  <div className="analytics-stat-header">
                    <span className="analytics-stat-label">Kelly Sizing Suggestion</span>
                    <span style={{ fontSize: '1.2rem' }}>📐</span>
                  </div>
                  <div className="analytics-stat-value">
                    {kellyPercentage > 0 ? `${kellyPercentage}%` : '0%'}
                  </div>
                  <div className="analytics-stat-footer">
                    {kellyPercentage > 0 
                      ? 'Recommended percentage of starting balance to risk per trade.'
                      : 'Expectancy is negative. Size down or skip setups until stats improve.'}
                  </div>
                </div>

                {/* Win / Loss Streaks Card */}
                <div className="analytics-stat-highlight">
                  <div className="analytics-stat-glow danger" />
                  <div className="analytics-stat-header">
                    <span className="analytics-stat-label">Peak Streaks</span>
                    <span style={{ fontSize: '1.2rem' }}>🔥</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        🔥 {maxWinStreak}
                      </div>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Wins</div>
                    </div>
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', height: '24px' }} />
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                        🩸 {maxLossStreak}
                      </div>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Losses</div>
                    </div>
                  </div>
                  <div className="analytics-stat-footer">
                    Longest consecutive winning &amp; losing streaks.
                  </div>
                </div>
              </div>

              {/* Ratios Breakdown Card */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 className="detail-section-title" style={{ marginBottom: '18px' }}>Ratios &amp; Profitability Scores</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Profit Factor</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profitFactor}</div>
                  </div>

                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Efficiency Grade</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: pfGrade.color }}>{pfGrade.label}</div>
                  </div>

                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Realized Risk-Reward (R:R)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: avgRealizedRR >= 1.5 ? 'var(--color-success)' : 'inherit' }}>
                      1 : {avgRealizedRR.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Average Win / Loss</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-success)', fontSize: '0.95rem' }}>{formatCurrency(avgWin)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/</span>
                      <span style={{ color: 'var(--color-danger)', fontSize: '0.95rem' }}>-{formatCurrency(avgLoss)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. STRATEGIES TAB */}
          {activeTab === 'strategies' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="analytics-cards-grid">
                {strategyList.map((s) => {
                  const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(s.pnl) / maxStrategyPnl) * 100)));
                  const isPositive = s.pnl >= 0;
                  return (
                    <div 
                      key={s.name} 
                      className={`analytics-card-item ${isPositive ? 'profitable' : 'unprofitable'}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="analytics-card-item-title">{s.name}</span>
                        <span className={`badge ${isPositive ? 'badge--success' : 'badge--danger'}`}>
                          {s.count} trades
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <span>Win Rate</span>
                          <span>{s.winRate}%</span>
                        </div>
                        <div className="bar-track" style={{ height: '6px', borderRadius: '3px' }}>
                          <div 
                            className={`bar-fill ${s.winRate >= 50 ? 'win' : 'loss'}`}
                            style={{ width: `${s.winRate}%`, height: '100%', borderRadius: '3px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Profit</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {isPositive ? '+' : ''}{formatCurrency(s.pnl)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profit Factor</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.profitFactor >= 1.0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {s.profitFactor >= 99 ? '∞' : s.profitFactor.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PSYCHOLOGY TAB */}
          {activeTab === 'psychology' && (
            <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
              <h2 className="detail-section-title">Emotion &amp; Discipline Scorecard</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                P&amp;L impact of tagged behaviors. Ensure you log psychological traits when modifying or saving trade entries.
              </p>

              <div className="bar-chart">
                {factorList.length > 0 ? (
                  factorList.map((f) => {
                    const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(f.pnl) / maxFactorPnl) * 100)));
                    const isPositive = f.pnl >= 0;
                    return (
                      <div key={f.name} className="bar-row">
                        <span className="bar-label" style={{ minWidth: '150px' }}>
                          <span style={{ marginRight: '6px' }}>{isPositive ? '🟢' : '🔴'}</span>
                          {f.name} ({f.count} trades)
                        </span>
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
                          {isPositive ? '+' : ''}{formatCurrency(f.pnl)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No emotional tags found in history. Click on 'Trades Directory' &gt; edit a trade to add Psychological factors.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SESSIONS & ASSETS TAB */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Asset Tickers Performance */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 className="detail-section-title" style={{ marginBottom: '18px' }}>Asset Performance</h2>
                <div className="bar-chart">
                  {pairList.map((p) => {
                    const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(p.pnl) / maxPairPnl) * 100)));
                    const isPositive = p.pnl >= 0;
                    return (
                      <div key={p.name} className="bar-row">
                        <span className="bar-label" style={{ minWidth: '150px' }}>{p.name} ({p.winRate}% win rate)</span>
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
                          {isPositive ? '+' : ''}{formatCurrency(p.pnl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sessions Performance */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 className="detail-section-title" style={{ marginBottom: '18px' }}>Session Analysis</h2>
                <div className="bar-chart">
                  {sessionList.map((s) => {
                    const percentage = Math.max(10, Math.min(100, Math.round((Math.abs(s.pnl) / maxSessionPnl) * 100)));
                    const isPositive = s.pnl >= 0;
                    return (
                      <div key={s.name} className="bar-row">
                        <span className="bar-label" style={{ minWidth: '150px' }}>{s.name} session ({s.winRate}% win)</span>
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
                          {isPositive ? '+' : ''}{formatCurrency(s.pnl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel empty-state" style={{ padding: '60px 20px' }}>
          <AnalyticsIcon className="empty-state-icon" />
          <p className="empty-state-title">No analytics compiled</p>
          <p className="empty-state-desc">You need at least one closed trade record to generate statistics.</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(AnalyticsView);

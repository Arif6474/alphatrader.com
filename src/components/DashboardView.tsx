'use client';
import React, { useState } from 'react';
import { Trade } from '@/lib/db';

interface DashboardViewProps {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onNavigate: (view: string) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* ── inline mini icons ── */
const IconPnl = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconScale = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Circular Progress Ring ── */
function Ring({ pct, color, size = 52, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

/* ── Stat Card ── */
function StatCard({
  label, value, sub, icon, accent, ring, ringMax
}: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  accent: string; ring?: number; ringMax?: number;
}) {
  const pct = ring !== undefined && ringMax ? Math.min((ring / ringMax) * 100, 100) : undefined;
  return (
    <div style={{
      background: 'rgba(10,12,22,0.7)', border: `1px solid rgba(255,255,255,0.05)`,
      borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
      transition: 'transform 0.2s, border-color 0.2s', cursor: 'default',
      borderTop: `2px solid ${accent}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderTopColor = accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Subtle glow bg */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
        background: `linear-gradient(180deg, ${accent}18 0%, transparent 100%)`, pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {label}
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: accent, fontFamily: 'var(--font-mono)', lineHeight: 1, letterSpacing: '-0.5px' }}>
            {value}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
          {pct !== undefined ? (
            <div style={{ position: 'relative' }}>
              <Ring pct={pct} color={accent} size={48} stroke={4} />
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '0.55rem', fontWeight: 800, color: accent }}>
                {Math.round(pct)}%
              </span>
            </div>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${accent}18`, border: `1px solid ${accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Sub label */}
      <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</span>
    </div>
  );
}

function DashboardView({ trades, onViewTrade, onNavigate }: DashboardViewProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  const stats = React.useMemo(() => {
    const closedTrades = trades.filter(t => t.closed);
    const activeTrades = trades.filter(t => !t.closed);
    const netPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);

    const grossProfit = closedTrades.filter(t => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0);
    const grossLoss = Math.abs(closedTrades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '—';

    const winTrades = closedTrades.filter(t => t.status === 'Win');
    const lossTrades = closedTrades.filter(t => t.status === 'Loss');
    const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

    const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;
    const expectancy = (winRate / 100) * avgWin - ((1 - winRate / 100) * avgLoss);

    const rMultiples = closedTrades.map(t => (t.pnl || 0) / (t.riskAmount || 1));
    const avgRR = rMultiples.length > 0
      ? (rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length).toFixed(2) : '0.00';

    const startBalance = trades.length > 0 ? trades[trades.length - 1].accountBalance : 0;
    const balanceHistory = [{ balance: startBalance, date: 'Start' }];
    const chrono = [...closedTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let cur = startBalance, peak = startBalance, maxDrawdown = 0;
    chrono.forEach(t => {
      cur += (t.pnl || 0);
      if (cur > peak) peak = cur;
      const dd = peak > 0 ? ((peak - cur) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
      balanceHistory.push({ balance: cur, date: formatDate(t.entryDate) });
    });

    // SVG path (smooth bezier)
    const W = 520, H = 170, px = 32, py = 16;
    const minB = Math.min(...balanceHistory.map(h => h.balance)) * 0.998;
    const maxB = Math.max(...balanceHistory.map(h => h.balance)) * 1.002;
    const range = maxB - minB === 0 ? 1 : maxB - minB;
    const points = balanceHistory.map((h, i) => ({
      x: px + (i / Math.max(balanceHistory.length - 1, 1)) * (W - px * 2),
      y: H - py - ((h.balance - minB) / range) * (H - py * 2),
      balance: h.balance, label: h.date,
    }));

    let linePath = '', areaPath = '';
    if (points.length > 1) {
      // Smooth bezier
      const seg = points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
      }).join(' ');
      linePath = seg;
      areaPath = `${seg} L ${points[points.length - 1].x} ${H - py} L ${points[0].x} ${H - py} Z`;
    }

    const isUp = netPnl >= 0;

    return { closedTrades, activeTrades, netPnl, winRate, avgRR, profitFactor, expectancy, maxDrawdown, balanceHistory, points, linePath, areaPath, recentTrades: trades.slice(0, 5), W, H, isUp };
  }, [trades]);

  const { closedTrades, activeTrades, netPnl, winRate, avgRR, profitFactor, expectancy, maxDrawdown, balanceHistory, points, linePath, areaPath, recentTrades, W, H, isUp } = stats;

  const pfNum = parseFloat(profitFactor as string);
  const pfColor = isNaN(pfNum) ? '#6366f1' : pfNum >= 1.5 ? '#10b981' : pfNum >= 1.0 ? '#f59e0b' : '#ff3366';

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Your trading performance at a glance.
        </p>
      </div>

      {/* ── KPI Grid: 4 top + 4 bottom ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard label="Net P&L" value={`${netPnl >= 0 ? '+' : ''}${formatCurrency(netPnl)}`}
          sub={`${closedTrades.length} closed trades`} icon={<IconPnl />}
          accent={isUp ? '#10b981' : '#ff3366'} />
        <StatCard label="Win Rate" value={`${Math.round(winRate)}%`}
          sub={`${closedTrades.filter(t => t.status === 'Win').length} wins · ${closedTrades.filter(t => t.status === 'Loss').length} losses`}
          icon={<IconTarget />} accent="#6366f1"
          ring={winRate} ringMax={100} />
        <StatCard label="Profit Factor" value={String(profitFactor)}
          sub="Gross wins ÷ gross losses" icon={<IconScale />} accent={pfColor} />
        <StatCard label="Expectancy" value={`${expectancy >= 0 ? '+' : ''}${formatCurrency(expectancy)}`}
          sub="Expected $ per trade" icon={<IconStar />} accent={expectancy >= 0 ? '#10b981' : '#ff3366'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Max Drawdown" value={`${maxDrawdown.toFixed(2)}%`}
          sub="Peak-to-valley decline" icon={<IconAlert />} accent="#ff3366" />
        <StatCard label="Avg R:R" value={`${avgRR}R`}
          sub="Average realized multiple" icon={<IconActivity />} accent="#f59e0b" />
        <StatCard label="Total Trades" value={String(trades.length)}
          sub="Closed & open positions" icon={<IconLayers />} accent="#6366f1" />
        <StatCard label="Active Trades" value={String(activeTrades.length)}
          sub="Currently open positions" icon={<IconZap />} accent={activeTrades.length > 0 ? '#f59e0b' : 'var(--text-muted)'} />
      </div>

      {/* ── Bottom widgets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' }}>

        {/* Equity Curve */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                Performance Curve
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Cumulative account equity over time
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Balance</p>
              <p style={{ margin: '3px 0 0', fontSize: '1.25rem', fontWeight: 800, color: isUp ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(balanceHistory[balanceHistory.length - 1].balance)}
              </p>
            </div>
          </div>

          {points.length > 1 ? (
            <div style={{ position: 'relative' }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '180px', display: 'block' }}>
                <defs>
                  <linearGradient id="dg-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={isUp ? '#6366f1' : '#ff3366'} />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#f59e0b'} />
                  </linearGradient>
                  <linearGradient id="dg-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isUp ? '#6366f1' : '#ff3366'} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={isUp ? '#6366f1' : '#ff3366'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75].map(r => (
                  <line key={r} x1={32} y1={16 + r * (H - 32)} x2={W - 32} y2={16 + r * (H - 32)}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                <path d={areaPath} fill="url(#dg-fill)" />
                <path d={linePath} fill="none" stroke="url(#dg-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={tooltip?.x === p.x ? 6 : 3.5}
                    fill={tooltip?.x === p.x ? '#fff' : (isUp ? '#10b981' : '#ff3366')}
                    stroke={isUp ? '#10b981' : '#ff3366'} strokeWidth="1.5"
                    style={{ cursor: 'crosshair', transition: 'r 0.15s' }}
                    onMouseEnter={() => setTooltip({ x: p.x, y: p.y, val: p.balance, label: p.label })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </svg>
              {tooltip && (
                <div style={{
                  position: 'absolute', pointerEvents: 'none',
                  left: `${(tooltip.x / W) * 100}%`, top: `${(tooltip.y / H) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                  background: 'rgba(7,9,14,0.95)', border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{tooltip.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isUp ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(tooltip.val)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '8px' }}>
              <IconActivity />
              <span style={{ fontSize: '0.8rem' }}>No equity data yet — close a trade to begin.</span>
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Recent Trades</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last {recentTrades.length} entries</p>
            </div>
            <button onClick={() => onNavigate('trades')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-hover)', fontSize: '0.72rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
            >
              View All <IconArrow />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentTrades.length > 0 ? recentTrades.map(t => {
              const pnl = t.pnl || 0;
              const rr = t.riskAmount > 0 ? pnl / t.riskAmount : 0;
              const isWin = t.status === 'Win';
              const isLoss = t.status === 'Loss';
              const accent = isWin ? '#10b981' : isLoss ? '#ff3366' : '#f59e0b';
              return (
                <div key={t.id} onClick={() => onViewTrade(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                    borderRadius: '10px', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.04)`,
                    transition: 'all 0.15s', borderLeft: `3px solid ${accent}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {/* Direction badge */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
                    background: t.direction === 'Long' ? 'rgba(16,185,129,0.1)' : 'rgba(255,51,102,0.1)',
                    border: `1px solid ${t.direction === 'Long' ? 'rgba(16,185,129,0.2)' : 'rgba(255,51,102,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 900,
                    color: t.direction === 'Long' ? '#10b981' : '#ff3366',
                    letterSpacing: '0.3px',
                  }}>
                    {t.direction.slice(0, 1)}
                  </div>

                  {/* Trade info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '0.2px' }}>{t.pair}</span>
                      {!t.closed && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>LIVE</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(t.entryDate)} · {t.strategy}
                    </div>
                  </div>

                  {/* PnL */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {t.closed ? (
                      <>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: accent, fontFamily: 'var(--font-mono)' }}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: rr >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(255,51,102,0.7)', fontFamily: 'var(--font-mono)' }}>
                          {rr >= 0 ? '+' : ''}{rr.toFixed(1)}R
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 7px', borderRadius: '5px' }}>OPEN</span>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No trades yet. Add your first trade to get started.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default React.memo(DashboardView);

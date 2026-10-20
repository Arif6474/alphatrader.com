'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trade } from '@/lib/db';
import { calculateFinancialMetrics } from '@/lib/calculations';

interface DashboardViewProps {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onNavigate: (view: string) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const getLocalDateKey = (dateStr: string) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* ── Inline SVG Icons ── */
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
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const IconPie = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);
const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconOrangeCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="14.01"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
        background: `linear-gradient(180deg, ${accent}18 0%, transparent 100%)`, pointerEvents: 'none' }} />

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

      <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</span>
    </div>
  );
}

function DashboardView({ trades, onViewTrade, onNavigate }: DashboardViewProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);
  const [barTooltip, setBarTooltip] = useState<{ x: number; y: number; date: string; pnl: number; count: number; wins: number; losses: number } | null>(null);
  const [barRange, setBarRange] = useState<'14d' | '30d' | 'all'>('14d');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Group closed trades by Date string (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; netPnl: number; winCount: number; lossCount: number; beCount: number }> = {};
    trades.filter(t => t.closed && t.status !== 'Cancelled').forEach(t => {
      if (!t.entryDate) return;
      const key = getLocalDateKey(t.entryDate);
      if (!map[key]) {
        map[key] = { trades: [], netPnl: 0, winCount: 0, lossCount: 0, beCount: 0 };
      }
      map[key].trades.push(t);
      const pnl = t.pnl || 0;
      map[key].netPnl += pnl;
      if (t.status === 'Win') map[key].winCount += 1;
      else if (t.status === 'Loss') map[key].lossCount += 1;
      else if (t.status === 'Breakeven') map[key].beCount += 1;
    });
    return map;
  }, [trades]);

  // Determine initial calendar month based on latest closed trade or current date
  const initialCalendarDate = useMemo(() => {
    const closed = trades.filter(t => t.closed && t.status !== 'Cancelled' && t.entryDate);
    if (closed.length > 0) {
      const sorted = [...closed].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      return new Date(sorted[0].entryDate);
    }
    return new Date();
  }, [trades]);

  const [calendarMonth, setCalendarMonth] = useState<Date>(initialCalendarDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => initialCalendarDate.getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sync pickerYear when calendarMonth changes
  useEffect(() => {
    setPickerYear(calendarMonth.getFullYear());
  }, [calendarMonth]);

  // Click outside to close picker popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
        setIsYearDropdownOpen(false);
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const yrs = new Set<number>([currentYr - 3, currentYr - 2, currentYr - 1, currentYr, currentYr + 1]);
    trades.forEach(t => {
      if (t.entryDate) {
        const y = new Date(t.entryDate).getFullYear();
        if (!isNaN(y)) yrs.add(y);
      }
    });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [trades]);

  // Core metrics calculation
  const stats = useMemo(() => {
    const metrics = calculateFinancialMetrics(trades, 0, 'USD');
    const closedTrades = trades.filter(t => t.closed && t.status !== 'Cancelled');
    const activeTrades = trades.filter(t => !t.closed && t.status !== 'Cancelled');

    // Equity Curve points
    const W = 520, H = 170, px = 32, py = 16;
    const balanceHistory = metrics.equityCurve.map(pt => ({
      balance: pt.balance,
      date: pt.index === 0 ? 'Start' : formatDate(pt.date)
    }));

    const minB = Math.min(...balanceHistory.map(h => h.balance)) * 0.998;
    const maxB = Math.max(...balanceHistory.map(h => h.balance)) * 1.002;
    const range = maxB - minB === 0 ? 1 : maxB - minB;
    const points = balanceHistory.map((h, i) => ({
      x: px + (i / Math.max(balanceHistory.length - 1, 1)) * (W - px * 2),
      y: H - py - ((h.balance - minB) / range) * (H - py * 2),
      balance: h.balance,
      label: h.date,
    }));

    let linePath = '', areaPath = '';
    if (points.length > 1) {
      const seg = points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
      }).join(' ');
      linePath = seg;
      areaPath = `${seg} L ${points[points.length - 1].x} ${H - py} L ${points[0].x} ${H - py} Z`;
    }

    const isUp = metrics.netPnl >= 0;

    // Day of week breakdown (0: Sun ... 6: Sat)
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayStats = [1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
      const dayTrades = closedTrades.filter(t => {
        const d = new Date(t.entryDate);
        return d.getDay() === dayIdx;
      });
      const dayPnl = dayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
      const wins = dayTrades.filter(t => t.status === 'Win').length;
      const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
      return {
        name: weekdayNames[dayIdx],
        count: dayTrades.length,
        pnl: dayPnl,
        winRate,
        wins,
      };
    }).filter(d => d.count > 0 || (d.name !== 'Sun' && d.name !== 'Sat')); // Always show Mon-Fri

    // Long vs Short breakdown
    const longTrades = closedTrades.filter(t => t.direction === 'Long');
    const shortTrades = closedTrades.filter(t => t.direction === 'Short');
    const longPnl = longTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const shortPnl = shortTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const longWins = longTrades.filter(t => t.status === 'Win').length;
    const shortWins = shortTrades.filter(t => t.status === 'Win').length;
    const longWinRate = longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0;
    const shortWinRate = shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0;

    return {
      metrics,
      closedTrades,
      activeTrades,
      balanceHistory,
      points,
      linePath,
      areaPath,
      recentTrades: trades.slice(0, 6),
      W,
      H,
      isUp,
      weekdayStats,
      directionStats: {
        long: { count: longTrades.length, pnl: longPnl, winRate: longWinRate },
        short: { count: shortTrades.length, pnl: shortPnl, winRate: shortWinRate }
      }
    };
  }, [trades]);

  const { metrics, closedTrades, balanceHistory, points, linePath, areaPath, recentTrades, W, H, isUp, weekdayStats, directionStats } = stats;

  const pfValue = metrics.profitFactor.value;
  const pfColor = metrics.profitFactor.isZeroLoss
    ? (metrics.profitFactor.isInfinite ? '#10b981' : 'var(--text-muted)')
    : (pfValue !== null && pfValue >= 1.5 ? '#10b981' : pfValue !== null && pfValue >= 1.0 ? '#f59e0b' : '#ff3366');

  // Daily P&L Bar Chart series
  const dailyBarData = useMemo(() => {
    const keys = Object.keys(tradesByDate).sort();
    let selectedKeys = keys;
    if (barRange === '14d') selectedKeys = keys.slice(-14);
    else if (barRange === '30d') selectedKeys = keys.slice(-30);

    return selectedKeys.map(k => ({
      date: k,
      label: formatDate(k),
      pnl: tradesByDate[k].netPnl,
      count: tradesByDate[k].trades.length,
      wins: tradesByDate[k].winCount,
      losses: tradesByDate[k].lossCount,
    }));
  }, [tradesByDate, barRange]);

  // Calendar calculations for selected month
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-11
    const todayStr = getLocalDateKey(new Date().toISOString());

    const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Monday as first day of week: (day + 6) % 7
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Leading days from previous month
    const leading = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      const k = getLocalDateKey(d.toISOString());
      leading.push({
        dayNum: prevMonthDays - i,
        dateKey: k,
        isCurrentMonth: false,
        isToday: k === todayStr,
        trades: tradesByDate[k]?.trades || [],
        netPnl: tradesByDate[k]?.netPnl || 0,
        count: tradesByDate[k]?.trades.length || 0,
      });
    }

    // Days in current month
    const current = [];
    let monthPnl = 0;
    let activeDays = 0;
    let winningDays = 0;
    let losingDays = 0;
    let beDays = 0;
    let bestDay: { key: string; pnl: number } | null = null;
    let worstDay: { key: string; pnl: number } | null = null;
    let monthTradesCount = 0;

    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(year, month, dNum);
      const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      const dayTrades = tradesByDate[k]?.trades || [];
      const netPnl = tradesByDate[k]?.netPnl || 0;
      const count = dayTrades.length;

      if (count > 0) {
        activeDays++;
        monthPnl += netPnl;
        monthTradesCount += count;
        if (netPnl > 0.005) winningDays++;
        else if (netPnl < -0.005) losingDays++;
        else beDays++;

        if (!bestDay || netPnl > bestDay.pnl) bestDay = { key: k, pnl: netPnl };
        if (!worstDay || netPnl < worstDay.pnl) worstDay = { key: k, pnl: netPnl };
      }

      current.push({
        dayNum: dNum,
        dateKey: k,
        isCurrentMonth: true,
        isToday: k === todayStr,
        trades: dayTrades,
        netPnl,
        count,
      });
    }

    // Trailing days to fill 35 or 42 slots
    const totalSlots = leading.length + current.length > 35 ? 42 : 35;
    const trailingCount = totalSlots - (leading.length + current.length);
    const trailing = [];
    for (let dNum = 1; dNum <= trailingCount; dNum++) {
      const d = new Date(year, month + 1, dNum);
      const k = getLocalDateKey(d.toISOString());
      trailing.push({
        dayNum: dNum,
        dateKey: k,
        isCurrentMonth: false,
        isToday: k === todayStr,
        trades: tradesByDate[k]?.trades || [],
        netPnl: tradesByDate[k]?.netPnl || 0,
        count: tradesByDate[k]?.trades.length || 0,
      });
    }

    const dailyWinRate = activeDays > 0 ? (winningDays / (winningDays + losingDays || 1)) * 100 : 0;

    return {
      monthName,
      days: [...leading, ...current, ...trailing],
      monthPnl,
      activeDays,
      winningDays,
      losingDays,
      beDays,
      bestDay,
      worstDay,
      dailyWinRate,
      monthTradesCount,
    };
  }, [calendarMonth, tradesByDate]);

  // Selected date trades
  const selectedTrades = useMemo(() => {
    if (!selectedDateKey || !tradesByDate[selectedDateKey]) return [];
    return tradesByDate[selectedDateKey].trades;
  }, [selectedDateKey, tradesByDate]);

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
      {metrics.hasMixedCurrencies && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '10px',
          marginBottom: '20px',
          color: '#fbbf24',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️ <strong>Currency Notice:</strong> Multiple currencies detected ({metrics.unsupportedCurrencies.join(', ')}). Totals are displayed without foreign exchange conversion.</span>
        </div>
      )}

      {/* ── KPI Grid: 8 Stat Cards ── */}
      <div className="metrics-grid">
        <StatCard label="Net P&L" value={`${metrics.netPnl >= 0 ? '+' : ''}${formatCurrency(metrics.netPnl)}`}
          sub={`${metrics.closedTradesCount} closed trades (fees: ${formatCurrency(metrics.totalFees)})`} icon={<IconPnl />}
          accent={isUp ? '#10b981' : '#ff3366'} />
        <StatCard label="Win Rate" value={`${Math.round(metrics.winRate)}%`}
          sub={`${metrics.winCount}W · ${metrics.lossCount}L · ${metrics.breakevenCount}BE`}
          icon={<IconTarget />} accent="#6366f1"
          ring={metrics.winRate} ringMax={100} />
        <StatCard label="Profit Factor" value={metrics.profitFactor.display}
          sub={metrics.profitFactor.isZeroLoss ? (metrics.profitFactor.isInfinite ? "Zero gross loss" : "No closed trades") : "Gross profit ÷ gross loss"}
          icon={<IconScale />} accent={pfColor} />
        <StatCard label="Expectancy" value={`${metrics.netExpectancyPerTrade >= 0 ? '+' : ''}${formatCurrency(metrics.netExpectancyPerTrade)}`}
          sub="Average net return per trade" icon={<IconStar />} accent={metrics.netExpectancyPerTrade >= 0 ? '#10b981' : '#ff3366'} />
      </div>

      <div className="metrics-grid">
        <StatCard label="Max Drawdown" value={`${metrics.maxDrawdownPercent.toFixed(2)}%`}
          sub={`Peak-to-valley (${formatCurrency(metrics.maxDrawdownAmount)})`} icon={<IconAlert />} accent="#ff3366" />
        <StatCard label="Avg Realized R" value={metrics.avgRealizedR !== null ? `${metrics.avgRealizedR}R` : '—'}
          sub={metrics.validRTradesCount > 0 ? `${metrics.validRTradesCount} trades with planned risk` : "No stop-loss recorded"}
          icon={<IconActivity />} accent="#6366f1" />
        <StatCard label="Total Trades" value={String(metrics.totalTrades)}
          sub={`${metrics.closedTradesCount} closed · ${metrics.activeTradesCount} open`} icon={<IconLayers />} accent="#d4af37" />
        <StatCard label="Active Trades" value={String(metrics.activeTradesCount)}
          sub="Currently open positions" icon={<IconZap />} accent={metrics.activeTradesCount > 0 ? '#f59e0b' : 'var(--text-muted)'} />
      </div>

      {/* ── Section 1: Equity Curve & Outcome Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Equity Curve (Performance Curve) */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
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
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '185px', display: 'block' }}>
                <defs>
                  <linearGradient id="dg-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#ff3366'} />
                  </linearGradient>
                  <linearGradient id="dg-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#ff3366'} stopOpacity="0.20" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#ff3366'} stopOpacity="0" />
                  </linearGradient>
                </defs>
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
                  background: 'rgba(7,9,14,0.95)', border: '1px solid rgba(229,184,105,0.4)',
                  borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 10
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{tooltip.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isUp ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(tooltip.val)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '185px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '8px' }}>
              <IconActivity />
              <span style={{ fontSize: '0.8rem' }}>No equity data yet — close a trade to begin.</span>
            </div>
          )}
        </div>

        {/* Trade Outcome Distribution (Donut Chart) */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Outcome Breakdown
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Win vs Loss proportion & payoff
              </p>
            </div>
            <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(229,184,105,0.1)', color: '#6366f1', fontSize: '0.72rem', fontWeight: 700 }}>
              PF {metrics.profitFactor.display}
            </div>
          </div>

          {metrics.closedTradesCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              {/* Donut graphic */}
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0, margin: '0 auto' }}>
                {(() => {
                  const size = 130;
                  const stroke = 14;
                  const r = (size - stroke) / 2;
                  const circ = 2 * Math.PI * r;
                  const total = metrics.closedTradesCount || 1;
                  const winLen = (metrics.winCount / total) * circ;
                  const lossLen = (metrics.lossCount / total) * circ;
                  const beLen = (metrics.breakevenCount / total) * circ;

                  return (
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
                      {/* Win Arc */}
                      {winLen > 0 && (
                        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10b981" strokeWidth={stroke}
                          strokeDasharray={`${winLen} ${circ - winLen}`} strokeDashoffset={0} />
                      )}
                      {/* Loss Arc */}
                      {lossLen > 0 && (
                        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ff3366" strokeWidth={stroke}
                          strokeDasharray={`${lossLen} ${circ - lossLen}`} strokeDashoffset={-winLen} />
                      )}
                      {/* Breakeven Arc */}
                      {beLen > 0 && (
                        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6366f1" strokeWidth={stroke}
                          strokeDasharray={`${beLen} ${circ - beLen}`} strokeDashoffset={-(winLen + lossLen)} />
                      )}
                    </svg>
                  );
                })()}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(metrics.winRate)}%
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Win Rate
                  </div>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>Wins</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{metrics.winCount} trades ({((metrics.winCount / metrics.closedTradesCount) * 100).toFixed(0)}%)</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    +{formatCurrency(metrics.grossProfit)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,51,102,0.08)', borderRadius: '8px', borderLeft: '3px solid #ff3366' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ff3366' }}>Losses</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{metrics.lossCount} trades ({((metrics.lossCount / metrics.closedTradesCount) * 100).toFixed(0)}%)</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff3366', fontFamily: 'var(--font-mono)' }}>
                    -{formatCurrency(metrics.grossLoss)}
                  </span>
                </div>

                {metrics.breakevenCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(229,184,105,0.08)', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1' }}>Breakeven</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', fontFamily: 'var(--font-mono)' }}>{metrics.breakevenCount} trades</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No closed trades recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Trading Daily Profit / Loss Calendar ── */}
      <div style={{
        background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', padding: '22px 24px', marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}>
        {/* Calendar Header with Navigation & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(229,184,105,0.12)', border: '1px solid rgba(229,184,105,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <IconCalendar />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  Daily Profit & Loss Calendar
                </h2>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(229,184,105,0.15)', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Interactive
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Day-by-day trading performance, win/loss color maps, and trade volume
              </p>
            </div>
          </div>

          {/* Month Navigator Controls — Matching user screenshot */}
          <div ref={datePickerRef} style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#0c1322',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '3px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {/* Prev Month Chevron */}
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                  setSelectedDateKey(null);
                }}
                style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}
                title="Previous Month"
              >
                <IconChevronLeft />
              </button>

              {/* Month Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setPickerYear(calendarMonth.getFullYear());
                  setIsDatePickerOpen(prev => !prev);
                  setIsYearDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'transparent', border: 'none',
                  color: '#fff', fontSize: '0.88rem', fontWeight: 800,
                  cursor: 'pointer', padding: '4px 10px', borderRadius: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <IconOrangeCalendar />
                <span>{calendarData.monthName}</span>
              </button>

              {/* Next Month Chevron */}
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                  setSelectedDateKey(null);
                }}
                style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}
                title="Next Month"
              >
                <IconChevronRight />
              </button>
            </div>

            {/* Month & Year Picker Popover Modal */}
            {isDatePickerOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '320px',
                background: '#0c1322',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '18px 20px',
                boxShadow: '0 24px 50px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
                zIndex: 60,
                backdropFilter: 'blur(20px)',
                animation: 'fadeIn 0.18s ease-out',
              }}>
                {/* Popover Header: Year Selector + Nav Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  {/* Year Dropdown Trigger */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsYearDropdownOpen(prev => !prev)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px', padding: '6px 14px',
                        color: '#fff', fontSize: '0.88rem', fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                    >
                      <span>{pickerYear}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Year Options Dropdown */}
                    {isYearDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                        background: '#090e1a', border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px', padding: '4px', zIndex: 70,
                        minWidth: '95px', maxHeight: '180px', overflowY: 'auto',
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.9)',
                      }}>
                        {availableYears.map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setPickerYear(yr);
                              setIsYearDropdownOpen(false);
                            }}
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: '6px', border: 'none',
                              background: yr === pickerYear ? '#2563eb' : 'transparent',
                              color: '#fff', fontSize: '0.82rem', fontWeight: 700, textAlign: 'left',
                              cursor: 'pointer', transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => {
                              if (yr !== pickerYear) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseLeave={e => {
                              if (yr !== pickerYear) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Jump Arrows */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPickerYear(prev => prev - 1)}
                      style={{
                        width: 28, height: 28, borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'transparent', color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Previous Year"
                    >
                      <IconChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerYear(prev => prev + 1)}
                      style={{
                        width: 28, height: 28, borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'transparent', color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Next Year"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* 12 Months Grid (3 columns x 4 rows) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, mIdx) => {
                    const isSelected = calendarMonth.getFullYear() === pickerYear && calendarMonth.getMonth() === mIdx;
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setCalendarMonth(new Date(pickerYear, mIdx, 1));
                          setSelectedDateKey(null);
                          setIsDatePickerOpen(false);
                          setIsYearDropdownOpen(false);
                        }}
                        style={{
                          height: '44px',
                          borderRadius: '12px',
                          border: isSelected ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                          background: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.03)',
                          boxShadow: isSelected ? '0 0 18px rgba(37, 99, 235, 0.55)' : 'none',
                          color: '#fff',
                          fontSize: '0.86rem',
                          fontWeight: isSelected ? 800 : 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          }
                        }}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  {/* Current Month Shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setCalendarMonth(now);
                      setPickerYear(now.getFullYear());
                      setSelectedDateKey(null);
                      setIsDatePickerOpen(false);
                      setIsYearDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none',
                      color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700,
                      cursor: 'pointer', padding: '4px 0', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <IconRefresh />
                    <span>Current Month</span>
                  </button>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen(false);
                      setIsYearDropdownOpen(false);
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700,
                      cursor: 'pointer', padding: '4px 6px', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Statistics Strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px',
          padding: '14px 16px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Month Net P&L</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: calendarData.monthPnl >= 0 ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {calendarData.monthPnl >= 0 ? '+' : ''}{formatCurrency(calendarData.monthPnl)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Trading Days</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {calendarData.activeDays} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({calendarData.monthTradesCount} trades)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Win / Loss Days</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#6366f1', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              <span style={{ color: '#10b981' }}>{calendarData.winningDays}W</span> · <span style={{ color: '#ff3366' }}>{calendarData.losingDays}L</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '6px' }}>({Math.round(calendarData.dailyWinRate)}%)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Best Day</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {calendarData.bestDay ? `+${formatCurrency(calendarData.bestDay.pnl)}` : '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Worst Day</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ff3366', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {calendarData.worstDay ? `${formatCurrency(calendarData.worstDay.pnl)}` : '—'}
            </div>
          </div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          <div style={{ minWidth: '680px' }}>
            {/* Weekday Column Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const isWeekend = idx >= 5;
                return (
                  <div key={day} style={{
                    textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
                    color: isWeekend ? 'rgba(255,255,255,0.3)' : 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 0'
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Calendar Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {calendarData.days.map((item, idx) => {
                const hasTrades = item.count > 0;
                const isWinDay = item.netPnl > 0.005;
                const isLossDay = item.netPnl < -0.005;
                const isBeDay = hasTrades && !isWinDay && !isLossDay;
                const isSelected = selectedDateKey === item.dateKey;

                let bg = 'rgba(255,255,255,0.015)';
                let border = '1px solid rgba(255,255,255,0.04)';
                let pnlColor = 'var(--text-muted)';

                if (item.isCurrentMonth && hasTrades) {
                  if (isWinDay) {
                    bg = 'rgba(16, 185, 129, 0.12)';
                    border = '1px solid rgba(16, 185, 129, 0.35)';
                    pnlColor = '#10b981';
                  } else if (isLossDay) {
                    bg = 'rgba(255, 51, 102, 0.12)';
                    border = '1px solid rgba(255, 51, 102, 0.35)';
                    pnlColor = '#ff3366';
                  } else {
                    bg = 'rgba(245, 158, 11, 0.10)';
                    border = '1px solid rgba(245, 158, 11, 0.3)';
                    pnlColor = '#f59e0b';
                  }
                }

                if (isSelected) {
                  border = '2px solid #6366f1';
                }

                return (
                  <div
                    key={`${item.dateKey}-${idx}`}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDateKey(prev => prev === item.dateKey ? null : item.dateKey);
                      }
                    }}
                    style={{
                      background: bg,
                      border,
                      borderRadius: '10px',
                      padding: '8px 10px',
                      minHeight: '74px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: item.isCurrentMonth ? 1 : 0.28,
                      cursor: hasTrades ? 'pointer' : 'default',
                      transition: 'all 0.18s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (hasTrades) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (hasTrades) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Top Row: Day Number & Today indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: item.isToday ? 900 : 700,
                        color: item.isToday ? '#6366f1' : item.isCurrentMonth ? 'var(--text-secondary)' : 'var(--text-muted)'
                      }}>
                        {item.dayNum}
                      </span>
                      {item.isToday && (
                        <span style={{
                          fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px',
                          background: 'rgba(229,184,105,0.25)', color: '#6366f1', textTransform: 'uppercase'
                        }}>
                          Today
                        </span>
                      )}
                    </div>

                    {/* Middle & Bottom: Daily Net P&L & Trade Count */}
                    {hasTrades ? (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{
                          fontSize: '0.86rem', fontWeight: 900, color: pnlColor, fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {item.netPnl >= 0 ? '+' : ''}{formatCurrency(item.netPnl)}
                        </div>
                        <div style={{
                          fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '2px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span>{item.count} {item.count === 1 ? 'trade' : 'trades'}</span>
                          {isSelected && <span style={{ color: '#6366f1' }}>●</span>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '24px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Trades Breakdown Tray */}
        {selectedDateKey && selectedTrades.length > 0 && (
          <div style={{
            marginTop: '20px', padding: '16px 18px', background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px', border: '1px solid rgba(229,184,105,0.3)',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6366f1' }}>
                  Trades on {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ({selectedTrades.length} closed trades)
                </span>
              </div>
              <button
                onClick={() => setSelectedDateKey(null)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.7rem',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {selectedTrades.map(t => {
                const pnl = t.pnl || 0;
                const isWin = t.status === 'Win';
                const isLoss = t.status === 'Loss';
                const accent = isWin ? '#10b981' : isLoss ? '#ff3366' : '#f59e0b';
                return (
                  <div
                    key={t.id}
                    onClick={() => onViewTrade(t)}
                    style={{
                      background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)`,
                      borderLeft: `3px solid ${accent}`, borderRadius: '8px', padding: '10px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px',
                          background: t.direction === 'Long' ? 'rgba(16,185,129,0.15)' : 'rgba(255,51,102,0.15)',
                          color: t.direction === 'Long' ? '#10b981' : '#ff3366'
                        }}>
                          {t.direction}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{t.pair}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {t.strategy || 'Standard Setup'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: accent, fontFamily: 'var(--font-mono)' }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#6366f1', textDecoration: 'underline' }}>View Details</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Daily P&L Bar Chart & Day of Week / Directional Analysis ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Daily P&L Bar Chart */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Daily Net P&L Bars
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Profits (above 0) vs Losses (below 0)
              </p>
            </div>
            
            {/* Range Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px' }}>
              {(['14d', '30d', 'all'] as const).map(rng => (
                <button
                  key={rng}
                  onClick={() => setBarRange(rng)}
                  style={{
                    padding: '4px 8px', borderRadius: '6px', border: 'none',
                    background: barRange === rng ? 'rgba(229,184,105,0.2)' : 'transparent',
                    color: barRange === rng ? '#6366f1' : 'var(--text-muted)',
                    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {rng === '14d' ? '14D' : rng === '30d' ? '30D' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {dailyBarData.length > 0 ? (
            <div style={{ position: 'relative' }}>
              {(() => {
                const bW = 500;
                const bH = 175;
                const yBase = bH / 2;
                const maxAbs = Math.max(...dailyBarData.map(d => Math.abs(d.pnl)), 100);
                const barWidth = Math.max(8, Math.min(22, (bW - 40) / dailyBarData.length - 4));

                return (
                  <svg viewBox={`0 0 ${bW} ${bH}`} preserveAspectRatio="none" style={{ width: '100%', height: '180px', display: 'block' }}>
                    <defs>
                      <linearGradient id="bar-win" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="bar-loss" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#ff3366" />
                      </linearGradient>
                    </defs>

                    {/* Zero baseline */}
                    <line x1={20} y1={yBase} x2={bW - 20} y2={yBase} stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeDasharray="3 3" />

                    {/* Bars */}
                    {dailyBarData.map((d, i) => {
                      const x = 24 + i * ((bW - 48) / Math.max(dailyBarData.length - 1, 1));
                      const isWin = d.pnl >= 0;
                      const barH = Math.max(3, (Math.abs(d.pnl) / maxAbs) * (yBase - 22));
                      const y = isWin ? yBase - barH : yBase;

                      return (
                        <g key={d.date}>
                          <rect
                            x={x - barWidth / 2}
                            y={y}
                            width={barWidth}
                            height={barH}
                            rx={3}
                            fill={isWin ? 'url(#bar-win)' : 'url(#bar-loss)'}
                            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                            onMouseEnter={() => setBarTooltip({ x, y: isWin ? y : y + barH, date: d.label, pnl: d.pnl, count: d.count, wins: d.wins, losses: d.losses })}
                            onMouseLeave={() => setBarTooltip(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

              {barTooltip && (
                <div style={{
                  position: 'absolute', pointerEvents: 'none',
                  left: `${(barTooltip.x / 500) * 100}%`, top: `${(barTooltip.y / 175) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                  background: 'rgba(7,9,14,0.96)', border: '1px solid rgba(229,184,105,0.4)',
                  borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 10
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{barTooltip.date}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: barTooltip.pnl >= 0 ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                    {barTooltip.pnl >= 0 ? '+' : ''}{formatCurrency(barTooltip.pnl)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {barTooltip.count} trades ({barTooltip.wins}W · {barTooltip.losses}L)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No trading days recorded yet.
            </div>
          )}
        </div>

        {/* Day of Week Edge & Directional Long/Short Analysis */}
        <div style={{
          background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Weekday & Directional Edge
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Performance by day of week & market bias
                </p>
              </div>
              <div style={{ color: '#6366f1' }}>
                <IconCompass />
              </div>
            </div>

            {/* Weekday bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {weekdayStats.map(wd => {
                const isPositive = wd.pnl >= 0;
                return (
                  <div key={wd.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ width: '35px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {wd.name}
                    </span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(wd.winRate, 100)}%`, height: '100%',
                        background: wd.count > 0 ? (isPositive ? '#10b981' : '#ff3366') : 'transparent',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <div style={{ minWidth: '90px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: wd.count > 0 ? (isPositive ? '#10b981' : '#ff3366') : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {wd.count > 0 ? `${isPositive ? '+' : ''}${formatCurrency(wd.pnl)}` : 'No trades'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long vs Short Ratio */}
          <div style={{
            padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981' }}>LONG</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{directionStats.long.count} trades</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: directionStats.long.pnl >= 0 ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                {directionStats.long.pnl >= 0 ? '+' : ''}{formatCurrency(directionStats.long.pnl)}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {Math.round(directionStats.long.winRate)}% Win Rate
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ff3366' }}>SHORT</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{directionStats.short.count} trades</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: directionStats.short.pnl >= 0 ? '#10b981' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                {directionStats.short.pnl >= 0 ? '+' : ''}{formatCurrency(directionStats.short.pnl)}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {Math.round(directionStats.short.winRate)}% Win Rate
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 4: Recent Trades List ── */}
      <div style={{
        background: 'rgba(10,12,22,0.7)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', padding: '20px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recent Trades</p>
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last {recentTrades.length} entries</p>
          </div>
          <button onClick={() => onNavigate('trades')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: 'none',
              background: 'rgba(229,184,105,0.12)', color: '#6366f1', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,184,105,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,184,105,0.12)'}
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
                  fontSize: '0.65rem', fontWeight: 900,
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
  );
}

export default React.memo(DashboardView);

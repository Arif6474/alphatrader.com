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
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconScale = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IconOrangeCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14.01" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

/* ── Circular Progress Ring ── */
function Ring({ pct, strokeColor, size = 48, stroke = 4 }: { pct: number; strokeColor: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={strokeColor}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Stat Card Component ── */
function StatCard({
  label,
  value,
  sub,
  icon,
  accentColor,
  ring,
  ringMax,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: 'emerald' | 'rose' | 'indigo' | 'amber' | 'gold';
  ring?: number;
  ringMax?: number;
}) {
  const pct = ring !== undefined && ringMax ? Math.min((ring / ringMax) * 100, 100) : undefined;

  const colorStyles = {
    emerald: {
      borderTop: 'border-t-emerald-500',
      text: 'text-emerald-400',
      bgGlow: 'from-emerald-500/15',
      iconBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
      stroke: '#10b981',
    },
    rose: {
      borderTop: 'border-t-rose-500',
      text: 'text-rose-400',
      bgGlow: 'from-rose-500/15',
      iconBg: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
      stroke: '#ff3366',
    },
    indigo: {
      borderTop: 'border-t-indigo-500',
      text: 'text-indigo-400',
      bgGlow: 'from-indigo-500/15',
      iconBg: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
      stroke: '#6366f1',
    },
    amber: {
      borderTop: 'border-t-amber-500',
      text: 'text-amber-400',
      bgGlow: 'from-amber-500/15',
      iconBg: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
      stroke: '#f59e0b',
    },
    gold: {
      borderTop: 'border-t-amber-400',
      text: 'text-amber-300',
      bgGlow: 'from-amber-400/15',
      iconBg: 'bg-amber-400/10 border-amber-400/25 text-amber-300',
      stroke: '#d4af37',
    },
  }[accentColor];

  return (
    <div
      className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 border-t-2 ${colorStyles.borderTop} backdrop-blur-md min-h-[135px] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl hover:shadow-black/60 group cursor-default`}
    >
      {/* Top Ambient Glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${colorStyles.bgGlow} to-transparent pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-300`}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className={`text-2xl sm:text-[1.75rem] font-black font-mono leading-none tracking-tight ${colorStyles.text} transition-transform duration-200 group-hover:scale-[1.02] truncate`}>
            {value}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          {pct !== undefined ? (
            <div className="relative">
              <Ring pct={pct} strokeColor={colorStyles.stroke} size={48} stroke={4} />
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono ${colorStyles.text}`}>
                {Math.round(pct)}%
              </span>
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${colorStyles.iconBg}`}>
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Card Subtitle */}
      <span className="text-xs font-medium text-slate-400 relative z-10 truncate mt-3">{sub}</span>
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
      date: pt.index === 0 ? 'Start' : formatDate(pt.date),
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
      const seg = points
        .map((p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
        })
        .join(' ');
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
    }).filter(d => d.count > 0 || (d.name !== 'Sun' && d.name !== 'Sat'));

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
        short: { count: shortTrades.length, pnl: shortPnl, winRate: shortWinRate },
      },
    };
  }, [trades]);

  const { metrics, balanceHistory, points, linePath, areaPath, recentTrades, W, H, isUp, weekdayStats, directionStats } = stats;

  const pfValue = metrics.profitFactor.value;
  const pfAccent: 'emerald' | 'amber' | 'rose' = metrics.profitFactor.isZeroLoss
    ? (metrics.profitFactor.isInfinite ? 'emerald' : 'amber')
    : (pfValue !== null && pfValue >= 1.5 ? 'emerald' : pfValue !== null && pfValue >= 1.0 ? 'amber' : 'rose');

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
    <div className="w-full pb-8">
      {/* ── Currency Notice ── */}
      {metrics.hasMixedCurrencies && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs shadow-md backdrop-blur-sm mb-6">
          <span>
            ⚠️ <strong>Currency Notice:</strong> Multiple currencies detected ({metrics.unsupportedCurrencies.join(', ')}). Totals are displayed without foreign exchange conversion.
          </span>
        </div>
      )}

      {/* ── KPI Grid: 8 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Net P&L"
          value={`${metrics.netPnl >= 0 ? '+' : ''}${formatCurrency(metrics.netPnl)}`}
          sub={`${metrics.closedTradesCount} closed trades (fees: ${formatCurrency(metrics.totalFees)})`}
          icon={<IconPnl />}
          accentColor={isUp ? 'emerald' : 'rose'}
        />
        <StatCard
          label="Win Rate"
          value={`${Math.round(metrics.winRate)}%`}
          sub={`${metrics.winCount}W · ${metrics.lossCount}L · ${metrics.breakevenCount}BE`}
          icon={<IconTarget />}
          accentColor="indigo"
          ring={metrics.winRate}
          ringMax={100}
        />
        <StatCard
          label="Profit Factor"
          value={metrics.profitFactor.display}
          sub={metrics.profitFactor.isZeroLoss ? (metrics.profitFactor.isInfinite ? 'Zero gross loss' : 'No closed trades') : 'Gross profit ÷ gross loss'}
          icon={<IconScale />}
          accentColor={pfAccent}
        />
        <StatCard
          label="Expectancy"
          value={`${metrics.netExpectancyPerTrade >= 0 ? '+' : ''}${formatCurrency(metrics.netExpectancyPerTrade)}`}
          sub="Average net return per trade"
          icon={<IconStar />}
          accentColor={metrics.netExpectancyPerTrade >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          label="Max Drawdown"
          value={`${metrics.maxDrawdownPercent.toFixed(2)}%`}
          sub={`Peak-to-valley (${formatCurrency(metrics.maxDrawdownAmount)})`}
          icon={<IconAlert />}
          accentColor="rose"
        />
        <StatCard
          label="Avg Realized R"
          value={metrics.avgRealizedR !== null ? `${metrics.avgRealizedR}R` : '—'}
          sub={metrics.validRTradesCount > 0 ? `${metrics.validRTradesCount} trades with planned risk` : 'No stop-loss recorded'}
          icon={<IconActivity />}
          accentColor="indigo"
        />
        <StatCard
          label="Total Trades"
          value={String(metrics.totalTrades)}
          sub={`${metrics.closedTradesCount} closed · ${metrics.activeTradesCount} open`}
          icon={<IconLayers />}
          accentColor="gold"
        />
        <StatCard
          label="Active Trades"
          value={String(metrics.activeTradesCount)}
          sub="Currently open positions"
          icon={<IconZap />}
          accentColor={metrics.activeTradesCount > 0 ? 'amber' : 'indigo'}
        />
      </div>

      {/* ── Section 1: Equity Curve & Outcome Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Equity Curve (Performance Curve) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md overflow-hidden shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/10 group min-h-[290px]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Performance Curve</p>
              <p className="text-xs text-slate-400 mt-1">Cumulative account equity over time</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
              <p className={`text-xl sm:text-2xl font-black font-mono tracking-tight mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(balanceHistory[balanceHistory.length - 1].balance)}
              </p>
            </div>
          </div>

          {points.length > 1 ? (
            <div className="relative w-full">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-48 block">
                <defs>
                  <linearGradient id="dg-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#ff3366'} />
                  </linearGradient>
                  <linearGradient id="dg-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#ff3366'} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#ff3366'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75].map(r => (
                  <line
                    key={r}
                    x1={32}
                    y1={16 + r * (H - 32)}
                    x2={W - 32}
                    y2={16 + r * (H - 32)}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                <path d={areaPath} fill="url(#dg-fill)" />
                <path d={linePath} fill="none" stroke="url(#dg-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={tooltip?.x === p.x ? 6 : 3.5}
                    fill={tooltip?.x === p.x ? '#ffffff' : isUp ? '#10b981' : '#ff3366'}
                    stroke={isUp ? '#10b981' : '#ff3366'}
                    strokeWidth="1.5"
                    className="cursor-crosshair transition-all duration-150"
                    onMouseEnter={() => setTooltip({ x: p.x, y: p.y, val: p.balance, label: p.label })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </svg>
              {tooltip && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-[120%] z-20 px-3 py-2 rounded-xl bg-[#07090e]/95 border border-indigo-500/40 shadow-2xl shadow-black/80 backdrop-blur-md whitespace-nowrap transition-all duration-100"
                  style={{ left: `${(tooltip.x / W) * 100}%`, top: `${(tooltip.y / H) * 100}%` }}
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-0.5">{tooltip.label}</div>
                  <div className={`text-sm font-black font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(tooltip.val)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
              <IconActivity />
              <span className="text-xs">No equity data yet — close a trade to begin.</span>
            </div>
          )}
        </div>

        {/* Trade Outcome Breakdown (Donut Chart) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/10 group min-h-[290px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Outcome Breakdown</p>
              <p className="text-xs text-slate-400 mt-1">Win vs Loss proportion & payoff</p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-tight">
              PF {metrics.profitFactor.display}
            </div>
          </div>

          {metrics.closedTradesCount > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
              {/* Donut Graphic */}
              <div className="relative w-32 h-32 flex-shrink-0 mx-auto sm:mx-0">
                {(() => {
                  const size = 128;
                  const stroke = 14;
                  const r = (size - stroke) / 2;
                  const circ = 2 * Math.PI * r;
                  const total = metrics.closedTradesCount || 1;
                  const winLen = (metrics.winCount / total) * circ;
                  const lossLen = (metrics.lossCount / total) * circ;
                  const beLen = (metrics.breakevenCount / total) * circ;

                  return (
                    <svg width={size} height={size} className="transform -rotate-90">
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                      {/* Win Arc */}
                      {winLen > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={r}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={stroke}
                          strokeDasharray={`${winLen} ${circ - winLen}`}
                          strokeDashoffset={0}
                          className="transition-all duration-500"
                        />
                      )}
                      {/* Loss Arc */}
                      {lossLen > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={r}
                          fill="none"
                          stroke="#ff3366"
                          strokeWidth={stroke}
                          strokeDasharray={`${lossLen} ${circ - lossLen}`}
                          strokeDashoffset={-winLen}
                          className="transition-all duration-500"
                        />
                      )}
                      {/* Breakeven Arc */}
                      {beLen > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={r}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth={stroke}
                          strokeDasharray={`${beLen} ${circ - beLen}`}
                          strokeDashoffset={-(winLen + lossLen)}
                          className="transition-all duration-500"
                        />
                      )}
                    </svg>
                  );
                })()}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black font-mono text-white leading-tight">
                    {Math.round(metrics.winRate)}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Win Rate</span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="flex-1 w-full flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border-l-4 border-emerald-500 transition-all duration-200 hover:bg-emerald-500/15">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-400">Wins</span>
                    <span className="text-[11px] text-slate-400">
                      {metrics.winCount} trades ({((metrics.winCount / metrics.closedTradesCount) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    +{formatCurrency(metrics.grossProfit)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border-l-4 border-rose-500 transition-all duration-200 hover:bg-rose-500/15">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-400">Losses</span>
                    <span className="text-[11px] text-slate-400">
                      {metrics.lossCount} trades ({((metrics.lossCount / metrics.closedTradesCount) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-rose-400">
                    -{formatCurrency(metrics.grossLoss)}
                  </span>
                </div>

                {metrics.breakevenCount > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border-l-4 border-indigo-500 transition-all duration-200 hover:bg-indigo-500/15">
                    <span className="text-xs font-bold text-indigo-400">Breakeven</span>
                    <span className="text-xs font-extrabold font-mono text-indigo-300">
                      {metrics.breakevenCount} trades
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              No closed trades recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Trading Rules Discipline Hub: The 10 Non-Negotiable Rules ── */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-[#090d18]/90 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 mb-8 transition-all duration-300 hover:border-white/10 group">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-indigo-500/10 via-amber-500/5 to-transparent pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-indigo-400">
                  The 10 Non-Negotiable
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-white mt-0.5">
                Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">Rules</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Same rules. Better decisions. A more consistent you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('rules')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-950/40 transition-all duration-200 hover:scale-102 cursor-pointer"
            >
              <span>View Full Rules Poster</span>
              <span className="text-amber-300">→</span>
            </button>
          </div>
        </div>

        {/* 10 Rules Quick Grid (5 columns x 2 rows on large screens) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {[
            { num: '01', title: 'Protect Capital First', color: 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10' },
            { num: '02', title: 'Always Set Stop Loss', color: 'border-rose-500/25 text-rose-400 bg-rose-500/10' },
            { num: '03', title: 'Never Overleverage', color: 'border-amber-500/25 text-amber-400 bg-amber-500/10' },
            { num: '04', title: 'Max Daily Risk Limit', color: 'border-blue-500/25 text-blue-400 bg-blue-500/10' },
            { num: '05', title: 'Follow Trading Plan', color: 'border-purple-500/25 text-purple-400 bg-purple-500/10' },
            { num: '06', title: 'Never Revenge Trade', color: 'border-rose-600/25 text-rose-500 bg-rose-600/10' },
            { num: '07', title: 'Never Trade on FOMO', color: 'border-sky-500/25 text-sky-400 bg-sky-500/10' },
            { num: '08', title: 'Avoid Overtrading', color: 'border-emerald-400/25 text-emerald-300 bg-emerald-400/10' },
            { num: '09', title: 'Accept Your Losses', color: 'border-amber-500/25 text-amber-300 bg-amber-500/10' },
            { num: '10', title: 'Review Every Trade', color: 'border-violet-500/25 text-violet-400 bg-violet-500/10' },
          ].map(r => (
            <div
              key={r.num}
              onClick={() => onNavigate('rules')}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-pointer group/item"
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0 ${r.color}`}>
                {r.num}
              </div>
              <div className="text-xs font-bold text-slate-300 group-hover/item:text-white truncate">
                {r.title}
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Quote Ribbon with Mountain Backdrop */}
        <div
          onClick={() => onNavigate('rules')}
          className="relative overflow-hidden rounded-xl bg-[#070b14] border border-white/10 p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3 cursor-pointer group/banner"
        >
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-indigo-500" />
            <p className="text-xs sm:text-sm font-semibold text-slate-300">
              <span className="text-white font-black">Discipline today</span> builds the trader{' '}
              <span className="italic font-serif text-amber-300 font-bold">you want tomorrow.</span>
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-400 group-hover/banner:translate-x-1 transition-transform">
            Open Interactive Rules Hub →
          </span>
        </div>
      </div>

      {/* ── Section 2: Trading Daily Profit / Loss Calendar ── */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 mb-8 transition-all duration-300 hover:border-white/10">
        {/* Calendar Header with Navigation Pill & Title */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 transition-transform duration-200 hover:scale-105">
              <IconCalendar />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Daily Profit & Loss Calendar
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 uppercase tracking-wider">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Day-by-day trading performance, win/loss color maps, and trade volume
              </p>
            </div>
          </div>

          {/* Month Navigator Controls — Matching Screenshot Pill */}
          <div ref={datePickerRef} className="relative">
            <div className="inline-flex items-center bg-[#0c1322] border border-white/10 rounded-full p-1 shadow-lg shadow-black/50 backdrop-blur-md transition-all duration-200 hover:border-white/20">
              {/* Prev Month Button */}
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                  setSelectedDateKey(null);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <IconChevronLeft />
              </button>

              {/* Center Month Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setPickerYear(calendarMonth.getFullYear());
                  setIsDatePickerOpen(prev => !prev);
                  setIsYearDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1 text-sm font-extrabold text-white hover:opacity-85 transition-opacity cursor-pointer"
              >
                <IconOrangeCalendar />
                <span>{calendarData.monthName}</span>
              </button>

              {/* Next Month Button */}
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                  setSelectedDateKey(null);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Next Month"
              >
                <IconChevronRight />
              </button>
            </div>

            {/* Month & Year Picker Popover Modal */}
            {isDatePickerOpen && (
              <div className="absolute top-full right-0 mt-2.5 w-80 p-5 rounded-2xl bg-[#0c1322] border border-white/10 shadow-2xl shadow-black/90 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header: Year Selector + Nav Arrows */}
                <div className="flex items-center justify-between mb-3.5">
                  {/* Year Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsYearDropdownOpen(prev => !prev)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-extrabold text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span>{pickerYear}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Year Options Dropdown */}
                    {isYearDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-24 max-h-44 overflow-y-auto p-1 rounded-xl bg-[#090e1a] border border-white/15 shadow-2xl shadow-black z-60">
                        {availableYears.map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setPickerYear(yr);
                              setIsYearDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              yr === pickerYear ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Jump Arrows */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerYear(prev => prev - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Previous Year"
                    >
                      <IconChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerYear(prev => prev + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Next Year"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* 12 Months Grid (3 columns x 4 rows) */}
                <div className="grid grid-cols-3 gap-2.5 my-4">
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
                        className={`h-11 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border border-blue-400/40 text-white font-extrabold shadow-lg shadow-blue-600/50 scale-[1.02]'
                            : 'bg-white/[0.03] border border-white/5 text-slate-200 font-bold hover:bg-white/10 hover:border-white/15 hover:text-white active:scale-95'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-bold">
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
                    className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors active:scale-95 cursor-pointer"
                  >
                    <IconRefresh />
                    <span>Current Month</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen(false);
                      setIsYearDropdownOpen(false);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 mb-5 rounded-xl bg-black/40 border border-white/5">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Net P&L</div>
            <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${calendarData.monthPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {calendarData.monthPnl >= 0 ? '+' : ''}{formatCurrency(calendarData.monthPnl)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trading Days</div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {calendarData.activeDays} <span className="text-xs font-normal text-slate-400">({calendarData.monthTradesCount} trades)</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Win / Loss Days</div>
            <div className="text-base sm:text-lg font-black font-mono text-indigo-400 mt-0.5">
              <span className="text-emerald-400">{calendarData.winningDays}W</span> · <span className="text-rose-400">{calendarData.losingDays}L</span>
              <span className="text-xs font-semibold text-slate-400 ml-1.5">({Math.round(calendarData.dailyWinRate)}%)</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Day</div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
              {calendarData.bestDay ? `+${formatCurrency(calendarData.bestDay.pnl)}` : '—'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Worst Day</div>
            <div className="text-base sm:text-lg font-black font-mono text-rose-400 mt-0.5">
              {calendarData.worstDay ? `${formatCurrency(calendarData.worstDay.pnl)}` : '—'}
            </div>
          </div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[660px]">
            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className={`py-1 ${idx >= 5 ? 'text-slate-500' : 'text-slate-300'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarData.days.map((item, idx) => {
                const hasTrades = item.count > 0;
                const isWinDay = item.netPnl > 0.005;
                const isLossDay = item.netPnl < -0.005;
                const isSelected = selectedDateKey === item.dateKey;

                let cellClasses = 'bg-white/[0.02] border-white/5 text-slate-500';
                let pnlClasses = 'text-slate-400';

                if (item.isCurrentMonth && hasTrades) {
                  if (isWinDay) {
                    cellClasses = 'bg-emerald-500/10 border-emerald-500/35 hover:border-emerald-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/40 cursor-pointer';
                    pnlClasses = 'text-emerald-400';
                  } else if (isLossDay) {
                    cellClasses = 'bg-rose-500/10 border-rose-500/35 hover:border-rose-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-950/40 cursor-pointer';
                    pnlClasses = 'text-rose-400';
                  } else {
                    cellClasses = 'bg-amber-500/10 border-amber-500/35 hover:border-amber-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-950/40 cursor-pointer';
                    pnlClasses = 'text-amber-400';
                  }
                }

                if (isSelected) {
                  cellClasses += ' ring-2 ring-indigo-500 border-indigo-400 scale-[1.02] shadow-xl';
                }

                return (
                  <div
                    key={`${item.dateKey}-${idx}`}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDateKey(prev => prev === item.dateKey ? null : item.dateKey);
                      }
                    }}
                    className={`min-h-[78px] p-2.5 rounded-xl flex flex-col justify-between border transition-all duration-200 relative ${cellClasses} ${
                      item.isCurrentMonth ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    {/* Top Row: Day Number & Today Pill */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold ${item.isToday ? 'text-indigo-400' : item.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.dayNum}
                      </span>
                      {item.isToday && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 uppercase tracking-tight">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Middle: Net P&L & Trades count */}
                    {hasTrades ? (
                      <div className="mt-1">
                        <div className={`text-xs sm:text-sm font-black font-mono truncate ${pnlClasses}`}>
                          {item.netPnl >= 0 ? '+' : ''}{formatCurrency(item.netPnl)}
                        </div>
                        <div className="text-[10px] text-white/50 font-semibold flex items-center justify-between mt-0.5">
                          <span>{item.count} {item.count === 1 ? 'trade' : 'trades'}</span>
                          {isSelected && <span className="text-indigo-400 font-bold">●</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Trades Breakdown Tray */}
        {selectedDateKey && selectedTrades.length > 0 && (
          <div className="mt-5 p-5 rounded-xl bg-black/50 border border-indigo-500/30 shadow-2xl shadow-black animate-in fade-in duration-200">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-indigo-400">
                  Trades on {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-slate-400">
                  ({selectedTrades.length} closed trades)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedTrades.map(t => {
                const pnl = t.pnl || 0;
                const isWin = t.status === 'Win';
                const isLoss = t.status === 'Loss';
                const borderAccent = isWin ? 'border-l-emerald-500' : isLoss ? 'border-l-rose-500' : 'border-l-amber-500';
                const textAccent = isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-amber-400';

                return (
                  <div
                    key={t.id}
                    onClick={() => onViewTrade(t)}
                    className={`flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-white/5 border-l-4 ${borderAccent} hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          t.direction === 'Long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {t.direction}
                        </span>
                        <span className="text-sm font-black text-white">{t.pair}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {t.strategy || 'Standard Setup'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black font-mono ${textAccent}`}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <span className="text-[11px] text-indigo-400 underline">View Details</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Daily P&L Bars & Weekday / Directional Edge ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Daily P&L Bar Chart */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/10 group min-h-[290px]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Daily Net P&L Bars</p>
              <p className="text-xs text-slate-400 mt-1">Profits (above 0) vs Losses (below 0)</p>
            </div>

            {/* Range Toggle */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/5">
              {(['14d', '30d', 'all'] as const).map(rng => (
                <button
                  key={rng}
                  type="button"
                  onClick={() => setBarRange(rng)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    barRange === rng ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rng === '14d' ? '14D' : rng === '30d' ? '30D' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {dailyBarData.length > 0 ? (
            <div className="relative w-full my-auto">
              {(() => {
                const bW = 500;
                const bH = 175;
                const yBase = bH / 2;
                const maxAbs = Math.max(...dailyBarData.map(d => Math.abs(d.pnl)), 100);
                const barWidth = Math.max(8, Math.min(22, (bW - 40) / dailyBarData.length - 4));

                return (
                  <svg viewBox={`0 0 ${bW} ${bH}`} preserveAspectRatio="none" className="w-full h-44 block">
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
                    <line x1={20} y1={yBase} x2={bW - 20} y2={yBase} stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="3 3" />

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
                            className="cursor-pointer hover:opacity-85 transition-opacity"
                            onMouseEnter={() =>
                              setBarTooltip({
                                x,
                                y: isWin ? y : y + barH,
                                date: d.label,
                                pnl: d.pnl,
                                count: d.count,
                                wins: d.wins,
                                losses: d.losses,
                              })
                            }
                            onMouseLeave={() => setBarTooltip(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

              {barTooltip && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-[125%] z-20 px-3 py-2 rounded-xl bg-[#07090e]/95 border border-indigo-500/40 shadow-2xl shadow-black/80 backdrop-blur-md whitespace-nowrap transition-all duration-100"
                  style={{ left: `${(barTooltip.x / 500) * 100}%`, top: `${(barTooltip.y / 175) * 100}%` }}
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-0.5">{barTooltip.date}</div>
                  <div className={`text-sm font-black font-mono ${barTooltip.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {barTooltip.pnl >= 0 ? '+' : ''}{formatCurrency(barTooltip.pnl)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {barTooltip.count} trades ({barTooltip.wins}W · {barTooltip.losses}L)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
              No trading days recorded yet.
            </div>
          )}
        </div>

        {/* Day of Week Edge & Directional Long/Short Analysis */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/10 group min-h-[290px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Weekday & Directional Edge</p>
                <p className="text-xs text-slate-400 mt-1">Performance by day of week & market bias</p>
              </div>
              <div className="text-indigo-400">
                <IconCompass />
              </div>
            </div>

            {/* Weekday bars */}
            <div className="flex flex-col gap-2.5 mb-5">
              {weekdayStats.map(wd => {
                const isPositive = wd.pnl >= 0;
                return (
                  <div key={wd.name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="w-8 font-bold text-slate-400">{wd.name}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          wd.count > 0 ? (isPositive ? 'bg-emerald-500' : 'bg-rose-500') : 'transparent'
                        }`}
                        style={{ width: `${Math.min(wd.winRate, 100)}%` }}
                      />
                    </div>
                    <div className={`min-w-24 text-right font-black font-mono ${
                      wd.count > 0 ? (isPositive ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'
                    }`}>
                      {wd.count > 0 ? `${isPositive ? '+' : ''}${formatCurrency(wd.pnl)}` : 'No trades'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long vs Short Ratio */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 mt-auto">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-emerald-400">LONG</span>
                <span className="text-[11px] text-slate-400">{directionStats.long.count} trades</span>
              </div>
              <div className={`text-base font-black font-mono ${directionStats.long.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {directionStats.long.pnl >= 0 ? '+' : ''}{formatCurrency(directionStats.long.pnl)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                {Math.round(directionStats.long.winRate)}% Win Rate
              </div>
            </div>

            <div className="border-l border-white/10 pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-rose-400">SHORT</span>
                <span className="text-[11px] text-slate-400">{directionStats.short.count} trades</span>
              </div>
              <div className={`text-base font-black font-mono ${directionStats.short.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {directionStats.short.pnl >= 0 ? '+' : ''}{formatCurrency(directionStats.short.pnl)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                {Math.round(directionStats.short.winRate)}% Win Rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Recent Trades List ── */}
      <div className="p-6 rounded-2xl bg-[#0a0c16]/80 border border-white/5 backdrop-blur-md shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Recent Trades</p>
            <p className="text-xs text-slate-400 mt-1">Last {recentTrades.length} entries</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('trades')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-all duration-200 hover:gap-2 cursor-pointer"
          >
            <span>View All</span>
            <IconArrow />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentTrades.length > 0 ? (
            recentTrades.map(t => {
              const pnl = t.pnl || 0;
              const rr = t.riskAmount > 0 ? pnl / t.riskAmount : 0;
              const isWin = t.status === 'Win';
              const isLoss = t.status === 'Loss';
              const borderLeft = isWin ? 'border-l-emerald-500' : isLoss ? 'border-l-rose-500' : 'border-l-amber-500';
              const pnlColor = isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-amber-400';

              return (
                <div
                  key={t.id}
                  onClick={() => onViewTrade(t)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 border-l-4 ${borderLeft} hover:bg-white/[0.05] hover:translate-x-1 transition-all duration-200 cursor-pointer`}
                >
                  {/* Direction badge */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      t.direction === 'Long'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {t.direction.slice(0, 1)}
                  </div>

                  {/* Trade info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white tracking-tight">{t.pair}</span>
                      {!t.closed && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {formatDate(t.entryDate)} · {t.strategy}
                    </div>
                  </div>

                  {/* PnL */}
                  <div className="text-right flex-shrink-0">
                    {t.closed ? (
                      <>
                        <div className={`text-sm font-black font-mono ${pnlColor}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </div>
                        <div className={`text-[11px] font-mono font-medium ${rr >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {rr >= 0 ? '+' : ''}{rr.toFixed(1)}R
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        OPEN
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No trades yet. Add your first trade to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardView);

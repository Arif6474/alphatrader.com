'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TradingRule {
  id: number;
  num: string;
  title: string;
  desc: string;
  category: 'Capital' | 'Risk' | 'Execution' | 'Psychology' | 'Review';
  actionTip: string;
  color: {
    border: string;
    borderGlow: string;
    text: string;
    badge: string;
    bgGlow: string;
    iconStroke: string;
    shadow: string;
  };
  icon: React.ReactNode;
}

const TRADING_RULES: TradingRule[] = [
  {
    id: 1,
    num: '01',
    title: 'Protect Your Capital First',
    desc: 'Your capital is your most important asset. Preserve it, so you can stay in the game long enough to grow.',
    category: 'Capital',
    actionTip: 'Never risk more than 1-2% per trade. Survival precedes profitability.',
    color: {
      border: 'border-emerald-500/20 group-hover:border-emerald-500/50',
      borderGlow: 'hover:shadow-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      bgGlow: 'from-emerald-500/10',
      iconStroke: '#10b981',
      shadow: 'shadow-emerald-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    )
  },
  {
    id: 2,
    num: '02',
    title: 'Always Set a Stop Loss',
    desc: 'Every trade must have a predefined stop loss. No stop loss, no trade.',
    category: 'Risk',
    actionTip: 'Place your stop at a market structure invalidation level before clicking buy or sell.',
    color: {
      border: 'border-rose-500/20 group-hover:border-rose-500/50',
      borderGlow: 'hover:shadow-rose-500/10',
      text: 'text-rose-400',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      bgGlow: 'from-rose-500/10',
      iconStroke: '#f43f5e',
      shadow: 'shadow-rose-950/30'
    },
    icon: (
      <div className="flex flex-col items-center justify-center">
        <div className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black font-mono tracking-wider">
          SL
        </div>
        <div className="w-10 h-0.5 bg-rose-500/40 relative mt-2 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/60 ring-2 ring-rose-500/20" />
        </div>
      </div>
    )
  },
  {
    id: 3,
    num: '03',
    title: 'Never Overleverage',
    desc: 'Keep your position size reasonable. Leverage is a tool, not a shortcut to profits.',
    category: 'Capital',
    actionTip: 'Size by monetary risk amount, never by how many lots your broker margin permits.',
    color: {
      border: 'border-amber-500/20 group-hover:border-amber-500/50',
      borderGlow: 'hover:shadow-amber-500/10',
      text: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      bgGlow: 'from-amber-500/10',
      iconStroke: '#f59e0b',
      shadow: 'shadow-amber-950/30'
    },
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v17M12 21h4M12 21H8" />
        <path d="M5 8l7-2 7 2" />
        <path d="M5 8l-3 6h6l-3-6z" />
        <path d="M19 8l-3 6h6l-3-6z" />
      </svg>
    )
  },
  {
    id: 4,
    num: '04',
    title: 'Never Risk More Than Your Daily Limit',
    desc: 'Set a maximum daily loss and stick to it. When your limit is reached, stop trading.',
    category: 'Risk',
    actionTip: 'Hit -2R for the day? Shut the screens immediately. The market will be there tomorrow.',
    color: {
      border: 'border-blue-500/20 group-hover:border-blue-500/50',
      borderGlow: 'hover:shadow-blue-500/10',
      text: 'text-blue-400',
      badge: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      bgGlow: 'from-blue-500/10',
      iconStroke: '#3b82f6',
      shadow: 'shadow-blue-950/30'
    },
    icon: (
      <div className="relative flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3" />
        </svg>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shadow-md">
          ↓
        </div>
      </div>
    )
  },
  {
    id: 5,
    num: '05',
    title: 'Follow Your Trading Plan',
    desc: 'Have a clear plan for entry, exit, risk, and position size. Trade your plan, not your opinions.',
    category: 'Execution',
    actionTip: 'If a setup doesn\'t check all criteria in your pre-trade checklist, do not execute.',
    color: {
      border: 'border-purple-500/20 group-hover:border-purple-500/50',
      borderGlow: 'hover:shadow-purple-500/10',
      text: 'text-purple-400',
      badge: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      bgGlow: 'from-purple-500/10',
      iconStroke: '#a855f7',
      shadow: 'shadow-purple-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
        <circle cx="18" cy="18" r="4" fill="#6b21a8" stroke="#a855f7" strokeWidth="1.5" />
        <polyline points="16.5 18 17.5 19 19.5 17" stroke="#ffffff" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 6,
    num: '06',
    title: 'Never Revenge Trade',
    desc: 'A loss is part of the process. Don\'t try to recover it with impulsive trades. Stay calm and move on.',
    category: 'Psychology',
    actionTip: 'Take a compulsory 15-minute breather away from your desk after any loss.',
    color: {
      border: 'border-rose-600/25 group-hover:border-rose-500/50',
      borderGlow: 'hover:shadow-rose-600/10',
      text: 'text-rose-500',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      bgGlow: 'from-rose-600/10',
      iconStroke: '#ff3366',
      shadow: 'shadow-rose-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 9l2 1" />
        <path d="M16 9l-2 1" />
        <path d="M9 15s1.5-1.5 3-1.5 3 1.5 3 1.5" />
        <circle cx="18" cy="18" r="4" fill="#881337" stroke="#ff3366" strokeWidth="1.5" />
        <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" stroke="#ffffff" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 7,
    num: '07',
    title: 'Never Trade Out of FOMO',
    desc: 'Don\'t enter a trade just because you\'re afraid of missing out. Wait for your valid setup.',
    category: 'Psychology',
    actionTip: 'Missed a massive candle? Celebrate that the market moved, and wait for the pullback or next setup.',
    color: {
      border: 'border-sky-500/20 group-hover:border-sky-500/50',
      borderGlow: 'hover:shadow-sky-500/10',
      text: 'text-sky-400',
      badge: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      bgGlow: 'from-sky-500/10',
      iconStroke: '#0ea5e9',
      shadow: 'shadow-sky-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="2" y1="2" x2="22" y2="22" stroke="#38bdf8" strokeWidth="2.5" />
      </svg>
    )
  },
  {
    id: 8,
    num: '08',
    title: 'Avoid Overtrading',
    desc: 'Quality over quantity. Only take trades that meet your strategy criteria. No setup, no trade.',
    category: 'Execution',
    actionTip: 'Top performers take 1 to 3 high-conviction trades per day, not 15 random scalps.',
    color: {
      border: 'border-emerald-400/20 group-hover:border-emerald-400/50',
      borderGlow: 'hover:shadow-emerald-400/10',
      text: 'text-emerald-300',
      badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      bgGlow: 'from-emerald-400/10',
      iconStroke: '#10b981',
      shadow: 'shadow-emerald-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="14" width="4" height="7" rx="1.5" fill="#10b981" fillOpacity="0.3" />
        <rect x="10" y="9" width="4" height="12" rx="1.5" fill="#10b981" fillOpacity="0.6" />
        <rect x="17" y="4" width="4" height="17" rx="1.5" fill="#10b981" fillOpacity="0.9" />
      </svg>
    )
  },
  {
    id: 9,
    num: '09',
    title: 'Accept Your Losses',
    desc: 'Not every trade will be a winner. Accept losses, learn from them, and stay disciplined.',
    category: 'Psychology',
    actionTip: 'View losses as the cost of doing business, like electricity for a storefront.',
    color: {
      border: 'border-amber-500/20 group-hover:border-amber-500/50',
      borderGlow: 'hover:shadow-amber-500/10',
      text: 'text-amber-300',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      bgGlow: 'from-amber-500/10',
      iconStroke: '#f97316',
      shadow: 'shadow-amber-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 11c1.5 0 3 .5 3 2.5 0 2-1.5 3-2 4.5-.5 1.5-.5 3-2 3H9c-1.5 0-2-1-2.5-2.5C6 17 5 15.5 5 13.5 5 11.5 6.5 11 8 11" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <path d="M12 7.5c-.8-1-2.2-1-3 0s-.8 2.2 0 3l3 3 3-3c.8-.8.8-2.2 0-3s-2.2-1-3 0z" fill="#f97316" fillOpacity="0.3" stroke="#f97316" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 10,
    num: '10',
    title: 'Review Every Trade',
    desc: 'Track your trades, analyze your mistakes, and learn continuously. Your journal is your edge.',
    category: 'Review',
    actionTip: 'Take 5 minutes at the end of every trading session to log your emotions and execution quality.',
    color: {
      border: 'border-violet-500/20 group-hover:border-violet-500/50',
      borderGlow: 'hover:shadow-violet-500/10',
      text: 'text-violet-400',
      badge: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
      bgGlow: 'from-violet-500/10',
      iconStroke: '#8b5cf6',
      shadow: 'shadow-violet-950/30'
    },
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="12" x2="9" y2="15" stroke="#a78bfa" strokeWidth="2" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="#a78bfa" strokeWidth="2" />
        <line x1="15" y1="6" x2="15" y2="15" stroke="#a78bfa" strokeWidth="2" />
      </svg>
    )
  }
];

export default function TradingRulesView() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [pledged, setPledged] = useState<boolean>(false);
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // Load daily pledge from localStorage
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('alphatrader_rules_pledge_date');
      if (savedDate === today) {
        setPledged(true);
      }
      const savedChecks = localStorage.getItem(`alphatrader_rules_checks_${today}`);
      if (savedChecks) {
        setCheckedRules(JSON.parse(savedChecks));
      }
    } catch (e) {
      // localStorage fallback
    }
  }, []);

  const handleTogglePledge = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextState = !pledged;
    setPledged(nextState);
    if (nextState) {
      localStorage.setItem('alphatrader_rules_pledge_date', today);
      const allChecked: Record<number, boolean> = {};
      TRADING_RULES.forEach(r => (allChecked[r.id] = true));
      setCheckedRules(allChecked);
      localStorage.setItem(`alphatrader_rules_checks_${today}`, JSON.stringify(allChecked));
    } else {
      localStorage.removeItem('alphatrader_rules_pledge_date');
    }
  };

  const handleToggleCheck = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...checkedRules, [id]: !checkedRules[id] };
    setCheckedRules(updated);
    localStorage.setItem(`alphatrader_rules_checks_${today}`, JSON.stringify(updated));
  };

  const checkedCount = Object.values(checkedRules).filter(Boolean).length;

  const filteredRules = activeCategory === 'All'
    ? TRADING_RULES
    : TRADING_RULES.filter(r => r.category === activeCategory);

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ── Top Atmospheric Candlestick Backdrop & Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090d18] border border-white/5 p-6 sm:p-10 mb-8 shadow-2xl shadow-black/80">
        {/* Background Candlesticks Glow Watermark */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 300 300" className="w-full h-full text-indigo-400">
            <line x1="40" y1="20" x2="40" y2="180" stroke="currentColor" strokeWidth="2" />
            <rect x="30" y="50" width="20" height="90" fill="currentColor" rx="2" />
            <line x1="100" y1="40" x2="100" y2="240" stroke="currentColor" strokeWidth="2" />
            <rect x="90" y="80" width="20" height="110" fill="currentColor" rx="2" />
            <line x1="160" y1="60" x2="160" y2="280" stroke="currentColor" strokeWidth="2" />
            <rect x="150" y="110" width="20" height="120" fill="currentColor" rx="2" />
            <line x1="220" y1="30" x2="220" y2="210" stroke="currentColor" strokeWidth="2" />
            <rect x="210" y="70" width="20" height="100" fill="currentColor" rx="2" />
          </svg>
        </div>

        {/* Top Navbar Row */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">Alpha</span>
                <span className="text-lg font-black tracking-tight text-indigo-400">Trader</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                Journal · Analyze · Improve
              </div>
            </div>
          </div>

          {/* Right Tagline */}
          <div className="text-right">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-300">
              Discipline Builds
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-indigo-400">
              Better Traders
            </div>
          </div>
        </div>

        {/* Hero Title Area */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-black tracking-[0.25em] uppercase mb-4 shadow-md">
            <span>The 10 Non-Negotiable</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-none mb-3">
            <span className="text-white">Trading </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 drop-shadow-sm">
              Rules
            </span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-300">
            Same rules. Better decisions. A more consistent you.
          </p>
        </div>

        {/* Daily Session Commitment Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e1424] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${
              pledged ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              {pledged ? '✓' : '10'}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Daily Discipline Commitment</span>
                {pledged && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase tracking-wide">
                    Pledged
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {checkedCount} of 10 rules checked for today&apos;s active trading session
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleTogglePledge}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md ${
                pledged
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
              }`}
            >
              <span>{pledged ? '✓ Re-Pledge Discipline' : 'Commit To Rules Today'}</span>
            </button>
            <Link
              href="/psychology"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
              title="Psychology & Discipline Engine"
            >
              Psychology View →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Capital', 'Risk', 'Execution', 'Psychology', 'Review'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#0a0d18] text-slate-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-400">
          Showing {filteredRules.length} of 10 rules
        </div>
      </div>

      {/* ── The 10 Non-Negotiable Rules Grid (2 Columns) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {filteredRules.map(rule => {
          const isChecked = !!checkedRules[rule.id];
          const isExpanded = expandedRule === rule.id;

          return (
            <div
              key={rule.id}
              onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
              className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-[#0a0e1a]/90 border ${rule.color.border} backdrop-blur-xl shadow-xl shadow-black/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${rule.color.borderGlow} cursor-pointer overflow-hidden`}
            >
              {/* Ambient Radial Gradient Accent */}
              <div
                className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${rule.color.bgGlow} to-transparent pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-300 rounded-tr-2xl`}
              />

              <div>
                {/* Card Top: Number Pill Badge & Checkbox */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-black font-mono tracking-wider ${rule.color.badge}`}>
                    {rule.num}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleCheck(rule.id, e)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/40'
                          : 'bg-white/5 text-transparent hover:text-white/40 border border-white/10 hover:border-white/20'
                      }`}
                      title={isChecked ? 'Mark rule as adhered' : 'Click to check'}
                    >
                      ✓
                    </button>
                  </div>
                </div>

                {/* Card Middle: Icon Container & Content */}
                <div className="flex items-start gap-4 mb-3 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-md ${rule.color.shadow}`}>
                    {rule.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white tracking-tight group-hover:text-slate-100 transition-colors">
                      {rule.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1 font-normal">
                      {rule.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Practical Action Tip */}
              <div className="mt-4 pt-3.5 border-t border-white/5 relative z-10">
                {isExpanded ? (
                  <div className="animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 mb-1">
                      <span>💡 Execution Directive</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium bg-black/40 p-2.5 rounded-xl border border-white/5">
                      {rule.actionTip}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                    <span>Click card to view execution directive</span>
                    <span className="text-indigo-400 font-bold">→</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Mountain Summit Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#070b14] border border-white/10 shadow-2xl shadow-black/80">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/trader_mountain_summit.jpg"
            alt="Trader standing on mountain summit at sunset"
            className="w-full h-full object-cover object-right opacity-80"
          />
          {/* Subtle Dark Gradient Overlay across the image so text stays 100% legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/85 to-transparent sm:via-[#070b14]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/90 via-transparent to-transparent" />
        </div>

        {/* Banner Content (Left Aligned on top of mountain ridge background) */}
        <div className="relative z-10 p-8 sm:p-12 max-w-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">
            Remember
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Discipline today<br />
            builds the trader{' '}
            <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
              you want tomorrow.
            </span>
          </h2>
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/lib/db';
import { CloseIcon, UploadIcon } from './Icons';
import type { Account } from './AccountManagerModal';
import { evaluateSingleTrade, getStandardContractSize } from '@/lib/calculations';
import toast from 'react-hot-toast';

interface TradeModalProps {
  trade?: Trade | null; // If present, we are editing
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: any) => Promise<void>;
  currentBalance: number;
  accounts?: Account[];
  defaultAccountId?: string;
}

type TabType = 'basic' | 'results' | 'psychology' | 'charts';

const MAJOR_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'BTCUSD', 'ETHUSD', 'SPY', 'QQQ', 'GOLD'
];

const EMOTIONS = ['Calm', 'Excited', 'Fearful', 'Greedy', 'Confident', 'Anxious', 'Frustrated', 'Neutral'];

const DISCIPLINE_FACTORS = [
  'FOMO', 'Revenge Trading', 'Overconfidence', 'Fear', 'Greed', 'Impatience', 
  'Hesitation', 'Anxiety', 'Excitement', 'Boredom', 'Frustration', 'Discipline', 'Patience', 'None'
];


function calculateDuration(start: string, end: string) {
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return '';
    const diffMs = e - s;
    if (diffMs <= 0) return '0m';
    
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  } catch (err) {
    return '';
  }
}

function TradeModal({ trade, isOpen, onClose, onSave, currentBalance, accounts = [], defaultAccountId = '' }: TradeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [accountId, setAccountId] = useState(defaultAccountId);
  
  // Basic Form States
  const [pair, setPair] = useState('EURUSD');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [strategy, setStrategy] = useState('Trend');
  const [broker, setBroker] = useState('');
  const [session, setSession] = useState('');
  const [tags, setTags] = useState(''); 
  const [mistakes, setMistakes] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [entryReason, setEntryReason] = useState('');
  const [accountBalance, setAccountBalance] = useState<number>(currentBalance);
  const [assetType, setAssetType] = useState<'Forex' | 'Crypto' | 'Stock' | 'Futures'>('Forex');
  const [contractSize, setContractSize] = useState<number>(100000);

  // Results Form States
  const [closed, setClosed] = useState(false);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitDate, setExitDate] = useState('');
  const [fees, setFees] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [lessonsLearned, setLessonsLearned] = useState('');

  // Psychology Form States
  const [psychologyBefore, setPsychologyBefore] = useState<string[]>([]);
  const [psychologyDuring, setPsychologyDuring] = useState<string[]>([]);
  const [psychologyAfter, setPsychologyAfter] = useState<string[]>([]);
  const [psychologyFactors, setPsychologyFactors] = useState<string[]>([]);

  // Charts Form States (URLs/keys)
  const [chartBefore, setChartBefore] = useState('');
  const [chartAfter, setChartAfter] = useState('');
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // Auto Calculations
  const [riskAmount, setRiskAmount] = useState(0);
  const [riskPercentage, setRiskPercentage] = useState(0);
  const [plannedRR, setPlannedRR] = useState(0);
  const [pnl, setPnl] = useState(0);

  // Psychology / Readiness Rules Status
  const [psychologyStatus, setPsychologyStatus] = useState<{
    isLoaded: boolean;
    isCompleted: boolean;
    completedCount: number;
    violations: string[];
  }>({
    isLoaded: false,
    isCompleted: true,
    completedCount: 10,
    violations: []
  });

  const [showRuleConfirmModal, setShowRuleConfirmModal] = useState(false);
  const [pendingTradeData, setPendingTradeData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split('T')[0];

    // Read localStorage first
    try {
      const local = localStorage.getItem(`alphatrader_psych_${today}`);
      if (local) {
        const parsed = JSON.parse(local);
        const pre = parsed.preTradeChecklist;
        if (pre) {
          const v: string[] = [];
          if (!pre.noRevenge) v.push('Revenge Trading active');
          if (!pre.notChasing) v.push('Chasing market moves');
          if (!pre.riskAcceptable) v.push('Risk not strictly defined');
          if (!pre.respectDailyLimits) v.push('Daily stop loss ignored');
          if (!pre.emotionallyNeutral) v.push('Emotional trading active');
          setPsychologyStatus({
            isLoaded: true,
            isCompleted: Boolean(pre.completed),
            completedCount: pre.completedCount || 0,
            violations: v
          });
        }
      }
    } catch {}

    // Async fetch from API
    fetch(`/api/psychology?date=${today}`)
      .then(res => res.json())
      .then(data => {
        const pre = data.current?.preTradeChecklist;
        if (pre) {
          const v: string[] = [];
          if (!pre.noRevenge) v.push('Revenge Trading active');
          if (!pre.notChasing) v.push('Chasing market moves');
          if (!pre.riskAcceptable) v.push('Risk not strictly defined');
          if (!pre.respectDailyLimits) v.push('Daily stop loss ignored');
          if (!pre.emotionallyNeutral) v.push('Emotional trading active');
          setPsychologyStatus({
            isLoaded: true,
            isCompleted: Boolean(pre.completed),
            completedCount: pre.completedCount || 0,
            violations: v
          });
        } else {
          setPsychologyStatus({
            isLoaded: true,
            isCompleted: false,
            completedCount: 0,
            violations: ['Pre-Trade Checklist Not Started Today']
          });
        }
      })
      .catch(() => {
        setPsychologyStatus(prev => ({ ...prev, isLoaded: true }));
      });
  }, [isOpen]);

  // Active Rule Violations for this trade
  const tradeRuleViolations = useMemo(() => {
    const list: string[] = [];

    // Rule 1: Today's Pre-Trade Readiness Checklist
    if (psychologyStatus.isLoaded && !psychologyStatus.isCompleted) {
      list.push('Pre-Trade Checklist incomplete for today');
    }
    if (psychologyStatus.violations.length > 0) {
      psychologyStatus.violations.forEach(v => {
        if (!list.includes(v)) list.push(v);
      });
    }

    // Rule 2: Defined Stop Loss
    if (!stopLossPrice || stopLossPrice <= 0) {
      list.push('No Stop Loss defined (Rule: Never trade without defined risk)');
    }

    // Rule 3: Max Risk % Limit
    if (riskPercentage > 2.5) {
      list.push(`Excessive Risk: ${riskPercentage.toFixed(1)}% of account (Rule: Max recommended 2.0%)`);
    }

    // Rule 4: Dangerous Psychology Factors
    const dangerousFactors = psychologyFactors.filter(f => ['FOMO', 'Revenge Trading', 'Overconfidence', 'Fear', 'Greed', 'Impatience'].includes(f));
    if (dangerousFactors.length > 0) {
      list.push(`High-Risk Psychological State: ${dangerousFactors.join(', ')}`);
    }

    return list;
  }, [psychologyStatus, stopLossPrice, riskPercentage, psychologyFactors]);

  // Initialize/Prefill fields on open or edit change
  useEffect(() => {
    if (isOpen) {
      setActiveTab('basic');
      if (trade) {
        setAccountId(trade.accountId || '');
        setPair(trade.pair);
        setDirection(trade.direction);
        setOrderType(trade.orderType);
        setStrategy(trade.strategy);
        setBroker(trade.broker || '');
        setSession(trade.session || '');
        setTags(trade.tags?.join(', ') || '');
        setMistakes(trade.mistakes?.join(', ') || '');
        setEntryDate(trade.entryDate);
        setLotSize(trade.lotSize);
        setEntryPrice(trade.entryPrice);
        setStopLossPrice(trade.stopLossPrice);
        setTakeProfitPrice(trade.takeProfitPrice);
        setEntryReason(trade.entryReason || '');
        setAccountBalance(trade.accountBalance);
        setAssetType(trade.assetType);
        setContractSize(trade.contractSize);
        
        setClosed(trade.closed);
        setExitPrice(trade.exitPrice || trade.entryPrice);
        setExitDate(trade.exitDate || '');
        setFees(trade.fees || 0);
        setCurrency(trade.currency || 'USD');
        setLessonsLearned(trade.lessonsLearned || '');
        
        setPsychologyBefore(trade.psychologyBefore || []);
        setPsychologyDuring(trade.psychologyDuring || []);
        setPsychologyAfter(trade.psychologyAfter || []);
        setPsychologyFactors(trade.psychologyFactors || []);
        
        setChartBefore(trade.chartBefore || '');
        setChartAfter(trade.chartAfter || '');
      } else {
        // Reset to default
        setPair('EURUSD');
        setDirection('Long');
        setOrderType('Market');
        setStrategy('Trend');
        setBroker('');
        setSession('');
        setTags('');
        setMistakes('');
        
        // Format current local time for datetime-local input (YYYY-MM-DDTHH:MM)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setEntryDate(now.toISOString().slice(0, 16));
        
        setLotSize(1.0);
        setEntryPrice(1.0800);
        setStopLossPrice(1.0780);
        setTakeProfitPrice(1.0850);
        setEntryReason('');
        setAccountBalance(currentBalance);
        setAccountId(defaultAccountId);
        setAssetType('Forex');
        setContractSize(getStandardContractSize('Forex', 'EURUSD'));
        
        setClosed(false);
        setExitPrice(1.0800);
        setExitDate(now.toISOString().slice(0, 16));
        setFees(0);
        setCurrency('USD');
        setLessonsLearned('');
        
        setPsychologyBefore([]);
        setPsychologyDuring([]);
        setPsychologyAfter([]);
        setPsychologyFactors([]);
        
        setChartBefore('');
        setChartAfter('');
      }
    }
  }, [isOpen, trade, currentBalance, defaultAccountId]);

  // Adjust contract size dynamically based on Asset Type and Ticker/Pair
  useEffect(() => {
    if (!trade) {
      setContractSize(getStandardContractSize(assetType, pair));
    }
  }, [assetType, pair, trade]);

  // Perform Real-Time Calculations using authoritative engine
  useEffect(() => {
    const finalMultiplier = contractSize > 0 ? contractSize : getStandardContractSize(assetType, pair);

    const evaluated = evaluateSingleTrade({
      pair,
      direction,
      lotSize,
      contractSize: finalMultiplier,
      entryPrice,
      exitPrice: closed ? exitPrice : undefined,
      stopLossPrice,
      takeProfitPrice,
      closed,
      entryDate,
      exitDate: closed ? exitDate : undefined,
      fees,
      accountBalance,
      currency,
      assetType
    });

    setRiskAmount(evaluated.plannedRiskAmount ?? 0);
    setRiskPercentage(evaluated.plannedRiskPercent ?? 0);
    setPlannedRR(evaluated.plannedRR ?? 0);
    setPnl(evaluated.netPnl ?? 0);
  }, [pair, direction, entryPrice, stopLossPrice, takeProfitPrice, lotSize, accountBalance, assetType, contractSize, closed, exitPrice, fees, currency, entryDate, exitDate]);

  if (!isOpen) return null;

  // File upload to R2 cloud storage handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'before') {
      setUploadingBefore(true);
    } else {
      setUploadingAfter(true);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await res.json();
      if (target === 'before') {
        setChartBefore(data.url);
      } else {
        setChartAfter(data.url);
      }
      toast.success(`${target === 'before' ? 'Before' : 'After'} chart uploaded successfully!`);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error(err.message || 'Error uploading image. Please try again.');
    } finally {
      if (target === 'before') {
        setUploadingBefore(false);
      } else {
        setUploadingAfter(false);
      }
    }
  };

  const togglePill = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const evaluated = evaluateSingleTrade({
      pair,
      direction,
      lotSize,
      contractSize,
      entryPrice,
      exitPrice: closed ? exitPrice : undefined,
      stopLossPrice,
      takeProfitPrice,
      closed,
      entryDate,
      exitDate: closed ? exitDate : undefined,
      fees,
      accountBalance,
      currency,
      assetType
    });

    const tradeData = {
      pair: pair.toUpperCase().trim(),
      direction,
      orderType,
      strategy,
      broker,
      session,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      mistakes: mistakes.split(',').map(m => m.trim()).filter(Boolean),
      tradeDuration: closed && entryDate && exitDate ? calculateDuration(entryDate, exitDate) : undefined,
      entryDate,
      exitDate: closed ? exitDate : undefined,
      closed,
      lotSize,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      exitPrice: closed ? exitPrice : undefined,
      fees: Number(fees) || 0,
      currency,
      entryReason,
      lessonsLearned: closed ? lessonsLearned : '',
      riskAmount: evaluated.plannedRiskAmount ?? riskAmount,
      riskPercentage: evaluated.plannedRiskPercent ?? riskPercentage,
      accountBalance,
      pnl: closed ? (evaluated.netPnl ?? pnl) : undefined,
      grossPnl: closed ? (evaluated.grossPnl ?? undefined) : undefined,
      netPnl: closed ? (evaluated.netPnl ?? undefined) : undefined,
      status: evaluated.status,
      plannedRiskAmount: evaluated.plannedRiskAmount ?? undefined,
      plannedRR: evaluated.plannedRR ?? undefined,
      realizedRR: evaluated.realizedRR ?? undefined,
      psychologyBefore,
      psychologyDuring,
      psychologyAfter,
      psychologyFactors,
      chartBefore,
      chartAfter,
      assetType,
      contractSize,
      accountId: accountId || ''
    };

    // If there are rule violations, prompt warning confirmation dialog before saving
    if (tradeRuleViolations.length > 0) {
      setPendingTradeData(tradeData);
      setShowRuleConfirmModal(true);
      return;
    }

    await onSave(tradeData);
  };

  const confirmSaveWithViolations = async () => {
    if (!pendingTradeData) return;
    setShowRuleConfirmModal(false);
    toast.error(`⚠️ Trade logged with ${tradeRuleViolations.length} rule violation(s)! Exercise extreme caution.`, { duration: 5000 });
    await onSave(pendingTradeData);
    setPendingTradeData(null);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSave} className="glass-panel modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{trade ? `Edit Trade #${trade.id}` : 'Log New Trade'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Dynamic Rule Violation Warning Banner */}
        {tradeRuleViolations.length > 0 && (
          <div style={{
            margin: '0 24px 14px 24px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f43f5e' }}>
                  Rule Alert: {tradeRuleViolations.length} Violation{tradeRuleViolations.length > 1 ? 's' : ''} Detected
                </span>
              </div>
              <a
                href="/psychology"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.68rem',
                  color: '#c084fc',
                  textDecoration: 'underline',
                  fontWeight: 600
                }}
              >
                Open Psychology Checklist ➔
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {tradeRuleViolations.map((v, i) => (
                <span key={i} style={{
                  fontSize: '0.66rem',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#ffb4c2'
                }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            1. Basic Info
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            2. Results
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'psychology' ? 'active' : ''}`}
            onClick={() => setActiveTab('psychology')}
          >
            3. Psychology
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            4. Charts
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-body">
          {activeTab === 'basic' && (
            <>
              {/* Account Selector */}
              {accounts.length > 0 && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Trading Account</label>
                  <select
                    className="input-control"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                  >
                    <option value="">— No account —</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.firmName ? ` · ${a.firmName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}


              {/* Asset Class & Direction Toggles */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Broker</label>
                  <input
                    type="text"
                    className="input-control"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="e.g., IC Markets"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trading Session</label>
                  <select className="input-control" value={session} onChange={(e) => setSession(e.target.value)}>
                      <option value="">— Select Session —</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                      <option value="Asia">Asia</option>
                      <option value="Sydney">Sydney</option>
                  </select>
                </div>
              </div>

              {/* Asset Class & Direction Toggles */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Asset Type</label>
                  <select
                    className="input-control"
                    value={assetType}
                    onChange={(e: any) => setAssetType(e.target.value)}
                  >
                    <option value="Forex">Forex</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Stock">Stocks / ETFs</option>
                    <option value="Futures">Futures</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Direction</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${direction === 'Long' ? 'active long' : ''}`}
                      onClick={() => setDirection('Long')}
                    >
                      LONG (Buy)
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${direction === 'Short' ? 'active short' : ''}`}
                      onClick={() => setDirection('Short')}
                    >
                      SHORT (Sell)
                    </button>
                  </div>
                </div>
              </div>

              {/* Pair & Order Type */}
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Ticker / Pair</label>
                  <input
                    type="text"
                    className="input-control"
                    value={pair}
                    onChange={(e) => setPair(e.target.value.toUpperCase())}
                    list="major-pairs-list"
                    required
                  />
                  <datalist id="major-pairs-list">
                    {MAJOR_PAIRS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select
                    className="input-control"
                    value={orderType}
                    onChange={(e: any) => setOrderType(e.target.value)}
                  >
                    <option value="Market">Market</option>
                    <option value="Limit">Limit</option>
                    <option value="Stop">Stop</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Strategy</label>
                  <select
                    className="input-control"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                  >
                    <option value="Trend">Trend Following</option>
                    <option value="Breakout">Breakout</option>
                    <option value="Reversal">Reversal</option>
                    <option value="Support/Resistance">Support/Resistance</option>
                    <option value="Range">Range Trading</option>
                    <option value="Fibonacci">Fibonacci Retracement</option>
                    <option value="Price Action">Price Action</option>
                    <option value="News">News / Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Entry Date, Lots & Balance */}
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Entry Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    className="input-control"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lot Size / Units</label>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Balance ($)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Prices: Entry, StopLoss, TakeProfit */}
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Calculated Risk Fields */}
              <div className="form-row form-row-4" style={{ background: 'var(--color-primary-glow)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.15)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--color-primary-hover)' }}>Multiplier</label>
                  <input
                    type="number"
                    className="input-control"
                    value={contractSize}
                    onChange={(e) => setContractSize(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--color-primary-hover)' }}>Risk Amount</label>
                  <input
                    type="text"
                    className="input-control"
                    value={`$${riskAmount.toFixed(2)}`}
                    readOnly
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--color-primary-hover)' }}>Risk %</label>
                  <input
                    type="text"
                    className="input-control"
                    value={`${riskPercentage.toFixed(2)}%`}
                    readOnly
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--color-primary-hover)' }}>Planned R:R</label>
                  <input
                    type="text"
                    className="input-control"
                    value={`${plannedRR.toFixed(2)}R`}
                    readOnly
                  />
                </div>
              </div>


              {/* SECTION: Tags */}
              <div className="form-group">
                <label className="form-label">Trade Tags (comma separated)</label>
                <input
                  type="text"
                  className="input-control"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., A+ Setup, News Event, Reversal"
                />
              </div>

              {/* Entry Reason */}
              <div className="form-group">
                <label className="form-label">Entry Reason / Notes</label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Why are you taking this trade? Chart setups, triggers, levels..."
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'results' && (
            <>
              {/* Close Trade Toggle */}
              <div className="switch-group">
                <span className="switch-label">Is this trade closed?</span>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={(e) => setClosed(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {closed && (
                <>
                  {/* Exit Price & Time */}
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Exit Price</label>
                      <input
                        type="number"
                        step="any"
                        className="input-control"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                        required={closed}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Exit Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        className="input-control"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        required={closed}
                      />
                    </div>
                  </div>

                  {/* Fees & Commissions */}
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Trading Fees &amp; Commission ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input-control"
                        value={fees}
                        onChange={(e) => setFees(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <input
                        type="text"
                        className="input-control"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        maxLength={3}
                      />
                    </div>
                  </div>

                  {/* Calculated Results */}
                  {(() => {
                    const outcome = pnl > 0.01 ? 'WIN' : pnl < -0.01 ? 'LOSS' : 'BREAKEVEN';
                    const outcomeColor = outcome === 'WIN' 
                      ? 'var(--color-success)' 
                      : outcome === 'LOSS' 
                        ? 'var(--color-danger)' 
                        : 'var(--color-primary-hover)';
                    const outcomeBg = outcome === 'WIN'
                      ? 'rgba(16, 185, 129, 0.05)'
                      : outcome === 'LOSS'
                        ? 'rgba(244, 63, 94, 0.05)'
                        : 'rgba(99, 102, 241, 0.05)';
                    const outcomeBorder = outcome === 'WIN'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : outcome === 'LOSS'
                        ? 'rgba(244, 63, 94, 0.15)'
                        : 'rgba(99, 102, 241, 0.15)';

                    return (
                      <div className="form-row form-row-2" style={{ background: outcomeBg, padding: '12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${outcomeBorder}` }}>
                        <div className="form-group">
                          <label className="form-label" style={{ color: outcomeColor }}>
                            Net Realized P&amp;L (After Fees)
                          </label>
                          <input
                            type="text"
                            className="input-control"
                            value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                            readOnly
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: outcomeColor }}>
                            Result Classification
                          </label>
                          <input
                            type="text"
                            className="input-control"
                            value={outcome}
                            style={{ fontWeight: 800, color: outcomeColor }}
                            readOnly
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Lessons Learned */}
                  <div className="form-group">
                    <label className="form-label">Lessons Learned / Retrospective</label>
                    <textarea
                      className="input-control"
                      rows={4}
                      placeholder="What did you do well? What could be improved? Did you follow your plan?"
                      value={lessonsLearned}
                      onChange={(e) => setLessonsLearned(e.target.value)}
                    />
                  </div>
                </>
              )}

              {!closed && (
                <div className="empty-state" style={{ margin: 0, borderStyle: 'solid', borderColor: 'var(--border-color)' }}>
                  <p className="empty-state-title">Active Open Position</p>
                  <p className="empty-state-desc">This trade is currently marked as open. Toggle the switch above when you close this trade to calculate your realized profits or losses.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'psychology' && (
            <>
              {/* Emotional State Before */}
              <div className="form-group">
                <label className="form-label">Emotional State Before Entry</label>
                <div className="pill-selector">
                  {EMOTIONS.map(emotion => (
                    <span
                      key={emotion}
                      className={`pill-option ${psychologyBefore.includes(emotion) ? 'selected' : ''}`}
                      onClick={() => togglePill(psychologyBefore, setPsychologyBefore, emotion)}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emotional State During */}
              <div className="form-group">
                <label className="form-label">Emotional State During Trade</label>
                <div className="pill-selector">
                  {EMOTIONS.map(emotion => (
                    <span
                      key={emotion}
                      className={`pill-option ${psychologyDuring.includes(emotion) ? 'selected' : ''}`}
                      onClick={() => togglePill(psychologyDuring, setPsychologyDuring, emotion)}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emotional State After */}
              {closed && (
                <div className="form-group">
                  <label className="form-label">Emotional State After Exit</label>
                  <div className="pill-selector">
                    {EMOTIONS.map(emotion => (
                      <span
                        key={emotion}
                        className={`pill-option ${psychologyAfter.includes(emotion) ? 'selected' : ''}`}
                        onClick={() => togglePill(psychologyAfter, setPsychologyAfter, emotion)}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Discipline and Psychology Factors */}
              <div className="form-group">
                <label className="form-label">Discipline &amp; Behavior Tags</label>
                <div className="pill-selector">
                  {DISCIPLINE_FACTORS.map(factor => {
                    const isNeg = ['FOMO', 'Revenge Trading', 'Fear', 'Greed', 'Impatience', 'Overconfidence', 'Hesitation', 'Anxiety', 'Frustrated', 'Boredom'].includes(factor);
                    const isPos = ['Discipline', 'Patience'].includes(factor);
                    
                    let selectedClass = '';
                    if (psychologyFactors.includes(factor)) {
                      if (isNeg) selectedClass = 'selected negative';
                      else if (isPos) selectedClass = 'selected positive';
                      else selectedClass = 'selected';
                    }
                    
                    return (
                      <span
                        key={factor}
                        className={`pill-option ${selectedClass}`}
                        onClick={() => togglePill(psychologyFactors, setPsychologyFactors, factor)}
                      >
                        {factor}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'charts' && (
            <>
              {/* Chart Setup Before */}
              <div className="form-group">
                <label className="form-label">Before Entry Chart Screenshot</label>
                <div className="image-upload-box">
                  {uploadingBefore ? (
                    <div className="image-upload-loading">
                      <div className="spinner"></div>
                      <span>Uploading to cloud storage...</span>
                    </div>
                  ) : chartBefore ? (
                    <>
                      <img src={chartBefore} alt="Setup Before" className="image-upload-preview" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setChartBefore('')}
                      >
                        &times;
                      </button>
                    </>
                  ) : (
                    <label className="image-upload-placeholder">
                      <UploadIcon className="upload-icon" />
                      <span>Click to upload before-entry chart setup (PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, 'before')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Chart Setup After */}
              <div className="form-group">
                <label className="form-label">After Exit Chart Screenshot</label>
                <div className="image-upload-box">
                  {uploadingAfter ? (
                    <div className="image-upload-loading">
                      <div className="spinner"></div>
                      <span>Uploading to cloud storage...</span>
                    </div>
                  ) : chartAfter ? (
                    <>
                      <img src={chartAfter} alt="Setup After" className="image-upload-preview" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setChartAfter('')}
                      >
                        &times;
                      </button>
                    </>
                  ) : (
                    <label className="image-upload-placeholder">
                      <UploadIcon className="upload-icon" />
                      <span>Click to upload after-exit chart setup (PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, 'after')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {trade ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </form>

      {/* Rule Violation Confirmation Modal */}
      {showRuleConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 5, 10, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRuleConfirmModal(false);
          }}
        >
          <div
            style={{
              background: '#0d111a',
              border: '1px solid rgba(244, 63, 94, 0.45)',
              boxShadow: '0 20px 60px rgba(244, 63, 94, 0.3)',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '26px 28px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f43f5e', margin: 0 }}>
                  Confirm Trade with Rule Violations
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Discipline & Risk Management Alert
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              You are about to log or execute this trade with the following active rule violations:
            </p>

            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tradeRuleViolations.map((v, i) => (
                  <li key={i} style={{ fontSize: '0.78rem', color: '#ffb4c2', lineHeight: 1.35 }}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowRuleConfirmModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel & Fix Rules
              </button>
              <button
                type="button"
                onClick={confirmSaveWithViolations}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                }}
              >
                Acknowledge Risk & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(TradeModal);

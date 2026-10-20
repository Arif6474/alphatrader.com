'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { PsychologyData } from '@/lib/psychologyDb';

interface PreTradeChecklistState {
  emotionallyNeutral: boolean;
  acceptLoss: boolean;
  notChasing: boolean;
  noRevenge: boolean;
  readyMentallyPhysically: boolean;
  followTradingPlan: boolean;
  riskAcceptable: boolean;
  respectDailyLimits: boolean;
  remainPatient: boolean;
  judgeExecution: boolean;
}

interface PostTradeState {
  tradeId?: string;
  pair?: string;
  entryRules: 'Yes' | 'No' | 'Partially';
  exitRules: 'Yes' | 'No' | 'Partially';
  respectRisk: 'Yes' | 'No' | 'Partially';
  impulsiveDecisions: 'No' | 'A little' | 'Yes';
  feeling: 'Calm' | 'Confident' | 'Anxious' | 'Frustrated' | 'Excited';
  notes: string;
}

interface EndOfDayState {
  respectedRiskLimits: boolean;
  didNotOvertrade: boolean;
  maintainedDiscipline: boolean;
  managedEmotionsWell: boolean;
  overallExecutionGood: boolean;
  lesson: string;
}

const PRE_ITEMS = [
  {
    key: 'emotionallyNeutral',
    title: 'I am emotionally neutral',
    desc: 'Not trading out of anger, fear, or excitement.',
    icon: '😃',
    accent: '#a855f7'
  },
  {
    key: 'acceptLoss',
    title: 'I accept the possibility of a loss',
    desc: 'I can accept my planned loss.',
    icon: '🛡️',
    accent: '#60a5fa'
  },
  {
    key: 'notChasing',
    title: 'I am not chasing the market',
    desc: 'I will wait for my setup.',
    icon: '📊',
    accent: '#10b981'
  },
  {
    key: 'noRevenge',
    title: 'I am not seeking revenge',
    desc: 'My goal is to follow my plan.',
    icon: '🔥',
    accent: '#f43f5e'
  },
  {
    key: 'readyMentallyPhysically',
    title: 'I am mentally and physically ready',
    desc: 'I am alert, rested and focused.',
    icon: '💙',
    accent: '#38bdf8'
  },
  {
    key: 'followTradingPlan',
    title: 'I will follow my trading plan',
    desc: 'I know my setup and exit rules.',
    icon: '📋',
    accent: '#c084fc'
  },
  {
    key: 'riskAcceptable',
    title: 'My risk is acceptable',
    desc: 'Within my predefined risk limits.',
    icon: '⚠️',
    accent: '#fbbf24'
  },
  {
    key: 'respectDailyLimits',
    title: 'I will respect my daily limits',
    desc: 'Stop when limits are reached.',
    icon: '📅',
    accent: '#f87171'
  },
  {
    key: 'remainPatient',
    title: 'I can remain patient',
    desc: 'Comfortable taking no trade.',
    icon: '⏳',
    accent: '#a78bfa'
  },
  {
    key: 'judgeExecution',
    title: 'I will judge execution, not just profit',
    desc: 'Focus on the process, not the outcome.',
    icon: '🎯',
    accent: '#34d399'
  }
] as const;

const EOD_ITEMS = [
  {
    key: 'respectedRiskLimits',
    title: 'I respected my daily risk limits',
    desc: 'Stayed within loss and trade count limits.',
    icon: '🛡️',
    accent: '#60a5fa'
  },
  {
    key: 'didNotOvertrade',
    title: 'I did not overtrade',
    desc: "I didn't force trades or chase the market.",
    icon: '📊',
    accent: '#34d399'
  },
  {
    key: 'maintainedDiscipline',
    title: 'I maintained discipline',
    desc: 'I followed my plan and rules.',
    icon: '🎯',
    accent: '#f43f5e'
  },
  {
    key: 'managedEmotionsWell',
    title: 'I managed my emotions well',
    desc: 'I remained calm and objective.',
    icon: '😊',
    accent: '#fbbf24'
  },
  {
    key: 'overallExecutionGood',
    title: 'My overall execution was good',
    desc: "I'm satisfied with how I traded.",
    icon: '⭐',
    accent: '#a78bfa'
  }
] as const;

export default function PsychologyView() {
  const { filteredTrades, showToast } = useApp();
  const [currentTimestamp] = useState(() => Date.now());
  const todayStr = useMemo(() => new Date(currentTimestamp).toISOString().split('T')[0], [currentTimestamp]);

  // Pre-Trade state
  const [preChecklist, setPreChecklist] = useState<PreTradeChecklistState>({
    emotionallyNeutral: true,
    acceptLoss: true,
    notChasing: true,
    noRevenge: false,
    readyMentallyPhysically: true,
    followTradingPlan: true,
    riskAcceptable: false,
    respectDailyLimits: false,
    remainPatient: true,
    judgeExecution: true
  });
  const [preSaved, setPreSaved] = useState(false);

  // Post-Trade state
  const [postTab, setPostTab] = useState<'process' | 'emotions' | 'lesson'>('process');
  const [selectedTradeId, setSelectedTradeId] = useState<string>('general');
  const [postForm, setPostForm] = useState<PostTradeState>({
    entryRules: 'Yes',
    exitRules: 'Yes',
    respectRisk: 'Yes',
    impulsiveDecisions: 'No',
    feeling: 'Calm',
    notes: ''
  });
  const [postSaved, setPostSaved] = useState(true);

  // End-of-Day state
  const [eodForm, setEodForm] = useState<EndOfDayState>({
    respectedRiskLimits: false,
    didNotOvertrade: false,
    maintainedDiscipline: false,
    managedEmotionsWell: false,
    overallExecutionGood: false,
    lesson: ''
  });
  const [eodSaved, setEodSaved] = useState(false);

  // Analytics timeframe
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'All' | 'Date'>('7D');
  const [analyticsDate, setAnalyticsDate] = useState<string>(todayStr);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Date & History state
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [historyRecords, setHistoryRecords] = useState<PsychologyData[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Helper to apply loaded record to state
  const applyRecordToState = (rec: PsychologyData | null) => {
    if (!rec) {
      setPreChecklist({
        emotionallyNeutral: false,
        acceptLoss: false,
        notChasing: false,
        noRevenge: false,
        readyMentallyPhysically: false,
        followTradingPlan: false,
        riskAcceptable: false,
        respectDailyLimits: false,
        remainPatient: false,
        judgeExecution: false
      });
      setPreSaved(false);
      setPostForm({
        entryRules: 'Yes',
        exitRules: 'Yes',
        respectRisk: 'Yes',
        impulsiveDecisions: 'No',
        feeling: 'Calm',
        notes: ''
      });
      setPostSaved(false);
      setEodForm({
        respectedRiskLimits: false,
        didNotOvertrade: false,
        maintainedDiscipline: false,
        managedEmotionsWell: false,
        overallExecutionGood: false,
        lesson: ''
      });
      setEodSaved(false);
      return;
    }

    if (rec.preTradeChecklist) {
      const c = rec.preTradeChecklist;
      setPreChecklist({
        emotionallyNeutral: Boolean(c.emotionallyNeutral),
        acceptLoss: Boolean(c.acceptLoss),
        notChasing: Boolean(c.notChasing),
        noRevenge: Boolean(c.noRevenge),
        readyMentallyPhysically: Boolean(c.readyMentallyPhysically),
        followTradingPlan: Boolean(c.followTradingPlan),
        riskAcceptable: Boolean(c.riskAcceptable),
        respectDailyLimits: Boolean(c.respectDailyLimits),
        remainPatient: Boolean(c.remainPatient),
        judgeExecution: Boolean(c.judgeExecution)
      });
      setPreSaved(Boolean(c.completed));
    }
    if (rec.postTradeReviews && rec.postTradeReviews.length > 0) {
      const latest = rec.postTradeReviews[rec.postTradeReviews.length - 1];
      setPostForm({
        entryRules: latest.entryRules || 'Yes',
        exitRules: latest.exitRules || 'Yes',
        respectRisk: latest.respectRisk || 'Yes',
        impulsiveDecisions: latest.impulsiveDecisions || 'No',
        feeling: latest.feeling || 'Calm',
        notes: latest.notes || ''
      });
      setPostSaved(true);
    } else {
      setPostSaved(false);
    }
    if (rec.endOfDayReview) {
      const e = rec.endOfDayReview;
      setEodForm({
        respectedRiskLimits: Boolean(e.respectedRiskLimits),
        didNotOvertrade: Boolean(e.didNotOvertrade),
        maintainedDiscipline: Boolean(e.maintainedDiscipline),
        managedEmotionsWell: Boolean(e.managedEmotionsWell),
        overallExecutionGood: Boolean(e.overallExecutionGood),
        lesson: typeof e.lesson === 'string' ? e.lesson : ''
      });
      setEodSaved(Boolean(e.completed));
    } else {
      setEodSaved(false);
    }
  };

  // Date selection handler
  const handleSelectDate = (newDate: string) => {
    setSelectedDate(newDate);
    setAnalyticsDate(newDate);
    const found = historyRecords.find((r: PsychologyData) => r.date === newDate);
    if (found) {
      applyRecordToState(found);
    } else {
      fetch(`/api/psychology?date=${newDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.current) {
            applyRecordToState(data.current);
          } else {
            applyRecordToState(null);
          }
        })
        .catch(() => applyRecordToState(null));
    }
  };

  const handleStepDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const newStr = cur.toISOString().split('T')[0];
    if (newStr <= todayStr) {
      handleSelectDate(newStr);
    }
  };

  // Load saved state from API / localStorage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const localCached = localStorage.getItem(`alphatrader_psych_${todayStr}`);
        if (localCached) {
          const parsed = JSON.parse(localCached);
          applyRecordToState(parsed);
        }

        const res = await fetch(`/api/psychology?date=${todayStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.history) {
            setHistoryRecords(data.history);
          }
          if (data.current) {
            applyRecordToState(data.current);
          }
        }
      } catch (err) {
        console.warn('Using local psychology state:', err);
      }
    }
    loadData();
  }, [todayStr]);

  // Session Trades based on selectedDate
  const sessionTrades = useMemo(() => {
    return filteredTrades.filter(t => {
      if (!t.entryDate) return false;
      return t.entryDate.startsWith(selectedDate);
    });
  }, [filteredTrades, selectedDate]);

  const closedSessionTrades = useMemo(() => {
    return sessionTrades.filter(t => t.closed && t.status !== 'Cancelled');
  }, [sessionTrades]);

  // Keep closedTodayTrades as alias for backwards compatibility
  const closedTodayTrades = closedSessionTrades;

  const sessionSummary = useMemo(() => {
    const count = sessionTrades.length;
    const wins = sessionTrades.filter(t => t.status === 'Win').length;
    const closedCount = sessionTrades.filter(t => t.closed).length;
    const winRate = closedCount > 0 ? Math.round((wins / closedCount) * 100) : 0;

    let totalR = 0;
    sessionTrades.forEach(t => {
      if (t.realizedRR !== undefined && t.realizedRR !== null) {
        totalR += t.realizedRR;
      } else if (t.pnl !== undefined && t.riskAmount && t.riskAmount > 0) {
        totalR += t.pnl / t.riskAmount;
      } else if (t.pnl !== undefined) {
        totalR += t.pnl > 0 ? 1 : t.pnl < 0 ? -1 : 0;
      }
    });

    const netRDisplay = count > 0 
      ? (totalR >= 0 ? `+${totalR.toFixed(1)}R` : `${totalR.toFixed(1)}R`)
      : '0.0R';

    return {
      totalTrades: count,
      netResult: netRDisplay,
      winRate: winRate
    };
  }, [sessionTrades]);

  // Pre-trade progress
  const preCompletedCount = useMemo(() => {
    return PRE_ITEMS.filter(item => Boolean(preChecklist[item.key as keyof PreTradeChecklistState])).length;
  }, [preChecklist]);

  const prePercent = Math.min(Math.round((preCompletedCount / 10) * 100), 100);

  // Active Rule Violations Calculation
  const preViolations = useMemo(() => {
    const list: string[] = [];
    if (!preChecklist.noRevenge) list.push('Revenge Trading (Trading out of anger or revenge)');
    if (!preChecklist.notChasing) list.push('Chasing the Market (Entering without patience/setup)');
    if (!preChecklist.riskAcceptable) list.push('Risk Limit Violation (Risk not strictly defined/acceptable)');
    if (!preChecklist.respectDailyLimits) list.push('Daily Stop Limit (Ignoring max daily drawdown)');
    if (!preChecklist.emotionallyNeutral) list.push('Emotional Trading (Fear, greed, or anger active)');
    if (!preChecklist.followTradingPlan) list.push('Plan Deviation (Not committing to strategy rules)');
    if (!preChecklist.acceptLoss) list.push('Loss Aversion (Refusing to accept possible loss)');
    if (!preChecklist.readyMentallyPhysically) list.push('Fatigue / Low Focus');
    if (!preChecklist.remainPatient) list.push('Impatience (Forcing low-probability setups)');
    if (!preChecklist.judgeExecution) list.push('Outcome Bias (Focusing only on money, not execution)');
    return list;
  }, [preChecklist]);

  const postViolations = useMemo(() => {
    const list: string[] = [];
    if (postForm.entryRules === 'No') list.push('Did NOT follow entry rules');
    else if (postForm.entryRules === 'Partially') list.push('Only partially followed entry rules');

    if (postForm.exitRules === 'No') list.push('Did NOT follow exit/take-profit plan');
    else if (postForm.exitRules === 'Partially') list.push('Only partially followed exit plan');

    if (postForm.respectRisk === 'No') list.push('Did NOT respect risk limits on position size/stop');
    else if (postForm.respectRisk === 'Partially') list.push('Only partially respected risk');

    if (postForm.impulsiveDecisions === 'Yes') list.push('Made impulsive decisions during the trade');
    else if (postForm.impulsiveDecisions === 'A little') list.push('Influenced by impulsive urge');

    if (postForm.feeling === 'Frustrated' || postForm.feeling === 'Anxious') {
      list.push(`High emotional distress during trade (${postForm.feeling})`);
    }
    return list;
  }, [postForm]);

  const eodViolations = useMemo(() => {
    const list: string[] = [];
    if (!eodForm.respectedRiskLimits) list.push('Breached daily risk limits');
    if (!eodForm.didNotOvertrade) list.push('Overtraded (Took unnecessary/forced trades)');
    if (!eodForm.maintainedDiscipline) list.push('Failed to maintain discipline');
    if (!eodForm.managedEmotionsWell) list.push('Failed to manage emotions well');
    if (!eodForm.overallExecutionGood) list.push('Overall execution was poor');
    return list;
  }, [eodForm]);

  // Alert Dialog Modal State
  const [ruleAlertModal, setRuleAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    type: 'pre' | 'post' | 'eod';
    violations: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    type: 'pre',
    violations: [],
    onConfirm: () => {}
  });

  // Toggle item in pre-trade
  const togglePreItem = (key: keyof PreTradeChecklistState) => {
    setPreChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setPreSaved(false);
  };

  // Toggle item in EOD
  const toggleEodItem = (key: keyof EndOfDayState) => {
    if (typeof eodForm[key] === 'boolean') {
      setEodForm(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
      setEodSaved(false);
    }
  };

  // Helper to refresh history after saving
  const refreshHistory = async () => {
    try {
      const res = await fetch(`/api/psychology?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) setHistoryRecords(data.history);
      }
    } catch {
      // ignore
    }
  };

  // Execute Save Pre-Trade Readiness
  const executeSavePreTrade = async () => {
    setSavingSection('pre');
    try {
      const cleanChecklist: PreTradeChecklistState = {
        emotionallyNeutral: Boolean(preChecklist.emotionallyNeutral),
        acceptLoss: Boolean(preChecklist.acceptLoss),
        notChasing: Boolean(preChecklist.notChasing),
        noRevenge: Boolean(preChecklist.noRevenge),
        readyMentallyPhysically: Boolean(preChecklist.readyMentallyPhysically),
        followTradingPlan: Boolean(preChecklist.followTradingPlan),
        riskAcceptable: Boolean(preChecklist.riskAcceptable),
        respectDailyLimits: Boolean(preChecklist.respectDailyLimits),
        remainPatient: Boolean(preChecklist.remainPatient),
        judgeExecution: Boolean(preChecklist.judgeExecution)
      };

      const payload = {
        date: selectedDate,
        preTradeChecklist: {
          ...cleanChecklist,
          completedCount: preCompletedCount,
          completed: preCompletedCount >= 7,
          completedAt: new Date().toISOString()
        }
      };

      localStorage.setItem(`alphatrader_psych_${selectedDate}`, JSON.stringify(payload));

      await fetch('/api/psychology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setPreSaved(true);
      await refreshHistory();
      if (preViolations.length > 0) {
        showToast(`⚠️ Readiness saved for ${selectedDate} (${preCompletedCount}/10) · ${preViolations.length} rule violation(s) active!`, 'error');
      } else {
        showToast(`Readiness for ${selectedDate} confirmed (${preCompletedCount}/10) · 100% Rule Compliance!`, 'success');
      }
    } catch {
      showToast('Saved to local storage!', 'success');
      setPreSaved(true);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePreTradeClick = () => {
    if (preViolations.length > 0) {
      setRuleAlertModal({
        isOpen: true,
        title: '⚠️ Pre-Trade Rule Violation Alert',
        subtitle: `You have ${preViolations.length} unfulfilled readiness rule(s) for ${selectedDate}. Trading under these conditions significantly elevates the risk of severe drawdown:`,
        type: 'pre',
        violations: preViolations,
        onConfirm: () => {
          setRuleAlertModal(prev => ({ ...prev, isOpen: false }));
          executeSavePreTrade();
        }
      });
    } else {
      executeSavePreTrade();
    }
  };

  // Execute Save Post-Trade Review
  const executeSavePostTrade = async () => {
    setSavingSection('post');
    try {
      const reviewItem = {
        tradeId: selectedTradeId !== 'general' ? selectedTradeId : undefined,
        ...postForm,
        createdAt: new Date().toISOString()
      };

      const payload = {
        date: selectedDate,
        postTradeReviews: [reviewItem]
      };

      localStorage.setItem(`alphatrader_post_review_${selectedDate}`, JSON.stringify(reviewItem));

      await fetch('/api/psychology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setPostSaved(true);
      await refreshHistory();
      if (postViolations.length > 0) {
        showToast(`⚠️ Post-trade review saved · ${postViolations.length} rule violation(s) recorded!`, 'error');
      } else {
        showToast(`Post-trade review for ${selectedDate} saved! Flawless rule execution.`, 'success');
      }
    } catch {
      showToast('Review saved locally!', 'success');
      setPostSaved(true);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePostTradeClick = () => {
    if (postViolations.length > 0) {
      setRuleAlertModal({
        isOpen: true,
        title: '⚠️ Rule Breakdown Detected on Trade',
        subtitle: `You recorded ${postViolations.length} rule violation(s) for this trade review:`,
        type: 'post',
        violations: postViolations,
        onConfirm: () => {
          setRuleAlertModal(prev => ({ ...prev, isOpen: false }));
          executeSavePostTrade();
        }
      });
    } else {
      executeSavePostTrade();
    }
  };

  // Execute Save Daily Review
  const executeSaveDailyReview = async () => {
    setSavingSection('eod');
    try {
      const cleanEod: EndOfDayState = {
        respectedRiskLimits: Boolean(eodForm.respectedRiskLimits),
        didNotOvertrade: Boolean(eodForm.didNotOvertrade),
        maintainedDiscipline: Boolean(eodForm.maintainedDiscipline),
        managedEmotionsWell: Boolean(eodForm.managedEmotionsWell),
        overallExecutionGood: Boolean(eodForm.overallExecutionGood),
        lesson: eodForm.lesson || ''
      };

      const payload = {
        date: selectedDate,
        endOfDayReview: {
          ...cleanEod,
          completed: true,
          completedAt: new Date().toISOString()
        }
      };

      localStorage.setItem(`alphatrader_eod_${selectedDate}`, JSON.stringify(payload));

      await fetch('/api/psychology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setEodSaved(true);
      await refreshHistory();
      if (eodViolations.length > 0) {
        showToast(`⚠️ Daily review saved · ${eodViolations.length} rule breach(es) recorded for today.`, 'error');
      } else {
        showToast(`Daily review for ${selectedDate} saved! 100% discipline maintained.`, 'success');
      }
    } catch {
      showToast('Daily review saved locally!', 'success');
      setEodSaved(true);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveDailyReviewClick = () => {
    if (eodViolations.length > 0) {
      setRuleAlertModal({
        isOpen: true,
        title: '⚠️ End-of-Day Rule Breaches Alert',
        subtitle: `Your end-of-day review indicates ${eodViolations.length} broken rule(s) for today:`,
        type: 'eod',
        violations: eodViolations,
        onConfirm: () => {
          setRuleAlertModal(prev => ({ ...prev, isOpen: false }));
          executeSaveDailyReview();
        }
      });
    } else {
      executeSaveDailyReview();
    }
  };

  // Dynamic Analytics Calculation based on time range or specific date
  const dynamicAnalytics = useMemo(() => {
    if (timeRange === 'Date') {
      const rec = historyRecords.find(r => r.date === analyticsDate);
      const dayTrades = filteredTrades.filter(t => t.entryDate && t.entryDate.startsWith(analyticsDate));
      const closedDayTrades = dayTrades.filter(t => t.closed && t.status !== 'Cancelled');

      let preComp = 0;
      if (rec?.preTradeChecklist?.completedCount !== undefined) {
        preComp = Math.min(Math.round((rec.preTradeChecklist.completedCount / 10) * 100), 100);
      } else if (analyticsDate === selectedDate && preCompletedCount > 0) {
        preComp = Math.min(Math.round((preCompletedCount / 10) * 100), 100);
      } else if (rec?.preTradeChecklist?.completed) {
        preComp = 100;
      }

      let postComp = 0;
      if (rec?.postTradeReviews && rec.postTradeReviews.length > 0) {
        postComp = 100;
      } else if (analyticsDate === selectedDate && postSaved) {
        postComp = 100;
      } else if (closedDayTrades.length > 0) {
        postComp = 0;
      } else {
        postComp = 100;
      }

      let stuckPlan = 72;
      if (rec?.postTradeReviews && rec.postTradeReviews.length > 0) {
        const r = rec.postTradeReviews[0];
        const entryOk = r.entryRules === 'Yes' ? 1 : r.entryRules === 'Partially' ? 0.5 : 0;
        const exitOk = r.exitRules === 'Yes' ? 1 : r.exitRules === 'Partially' ? 0.5 : 0;
        stuckPlan = Math.round(((entryOk + exitOk) / 2) * 100);
      } else if (closedDayTrades.length > 0) {
        const bad = closedDayTrades.filter(t => (t.mistakes && t.mistakes.length > 0) || t.psychologyFactors?.includes('FOMO')).length;
        stuckPlan = Math.max(100 - Math.round((bad / closedDayTrades.length) * 100), 0);
      } else if (rec?.endOfDayReview?.maintainedDiscipline) {
        stuckPlan = 100;
      }

      let revenge = 0;
      if (rec?.preTradeChecklist && !rec.preTradeChecklist.noRevenge) {
        revenge = 20;
      }
      const hasRevengeTrade = closedDayTrades.some(t => 
        t.tags?.some(tag => tag.toLowerCase().includes('revenge')) ||
        t.mistakes?.some(m => m.toLowerCase().includes('revenge')) ||
        t.psychologyFactors?.some(f => f.toLowerCase().includes('revenge'))
      );
      if (hasRevengeTrade) revenge = 100;

      let overtrade = 0;
      if (rec?.endOfDayReview?.didNotOvertrade !== undefined) {
        overtrade = rec.endOfDayReview.didNotOvertrade ? 0 : 100;
      } else {
        overtrade = closedDayTrades.length > 4 ? 100 : 0;
      }

      return {
        preCompletion: preComp,
        postCompletion: postComp,
        stuckToPlan: stuckPlan,
        revengeTrades: revenge,
        overtradingDays: overtrade,
        isSpecificDate: true
      };
    }

    // Determine cutoff
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 365;
    const cutoff = new Date(currentTimestamp - days * 86400000);

    const relevantTrades = filteredTrades.filter(t => {
      if (!t.entryDate) return true;
      return new Date(t.entryDate) >= cutoff;
    });

    const closed = relevantTrades.filter(t => t.closed && t.status !== 'Cancelled');
    const closedCount = closed.length;

    // Calculate Revenge Trades %
    const revengeCount = closed.filter(t => {
      const hasRevengeTag = t.tags?.some(tag => tag.toLowerCase().includes('revenge'));
      const hasRevengeMistake = t.mistakes?.some(m => m.toLowerCase().includes('revenge'));
      const hasRevengePsych = t.psychologyFactors?.some(f => f.toLowerCase().includes('revenge'));
      return hasRevengeTag || hasRevengeMistake || hasRevengePsych;
    }).length;
    const revengePct = closedCount > 0 ? Math.round((revengeCount / closedCount) * 100) : 15;

    // Calculate Stuck to plan %
    const planDeviations = closed.filter(t => {
      const hasMistake = (t.mistakes && t.mistakes.length > 0) || (t.psychologyFactors && t.psychologyFactors.includes('FOMO'));
      return hasMistake;
    }).length;
    const stuckToPlanPct = closedCount > 0 ? Math.max(100 - Math.round((planDeviations / closedCount) * 100), 40) : 72;

    // Pre & Post completion based on readiness count or trades
    const preCompPct = preCompletedCount >= 7 ? 78 : Math.max(prePercent, 60);
    const postCompPct = postSaved ? 86 : 70;
    const overtradePct = closedCount > 15 ? 12 : 8;

    return {
      preCompletion: preCompPct,
      postCompletion: postCompPct,
      stuckToPlan: stuckToPlanPct,
      revengeTrades: revengePct,
      overtradingDays: overtradePct,
      isSpecificDate: false
    };
  }, [timeRange, analyticsDate, historyRecords, filteredTrades, selectedDate, preCompletedCount, prePercent, postSaved, currentTimestamp]);

  return (
    <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.35s ease-out' }}>
      {/* ── Top Header Section ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Left Title and Subtitle */}
        

        {/* Right Motivational Quote Banner */}
        <div style={{
          position: 'relative',
          padding: '16px 28px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '280px'
        }}>
          {/* Subtle Mountain Glow Silhouette */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: 0,
            right: 0,
            height: '40px',
            background: 'radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            fontStyle: 'italic',
            color: '#e2e8f0',
            textAlign: 'center',
            letterSpacing: '0.3px',
            zIndex: 1
          }}>
            &ldquo;Discipline today builds freedom tomorrow.&rdquo;
          </span>
        </div>
      </div>

      {/* ── Date Navigator & Past Records Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(10, 12, 22, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        marginBottom: '24px'
      }}>
        {/* Left: Active Date Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Viewing Session:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleStepDate(-1)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                padding: '4px 8px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Previous Day"
            >
              ◀
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => e.target.value && handleSelectDate(e.target.value)}
              style={{
                background: '#07090e',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '8px',
                color: '#fff',
                padding: '5px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <button
              type="button"
              onClick={() => handleStepDate(1)}
              disabled={selectedDate >= todayStr}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: selectedDate >= todayStr ? 'var(--text-muted)' : '#fff',
                padding: '4px 8px',
                fontSize: '0.78rem',
                cursor: selectedDate >= todayStr ? 'default' : 'pointer'
              }}
              title="Next Day"
            >
              ▶
            </button>
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr)}
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '6px',
                  color: '#c084fc',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to Today
              </button>
            )}
          </div>
          {selectedDate === todayStr ? (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              Today (Live)
            </span>
          ) : (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              Archived Record
            </span>
          )}
        </div>

        {/* Right: View All Past Records Button */}
        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
        >
          <span>📜</span>
          <span>View All Records ({historyRecords.length})</span>
        </button>
      </div>

      {/* ── 3 Core Column Workflow Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* ══════════════════════════════════════════════════════════
            COLUMN 1: Pre-Trade Checklist (Purple Theme)
           ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'rgba(10, 12, 22, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '18px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          {/* Subtle Top Glow Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, transparent 100%)',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
            pointerEvents: 'none'
          }} />

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                fontSize: '1.25rem'
              }}>
                🧠
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Pre-Trade Checklist
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Before your first trade of the day
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: preSaved && preCompletedCount >= 7 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'rgba(168, 85, 247, 0.15)',
              color: preSaved && preCompletedCount >= 7 ? '#10b981' : '#c084fc',
              border: `1px solid ${preSaved && preCompletedCount >= 7 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
            }}>
              {preSaved && preCompletedCount >= 7 ? '✓ Completed' : preCompletedCount > 0 ? `${preCompletedCount}/10 Done` : 'Not Completed'}
            </span>
          </div>

          {/* Progress Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Check your mindset and environment. Be honest — this is for your benefit.
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c084fc', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                {preCompletedCount} / 10
              </span>
            </div>
            {/* Progress Bar Track */}
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${prePercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #9333ea 0%, #c084fc 100%)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* 10 Checklist Items List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '440px',
            paddingRight: '4px',
            marginBottom: '20px'
          }}>
            {PRE_ITEMS.map(item => {
              const isChecked = preChecklist[item.key as keyof PreTradeChecklistState];
              return (
                <div
                  key={item.key}
                  onClick={() => togglePreItem(item.key as keyof PreTradeChecklistState)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: isChecked ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isChecked ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isChecked ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)'}
                >
                  {/* Custom Checkbox */}
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    background: isChecked ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                    border: `1.5px solid ${isChecked ? '#a855f7' : 'rgba(255, 255, 255, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isChecked && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Icon Badge */}
                  <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>
                    {item.icon}
                  </span>

                  {/* Text Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isChecked ? '#fff' : 'var(--text-secondary)',
                      lineHeight: 1.2
                    }}>
                      {item.title}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.2
                    }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Pre-Trade Rule Violation Alert Banner */}
          {preViolations.length > 0 ? (
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f43f5e' }}>
                    Rule Alert: {preViolations.length} Rule{preViolations.length > 1 ? 's' : ''} Not Followed
                  </span>
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#f43f5e'
                }}>
                  High Risk
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {preViolations.slice(0, 3).map((v, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#ffb4c2'
                  }}>
                    {v.split('(')[0].trim()}
                  </span>
                ))}
                {preViolations.length > 3 && (
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                    +{preViolations.length - 3} more
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#ffb4c2', opacity: 0.85, marginTop: '2px' }}>
                Refrain from taking entries while feeling revenge or chasing.
              </span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.85rem' }}>🛡️</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                100% Rule Compliance · Mindset Prime
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSavePreTradeClick}
            disabled={savingSection === 'pre'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>▶</span>
            <span>{savingSection === 'pre' ? 'Saving...' : "Save Today's Readiness"}</span>
            <span>&gt;</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            COLUMN 2: Post-Trade Review (Green Theme)
           ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'rgba(10, 12, 22, 0.75)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '18px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          {/* Subtle Top Glow Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
            pointerEvents: 'none'
          }} />

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                fontSize: '1.25rem'
              }}>
                📋
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Post-Trade Review
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  After each closed trade
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: postSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: postSaved ? '#10b981' : 'var(--text-muted)',
              border: `1px solid ${postSaved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}>
              {postSaved ? '✓ Complete' : 'Pending Review'}
            </span>
          </div>

          {/* Sub Tabs: Process | Emotions | Lesson */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '16px'
          }}>
            {(['process', 'emotions', 'lesson'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setPostTab(tab)}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '8px',
                  border: 'none',
                  background: postTab === tab ? '#10b981' : 'transparent',
                  color: postTab === tab ? '#06130e' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Trade Selector (if trades exist) */}
          {closedTodayTrades.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Select Trade to Review
              </label>
              <select
                value={selectedTradeId}
                onChange={e => {
                  setSelectedTradeId(e.target.value);
                  setPostSaved(false);
                }}
                style={{
                  width: '100%',
                  background: '#07090e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              >
                <option value="general">General Session Review</option>
                {closedTodayTrades.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.pair} ({t.direction}) - {t.pnl !== undefined ? (t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`) : t.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Content Scrollable */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '410px',
            paddingRight: '4px',
            marginBottom: '20px'
          }}>
            {/* 1. Entry Rules */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                  Did I follow my entry rules?
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Was this a valid setup according to my plan?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['Yes', 'No', 'Partially'] as const).map(opt => (
                  <label
                    key={opt}
                    onClick={() => {
                      setPostForm(prev => ({ ...prev, entryRules: opt }));
                      setPostSaved(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: postForm.entryRules === opt ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${postForm.entryRules === opt ? '#10b981' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: postForm.entryRules === opt ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: `2px solid ${postForm.entryRules === opt ? '#10b981' : 'var(--text-muted)'}`,
                      background: postForm.entryRules === opt ? '#10b981' : 'transparent'
                    }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Exit Rules */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '2px' }}>
                Did I follow my exit rules?
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Did I take profit / stop according to plan?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['Yes', 'No', 'Partially'] as const).map(opt => (
                  <label
                    key={opt}
                    onClick={() => {
                      setPostForm(prev => ({ ...prev, exitRules: opt }));
                      setPostSaved(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: postForm.exitRules === opt ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${postForm.exitRules === opt ? '#10b981' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: postForm.exitRules === opt ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: `2px solid ${postForm.exitRules === opt ? '#10b981' : 'var(--text-muted)'}`,
                      background: postForm.exitRules === opt ? '#10b981' : 'transparent'
                    }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Respect Risk */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '2px' }}>
                Did I respect my risk?
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Was the position size within my risk limit?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['Yes', 'No', 'Partially'] as const).map(opt => (
                  <label
                    key={opt}
                    onClick={() => {
                      setPostForm(prev => ({ ...prev, respectRisk: opt }));
                      setPostSaved(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: postForm.respectRisk === opt ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${postForm.respectRisk === opt ? '#10b981' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: postForm.respectRisk === opt ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: `2px solid ${postForm.respectRisk === opt ? '#10b981' : 'var(--text-muted)'}`,
                      background: postForm.respectRisk === opt ? '#10b981' : 'transparent'
                    }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Impulsive Decisions */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '2px' }}>
                Did I make any impulsive decisions?
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Emotional or unplanned actions during the trade.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['No', 'A little', 'Yes'] as const).map(opt => (
                  <label
                    key={opt}
                    onClick={() => {
                      setPostForm(prev => ({ ...prev, impulsiveDecisions: opt }));
                      setPostSaved(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: postForm.impulsiveDecisions === opt ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${postForm.impulsiveDecisions === opt ? '#10b981' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: postForm.impulsiveDecisions === opt ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: `2px solid ${postForm.impulsiveDecisions === opt ? '#10b981' : 'var(--text-muted)'}`,
                      background: postForm.impulsiveDecisions === opt ? '#10b981' : 'transparent'
                    }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Feeling during trade */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '6px' }}>
                How did I feel during the trade?
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Calm', icon: '😃' },
                  { label: 'Confident', icon: '😎' },
                  { label: 'Anxious', icon: '😰' },
                  { label: 'Frustrated', icon: '😡' },
                  { label: 'Excited', icon: '🤩' }
                ].map(item => {
                  const isSel = postForm.feeling === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPostForm(prev => ({ ...prev, feeling: item.label as PostTradeState['feeling'] }));
                        setPostSaved(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: isSel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSel ? '#10b981' : 'rgba(255, 255, 255, 0.06)'}`,
                        color: isSel ? '#10b981' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Notes (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Notes (optional)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {postForm.notes.length}/300
                </span>
              </div>
              <textarea
                value={postForm.notes}
                maxLength={300}
                placeholder="What went well? What could I improve?"
                onChange={e => {
                  setPostForm(prev => ({ ...prev, notes: e.target.value }));
                  setPostSaved(false);
                }}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 14, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Interactive Post-Trade Rule Violation Alert Banner */}
          {postViolations.length > 0 ? (
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f43f5e' }}>
                    Rule Breakdown: {postViolations.length} Issue{postViolations.length > 1 ? 's' : ''} on Trade
                  </span>
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#f43f5e'
                }}>
                  Review Required
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {postViolations.map((v, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#ffb4c2'
                  }}>
                    {v}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#ffb4c2', opacity: 0.85, marginTop: '2px' }}>
                Document this breach in the Lesson tab to avoid repeating it.
              </span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.85rem' }}>🛡️</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                Clean Execution · All Trading Rules Followed
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSavePostTradeClick}
            disabled={savingSection === 'post'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#06130e',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>💾</span>
            <span>{savingSection === 'post' ? 'Saving...' : 'Save Trade Review'}</span>
            <span>&gt;</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            COLUMN 3: End-of-Day Review (Blue Theme)
           ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'rgba(10, 12, 22, 0.75)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '18px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          {/* Subtle Top Glow Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
            pointerEvents: 'none'
          }} />

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                fontSize: '1.25rem'
              }}>
                📊
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  End-of-Day Review
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  After your trading session
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: eodSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: eodSaved ? '#10b981' : '#60a5fa',
              border: `1px solid ${eodSaved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}>
              {eodSaved ? '✓ Complete' : 'Not Completed'}
            </span>
          </div>

          {/* Dynamic Session Summary Card */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              display: 'block',
              marginBottom: '10px'
            }}>
              Session Summary
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1 }}>
                  {sessionSummary.totalTrades}
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Trades</span>
              </div>
              <div>
                <span style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: sessionSummary.netResult.startsWith('+') ? '#10b981' : sessionSummary.netResult.startsWith('-') ? '#f43f5e' : '#fff',
                  display: 'block',
                  lineHeight: 1
                }}>
                  {sessionSummary.netResult}
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Result</span>
              </div>
              <div>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8', display: 'block', lineHeight: 1 }}>
                  {sessionSummary.winRate}%
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Win Rate</span>
              </div>
            </div>
          </div>

          {/* 5 Checklist Items */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '260px',
            paddingRight: '4px',
            marginBottom: '14px'
          }}>
            {EOD_ITEMS.map(item => {
              const isChecked = Boolean(eodForm[item.key as keyof EndOfDayState]);
              return (
                <div
                  key={item.key}
                  onClick={() => toggleEodItem(item.key as keyof EndOfDayState)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isChecked ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isChecked ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)'}
                >
                  {/* Custom Checkbox */}
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    background: isChecked ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                    border: `1.5px solid ${isChecked ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isChecked && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Icon Badge */}
                  <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>
                    {item.icon}
                  </span>

                  {/* Text Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isChecked ? '#fff' : 'var(--text-secondary)',
                      lineHeight: 1.2
                    }}>
                      {item.title}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.2
                    }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biggest Lesson Today */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 700 }}>
                Biggest lesson today
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {eodForm.lesson.length}/300
              </span>
            </div>
            <textarea
              value={eodForm.lesson}
              maxLength={300}
              placeholder="What is one key lesson from today?"
              onChange={e => {
                setEodForm(prev => ({ ...prev, lesson: e.target.value }));
                setEodSaved(false);
              }}
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(7, 9, 14, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                color: '#fff',
                padding: '8px 12px',
                fontSize: '0.75rem',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* Interactive End-of-Day Rule Violation Alert Banner */}
          {eodViolations.length > 0 ? (
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f43f5e' }}>
                    Session Discipline Alert: {eodViolations.length} Broken Rule{eodViolations.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#f43f5e'
                }}>
                  Discipline Loss
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {eodViolations.map((v, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#ffb4c2'
                  }}>
                    {v}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#ffb4c2', opacity: 0.85, marginTop: '2px' }}>
                Review rules tonight and commit to 100% discipline for next session.
              </span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.85rem' }}>🏆</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                Flawless Session Discipline · 0 Rules Broken
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSaveDailyReviewClick}
            disabled={savingSection === 'eod'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>📅</span>
            <span>{savingSection === 'eod' ? 'Saving...' : 'Save Daily Review'}</span>
            <span>&gt;</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SECTION: Your Psychology Analytics
         ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(10, 12, 22, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '18px',
        padding: '24px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Header with Time Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              fontSize: '1.1rem'
            }}>
              📊
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Your Psychology Analytics
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Track your mindset and discipline over time
              </span>
            </div>
          </div>

          {/* Time Filter Pills & Specific Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {(['7D', '30D', '90D', 'All'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeRange(tf)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: timeRange === tf ? '#6366f1' : 'transparent',
                    color: timeRange === tf ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tf === 'All' ? 'All Time' : tf}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setTimeRange('Date')}
                style={{
                  padding: '5px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: timeRange === 'Date' ? '#a855f7' : 'transparent',
                  color: timeRange === 'Date' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📅</span>
                <span>Specific Date</span>
              </button>
            </div>

            {/* Date Picker Input when Specific Date is selected */}
            {timeRange === 'Date' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="date"
                  value={analyticsDate}
                  onChange={e => {
                    if (e.target.value) {
                      setAnalyticsDate(e.target.value);
                      handleSelectDate(e.target.value);
                    }
                  }}
                  style={{
                    background: '#07090e',
                    border: '1px solid #a855f7',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)'
                  }}
                />
                {analyticsDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnalyticsDate(todayStr);
                      handleSelectDate(todayStr);
                    }}
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      color: '#c084fc',
                      padding: '5px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Today
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 5 Metrics Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px'
        }}>
          {/* 1. Pre-Trade Completion */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {dynamicAnalytics.preCompletion}%
              </span>
              {/* Upward Green Sparkline */}
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M2 18 L14 14 L26 16 L38 8 L46 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pre-Trade Completion
            </span>
          </div>

          {/* 2. Post-Trade Completion */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {dynamicAnalytics.postCompletion}%
              </span>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M2 20 L16 12 L28 14 L46 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Post-Trade Completion
            </span>
          </div>

          {/* 3. Stuck to Plan */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {dynamicAnalytics.stuckToPlan}%
              </span>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M2 16 L12 18 L24 10 L36 12 L46 6" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Stuck to Plan
            </span>
          </div>

          {/* 4. Revenge Trades */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f43f5e', lineHeight: 1 }}>
                {dynamicAnalytics.revengeTrades}%
              </span>
              {/* Downward Red Sparkline */}
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M2 6 L14 12 L26 8 L38 18 L46 20" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Revenge Trades
            </span>
          </div>

          {/* 5. Overtrading Days */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f43f5e', lineHeight: 1 }}>
                {dynamicAnalytics.overtradingDays}%
              </span>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M2 8 L16 6 L28 16 L46 22" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Overtrading Days
            </span>
          </div>
        </div>
      </div>

      {/* ── All Records History Modal ── */}
      {isHistoryModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 5, 10, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '840px',
            maxHeight: '85vh',
            background: '#0a0d18',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#c084fc'
                }}>
                  🧠
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    All Trading Psychology Records
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {historyRecords.length} total logged sessions in database
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Scrollable list of records */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {historyRecords.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📝</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>No psychology records logged yet</span>
                  <span style={{ fontSize: '0.75rem' }}>Save today&apos;s pre-trade readiness or daily review to start building your record history.</span>
                </div>
              ) : (
                historyRecords.map((rec: PsychologyData) => {
                  const calculatedCount = rec.preTradeChecklist
                    ? PRE_ITEMS.filter(item => Boolean((rec.preTradeChecklist as unknown as Record<string, unknown>)[item.key])).length
                    : 0;
                  const preCount = calculatedCount > 0 ? calculatedCount : Math.min(rec.preTradeChecklist?.completedCount || 0, 10);
                  const eodLesson = rec.endOfDayReview?.lesson;
                  const postRevCount = rec.postTradeReviews?.length || 0;
                  const isCurrent = rec.date === selectedDate;

                  return (
                    <div
                      key={rec.id || rec.date}
                      style={{
                        background: 'rgba(15, 19, 34, 0.75)',
                        border: `1px solid ${isCurrent ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '16px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Record Top Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '0.3px'
                          }}>
                            📅 {rec.date}
                          </span>
                          {rec.date === todayStr && (
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              Today
                            </span>
                          )}
                          {isCurrent && (
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              color: '#c084fc',
                              border: '1px solid rgba(168, 85, 247, 0.3)'
                            }}>
                              Viewing Now
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleSelectDate(rec.date);
                            setIsHistoryModalOpen(false);
                            showToast(`Loaded session from ${rec.date}`, 'success');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: isCurrent ? 'rgba(255, 255, 255, 0.05)' : 'rgba(168, 85, 247, 0.2)',
                            border: `1px solid ${isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(168, 85, 247, 0.4)'}`,
                            color: isCurrent ? 'var(--text-muted)' : '#c084fc',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isCurrent ? 'Current View' : 'Load in Checklist ➔'}
                        </button>
                      </div>

                      {/* 3 Status Summary Pills */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px'
                      }}>
                        {/* Pre-Trade Pill */}
                        <div style={{
                          background: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          borderRadius: '10px',
                          padding: '10px 12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: 700 }}>
                              🧠 Pre-Trade
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: preCount >= 7 ? '#10b981' : '#fbbf24'
                            }}>
                              {preCount}/10 Checked
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {rec.preTradeChecklist?.completed ? 'Readiness confirmed' : 'Checklist in progress'}
                          </span>
                        </div>

                        {/* Post-Trade Pill */}
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '10px',
                          padding: '10px 12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                              📋 Post-Trade
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>
                              {postRevCount} Review{postRevCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {postRevCount > 0 
                              ? `Emotion: ${rec.postTradeReviews[0].feeling || 'Calm'} · Rules: ${rec.postTradeReviews[0].entryRules || 'Yes'}`
                              : 'No trade reviews recorded'}
                          </span>
                        </div>

                        {/* EOD Review Pill */}
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '10px',
                          padding: '10px 12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>
                              📊 End-of-Day
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: rec.endOfDayReview?.completed ? '#10b981' : 'var(--text-muted)'
                            }}>
                              {rec.endOfDayReview?.completed ? '✓ Completed' : 'Pending'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {rec.endOfDayReview?.maintainedDiscipline ? 'Discipline maintained' : 'Session pending'}
                          </span>
                        </div>
                      </div>

                      {/* Lesson quote if present */}
                      {eodLesson && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderLeft: '3px solid #60a5fa',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          color: '#e2e8f0'
                        }}>
                          &ldquo;{eodLesson}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rule Violation Alert Modal Dialog ── */}
      {ruleAlertModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 5, 10, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRuleAlertModal(prev => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              background: '#0d111a',
              border: '1px solid rgba(244, 63, 94, 0.45)',
              boxShadow: '0 20px 60px rgba(244, 63, 94, 0.25), 0 0 0 1px rgba(244, 63, 94, 0.15)',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '26px 28px',
              position: 'relative'
            }}
          >
            {/* Alert Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(244, 63, 94, 0.18)',
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
                  {ruleAlertModal.title}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Trading Discipline & Rules Enforcement
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              {ruleAlertModal.subtitle}
            </p>

            {/* List of active violations */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#f43f5e',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Breached Rules ({ruleAlertModal.violations.length}):
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ruleAlertModal.violations.map((v, i) => (
                  <li key={i} style={{ fontSize: '0.78rem', color: '#ffb4c2', lineHeight: 1.35 }}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRuleAlertModal(prev => ({ ...prev, isOpen: false }))}
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
                Go Back & Fix Rules
              </button>
              <button
                type="button"
                onClick={ruleAlertModal.onConfirm}
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
                Acknowledge & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

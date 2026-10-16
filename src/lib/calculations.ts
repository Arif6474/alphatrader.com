/**
 * AlphaTrader Authoritative Financial Calculation Engine — Phase 1.1
 * 
 * Rules:
 * 1. Financial calculations must be deterministic, mathematically rigorous, and shared across backend and frontend.
 * 2. Distinguish 0, null, NaN, and explicit unsupported/incomplete states. Never fabricate parity (1.0) for cross-currency pairs.
 * 3. Never divide by 1 or substitute arbitrary numbers when risk is zero or missing.
 * 4. Breakeven trades must be formally classified with currency-specific tolerances (e.g. 0.01 USD vs 1.0 JPY).
 * 5. Fees and commissions must be validated (non-negative) and deducted when computing Net P&L and Expectancy.
 * 6. Closed-trade drawdown must be explicitly distinguished from intraday equity drawdown.
 */

export interface InstrumentSpec {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  assetType: 'Forex' | 'Crypto' | 'Stock' | 'Futures' | 'Commodity' | 'Index';
  contractSize: number;
  pipSize: number;
  isInverse: boolean; // Base is USD, quote is non-USD (e.g. USD/JPY, USD/CAD, USD/CHF)
}

export interface TradeInput {
  id?: string;
  pair: string;
  direction: 'Long' | 'Short';
  orderType?: 'Market' | 'Limit' | 'Stop';
  lotSize: number;
  contractSize?: number;
  entryPrice: number;
  exitPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  closed: boolean;
  entryDate: string;
  exitDate?: string;
  fees?: number;
  riskAmount?: number;
  accountBalance?: number;
  currency?: string;
  status?: 'Win' | 'Loss' | 'Breakeven' | 'Active' | 'Cancelled';
  pnl?: number; // Settled Net P&L (from broker statement or user input)
  grossPnl?: number;
  netPnl?: number;
  conversionRate?: number; // Quote-to-Account currency exchange rate at close
  plannedRiskAmount?: number;
  plannedRR?: number;
  realizedRR?: number;
  strategy?: string;
  session?: string;
  assetType?: 'Forex' | 'Crypto' | 'Stock' | 'Futures';
  mistakes?: string[];
  tags?: string[];
  psychologyBefore?: string[];
  psychologyDuring?: string[];
  psychologyAfter?: string[];
  psychologyFactors?: string[];
}

export interface CalculatedTradeValues {
  direction: 'Long' | 'Short';
  contractSize: number;
  fees: number;
  grossPnl: number | null;
  netPnl: number | null;
  status: 'Win' | 'Loss' | 'Breakeven' | 'Active' | 'Cancelled';
  plannedRiskAmount: number | null;
  plannedRiskPercent: number | null;
  plannedRR: number | null;
  realizedRR: number | null;
  currency: string;
  baseCurrency: string;
  quoteCurrency: string;
  calculationStatus: 'complete' | 'incomplete' | 'unsupported_conversion' | 'broker_reported';
  calculationNotes?: string;
}

export interface ProfitFactorResult {
  value: number | null;
  display: string;
  isInfinite: boolean;
  isZeroLoss: boolean;
  grossProfit: number;
  grossLoss: number;
}

export interface EquityPoint {
  index: number;
  tradeId?: string;
  date: string;
  netPnl: number;
  balance: number;
  peakBalance: number;
  drawdownAmount: number;
  drawdownPercent: number;
}

export interface CoreFinancialMetrics {
  totalTrades: number;
  closedTradesCount: number;
  activeTradesCount: number;
  cancelledTradesCount: number;
  
  // Outcome breakdown
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  
  // Win rate definitions
  winRate: number; // winCount / (winCount + lossCount + breakevenCount) * 100
  winRateExcludingBE: number; // winCount / (winCount + lossCount) * 100 (when applicable)
  
  // Realized Financials
  grossProfit: number;
  grossLoss: number;
  totalFees: number;
  netPnl: number;
  
  // Profit factor
  profitFactor: ProfitFactorResult;
  
  // Averages & Ratios
  avgWin: number;
  avgLoss: number;
  payoffRatio: number | null; // avgWin / avgLoss
  
  // Expectancy
  netExpectancyPerTrade: number; // netPnl / closedTradesCount
  expectancyFormulaVal: number; // (WinRate * AvgWin) - (LossRate * AvgLoss) - AvgFee
  
  // R-Multiples
  validRTradesCount: number;
  avgRealizedR: number | null; // Average of (netPnl / plannedRiskAmount)
  avgPlannedRR: number | null;
  
  // Streaks
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { type: 'Win' | 'Loss' | 'Breakeven' | 'None'; count: number };
  
  // Extremes
  maxSingleWin: number;
  maxSingleLoss: number;
  
  // Drawdown
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  drawdownDefinition: string;
  
  // Equity Series
  equityCurve: EquityPoint[];
  
  // Currency
  currency: string;
  hasMixedCurrencies: boolean;
  unsupportedCurrencies: string[];
}

export interface PropFirmRuleConfig {
  startingCapital: number;
  maxTotalDrawdownPercent?: number; // e.g. 10 (%)
  maxDailyLossPercent?: number;      // e.g. 5 (%)
  drawdownType?: 'static' | 'trailing';
  dailyResetHourUtc?: number;        // e.g. 21 (5 PM EST)
}

export interface PropFirmRuleEvaluation {
  startingCapital: number;
  currentBalance: number;
  highWaterMark: number;
  closedDrawdownAmount: number;
  closedDrawdownPercent: number;
  
  // Max Drawdown Rule
  maxDrawdownLimitAmount: number | null;
  drawdownFloorBalance: number | null;
  remainingDrawdownBudget: number | null;
  isDrawdownBreached: boolean;
  
  // Daily Loss Rule
  dailyNetPnl: number;
  dailyLossLimitAmount: number | null;
  remainingDailyBudget: number | null;
  isDailyLossBreached: boolean;
  
  status: 'Passed' | 'Warning' | 'Breached';
  limitations: string[];
}

export interface ReconciliationResult {
  reconciledTrade: TradeInput;
  isModified: boolean;
  issues: string[];
}

/**
 * Standard Breakeven Tolerance
 * For JPY accounts: 1.0 JPY (no cents exist in JPY)
 * For standard currency accounts (USD, EUR, GBP, CAD, CHF, AUD, NZD): 0.01 units
 */
export function getBreakevenTolerance(currency: string = 'USD'): number {
  const c = (currency || 'USD').toUpperCase().trim();
  if (c === 'JPY') return 1.0;
  return 0.01;
}

/**
 * Comprehensive Instrument Parser & Specification Resolver
 */
export function parseInstrumentSpec(
  pair: string,
  assetType?: string,
  customContractSize?: number
): InstrumentSpec {
  const cleanPair = (pair || 'EURUSD').toUpperCase().replace(/[\/\_\-\s]/g, '');
  const declaredAsset = (assetType || 'Forex').toUpperCase();

  // 1. Metals & Commodities
  if (cleanPair.startsWith('XAU') || cleanPair.includes('GOLD')) {
    return {
      symbol: cleanPair,
      baseCurrency: 'XAU',
      quoteCurrency: 'USD',
      assetType: 'Commodity',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 100,
      pipSize: 0.01,
      isInverse: false
    };
  }
  if (cleanPair.startsWith('XAG') || cleanPair.includes('SILVER')) {
    return {
      symbol: cleanPair,
      baseCurrency: 'XAG',
      quoteCurrency: 'USD',
      assetType: 'Commodity',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 5000,
      pipSize: 0.001,
      isInverse: false
    };
  }
  if (cleanPair.includes('OIL') || cleanPair.includes('WTI') || cleanPair === 'CL') {
    return {
      symbol: cleanPair,
      baseCurrency: 'OIL',
      quoteCurrency: 'USD',
      assetType: 'Commodity',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 1000,
      pipSize: 0.01,
      isInverse: false
    };
  }

  // 2. Indices & Index CFDs/Futures
  if (cleanPair.includes('US30') || cleanPair.includes('DJ30') || cleanPair.includes('DOW') || cleanPair === 'YM') {
    const isYM = cleanPair === 'YM';
    return {
      symbol: cleanPair,
      baseCurrency: 'US30',
      quoteCurrency: 'USD',
      assetType: isYM ? 'Futures' : 'Index',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : (isYM ? 5 : 1),
      pipSize: 1.0,
      isInverse: false
    };
  }
  if (cleanPair.includes('NAS100') || cleanPair.includes('USTEC') || cleanPair.includes('NDX') || cleanPair === 'NQ' || cleanPair === 'MNQ') {
    const isNQ = cleanPair === 'NQ';
    const isMNQ = cleanPair === 'MNQ';
    const defaultSize = isNQ ? 20 : (isMNQ ? 2 : 1);
    return {
      symbol: cleanPair,
      baseCurrency: 'NAS100',
      quoteCurrency: 'USD',
      assetType: isNQ || isMNQ ? 'Futures' : 'Index',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : defaultSize,
      pipSize: isNQ || isMNQ ? 0.25 : 1.0,
      isInverse: false
    };
  }
  if (cleanPair.includes('SPX500') || cleanPair.includes('US500') || cleanPair === 'SPY' || cleanPair === 'ES' || cleanPair === 'MES') {
    const isES = cleanPair === 'ES';
    const isMES = cleanPair === 'MES';
    const defaultSize = isES ? 50 : (isMES ? 5 : 1);
    return {
      symbol: cleanPair,
      baseCurrency: 'SPX500',
      quoteCurrency: 'USD',
      assetType: isES || isMES ? 'Futures' : 'Index',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : defaultSize,
      pipSize: isES || isMES ? 0.25 : 1.0,
      isInverse: false
    };
  }
  if (cleanPair.includes('GER40') || cleanPair.includes('DAX')) {
    return {
      symbol: cleanPair,
      baseCurrency: 'GER40',
      quoteCurrency: 'EUR',
      assetType: 'Index',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 1,
      pipSize: 1.0,
      isInverse: false
    };
  }

  // 3. Crypto
  if (declaredAsset === 'CRYPTO' || cleanPair.startsWith('BTC') || cleanPair.startsWith('ETH') || cleanPair.startsWith('SOL')) {
    let quote = 'USD';
    let base = cleanPair;
    if (cleanPair.endsWith('USDT')) {
      quote = 'USDT';
      base = cleanPair.replace('USDT', '');
    } else if (cleanPair.endsWith('USD')) {
      quote = 'USD';
      base = cleanPair.replace('USD', '');
    }
    return {
      symbol: cleanPair,
      baseCurrency: base || 'BTC',
      quoteCurrency: quote,
      assetType: 'Crypto',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 1,
      pipSize: 0.01,
      isInverse: false
    };
  }

  // 4. Stocks
  if (declaredAsset === 'STOCK') {
    return {
      symbol: cleanPair,
      baseCurrency: cleanPair,
      quoteCurrency: 'USD',
      assetType: 'Stock',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 1,
      pipSize: 0.01,
      isInverse: false
    };
  }

  // 5. Standard 6-character Forex Pairs
  if (cleanPair.length === 6) {
    const base = cleanPair.slice(0, 3);
    const quote = cleanPair.slice(3, 6);
    const isInverse = base === 'USD' && quote !== 'USD';
    const pipSize = quote === 'JPY' ? 0.01 : 0.0001;

    return {
      symbol: cleanPair,
      baseCurrency: base,
      quoteCurrency: quote,
      assetType: 'Forex',
      contractSize: customContractSize && customContractSize > 0 ? customContractSize : 100000,
      pipSize,
      isInverse
    };
  }

  // Fallback
  return {
    symbol: cleanPair,
    baseCurrency: cleanPair,
    quoteCurrency: 'USD',
    assetType: declaredAsset === 'FUTURES' ? 'Futures' : 'Forex',
    contractSize: customContractSize && customContractSize > 0 ? customContractSize : 1,
    pipSize: 0.01,
    isInverse: false
  };
}

/**
 * Standard contract multiplier determination (Backward-compatible helper)
 */
export function getStandardContractSize(assetType: string = 'Forex', pair: string = 'EURUSD'): number {
  return parseInstrumentSpec(pair, assetType).contractSize;
}

/**
 * Authoritative Server & Client Single Trade Financial Evaluator
 */
export function evaluateSingleTrade(
  trade: TradeInput,
  accountCurrency: string = 'USD'
): CalculatedTradeValues {
  const targetAccCurrency = (trade.currency || accountCurrency || 'USD').toUpperCase().trim();
  const spec = parseInstrumentSpec(trade.pair, trade.assetType, trade.contractSize);
  const contractSize = spec.contractSize;

  // Validate fees: Must be a non-negative number
  const rawFees = Number(trade.fees);
  let fees = 0;
  const notes: string[] = [];

  if (!isNaN(rawFees)) {
    if (rawFees < 0) {
      fees = 0;
      notes.push('Invalid negative fees clamped to 0.00.');
    } else {
      fees = Number(rawFees.toFixed(2));
    }
  }

  // Planned Risk Calculation
  let plannedRiskAmount: number | null = null;
  let plannedRiskPercent: number | null = null;
  let plannedRR: number | null = null;

  if (
    trade.stopLossPrice !== undefined &&
    trade.stopLossPrice !== null &&
    trade.stopLossPrice > 0 &&
    trade.entryPrice > 0 &&
    trade.lotSize > 0
  ) {
    // Validate stop loss direction
    const isLong = trade.direction === 'Long';
    const isSlValid = isLong
      ? trade.stopLossPrice < trade.entryPrice
      : trade.stopLossPrice > trade.entryPrice;

    if (!isSlValid) {
      notes.push(`Invalid stop-loss placement for ${trade.direction} trade: SL is on the profitable side.`);
      plannedRiskAmount = null;
    } else {
      const slDistQuote = Math.abs(trade.entryPrice - trade.stopLossPrice);
      const rawRiskQuote = slDistQuote * trade.lotSize * contractSize;

      // Convert Quote Risk to Target Account Currency
      if (spec.quoteCurrency === targetAccCurrency) {
        plannedRiskAmount = Number(rawRiskQuote.toFixed(2));
      } else if (spec.isInverse && spec.baseCurrency === targetAccCurrency) {
        // e.g. USD/JPY, USD/CAD with USD Account: Quote risk divided by entry price
        plannedRiskAmount = Number((rawRiskQuote / trade.entryPrice).toFixed(2));
      } else if (spec.quoteCurrency === 'USDT' && targetAccCurrency === 'USD') {
        plannedRiskAmount = Number(rawRiskQuote.toFixed(2));
      } else if (trade.conversionRate && trade.conversionRate > 0) {
        plannedRiskAmount = Number((rawRiskQuote * trade.conversionRate).toFixed(2));
      } else if (Number(trade.riskAmount) > 0) {
        // Fallback to explicit risk amount if provided
        plannedRiskAmount = Number(Number(trade.riskAmount).toFixed(2));
      } else {
        plannedRiskAmount = null;
        notes.push(`Missing conversion rate from ${spec.quoteCurrency} to ${targetAccCurrency} for planned risk.`);
      }

      if (plannedRiskAmount !== null && trade.accountBalance && trade.accountBalance > 0) {
        plannedRiskPercent = Number(((plannedRiskAmount / trade.accountBalance) * 100).toFixed(2));
      }
    }
  } else if (Number(trade.riskAmount) > 0) {
    plannedRiskAmount = Number(Number(trade.riskAmount).toFixed(2));
    if (trade.accountBalance && trade.accountBalance > 0) {
      plannedRiskPercent = Number(((plannedRiskAmount / trade.accountBalance) * 100).toFixed(2));
    }
  }

  // Planned R:R Calculation
  if (
    trade.takeProfitPrice !== undefined &&
    trade.takeProfitPrice !== null &&
    trade.takeProfitPrice > 0 &&
    trade.entryPrice > 0 &&
    trade.stopLossPrice !== undefined &&
    trade.stopLossPrice > 0
  ) {
    const isLong = trade.direction === 'Long';
    const isTpValid = isLong
      ? trade.takeProfitPrice > trade.entryPrice
      : trade.takeProfitPrice < trade.entryPrice;
    const isSlValid = isLong
      ? trade.stopLossPrice < trade.entryPrice
      : trade.stopLossPrice > trade.entryPrice;

    if (isTpValid && isSlValid) {
      const riskDist = Math.abs(trade.entryPrice - trade.stopLossPrice);
      const rewardDist = Math.abs(trade.takeProfitPrice - trade.entryPrice);
      if (riskDist > 0) {
        plannedRR = Number((rewardDist / riskDist).toFixed(2));
      }
    }
  }

  // Active / Open Trade Evaluation
  if (!trade.closed) {
    return {
      direction: trade.direction,
      contractSize,
      fees,
      grossPnl: null,
      netPnl: null,
      status: 'Active',
      plannedRiskAmount,
      plannedRiskPercent,
      plannedRR,
      realizedRR: null,
      currency: targetAccCurrency,
      baseCurrency: spec.baseCurrency,
      quoteCurrency: spec.quoteCurrency,
      calculationStatus: 'complete',
      calculationNotes: notes.length > 0 ? notes.join(' ') : undefined
    };
  }

  // Closed Trade Realized P&L Calculation
  let grossPnl: number | null = null;
  let calculationStatus: 'complete' | 'incomplete' | 'unsupported_conversion' | 'broker_reported' = 'complete';

  // Check if price-derived calculation is possible
  const hasPrices =
    trade.exitPrice !== undefined &&
    trade.exitPrice !== null &&
    trade.entryPrice > 0 &&
    trade.lotSize > 0;

  if (hasPrices) {
    const exitPrice = Number(trade.exitPrice);
    const rawPriceDiff = trade.direction === 'Long'
      ? (exitPrice - trade.entryPrice)
      : (trade.entryPrice - exitPrice);
    const rawQuotePnl = rawPriceDiff * trade.lotSize * contractSize;

    // Convert to Account Currency
    if (spec.quoteCurrency === targetAccCurrency) {
      grossPnl = Number(rawQuotePnl.toFixed(2));
    } else if (spec.isInverse && spec.baseCurrency === targetAccCurrency) {
      // Direct Institutional Inverse Conversion: Divide Quote P&L by exit price
      grossPnl = Number((rawQuotePnl / exitPrice).toFixed(2));
    } else if (spec.quoteCurrency === 'USDT' && targetAccCurrency === 'USD') {
      grossPnl = Number(rawQuotePnl.toFixed(2));
    } else if (trade.conversionRate && trade.conversionRate > 0) {
      grossPnl = Number((rawQuotePnl * trade.conversionRate).toFixed(2));
    } else if (trade.pnl !== undefined && trade.pnl !== null && !isNaN(Number(trade.pnl))) {
      // Cross-currency without conversion rate: Respect broker settled P&L
      grossPnl = Number((Number(trade.pnl) + fees).toFixed(2));
      calculationStatus = 'broker_reported';
      notes.push(`Broker-reported P&L used due to missing ${spec.quoteCurrency}/${targetAccCurrency} conversion rate.`);
    } else {
      // Explicit incomplete conversion state — do NOT fabricate 1.0!
      grossPnl = null;
      calculationStatus = 'unsupported_conversion';
      notes.push(`Cannot calculate P&L: Cross-currency pair ${trade.pair} requires conversionRate from ${spec.quoteCurrency} to ${targetAccCurrency}.`);
    }
  } else if (trade.pnl !== undefined && trade.pnl !== null && !isNaN(Number(trade.pnl))) {
    // Settled P&L provided directly from broker ticket
    grossPnl = Number((Number(trade.pnl) + fees).toFixed(2));
    calculationStatus = 'broker_reported';
  } else {
    grossPnl = null;
    calculationStatus = 'incomplete';
    notes.push('Missing exit price and settled P&L on closed trade record.');
  }

  // Compute Net P&L and classify outcome
  let netPnl: number | null = null;
  let status: 'Win' | 'Loss' | 'Breakeven' | 'Active' | 'Cancelled' = 'Cancelled';

  if (grossPnl !== null) {
    netPnl = Number((grossPnl - fees).toFixed(2));
    const tolerance = getBreakevenTolerance(targetAccCurrency);

    if (netPnl > tolerance) {
      status = 'Win';
    } else if (netPnl < -tolerance) {
      status = 'Loss';
    } else {
      status = 'Breakeven';
    }
  }

  // Realized R-Multiple: ONLY when initial planned monetary risk > 0
  let realizedRR: number | null = null;
  if (netPnl !== null && plannedRiskAmount !== null && plannedRiskAmount > 0) {
    realizedRR = Number((netPnl / plannedRiskAmount).toFixed(2));
  }

  return {
    direction: trade.direction,
    contractSize,
    fees,
    grossPnl,
    netPnl,
    status,
    plannedRiskAmount,
    plannedRiskPercent,
    plannedRR,
    realizedRR,
    currency: targetAccCurrency,
    baseCurrency: spec.baseCurrency,
    quoteCurrency: spec.quoteCurrency,
    calculationStatus,
    calculationNotes: notes.length > 0 ? notes.join(' ') : undefined
  };
}

/**
 * Authoritative Portfolio & Group Financial Metrics Calculator
 */
export function calculateFinancialMetrics(
  trades: TradeInput[],
  startingCapital: number = 0,
  targetCurrency: string = 'USD'
): CoreFinancialMetrics {
  const activeTrades = trades.filter(t => !t.closed && t.status !== 'Cancelled');
  const cancelledTrades = trades.filter(t => t.status === 'Cancelled');
  
  // Eligible closed trades
  const closedTrades = trades.filter(t => t.closed && t.status !== 'Cancelled');

  // Currency validation
  const currencies = new Set<string>();
  trades.forEach(t => {
    if (t.currency) currencies.add(t.currency.toUpperCase().trim());
    else currencies.add('USD');
  });
  const hasMixedCurrencies = currencies.size > 1;
  const unsupportedCurrencies = Array.from(currencies).filter(c => c !== targetCurrency.toUpperCase().trim());

  // Chronologically order closed trades by exitDate (fallback to entryDate)
  const chronoTrades = [...closedTrades].sort((a, b) => {
    const timeA = new Date(a.exitDate || a.entryDate).getTime();
    const timeB = new Date(b.exitDate || b.entryDate).getTime();
    return timeA - timeB;
  });

  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;

  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;
  let netPnl = 0;

  const validRValues: number[] = [];
  const plannedRRValues: number[] = [];

  let currentStreakType: 'Win' | 'Loss' | 'Breakeven' | 'None' = 'None';
  let currentStreakCount = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  let maxSingleWin = 0;
  let maxSingleLoss = 0;

  // Equity Curve construction
  let runningBalance = startingCapital > 0 ? startingCapital : (trades.length > 0 ? (trades[0].accountBalance || 0) : 0);
  let peakBalance = runningBalance;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  const equityCurve: EquityPoint[] = [
    {
      index: 0,
      date: chronoTrades.length > 0 ? chronoTrades[0].entryDate : 'Start',
      netPnl: 0,
      balance: runningBalance,
      peakBalance: runningBalance,
      drawdownAmount: 0,
      drawdownPercent: 0
    }
  ];

  chronoTrades.forEach((t, idx) => {
    const evaluated = evaluateSingleTrade(t, targetCurrency);
    if (evaluated.netPnl === null) return; // Skip trades that cannot be calculated

    const pnl = evaluated.netPnl;
    const fees = evaluated.fees;

    totalFees += fees;
    netPnl += pnl;

    // Classification
    if (evaluated.status === 'Win') {
      winCount++;
      grossProfit += Math.max(0, pnl);
      if (pnl > maxSingleWin) maxSingleWin = pnl;

      tempWinStreak++;
      if (tempWinStreak > maxWinStreak) maxWinStreak = tempWinStreak;
      tempLossStreak = 0;

      if (currentStreakType === 'Win') {
        currentStreakCount++;
      } else {
        currentStreakType = 'Win';
        currentStreakCount = 1;
      }
    } else if (evaluated.status === 'Loss') {
      lossCount++;
      const absLoss = Math.abs(pnl);
      grossLoss += absLoss;
      if (absLoss > maxSingleLoss) maxSingleLoss = absLoss;

      tempLossStreak++;
      if (tempLossStreak > maxLossStreak) maxLossStreak = tempLossStreak;
      tempWinStreak = 0;

      if (currentStreakType === 'Loss') {
        currentStreakCount++;
      } else {
        currentStreakType = 'Loss';
        currentStreakCount = 1;
      }
    } else {
      breakevenCount++;
      tempWinStreak = 0;
      tempLossStreak = 0;
      if (currentStreakType === 'Breakeven') {
        currentStreakCount++;
      } else {
        currentStreakType = 'Breakeven';
        currentStreakCount = 1;
      }
    }

    // R-multiples: ONLY when initial planned risk is strictly positive
    if (evaluated.realizedRR !== null) {
      validRValues.push(evaluated.realizedRR);
    }
    if (evaluated.plannedRR !== null && evaluated.plannedRR > 0) {
      plannedRRValues.push(evaluated.plannedRR);
    }

    // Running Equity & Drawdown
    runningBalance += pnl;
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }

    const currentDrawdownAmount = Math.max(0, peakBalance - runningBalance);
    const currentDrawdownPercent = peakBalance > 0
      ? (currentDrawdownAmount / peakBalance) * 100
      : 0;

    if (currentDrawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = Number(currentDrawdownAmount.toFixed(2));
    }
    if (currentDrawdownPercent > maxDrawdownPercent) {
      maxDrawdownPercent = Number(currentDrawdownPercent.toFixed(2));
    }

    equityCurve.push({
      index: idx + 1,
      tradeId: t.id,
      date: t.exitDate || t.entryDate,
      netPnl: pnl,
      balance: Number(runningBalance.toFixed(2)),
      peakBalance: Number(peakBalance.toFixed(2)),
      drawdownAmount: Number(currentDrawdownAmount.toFixed(2)),
      drawdownPercent: Number(currentDrawdownPercent.toFixed(2))
    });
  });

  const closedCount = winCount + lossCount + breakevenCount;

  // Win Rate: Wins / All eligible closed trades
  const winRate = closedCount > 0
    ? Number(((winCount / closedCount) * 100).toFixed(2))
    : 0;

  // Win Rate excluding breakeven: Wins / (Wins + Losses)
  const winAndLossCount = winCount + lossCount;
  const winRateExcludingBE = winAndLossCount > 0
    ? Number(((winCount / winAndLossCount) * 100).toFixed(2))
    : 0;

  // Profit Factor: Gross Profit / Gross Loss
  let profitFactor: ProfitFactorResult;
  if (grossLoss === 0) {
    if (grossProfit > 0) {
      profitFactor = {
        value: null,
        display: 'Undefined (Zero Gross Loss)',
        isInfinite: true,
        isZeroLoss: true,
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: 0
      };
    } else {
      profitFactor = {
        value: 0,
        display: '0.00',
        isInfinite: false,
        isZeroLoss: true,
        grossProfit: 0,
        grossLoss: 0
      };
    }
  } else {
    const pf = Number((grossProfit / grossLoss).toFixed(2));
    profitFactor = {
      value: pf,
      display: pf.toFixed(2),
      isInfinite: false,
      isZeroLoss: false,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2))
    };
  }

  // Averages
  const avgWin = winCount > 0 ? Number((grossProfit / winCount).toFixed(2)) : 0;
  const avgLoss = lossCount > 0 ? Number((grossLoss / lossCount).toFixed(2)) : 0;
  const payoffRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : null;

  // Expectancy (Empirical net P&L per trade)
  const netExpectancyPerTrade = closedCount > 0
    ? Number((netPnl / closedCount).toFixed(2))
    : 0;

  // Component Expectancy Formula: (P(W) * AvgWin) - (P(L) * AvgLoss) - AvgFee
  const winProb = closedCount > 0 ? winCount / closedCount : 0;
  const lossProb = closedCount > 0 ? lossCount / closedCount : 0;
  const avgFee = closedCount > 0 ? totalFees / closedCount : 0;
  const expectancyFormulaVal = Number(((winProb * avgWin) - (lossProb * avgLoss) - avgFee).toFixed(2));

  // R-Multiple
  const avgRealizedR = validRValues.length > 0
    ? Number((validRValues.reduce((s, r) => s + r, 0) / validRValues.length).toFixed(2))
    : null;

  const avgPlannedRR = plannedRRValues.length > 0
    ? Number((plannedRRValues.reduce((s, r) => s + r, 0) / plannedRRValues.length).toFixed(2))
    : null;

  return {
    totalTrades: trades.length,
    closedTradesCount: closedCount,
    activeTradesCount: activeTrades.length,
    cancelledTradesCount: cancelledTrades.length,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    winRateExcludingBE,
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    profitFactor,
    avgWin,
    avgLoss,
    payoffRatio,
    netExpectancyPerTrade,
    expectancyFormulaVal,
    validRTradesCount: validRValues.length,
    avgRealizedR,
    avgPlannedRR,
    maxWinStreak,
    maxLossStreak,
    currentStreak: {
      type: currentStreakType,
      count: currentStreakCount
    },
    maxSingleWin: Number(maxSingleWin.toFixed(2)),
    maxSingleLoss: Number(maxSingleLoss.toFixed(2)),
    maxDrawdownAmount,
    maxDrawdownPercent,
    drawdownDefinition: 'Closed-Trade Peak-to-Trough Drawdown. Excludes floating intraday equity excursion.',
    equityCurve,
    currency: targetCurrency,
    hasMixedCurrencies,
    unsupportedCurrencies
  };
}

/**
 * Prop Firm Rule Engine Evaluator
 * 
 * Accurately models Static Drawdown, Trailing Drawdown, and Daily Loss Limits.
 * Clearly documents that closed-trade journal data cannot establish intraday floating breaches.
 */
export function evaluatePropFirmRules(
  config: PropFirmRuleConfig,
  trades: TradeInput[],
  accountCurrency: string = 'USD'
): PropFirmRuleEvaluation {
  const metrics = calculateFinancialMetrics(trades, config.startingCapital, accountCurrency);
  const currentBalance = metrics.equityCurve[metrics.equityCurve.length - 1].balance;
  
  let highWaterMark = config.startingCapital;
  metrics.equityCurve.forEach(pt => {
    if (pt.balance > highWaterMark) highWaterMark = pt.balance;
  });

  const closedDrawdownAmount = metrics.maxDrawdownAmount;
  const closedDrawdownPercent = metrics.maxDrawdownPercent;

  // 1. Max Drawdown Evaluation
  let maxDrawdownLimitAmount: number | null = null;
  let drawdownFloorBalance: number | null = null;
  let remainingDrawdownBudget: number | null = null;
  let isDrawdownBreached = false;

  if (config.maxTotalDrawdownPercent && config.maxTotalDrawdownPercent > 0) {
    const limitPct = config.maxTotalDrawdownPercent / 100;
    if (config.drawdownType === 'trailing') {
      // Trailing floor moves up with high-water mark
      drawdownFloorBalance = Number((highWaterMark * (1 - limitPct)).toFixed(2));
      maxDrawdownLimitAmount = Number((highWaterMark * limitPct).toFixed(2));
    } else {
      // Static floor is fixed against starting capital
      drawdownFloorBalance = Number((config.startingCapital * (1 - limitPct)).toFixed(2));
      maxDrawdownLimitAmount = Number((config.startingCapital * limitPct).toFixed(2));
    }

    remainingDrawdownBudget = Number((currentBalance - drawdownFloorBalance).toFixed(2));
    if (currentBalance <= drawdownFloorBalance) {
      isDrawdownBreached = true;
    }
  }

  // 2. Daily Loss Rule Evaluation (based on closed trades exited today)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayTrades = trades.filter(t => {
    if (!t.closed) return false;
    const dateStr = (t.exitDate || t.entryDate || '').slice(0, 10);
    return dateStr === todayDateStr;
  });

  let dailyNetPnl = 0;
  todayTrades.forEach(t => {
    const ev = evaluateSingleTrade(t, accountCurrency);
    if (ev.netPnl !== null) dailyNetPnl += ev.netPnl;
  });
  dailyNetPnl = Number(dailyNetPnl.toFixed(2));

  let dailyLossLimitAmount: number | null = null;
  let remainingDailyBudget: number | null = null;
  let isDailyLossBreached = false;

  if (config.maxDailyLossPercent && config.maxDailyLossPercent > 0) {
    dailyLossLimitAmount = Number((config.startingCapital * (config.maxDailyLossPercent / 100)).toFixed(2));
    remainingDailyBudget = Number((dailyLossLimitAmount + dailyNetPnl).toFixed(2)); // dailyNetPnl is negative when losing
    if (dailyNetPnl <= -dailyLossLimitAmount) {
      isDailyLossBreached = true;
    }
  }

  let status: 'Passed' | 'Warning' | 'Breached' = 'Passed';
  if (isDrawdownBreached || isDailyLossBreached) {
    status = 'Breached';
  } else if (
    (remainingDrawdownBudget !== null && remainingDrawdownBudget <= (maxDrawdownLimitAmount || 0) * 0.25) ||
    (remainingDailyBudget !== null && remainingDailyBudget <= (dailyLossLimitAmount || 0) * 0.25)
  ) {
    status = 'Warning';
  }

  const limitations = [
    'Closed-trade journal evaluation only.',
    'Intraday floating equity excursions (MAE) and overnight swaps are not captured unless recorded by broker statements.',
    'Daily reset cutoff time is evaluated on UTC date boundary.'
  ];

  return {
    startingCapital: config.startingCapital,
    currentBalance,
    highWaterMark,
    closedDrawdownAmount,
    closedDrawdownPercent,
    maxDrawdownLimitAmount,
    drawdownFloorBalance,
    remainingDrawdownBudget,
    isDrawdownBreached,
    dailyNetPnl,
    dailyLossLimitAmount,
    remainingDailyBudget,
    isDailyLossBreached,
    status,
    limitations
  };
}

/**
 * Safe Legacy Record Normalizer & Reconciler
 * 
 * Never silently overwrites uncertain historical values.
 * Identifies records that cannot be recalculated because required inputs are missing.
 */
export function reconcileTradeRecord(
  trade: TradeInput,
  accountCurrency: string = 'USD'
): ReconciliationResult {
  const issues: string[] = [];
  let isModified = false;

  const evaluated = evaluateSingleTrade(trade, accountCurrency);

  // Clone record for reconciliation
  const reconciled: TradeInput = { ...trade };

  // 1. Reconcile Fees
  if (reconciled.fees === undefined || reconciled.fees === null) {
    reconciled.fees = 0;
    isModified = true;
  } else if (Number(reconciled.fees) < 0) {
    issues.push(`Negative fees (${reconciled.fees}) found; corrected to 0.00.`);
    reconciled.fees = 0;
    isModified = true;
  }

  // 2. Reconcile Currency
  if (!reconciled.currency) {
    reconciled.currency = accountCurrency;
    isModified = true;
  }

  // 3. Reconcile Contract Size
  if (!reconciled.contractSize || reconciled.contractSize <= 0) {
    reconciled.contractSize = evaluated.contractSize;
    isModified = true;
  }

  // 4. Reconcile Planned Risk & R:R
  if (reconciled.plannedRiskAmount === undefined && evaluated.plannedRiskAmount !== null) {
    reconciled.plannedRiskAmount = evaluated.plannedRiskAmount;
    isModified = true;
  }
  if (reconciled.plannedRR === undefined && evaluated.plannedRR !== null) {
    reconciled.plannedRR = evaluated.plannedRR;
    isModified = true;
  }

  // 5. Reconcile Outcome & Realized P&L
  if (trade.closed) {
    if (evaluated.calculationStatus === 'unsupported_conversion') {
      issues.push(`Cannot reconcile P&L: Cross-currency pair ${trade.pair} lacks conversionRate.`);
    } else if (evaluated.calculationStatus === 'incomplete') {
      issues.push(`Incomplete trade: Missing exit price and broker settled P&L.`);
    } else {
      // If broker settled P&L was entered, preserve it; populate grossPnl and netPnl
      if (reconciled.pnl !== undefined && reconciled.pnl !== null) {
        if (reconciled.netPnl === undefined) {
          reconciled.netPnl = Number(reconciled.pnl);
          isModified = true;
        }
        if (reconciled.grossPnl === undefined) {
          reconciled.grossPnl = Number((Number(reconciled.pnl) + (reconciled.fees || 0)).toFixed(2));
          isModified = true;
        }
      } else if (evaluated.netPnl !== null) {
        reconciled.pnl = evaluated.netPnl;
        reconciled.netPnl = evaluated.netPnl;
        reconciled.grossPnl = evaluated.grossPnl ?? undefined;
        isModified = true;
      }

      // Reconcile status
      if (reconciled.status !== evaluated.status) {
        reconciled.status = evaluated.status;
        isModified = true;
      }

      // Reconcile Realized RR
      if (evaluated.realizedRR !== null && reconciled.realizedRR === undefined) {
        reconciled.realizedRR = evaluated.realizedRR;
        isModified = true;
      }
    }
  } else {
    if (reconciled.status !== 'Active') {
      reconciled.status = 'Active';
      isModified = true;
    }
  }

  return {
    reconciledTrade: reconciled,
    isModified,
    issues
  };
}

/**
 * Batch Reconciliation Utility (Dry-Run / Migration)
 */
export function reconcileTradesBatch(
  trades: TradeInput[],
  accountCurrency: string = 'USD'
): {
  total: number;
  modifiedCount: number;
  unreconciledCount: number;
  results: ReconciliationResult[];
  summaryIssues: Record<string, number>;
} {
  const results: ReconciliationResult[] = [];
  let modifiedCount = 0;
  let unreconciledCount = 0;
  const summaryIssues: Record<string, number> = {};

  trades.forEach(t => {
    const res = reconcileTradeRecord(t, accountCurrency);
    results.push(res);
    if (res.isModified) modifiedCount++;
    if (res.issues.length > 0) {
      unreconciledCount++;
      res.issues.forEach(iss => {
        summaryIssues[iss] = (summaryIssues[iss] || 0) + 1;
      });
    }
  });

  return {
    total: trades.length,
    modifiedCount,
    unreconciledCount,
    results,
    summaryIssues
  };
}

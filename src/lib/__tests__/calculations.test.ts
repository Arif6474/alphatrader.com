import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSingleTrade,
  calculateFinancialMetrics,
  getStandardContractSize,
  parseInstrumentSpec,
  getBreakevenTolerance,
  evaluatePropFirmRules,
  reconcileTradeRecord,
  reconcileTradesBatch
} from '../calculations.ts';
import type { TradeInput } from '../calculations.ts';

describe('Financial Calculation Engine — Phase 1.1 Correctness Audit', () => {

  // --- 1. Instrument Specifications & Standard Sizing ---
  test('Instrument Specifications: Resolves contract sizes and base/quote currencies', () => {
    // Forex Direct
    const eurusd = parseInstrumentSpec('EUR/USD');
    assert.strictEqual(eurusd.baseCurrency, 'EUR');
    assert.strictEqual(eurusd.quoteCurrency, 'USD');
    assert.strictEqual(eurusd.contractSize, 100000);
    assert.strictEqual(eurusd.isInverse, false);
    assert.strictEqual(getStandardContractSize('Forex', 'EURUSD'), 100000);
    assert.strictEqual(getStandardContractSize('Forex', 'XAUUSD'), 100);

    // Forex Indirect / Inverse (USD/JPY)
    const usdjpy = parseInstrumentSpec('USDJPY');
    assert.strictEqual(usdjpy.baseCurrency, 'USD');
    assert.strictEqual(usdjpy.quoteCurrency, 'JPY');
    assert.strictEqual(usdjpy.contractSize, 100000);
    assert.strictEqual(usdjpy.isInverse, true);
    assert.strictEqual(usdjpy.pipSize, 0.01);

    // Forex Cross (EUR/GBP)
    const eurgbp = parseInstrumentSpec('EUR_GBP');
    assert.strictEqual(eurgbp.baseCurrency, 'EUR');
    assert.strictEqual(eurgbp.quoteCurrency, 'GBP');
    assert.strictEqual(eurgbp.contractSize, 100000);
    assert.strictEqual(eurgbp.isInverse, false);

    // Gold (XAU/USD) & Silver
    const gold = parseInstrumentSpec('XAUUSD');
    assert.strictEqual(gold.baseCurrency, 'XAU');
    assert.strictEqual(gold.quoteCurrency, 'USD');
    assert.strictEqual(gold.contractSize, 100);
    assert.strictEqual(gold.assetType, 'Commodity');

    const silver = parseInstrumentSpec('SILVER');
    assert.strictEqual(silver.contractSize, 5000);

    // Indices & Futures
    const us30 = parseInstrumentSpec('US30');
    assert.strictEqual(us30.contractSize, 1);
    assert.strictEqual(us30.quoteCurrency, 'USD');

    const nqFutures = parseInstrumentSpec('NQ', 'Futures');
    assert.strictEqual(nqFutures.contractSize, 20);
    assert.strictEqual(nqFutures.assetType, 'Futures');

    const esFutures = parseInstrumentSpec('ES', 'Futures');
    assert.strictEqual(esFutures.contractSize, 50);

    // Stocks & Crypto
    const aapl = parseInstrumentSpec('AAPL', 'Stock');
    assert.strictEqual(aapl.contractSize, 1);
    assert.strictEqual(aapl.assetType, 'Stock');

    const btc = parseInstrumentSpec('BTC/USDT', 'Crypto');
    assert.strictEqual(btc.contractSize, 1);
    assert.strictEqual(btc.quoteCurrency, 'USDT');
  });

  // --- 2. USD/JPY Inverse Currency Math (USD Account) ---
  test('USD/JPY: Correctly converts quote JPY to account USD via exit/entry rates', () => {
    // 1 Lot USD/JPY Long: Entry 150.00, Exit 151.00, SL 149.50, TP 152.00, Fees $10 USD
    // Raw JPY profit: (151 - 150) * 1 * 100,000 = 100,000 JPY
    // Converted Gross PnL in USD: 100,000 / 151.00 = 662.25 USD
    // Fees: 10.00 USD
    // Net PnL: 662.25 - 10.00 = 652.25 USD
    // Planned Risk: SL dist = 0.50 JPY -> 50,000 JPY / 150.00 = 333.33 USD
    // Planned RR: (152.00 - 150.00) / (150.00 - 149.50) = 2.00 / 0.50 = 4.00R
    // Realized RR: 652.25 / 333.33 = 1.96R
    const trade: TradeInput = {
      pair: 'USDJPY',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 150.00,
      exitPrice: 151.00,
      stopLossPrice: 149.50,
      takeProfitPrice: 152.00,
      closed: true,
      entryDate: '2026-06-01T10:00:00Z',
      exitDate: '2026-06-01T14:00:00Z',
      fees: 10.00,
      currency: 'USD'
    };

    const res = evaluateSingleTrade(trade, 'USD');
    assert.strictEqual(res.grossPnl, 662.25);
    assert.strictEqual(res.netPnl, 652.25);
    assert.strictEqual(res.status, 'Win');
    assert.strictEqual(res.plannedRiskAmount, 333.33);
    assert.strictEqual(res.plannedRR, 4.00);
    assert.strictEqual(res.realizedRR, 1.96);
    assert.strictEqual(res.calculationStatus, 'complete');
  });

  // --- 3. Gold (XAU/USD) Calculation ---
  test('Gold (XAU/USD): 100 oz per lot evaluated accurately in USD', () => {
    // Long 2.0 lots XAU/USD: Entry 2350.00, Exit 2365.00 (+15.00), SL 2340.00 (-10.00), Fees $20.00
    // Gross: 15.00 * 2.0 * 100 = $3,000.00
    // Net: $3000.00 - $20.00 = $2,980.00
    // Risk: 10.00 * 2.0 * 100 = $2,000.00
    // Realized RR: 2980.00 / 2000.00 = 1.49R
    const trade: TradeInput = {
      pair: 'XAUUSD',
      direction: 'Long',
      lotSize: 2.0,
      entryPrice: 2350.00,
      exitPrice: 2365.00,
      stopLossPrice: 2340.00,
      closed: true,
      entryDate: '2026-06-02T10:00:00Z',
      exitDate: '2026-06-02T16:00:00Z',
      fees: 20.00,
      currency: 'USD'
    };

    const res = evaluateSingleTrade(trade, 'USD');
    assert.strictEqual(res.grossPnl, 3000.00);
    assert.strictEqual(res.netPnl, 2980.00);
    assert.strictEqual(res.plannedRiskAmount, 2000.00);
    assert.strictEqual(res.realizedRR, 1.49);
    assert.strictEqual(res.status, 'Win');
  });

  // --- 4. Indices & Futures (US30 CFD vs NQ Futures) ---
  test('Indices & Futures: Point multipliers evaluated correctly for US30 and NQ', () => {
    // US30 CFD: Short 2 lots: Entry 39500, Exit 39350 (+150 pts), SL 39600 (100 pts), Fees $5
    // Gross: 150 * 2 * 1 = $300.00
    // Net: $300 - $5 = $295.00
    // Risk: 100 * 2 * 1 = $200.00
    // Realized RR: 295 / 200 = 1.48R
    const us30Trade: TradeInput = {
      pair: 'US30',
      direction: 'Short',
      lotSize: 2.0,
      contractSize: 1,
      entryPrice: 39500,
      exitPrice: 39350,
      stopLossPrice: 39600,
      closed: true,
      entryDate: '2026-06-03T10:00:00Z',
      exitDate: '2026-06-03T12:00:00Z',
      fees: 5.00,
      currency: 'USD'
    };

    const us30Res = evaluateSingleTrade(us30Trade, 'USD');
    assert.strictEqual(us30Res.grossPnl, 300.00);
    assert.strictEqual(us30Res.netPnl, 295.00);
    assert.strictEqual(us30Res.plannedRiskAmount, 200.00);
    assert.strictEqual(us30Res.realizedRR, 1.48);

    // NQ Futures: Long 1 contract: Entry 19000.00, Exit 19025.00 (+25 pts), SL 18990.00 (10 pts), Fees $4.50
    // Multiplier = 20 ($20/pt)
    // Gross: 25 * 1 * 20 = $500.00
    // Net: $500 - $4.50 = $495.50
    // Risk: 10 * 1 * 20 = $200.00
    // Realized RR: 495.50 / 200 = 2.48R
    const nqTrade: TradeInput = {
      pair: 'NQ',
      assetType: 'Futures',
      direction: 'Long',
      lotSize: 1.0,
      contractSize: 20,
      entryPrice: 19000.00,
      exitPrice: 19025.00,
      stopLossPrice: 18990.00,
      closed: true,
      entryDate: '2026-06-03T14:00:00Z',
      exitDate: '2026-06-03T15:30:00Z',
      fees: 4.50,
      currency: 'USD'
    };

    const nqRes = evaluateSingleTrade(nqTrade, 'USD');
    assert.strictEqual(nqRes.grossPnl, 500.00);
    assert.strictEqual(nqRes.netPnl, 495.50);
    assert.strictEqual(nqRes.plannedRiskAmount, 200.00);
    assert.strictEqual(nqRes.realizedRR, 2.48);
  });

  // --- 5. Stocks & Crypto ---
  test('Stocks & Crypto: Correct 1:1 unit sizing and quote currency handling', () => {
    // AAPL: Long 50 shares, Entry $210, Exit $215, Fees $1.00
    const aaplTrade: TradeInput = {
      pair: 'AAPL',
      assetType: 'Stock',
      direction: 'Long',
      lotSize: 50,
      entryPrice: 210.00,
      exitPrice: 215.00,
      closed: true,
      entryDate: '2026-06-04T13:30:00Z',
      exitDate: '2026-06-04T16:00:00Z',
      fees: 1.00,
      currency: 'USD'
    };

    const aaplRes = evaluateSingleTrade(aaplTrade, 'USD');
    assert.strictEqual(aaplRes.grossPnl, 250.00);
    assert.strictEqual(aaplRes.netPnl, 249.00);

    // BTC/USD: Short 0.5 BTC, Entry 65000, Exit 63000 (+2000 pts profit), Fees $15
    const btcTrade: TradeInput = {
      pair: 'BTCUSD',
      assetType: 'Crypto',
      direction: 'Short',
      lotSize: 0.5,
      entryPrice: 65000.00,
      exitPrice: 63000.00,
      closed: true,
      entryDate: '2026-06-05T01:00:00Z',
      exitDate: '2026-06-05T04:00:00Z',
      fees: 15.00,
      currency: 'USD'
    };

    const btcRes = evaluateSingleTrade(btcTrade, 'USD');
    assert.strictEqual(btcRes.grossPnl, 1000.00);
    assert.strictEqual(btcRes.netPnl, 985.00);
    assert.strictEqual(btcRes.status, 'Win');
  });

  // --- 6. Cross-Currency Pairs & Missing Conversion Rates ---
  test('Cross-Currency: Uses conversionRate when provided, respects broker PnL, or flags unsupported', () => {
    // Case A: EUR/GBP with conversionRate GBP/USD = 1.28
    // Long 1.0 lot, Entry 0.8500, Exit 0.8550 (+0.0050 GBP)
    // Raw GBP PnL: 0.0050 * 1 * 100,000 = 500 GBP
    // Converted to USD: 500 * 1.28 = $640.00 USD
    const crossWithRate: TradeInput = {
      pair: 'EURGBP',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 0.8500,
      exitPrice: 0.8550,
      stopLossPrice: 0.8475,
      conversionRate: 1.28,
      closed: true,
      entryDate: '2026-06-06T10:00:00Z',
      exitDate: '2026-06-06T11:00:00Z',
      fees: 0,
      currency: 'USD'
    };

    const resA = evaluateSingleTrade(crossWithRate, 'USD');
    assert.strictEqual(resA.grossPnl, 640.00);
    assert.strictEqual(resA.plannedRiskAmount, 320.00); // 250 GBP * 1.28
    assert.strictEqual(resA.realizedRR, 2.00);
    assert.strictEqual(resA.calculationStatus, 'complete');

    // Case B: EUR/GBP without conversionRate and without broker pnl
    // Must return unsupported_conversion and NOT fabricate 1.0 parity!
    const crossMissingRate: TradeInput = {
      pair: 'EURGBP',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 0.8500,
      exitPrice: 0.8550,
      closed: true,
      entryDate: '2026-06-06T10:00:00Z',
      exitDate: '2026-06-06T11:00:00Z',
      currency: 'USD'
    };

    const resB = evaluateSingleTrade(crossMissingRate, 'USD');
    assert.strictEqual(resB.grossPnl, null);
    assert.strictEqual(resB.netPnl, null);
    assert.strictEqual(resB.calculationStatus, 'unsupported_conversion');

    // Case C: EUR/GBP with broker settled pnl = $635.00
    const crossWithBrokerPnl: TradeInput = {
      pair: 'EURGBP',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 0.8500,
      exitPrice: 0.8550,
      pnl: 635.00,
      closed: true,
      entryDate: '2026-06-06T10:00:00Z',
      exitDate: '2026-06-06T11:00:00Z',
      fees: 5.00,
      currency: 'USD'
    };

    const resC = evaluateSingleTrade(crossWithBrokerPnl, 'USD');
    assert.strictEqual(resC.netPnl, 635.00);
    assert.strictEqual(resC.grossPnl, 640.00); // 635 + 5
    assert.strictEqual(resC.calculationStatus, 'broker_reported');
  });

  // --- 7. Fee Validation & Negative Fee Guard ---
  test('Fee Validation: Negative fees are clamped to 0.00 with explanatory notes', () => {
    const tradeNegativeFee: TradeInput = {
      pair: 'EURUSD',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 1.1000,
      exitPrice: 1.1010,
      fees: -25.00, // Invalid negative fee
      closed: true,
      entryDate: '2026-06-07T10:00:00Z',
      exitDate: '2026-06-07T11:00:00Z',
      currency: 'USD'
    };

    const res = evaluateSingleTrade(tradeNegativeFee, 'USD');
    assert.strictEqual(res.fees, 0.00);
    assert.strictEqual(res.netPnl, 100.00); // 100 - 0
    assert.ok(res.calculationNotes?.includes('Invalid negative fees clamped to 0.00'));
  });

  // --- 8. Breakeven Tolerances Across Supported Currencies ---
  test('Breakeven Tolerance: 0.01 for USD vs 1.0 for JPY accounts', () => {
    assert.strictEqual(getBreakevenTolerance('USD'), 0.01);
    assert.strictEqual(getBreakevenTolerance('EUR'), 0.01);
    assert.strictEqual(getBreakevenTolerance('JPY'), 1.0);

    // USD Account: +$0.005 is within tolerance -> Breakeven
    const usdTrade: TradeInput = {
      pair: 'EURUSD',
      direction: 'Long',
      lotSize: 0.1,
      entryPrice: 1.10000,
      exitPrice: 1.10005, // Gross = $0.50, Fees = $0.50 -> Net = $0.00
      fees: 0.50,
      closed: true,
      entryDate: '2026-06-08T10:00:00Z',
      currency: 'USD'
    };
    const usdRes = evaluateSingleTrade(usdTrade, 'USD');
    assert.strictEqual(usdRes.status, 'Breakeven');

    // JPY Account: +0.80 JPY is within 1.0 JPY tolerance -> Breakeven
    const jpyTrade: TradeInput = {
      pair: 'EURJPY',
      direction: 'Long',
      lotSize: 0.01,
      entryPrice: 160.00,
      exitPrice: 160.01,
      fees: 9.20,
      closed: true,
      entryDate: '2026-06-08T10:00:00Z',
      currency: 'JPY'
    };
    // 0.01 * 0.01 * 100,000 = 10 JPY gross. Net = 10 - 9.20 = 0.80 JPY
    const jpyRes = evaluateSingleTrade(jpyTrade, 'JPY');
    assert.strictEqual(jpyRes.status, 'Breakeven');
  });

  // --- 9. Missing Risk & Invalid Stop-Loss Placement ---
  test('Missing Risk & Inverted Stop-Loss: Realized R is strictly null and not divided by 1', () => {
    // A: No Stop Loss and no riskAmount
    const noRiskTrade: TradeInput = {
      pair: 'EURUSD',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 1.1000,
      exitPrice: 1.1050,
      closed: true,
      entryDate: '2026-06-09T10:00:00Z',
      currency: 'USD'
    };
    const resA = evaluateSingleTrade(noRiskTrade, 'USD');
    assert.strictEqual(resA.plannedRiskAmount, null);
    assert.strictEqual(resA.realizedRR, null);

    // B: Inverted Stop-Loss on Long (SL above Entry)
    const invertedSlTrade: TradeInput = {
      pair: 'EURUSD',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 1.1000,
      stopLossPrice: 1.1050, // Invalid: SL above entry on Long!
      closed: false,
      entryDate: '2026-06-09T10:00:00Z',
      currency: 'USD'
    };
    const resB = evaluateSingleTrade(invertedSlTrade, 'USD');
    assert.strictEqual(resB.plannedRiskAmount, null);
    assert.ok(resB.calculationNotes?.includes('Invalid stop-loss placement'));
  });

  // --- 10. Drawdown Recovery & Starting Equity Assumptions ---
  test('Drawdown Series: Evaluates peak-to-trough decline on closed-trade equity curve', () => {
    // Starting Capital = $10,000
    // Trade 1: Loss -$1,000 -> Bal $9,000 (DD = $1,000, 10.00%)
    // Trade 2: Win +$500   -> Bal $9,500 (DD = $500, 5.00%)
    // Trade 3: Win +$1,500 -> Bal $11,000 (New Peak $11,000, DD = $0, 0%)
    // Trade 4: Loss -$1,100 -> Bal $9,900 (Peak $11,000, DD = $1,100, 10.00%)
    const trades: TradeInput[] = [
      { pair: 'EURUSD', direction: 'Long', lotSize: 1, entryPrice: 1.1000, exitPrice: 1.0900, closed: true, entryDate: '2026-06-01T10:00:00Z', exitDate: '2026-06-01T12:00:00Z', currency: 'USD' },
      { pair: 'EURUSD', direction: 'Long', lotSize: 1, entryPrice: 1.1000, exitPrice: 1.1050, closed: true, entryDate: '2026-06-02T10:00:00Z', exitDate: '2026-06-02T12:00:00Z', currency: 'USD' },
      { pair: 'EURUSD', direction: 'Long', lotSize: 1, entryPrice: 1.1000, exitPrice: 1.1150, closed: true, entryDate: '2026-06-03T10:00:00Z', exitDate: '2026-06-03T12:00:00Z', currency: 'USD' },
      { pair: 'EURUSD', direction: 'Long', lotSize: 1, entryPrice: 1.1000, exitPrice: 1.0890, closed: true, entryDate: '2026-06-04T10:00:00Z', exitDate: '2026-06-04T12:00:00Z', currency: 'USD' }
    ];

    const metrics = calculateFinancialMetrics(trades, 10000, 'USD');
    assert.strictEqual(metrics.maxDrawdownAmount, 1100.00);
    assert.strictEqual(metrics.maxDrawdownPercent, 10.00);
    assert.strictEqual(metrics.equityCurve[metrics.equityCurve.length - 1].balance, 9900.00);
    assert.ok(metrics.drawdownDefinition.includes('Closed-Trade Peak-to-Trough Drawdown'));
  });

  // --- 11. Prop Firm Rules: Static vs Trailing Drawdown & Daily Loss ---
  test('Prop Firm Rules: Accurately evaluates static vs trailing drawdown and daily loss', () => {
    // Config: $100,000 capital, 10% max total DD, 5% max daily loss
    const staticConfig = {
      startingCapital: 100000,
      maxTotalDrawdownPercent: 10,
      maxDailyLossPercent: 5,
      drawdownType: 'static' as const
    };

    // Trades resulting in $89,500 balance (breaching $90,000 static floor)
    const breachTrades: TradeInput[] = [
      { pair: 'EURUSD', direction: 'Long', lotSize: 10, entryPrice: 1.1000, exitPrice: 1.0895, closed: true, entryDate: '2026-06-01T10:00:00Z', exitDate: '2026-06-01T12:00:00Z', currency: 'USD' }
    ];
    // Loss: (1.0895 - 1.1000) * 10 * 100,000 = -10,500 USD -> Bal = 89,500
    const evalStatic = evaluatePropFirmRules(staticConfig, breachTrades, 'USD');
    assert.strictEqual(evalStatic.isDrawdownBreached, true);
    assert.strictEqual(evalStatic.status, 'Breached');
    assert.strictEqual(evalStatic.drawdownFloorBalance, 90000.00);

    // Trailing Drawdown: Account grew to $110,000. Trailing limit 6%. Floor = 110,000 * 0.94 = $103,400.
    const trailingConfig = {
      startingCapital: 100000,
      maxTotalDrawdownPercent: 6,
      drawdownType: 'trailing' as const
    };
    const trailingTrades: TradeInput[] = [
      { pair: 'EURUSD', direction: 'Long', lotSize: 10, entryPrice: 1.1000, exitPrice: 1.1100, closed: true, entryDate: '2026-06-01T10:00:00Z', exitDate: '2026-06-01T12:00:00Z', currency: 'USD' }, // +10,000 -> Bal 110k
      { pair: 'EURUSD', direction: 'Long', lotSize: 6, entryPrice: 1.1000, exitPrice: 1.0900, closed: true, entryDate: '2026-06-02T10:00:00Z', exitDate: '2026-06-02T12:00:00Z', currency: 'USD' } // -6,000 -> Bal 104k
    ];
    const evalTrailing = evaluatePropFirmRules(trailingConfig, trailingTrades, 'USD');
    assert.strictEqual(evalTrailing.highWaterMark, 110000.00);
    assert.strictEqual(evalTrailing.drawdownFloorBalance, 103400.00);
    assert.strictEqual(evalTrailing.currentBalance, 104000.00);
    assert.strictEqual(evalTrailing.remainingDrawdownBudget, 600.00);
    assert.strictEqual(evalTrailing.status, 'Warning'); // Budget <= 25% of limit
  });

  // --- 12. Safe Legacy Record Reconciliation ---
  test('Legacy Reconciliation: Idempotently populates missing fields and identifies anomalies', () => {
    // Legacy trade with missing fees, missing currency, missing contractSize, but valid broker pnl
    const legacyTrade: TradeInput = {
      pair: 'USDJPY',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 150.00,
      exitPrice: 151.00,
      pnl: 662.25, // Pre-existing broker settled PnL
      closed: true,
      entryDate: '2026-01-01T10:00:00Z'
    };

    const res = reconcileTradeRecord(legacyTrade, 'USD');
    assert.strictEqual(res.isModified, true);
    assert.strictEqual(res.reconciledTrade.fees, 0);
    assert.strictEqual(res.reconciledTrade.currency, 'USD');
    assert.strictEqual(res.reconciledTrade.contractSize, 100000);
    assert.strictEqual(res.reconciledTrade.netPnl, 662.25); // Preserves broker settled PnL!
    assert.strictEqual(res.reconciledTrade.status, 'Win');

    // Incomplete trade: closed but missing both exit price and settled pnl
    const brokenTrade: TradeInput = {
      pair: 'EURUSD',
      direction: 'Long',
      lotSize: 1.0,
      entryPrice: 1.1000,
      closed: true,
      entryDate: '2026-01-02T10:00:00Z'
    };
    const brokenRes = reconcileTradeRecord(brokenTrade, 'USD');
    assert.ok(brokenRes.issues.some(iss => iss.includes('Incomplete trade')));

    // Batch dry-run test
    const batchRes = reconcileTradesBatch([legacyTrade, brokenTrade], 'USD');
    assert.strictEqual(batchRes.total, 2);
    assert.strictEqual(batchRes.modifiedCount, 2);
    assert.strictEqual(batchRes.unreconciledCount, 1);
  });
});

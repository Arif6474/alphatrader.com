import { NextResponse } from 'next/server';
import { saveTrades } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

const SAMPLE_TRADES = [
  {
    "pair": "EURUSD",
    "direction": "Long",
    "orderType": "Market",
    "strategy": "Breakout",
    "broker": "IC Markets",
    "session": "New York",
    "tags": ["Breakout", "Trend Following"],
    "mistakes": [],
    "tradeDuration": "2h 45m",
    "entryDate": "2026-06-12T14:30",
    "exitDate": "2026-06-12T17:15",
    "closed": true,
    "lotSize": 1.5,
    "entryPrice": 1.0825,
    "stopLossPrice": 1.0805,
    "takeProfitPrice": 1.0875,
    "exitPrice": 1.0865,
    "entryReason": "Price broke out above key daily resistance level with strong volume confirmation on the 15m chart.",
    "lessonsLearned": "Taking partial profits at +2R was a solid choice as the price started to stall near the daily target.",
    "riskAmount": 300,
    "riskPercentage": 1.5,
    "accountBalance": 20000,
    "pnl": 600,
    "status": "Win",
    "psychologyBefore": ["Calm", "Confident"],
    "psychologyDuring": ["Calm", "Neutral"],
    "psychologyAfter": ["Confident", "Calm"],
    "psychologyFactors": ["Discipline"],
    "assetType": "Forex",
    "contractSize": 100000,
    "createdAt": "2026-06-12T14:30:00.000Z"
  },
  {
    "pair": "GBPUSD",
    "direction": "Short",
    "orderType": "Limit",
    "strategy": "Reversal",
    "broker": "IC Markets",
    "session": "London",
    "tags": ["Reversal", "FOMO Entry"],
    "mistakes": ["FOMO", "Revenge Trading"],
    "tradeDuration": "2h 30m",
    "entryDate": "2026-06-13T09:15",
    "exitDate": "2026-06-13T11:45",
    "closed": true,
    "lotSize": 2.0,
    "entryPrice": 1.2740,
    "stopLossPrice": 1.2760,
    "takeProfitPrice": 1.2680,
    "exitPrice": 1.2760,
    "entryReason": "Expected double top reversal at the psychological resistance area of 1.2740.",
    "lessonsLearned": "Price broke through the level aggressively. I failed to wait for confirmation. Entered purely out of FOMO.",
    "riskAmount": 400,
    "riskPercentage": 2.0,
    "accountBalance": 20600,
    "pnl": -400,
    "status": "Loss",
    "psychologyBefore": ["Anxious", "Excited"],
    "psychologyDuring": ["Fearful", "Anxious"],
    "psychologyAfter": ["Frustrated", "Neutral"],
    "psychologyFactors": ["FOMO", "Revenge Trading"],
    "assetType": "Forex",
    "contractSize": 100000,
    "createdAt": "2026-06-13T09:15:00.000Z"
  },
  {
    "pair": "USDJPY",
    "direction": "Long",
    "orderType": "Market",
    "strategy": "Support/Resistance",
    "broker": "Pepperstone",
    "session": "London",
    "tags": ["Support Level", "Bullish Engulfing"],
    "mistakes": [],
    "tradeDuration": "7h 30m",
    "entryDate": "2026-06-14T08:00",
    "exitDate": "2026-06-14T15:30",
    "closed": true,
    "lotSize": 1.0,
    "entryPrice": 156.50,
    "stopLossPrice": 156.20,
    "takeProfitPrice": 157.40,
    "exitPrice": 157.10,
    "entryReason": "Retest of major support level at 156.50. Formed a beautiful bullish engulfing candle on the 4H chart.",
    "lessonsLearned": "Great patience shown. Supported by daily trend. Trail stop locked in gains nicely.",
    "riskAmount": 192.31,
    "riskPercentage": 0.95,
    "accountBalance": 20200,
    "pnl": 384.62,
    "status": "Win",
    "psychologyBefore": ["Calm", "Neutral"],
    "psychologyDuring": ["Calm", "Confident"],
    "psychologyAfter": ["Calm", "Confident"],
    "psychologyFactors": ["Patience"],
    "assetType": "Forex",
    "contractSize": 100000,
    "createdAt": "2026-06-14T08:00:00.000Z"
  },
  {
    "pair": "BTCUSD",
    "direction": "Long",
    "orderType": "Market",
    "strategy": "Trend",
    "broker": "Binance",
    "session": "Asia",
    "tags": ["Pullback", "20 EMA Retest"],
    "mistakes": [],
    "tradeDuration": "",
    "entryDate": "2026-06-14T20:00",
    "closed": false,
    "lotSize": 0.05,
    "entryPrice": 67200,
    "stopLossPrice": 66200,
    "takeProfitPrice": 69200,
    "entryReason": "Strong uptrend continuing. Entering on a minor pullback to the 20 EMA on the 1H chart.",
    "riskAmount": 50,
    "riskPercentage": 0.25,
    "accountBalance": 20584.62,
    "status": "Active",
    "psychologyBefore": ["Calm"],
    "psychologyDuring": ["Calm"],
    "psychologyAfter": [],
    "psychologyFactors": ["Patience"],
    "assetType": "Crypto",
    "contractSize": 1,
    "createdAt": "2026-06-14T20:00:00.000Z"
  }
];

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'reset') {
      const scopedSample = SAMPLE_TRADES.map((t, idx) => ({
        ...t,
        userId: sessionUser.userId,
        id: `sample-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(new Date(t.createdAt).getTime()).toISOString()
      }));
      await saveTrades(scopedSample as any, sessionUser.userId);
      return NextResponse.json({ success: true, message: 'Database reset to user sample data' });
    }

    if (action === 'clear') {
      await saveTrades([], sessionUser.userId);
      return NextResponse.json({ success: true, message: 'Your journal has been wiped clean' });
    }

    if (action === 'import') {
      const body = await request.json();
      const tradesArray = Array.isArray(body) ? body : body.trades;
      
      if (!tradesArray || !Array.isArray(tradesArray)) {
        return NextResponse.json({ error: 'Invalid payload. Expecting an array of trades.' }, { status: 400 });
      }
      
      const mapped = tradesArray.map(t => ({
        ...t,
        userId: sessionUser.userId
      }));
      
      await saveTrades(mapped, sessionUser.userId);
      return NextResponse.json({ success: true, message: `${tradesArray.length} trades imported successfully` });
    }

    return NextResponse.json({ error: 'Invalid or missing action query parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in Admin DB API:', error);
    return NextResponse.json({ error: 'Administration task failed' }, { status: 500 });
  }
}

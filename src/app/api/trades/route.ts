import { NextResponse } from 'next/server';
import { getTrades, addTrade } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trades = await getTrades(sessionUser.userId);
    // Sort trades by entryDate desc (newest first)
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );
    return NextResponse.json(sortedTrades);
  } catch (error) {
    console.error('Error fetching trades in API:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Server-side validation
    if (!body.pair || !body.direction || !body.orderType || !body.entryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tradeData = {
      pair: body.pair,
      direction: body.direction,
      orderType: body.orderType,
      strategy: body.strategy || 'Other',
      entryDate: body.entryDate,
      exitDate: body.exitDate || undefined,
      closed: !!body.closed,
      lotSize: Number(body.lotSize) || 0,
      entryPrice: Number(body.entryPrice) || 0,
      stopLossPrice: Number(body.stopLossPrice) || 0,
      takeProfitPrice: Number(body.takeProfitPrice) || 0,
      exitPrice: body.exitPrice !== undefined && body.exitPrice !== null ? Number(body.exitPrice) : undefined,
      entryReason: body.entryReason || '',
      lessonsLearned: body.lessonsLearned || '',
      riskAmount: Number(body.riskAmount) || 0,
      riskPercentage: Number(body.riskPercentage) || 0,
      accountBalance: Number(body.accountBalance) || 0,
      pnl: body.pnl !== undefined ? Number(body.pnl) : undefined,
      status: body.status || 'Active',
      psychologyBefore: Array.isArray(body.psychologyBefore) ? body.psychologyBefore : [],
      psychologyDuring: Array.isArray(body.psychologyDuring) ? body.psychologyDuring : [],
      psychologyAfter: Array.isArray(body.psychologyAfter) ? body.psychologyAfter : [],
      psychologyFactors: Array.isArray(body.psychologyFactors) ? body.psychologyFactors : [],
      chartBefore: body.chartBefore || '',
      chartAfter: body.chartAfter || '',
      assetType: body.assetType || 'Forex',
      contractSize: Number(body.contractSize) || 1,
      accountId: body.accountId || ''
    };

    const newTrade = await addTrade(tradeData, sessionUser.userId);
    return NextResponse.json(newTrade, { status: 201 });
  } catch (error) {
    console.error('Error creating trade in API:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}

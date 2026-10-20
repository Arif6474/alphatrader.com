import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getPsychologyRecord, savePsychologyRecord, getPsychologyHistory } from '@/lib/psychologyDb';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || todayStr;
    const accountId = searchParams.get('accountId') || undefined;

    const [todayRecord, history] = await Promise.all([
      getPsychologyRecord(user.userId, date, accountId),
      getPsychologyHistory(user.userId, 90)
    ]);

    return NextResponse.json({
      success: true,
      current: todayRecord,
      history
    });
  } catch (error) {
    console.error('Error fetching psychology record:', error);
    return NextResponse.json({ error: 'Failed to fetch psychology record' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const todayStr = new Date().toISOString().split('T')[0];
    const date = body.date || todayStr;

    const saved = await savePsychologyRecord(user.userId, {
      ...body,
      date
    });

    return NextResponse.json({
      success: true,
      record: saved
    });
  } catch (error) {
    console.error('Error saving psychology record:', error);
    return NextResponse.json({ error: 'Failed to save psychology record' }, { status: 500 });
  }
}

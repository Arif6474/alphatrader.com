import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import AccountModel from '@/models/Account';
import {
  getAccountsByUserId,
  createLocalAccount
} from '@/lib/accountsDb';

let useMongo: boolean | null = null;

async function checkMongoConnection(): Promise<boolean> {
  if (useMongo !== null) return useMongo;
  try {
    await connectToDatabase();
    useMongo = true;
  } catch {
    useMongo = false;
  }
  return useMongo;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isMongo = await checkMongoConnection();

  if (!isMongo) {
    const accounts = getAccountsByUserId(user.userId);
    return NextResponse.json(accounts);
  }

  try {
    const accounts = await AccountModel.find({ userId: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json(
      accounts.map(a => ({
        id: a._id.toString(),
        userId: a.userId,
        name: a.name,
        firmName: a.firmName || '',
        startingCapital: a.startingCapital,
        createdAt: a.createdAt?.toISOString(),
        updatedAt: a.updatedAt?.toISOString()
      }))
    );
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    const accounts = getAccountsByUserId(user.userId);
    return NextResponse.json(accounts);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, firmName, startingCapital } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
  }

  const isMongo = await checkMongoConnection();

  if (!isMongo) {
    const account = createLocalAccount({
      userId: user.userId,
      name: name.trim(),
      firmName: (firmName || '').trim(),
      startingCapital: Number(startingCapital) || 0
    });
    return NextResponse.json(account, { status: 201 });
  }

  try {
    const account = await AccountModel.create({
      userId: user.userId,
      name: name.trim(),
      firmName: (firmName || '').trim(),
      startingCapital: Number(startingCapital) || 0
    });
    return NextResponse.json(
      {
        id: account._id.toString(),
        userId: account.userId,
        name: account.name,
        firmName: account.firmName || '',
        startingCapital: account.startingCapital,
        createdAt: account.createdAt?.toISOString(),
        updatedAt: account.updatedAt?.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

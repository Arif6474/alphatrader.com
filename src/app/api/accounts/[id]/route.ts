import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import AccountModel from '@/models/Account';
import {
  getLocalAccountById,
  updateLocalAccount,
  deleteLocalAccount
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const id = (await params).id;

  const isMongo = await checkMongoConnection();

  if (!isMongo) {
    const account = getLocalAccountById(id);
    if (!account || account.userId !== user.userId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    const updated = updateLocalAccount(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(firmName !== undefined ? { firmName: firmName.trim() } : {}),
      ...(startingCapital !== undefined ? { startingCapital: Number(startingCapital) } : {})
    });
    return NextResponse.json(updated);
  }

  try {
    const account = await AccountModel.findOneAndUpdate(
      { _id: id, userId: user.userId },
      {
        ...(name ? { name: name.trim() } : {}),
        ...(firmName !== undefined ? { firmName: firmName.trim() } : {}),
        ...(startingCapital !== undefined ? { startingCapital: Number(startingCapital) } : {})
      },
      { new: true }
    );
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: account._id.toString(),
      userId: account.userId,
      name: account.name,
      firmName: account.firmName || '',
      startingCapital: account.startingCapital,
      createdAt: account.createdAt?.toISOString(),
      updatedAt: account.updatedAt?.toISOString()
    });
  } catch (error) {
    console.error('PUT /api/accounts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = (await params).id;
  const isMongo = await checkMongoConnection();

  if (!isMongo) {
    const account = getLocalAccountById(id);
    if (!account || account.userId !== user.userId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    deleteLocalAccount(id);
    return NextResponse.json({ success: true });
  }

  try {
    const account = await AccountModel.findOneAndDelete({ _id: id, userId: user.userId });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

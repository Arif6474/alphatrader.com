import { NextResponse } from 'next/server';
import { updateTrade, deleteTrade } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const updatedTrade = await updateTrade(id, body, sessionUser.userId);
    if (!updatedTrade) {
      return NextResponse.json({ error: 'Trade not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('Error updating trade in API:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteTrade(id, sessionUser.userId);
    if (!success) {
      return NextResponse.json({ error: 'Trade not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade in API:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0 // instantly expire cookie
    });

    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout API error:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}

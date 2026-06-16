import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyPassword, signToken } from '@/lib/auth';
import { findLocalUserByEmail } from '@/lib/usersDb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Try MongoDB connection
    let useMongo = true;
    try {
      await connectToDatabase();
    } catch (err) {
      console.warn('MongoDB not available during signin, using local JSON database fallback.');
      useMongo = false;
    }

    const lowerEmail = email.toLowerCase().trim();
    let user: any = null;

    if (useMongo) {
      user = await UserModel.findOne({ email: lowerEmail });
    } else {
      user = findLocalUserByEmail(lowerEmail);
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userId = user._id ? user._id.toString() : user.id;
    const token = signToken({
      userId,
      email: user.email,
      name: user.name
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json({ error: 'Signin failed due to internal server error' }, { status: 500 });
  }
}

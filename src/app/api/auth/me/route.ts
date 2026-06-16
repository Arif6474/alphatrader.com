import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';
import { findLocalUserById } from '@/lib/usersDb';

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized. No active session.' }, { status: 401 });
    }

    // Try MongoDB connection
    let useMongo = true;
    try {
      await connectToDatabase();
    } catch (err) {
      useMongo = false;
    }

    let userProfile = null;
    if (useMongo) {
      const dbUser = await UserModel.findById(sessionUser.userId);
      if (dbUser) {
        userProfile = {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar
        };
      }
    } else {
      const dbUser = findLocalUserById(sessionUser.userId);
      if (dbUser) {
        userProfile = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar
        };
      }
    }

    // Fallback if not found in db but JWT is still valid
    if (!userProfile) {
      userProfile = {
        id: sessionUser.userId,
        name: sessionUser.name,
        email: sessionUser.email,
        avatar: undefined
      };
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Session retrieval API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}

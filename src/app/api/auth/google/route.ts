import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyGoogleToken, signToken } from '@/lib/auth';
import { findLocalUserByEmail, createLocalUser, saveLocalUsers, getLocalUsers } from '@/lib/usersDb';

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential token' }, { status: 400 });
    }

    const claims = await verifyGoogleToken(credential);
    if (!claims) {
      return NextResponse.json({ error: 'Google authentication failed' }, { status: 401 });
    }

    // Connect to database if possible
    let useMongo = true;
    try {
      await connectToDatabase();
    } catch (err) {
      console.warn('MongoDB not available during Google login, falling back to local JSON database.');
      useMongo = false;
    }

    let user: any = null;
    let userId = '';

    if (useMongo) {
      // Find user by email or by googleId
      user = await UserModel.findOne({
        $or: [{ email: claims.email.toLowerCase() }, { googleId: claims.sub }]
      });

      if (user) {
        // Update user's Google ID or avatar if missing
        let updated = false;
        if (!user.googleId) {
          user.googleId = claims.sub;
          updated = true;
        }
        if (!user.avatar && claims.picture) {
          user.avatar = claims.picture;
          updated = true;
        }
        if (updated) {
          await user.save();
        }
      } else {
        // Create new Google user
        user = new UserModel({
          name: claims.name,
          email: claims.email.toLowerCase().trim(),
          googleId: claims.sub,
          avatar: claims.picture
        });
        await user.save();
      }
      userId = user._id.toString();
    } else {
      // Local database fallback
      user = findLocalUserByEmail(claims.email.toLowerCase());
      if (user) {
        // Update user
        let updated = false;
        if (!user.googleId) {
          user.googleId = claims.sub;
          updated = true;
        }
        if (!user.avatar && claims.picture) {
          user.avatar = claims.picture;
          updated = true;
        }
        if (updated) {
          const users = getLocalUsers();
          const idx = users.findIndex(u => u.id === user.id);
          if (idx !== -1) {
            users[idx] = { ...users[idx], googleId: user.googleId, avatar: user.avatar, updatedAt: new Date().toISOString() };
            saveLocalUsers(users);
          }
        }
      } else {
        // Create new user locally
        user = createLocalUser({
          name: claims.name,
          email: claims.email.toLowerCase().trim(),
          googleId: claims.sub,
          avatar: claims.picture
        });
      }
      userId = user.id;
    }

    const token = signToken({
      userId,
      email: claims.email,
      name: claims.name
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
        name: claims.name,
        email: claims.email,
        avatar: claims.picture
      }
    });
  } catch (error) {
    console.error('Google Sign-In API error:', error);
    return NextResponse.json({ error: 'Google login failed due to internal server error' }, { status: 500 });
  }
}

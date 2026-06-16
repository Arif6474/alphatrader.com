import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { findLocalUserByEmail, createLocalUser } from '@/lib/usersDb';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing name, email, or password' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Try MongoDB connection
    let useMongo = true;
    try {
      await connectToDatabase();
    } catch (err) {
      console.warn('MongoDB not available during signup, using local JSON database fallback.');
      useMongo = false;
    }

    const lowerEmail = email.toLowerCase().trim();

    if (useMongo) {
      const existingUser = await UserModel.findOne({ email: lowerEmail });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const newUser = new UserModel({
        name,
        email: lowerEmail,
        passwordHash
      });
      await newUser.save();
    } else {
      const existingUser = findLocalUserByEmail(lowerEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      createLocalUser({
        name,
        email: lowerEmail,
        passwordHash
      });
    }

    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Signup failed due to internal server error' }, { status: 500 });
  }
}

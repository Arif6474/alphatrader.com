import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import UserModel from '@/models/User';
import { connectToDatabase } from './mongodb';
import { findLocalUserById } from './usersDb';

const JWT_SECRET = process.env.JWT_SECRET || 'alphatrader-super-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// Hash password
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Sign JWT token
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Google Token Verification
export interface GoogleUserClaims {
  sub: string; // Google User ID
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleUserClaims | null> {
  // Demo Mode check: if GOOGLE_CLIENT_ID is not configured, support mock logins
  if (!GOOGLE_CLIENT_ID) {
    if (idToken.startsWith('mock_token_')) {
      const username = idToken.replace('mock_token_', '');
      const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
      return {
        sub: `mock_google_${username}`,
        email: `${username}@example.com`,
        name: `${capitalized} (Demo Google)`,
        picture: ''
      };
    }
    console.warn('Google client ID is not configured, and token was not a mock token.');
    return null;
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) {
      console.error('Failed to verify Google token with tokeninfo API');
      return null;
    }

    const payload = await res.json();
    
    // Verify audience matches our client ID
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      console.error('Audience mismatch on Google ID Token');
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    return null;
  }
}

// Helper to get current authenticated user details from cookies
export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}

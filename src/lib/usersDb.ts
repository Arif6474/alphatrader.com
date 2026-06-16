import fs from 'fs';
import path from 'path';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const dbDir = path.join(process.cwd(), 'src', 'data');
const usersFile = path.join(dbDir, 'users.json');

function ensureUsersDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
  }
}

export function getLocalUsers(): LocalUser[] {
  ensureUsersDb();
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    const db = JSON.parse(data);
    return db.users || [];
  } catch (error) {
    console.error('Error reading users from local JSON file:', error);
    return [];
  }
}

export function saveLocalUsers(users: LocalUser[]): boolean {
  ensureUsersDb();
  try {
    fs.writeFileSync(usersFile, JSON.stringify({ users }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users to local JSON file:', error);
    return false;
  }
}

export function findLocalUserByEmail(email: string): LocalUser | null {
  const users = getLocalUsers();
  const lowerEmail = email.toLowerCase().trim();
  return users.find(u => u.email.toLowerCase().trim() === lowerEmail) || null;
}

export function findLocalUserById(id: string): LocalUser | null {
  const users = getLocalUsers();
  return users.find(u => u.id === id) || null;
}

export function createLocalUser(user: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>): LocalUser {
  const users = getLocalUsers();
  const newUser: LocalUser = {
    ...user,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}

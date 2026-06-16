import fs from 'fs';
import path from 'path';

export interface LocalAccount {
  id: string;
  userId: string;
  name: string;
  firmName?: string;
  startingCapital: number;
  createdAt: string;
  updatedAt: string;
}

const dbDir = path.join(process.cwd(), 'src', 'data');
const accountsFile = path.join(dbDir, 'accounts.json');

function ensureAccountsDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(accountsFile)) {
    fs.writeFileSync(accountsFile, JSON.stringify({ accounts: [] }, null, 2));
  }
}

export function getLocalAccounts(): LocalAccount[] {
  ensureAccountsDb();
  try {
    const data = fs.readFileSync(accountsFile, 'utf8');
    const db = JSON.parse(data);
    return db.accounts || [];
  } catch (error) {
    console.error('Error reading accounts from local JSON file:', error);
    return [];
  }
}

export function saveLocalAccounts(accounts: LocalAccount[]): boolean {
  ensureAccountsDb();
  try {
    fs.writeFileSync(accountsFile, JSON.stringify({ accounts }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving accounts to local JSON file:', error);
    return false;
  }
}

export function getAccountsByUserId(userId: string): LocalAccount[] {
  return getLocalAccounts()
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLocalAccountById(id: string): LocalAccount | null {
  return getLocalAccounts().find(a => a.id === id) || null;
}

export function createLocalAccount(
  account: Omit<LocalAccount, 'id' | 'createdAt' | 'updatedAt'>
): LocalAccount {
  const all = getLocalAccounts();
  const newAccount: LocalAccount = {
    ...account,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  all.push(newAccount);
  saveLocalAccounts(all);
  return newAccount;
}

export function updateLocalAccount(
  id: string,
  fields: Partial<Omit<LocalAccount, 'id' | 'userId' | 'createdAt'>>
): LocalAccount | null {
  const all = getLocalAccounts();
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...fields, updatedAt: new Date().toISOString() };
  saveLocalAccounts(all);
  return all[idx];
}

export function deleteLocalAccount(id: string): boolean {
  const all = getLocalAccounts();
  const filtered = all.filter(a => a.id !== id);
  if (filtered.length === all.length) return false;
  return saveLocalAccounts(filtered);
}

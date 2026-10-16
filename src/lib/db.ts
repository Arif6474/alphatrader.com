import { connectToDatabase } from './mongodb';
import TradeModel from '@/models/Trade';
import { evaluateSingleTrade } from './calculations';
import fs from 'fs';
import path from 'path';

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  pair: string;
  direction: 'Long' | 'Short';
  orderType: 'Market' | 'Limit' | 'Stop';
  strategy: string;
  timeframe?: string;
  broker?: string;
  session?: string;
  tags?: string[];
  mistakes?: string[];
  tradeDuration?: string;
  entryDate: string;
  exitDate?: string;
  closed: boolean;
  lotSize: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  exitPrice?: number;
  entryReason?: string;
  lessonsLearned?: string;
  riskAmount: number;
  riskPercentage: number;
  accountBalance: number;
  pnl?: number;
  grossPnl?: number;
  netPnl?: number;
  fees?: number;
  currency?: string;
  conversionRate?: number;
  status: 'Win' | 'Loss' | 'Breakeven' | 'Active' | 'Cancelled';
  plannedRiskAmount?: number;
  plannedRR?: number;
  realizedRR?: number;
  psychologyBefore: string[];
  psychologyDuring: string[];
  psychologyAfter: string[];
  psychologyFactors: string[];
  chartBefore?: string; // base64 or URL
  chartAfter?: string;  // base64 or URL
  assetType: 'Forex' | 'Crypto' | 'Stock' | 'Futures';
  contractSize: number;
  createdAt: string;
}

// --- Local File Database Config & Helpers ---
const dbDir = path.join(process.cwd(), 'src', 'data');
const dbFile = path.join(dbDir, 'db.json');

function ensureDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ trades: [] }, null, 2));
  }
}

function getLocalTrades(): Trade[] {
  ensureDb();
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    const db = JSON.parse(data);
    return db.trades || [];
  } catch (error) {
    console.error('Error reading trades from local JSON file:', error);
    return [];
  }
}

function saveLocalTrades(trades: Trade[]): boolean {
  ensureDb();
  try {
    fs.writeFileSync(dbFile, JSON.stringify({ trades }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving trades to local JSON file:', error);
    return false;
  }
}

// --- Connection Resiliency and Fallback ---
let useMongo = true;
let hasCheckedMongo = false;

async function checkMongoConnection(): Promise<boolean> {
  if (hasCheckedMongo) return useMongo;

  try {
    const connectionPromise = connectToDatabase();
    
    // Create a 1.5-second timeout for MongoDB connection attempts
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB Connection Timeout (1.5s)')), 1500)
    );

    // Race connection against the timeout
    await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('Successfully connected to MongoDB. Using MongoDB as active database.');
    useMongo = true;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'CRITICAL: MongoDB connection failed in production. Refusing silent fallback to local JSON to prevent data loss.',
        'Reason:', (err as Error).message
      );
      throw new Error(`Database connection failed: ${(err as Error).message}`);
    }

    console.warn(
      'MongoDB connection failed or timed out. Falling back to local file-based database (src/data/db.json).',
      'Reason:', (err as Error).message
    );
    useMongo = false;
  }

  hasCheckedMongo = true;
  return useMongo;
}

// Map MongoDB Document to plain TypeScript Trade type expected by client
function mapTradeDoc(doc: any): Trade {
  const pnl = doc.pnl !== undefined && doc.pnl !== null ? doc.pnl : (doc.netPnl !== undefined ? doc.netPnl : undefined);
  return {
    id: doc._id.toString(),
    userId: doc.userId ? doc.userId.toString() : '',
    accountId: doc.accountId || '',
    pair: doc.pair,
    direction: doc.direction,
    orderType: doc.orderType,
    strategy: doc.strategy,
    timeframe: doc.timeframe || undefined,
    broker: doc.broker || '',
    session: doc.session || '',
    tags: doc.tags || [],
    mistakes: doc.mistakes || [],
    tradeDuration: doc.tradeDuration || '',
    entryDate: doc.entryDate,
    exitDate: doc.exitDate || undefined,
    closed: doc.closed,
    lotSize: doc.lotSize,
    entryPrice: doc.entryPrice,
    stopLossPrice: doc.stopLossPrice,
    takeProfitPrice: doc.takeProfitPrice,
    exitPrice: doc.exitPrice !== undefined && doc.exitPrice !== null ? doc.exitPrice : undefined,
    entryReason: doc.entryReason || '',
    lessonsLearned: doc.lessonsLearned || '',
    riskAmount: doc.riskAmount,
    riskPercentage: doc.riskPercentage,
    accountBalance: doc.accountBalance,
    pnl,
    grossPnl: doc.grossPnl !== undefined ? doc.grossPnl : pnl,
    netPnl: doc.netPnl !== undefined ? doc.netPnl : pnl,
    fees: doc.fees || 0,
    currency: doc.currency || 'USD',
    conversionRate: doc.conversionRate !== undefined ? doc.conversionRate : undefined,
    status: doc.status || 'Active',
    plannedRiskAmount: doc.plannedRiskAmount,
    plannedRR: doc.plannedRR,
    realizedRR: doc.realizedRR,
    psychologyBefore: doc.psychologyBefore || [],
    psychologyDuring: doc.psychologyDuring || [],
    psychologyAfter: doc.psychologyAfter || [],
    psychologyFactors: doc.psychologyFactors || [],
    chartBefore: doc.chartBefore || '',
    chartAfter: doc.chartAfter || '',
    assetType: doc.assetType,
    contractSize: doc.contractSize,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
  };
}

export async function getTrades(userId: string): Promise<Trade[]> {
  const isMongo = await checkMongoConnection();
  if (!isMongo) {
    const local = getLocalTrades();
    return local.filter(t => t.userId === userId);
  }

  try {
    const docs = await TradeModel.find({ userId }).sort({ entryDate: -1 });
    return docs.map(mapTradeDoc);
  } catch (error) {
    console.error('Error fetching trades from MongoDB, using JSON fallback:', error);
    const local = getLocalTrades();
    return local.filter(t => t.userId === userId);
  }
}

export async function saveTrades(trades: Trade[], userId: string): Promise<boolean> {
  const isMongo = await checkMongoConnection();
  if (!isMongo) {
    const localTrades = getLocalTrades();
    const filtered = localTrades.filter(t => t.userId !== userId);
    const mapped = trades.map(t => ({
      ...t,
      userId,
      id: t.id && !t.id.startsWith('t') ? t.id : Math.random().toString(36).substring(2, 11),
      createdAt: t.createdAt || new Date().toISOString()
    }));
    filtered.push(...mapped);
    return saveLocalTrades(filtered);
  }

  try {
    await TradeModel.deleteMany({ userId });
    if (trades.length > 0) {
      const mapped = trades.map(t => {
        const { id, createdAt, ...rest } = t;
        return {
          ...rest,
          userId,
          // Use id if it is a valid MongoDB ObjectId, otherwise let Mongo auto-generate it
          ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : {})
        };
      });
      await TradeModel.insertMany(mapped);
    }
    return true;
  } catch (error) {
    console.error('Error batch saving trades to MongoDB, using JSON fallback:', error);
    const localTrades = getLocalTrades();
    const filtered = localTrades.filter(t => t.userId !== userId);
    const mapped = trades.map(t => ({
      ...t,
      userId,
      id: t.id && !t.id.startsWith('t') ? t.id : Math.random().toString(36).substring(2, 11),
      createdAt: t.createdAt || new Date().toISOString()
    }));
    filtered.push(...mapped);
    return saveLocalTrades(filtered);
  }
}

export async function addTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'userId'>, userId: string): Promise<Trade> {
  // Authoritative server-side evaluation
  const evaluated = evaluateSingleTrade(trade as any);
  const validatedTrade: Omit<Trade, 'id' | 'createdAt' | 'userId'> = {
    ...trade,
    status: evaluated.status,
    fees: evaluated.fees,
    pnl: evaluated.netPnl !== null ? evaluated.netPnl : trade.pnl,
    grossPnl: evaluated.grossPnl !== null ? evaluated.grossPnl : undefined,
    netPnl: evaluated.netPnl !== null ? evaluated.netPnl : undefined,
    currency: evaluated.currency,
    plannedRiskAmount: evaluated.plannedRiskAmount !== null ? evaluated.plannedRiskAmount : undefined,
    plannedRR: evaluated.plannedRR !== null ? evaluated.plannedRR : undefined,
    realizedRR: evaluated.realizedRR !== null ? evaluated.realizedRR : undefined,
    riskAmount: evaluated.plannedRiskAmount !== null ? evaluated.plannedRiskAmount : trade.riskAmount
  };

  const isMongo = await checkMongoConnection();
  if (!isMongo) {
    const localTrades = getLocalTrades();
    const newTrade: Trade = {
      ...validatedTrade,
      userId,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString()
    };
    localTrades.push(newTrade);
    saveLocalTrades(localTrades);
    return newTrade;
  }

  const doc = new TradeModel({ ...validatedTrade, userId });
  await doc.save();
  return mapTradeDoc(doc);
}

export async function updateTrade(id: string, updatedFields: Partial<Trade>, userId: string): Promise<Trade | null> {
  const isMongo = await checkMongoConnection();
  if (!isMongo) {
    const localTrades = getLocalTrades();
    const index = localTrades.findIndex(t => t.id === id && t.userId === userId);
    if (index === -1) return null;

    const merged = { ...localTrades[index], ...updatedFields };
    const evaluated = evaluateSingleTrade(merged as any);

    const updatedTrade: Trade = {
      ...merged,
      status: evaluated.status,
      fees: evaluated.fees,
      pnl: evaluated.netPnl !== null ? evaluated.netPnl : merged.pnl,
      grossPnl: evaluated.grossPnl !== null ? evaluated.grossPnl : merged.grossPnl,
      netPnl: evaluated.netPnl !== null ? evaluated.netPnl : merged.netPnl,
      currency: evaluated.currency,
      plannedRiskAmount: evaluated.plannedRiskAmount !== null ? evaluated.plannedRiskAmount : merged.plannedRiskAmount,
      plannedRR: evaluated.plannedRR !== null ? evaluated.plannedRR : merged.plannedRR,
      realizedRR: evaluated.realizedRR !== null ? evaluated.realizedRR : merged.realizedRR,
      userId // enforce original ownership
    };
    localTrades[index] = updatedTrade;
    saveLocalTrades(localTrades);
    return updatedTrade;
  }

  // Fetch current doc to merge and evaluate
  const currentDoc = await TradeModel.findOne({ _id: id, userId });
  if (!currentDoc) return null;

  const currentObj = mapTradeDoc(currentDoc);
  const merged = { ...currentObj, ...updatedFields };
  const evaluated = evaluateSingleTrade(merged as any);

  const fieldsToSet = {
    ...updatedFields,
    status: evaluated.status,
    fees: evaluated.fees,
    pnl: evaluated.netPnl !== null ? evaluated.netPnl : merged.pnl,
    grossPnl: evaluated.grossPnl !== null ? evaluated.grossPnl : merged.grossPnl,
    netPnl: evaluated.netPnl !== null ? evaluated.netPnl : merged.netPnl,
    currency: evaluated.currency,
    plannedRiskAmount: evaluated.plannedRiskAmount !== null ? evaluated.plannedRiskAmount : merged.plannedRiskAmount,
    plannedRR: evaluated.plannedRR !== null ? evaluated.plannedRR : merged.plannedRR,
    realizedRR: evaluated.realizedRR !== null ? evaluated.realizedRR : merged.realizedRR
  };

  const { id: _, userId: __, ...cleanFields } = fieldsToSet as any;
  const doc = await TradeModel.findOneAndUpdate({ _id: id, userId }, cleanFields, { new: true });
  if (!doc) return null;
  return mapTradeDoc(doc);
}

export async function deleteTrade(id: string, userId: string): Promise<boolean> {
  const isMongo = await checkMongoConnection();
  if (!isMongo) {
    const localTrades = getLocalTrades();
    const filtered = localTrades.filter(t => !(t.id === id && t.userId === userId));
    if (filtered.length === localTrades.length) return false;
    return saveLocalTrades(filtered);
  }

  const res = await TradeModel.findOneAndDelete({ _id: id, userId });
  return !!res;
}

import fs from 'fs';
import path from 'path';
import { connectToDatabase } from './mongodb';
import PsychologyModel from '@/models/Psychology';

export interface PsychologyData {
  id?: string;
  userId: string;
  accountId?: string;
  date: string; // YYYY-MM-DD
  preTradeChecklist: {
    emotionallyNeutral: boolean;
    acceptLoss: boolean;
    notChasing: boolean;
    noRevenge: boolean;
    readyMentallyPhysically: boolean;
    followTradingPlan: boolean;
    riskAcceptable: boolean;
    respectDailyLimits: boolean;
    remainPatient: boolean;
    judgeExecution: boolean;
    completedCount: number;
    completed: boolean;
    completedAt?: string;
  };
  postTradeReviews: Array<{
    tradeId?: string;
    pair?: string;
    entryRules: 'Yes' | 'No' | 'Partially';
    exitRules: 'Yes' | 'No' | 'Partially';
    respectRisk: 'Yes' | 'No' | 'Partially';
    impulsiveDecisions: 'No' | 'A little' | 'Yes';
    feeling: 'Calm' | 'Confident' | 'Anxious' | 'Frustrated' | 'Excited';
    notes?: string;
    createdAt: string;
  }>;
  endOfDayReview: {
    respectedRiskLimits: boolean;
    didNotOvertrade: boolean;
    maintainedDiscipline: boolean;
    managedEmotionsWell: boolean;
    overallExecutionGood: boolean;
    lesson?: string;
    completed: boolean;
    completedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const dbDir = path.join(process.cwd(), 'src', 'data');
const psychFile = path.join(dbDir, 'psychology.json');

function ensurePsychDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(psychFile)) {
    fs.writeFileSync(psychFile, JSON.stringify({ records: [] }, null, 2));
  }
}

function getLocalRecords(): PsychologyData[] {
  ensurePsychDb();
  try {
    const raw = fs.readFileSync(psychFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.records || [];
  } catch (err) {
    console.error('Error reading psychology.json:', err);
    return [];
  }
}

function saveLocalRecords(records: PsychologyData[]): boolean {
  ensurePsychDb();
  try {
    fs.writeFileSync(psychFile, JSON.stringify({ records }, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving psychology.json:', err);
    return false;
  }
}

let useMongo = true;
let hasCheckedMongo = false;

async function checkMongo(): Promise<boolean> {
  if (hasCheckedMongo) return useMongo;
  try {
    const connPromise = connectToDatabase();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Mongo timeout')), 1500)
    );
    await Promise.race([connPromise, timeout]);
    useMongo = true;
  } catch {
    useMongo = false;
  }
  hasCheckedMongo = true;
  return useMongo;
}

export function defaultPsychologyRecord(userId: string, date: string, accountId: string = ''): PsychologyData {
  return {
    userId,
    accountId,
    date,
    preTradeChecklist: {
      emotionallyNeutral: false,
      acceptLoss: false,
      notChasing: false,
      noRevenge: false,
      readyMentallyPhysically: false,
      followTradingPlan: false,
      riskAcceptable: false,
      respectDailyLimits: false,
      remainPatient: false,
      judgeExecution: false,
      completedCount: 0,
      completed: false
    },
    postTradeReviews: [],
    endOfDayReview: {
      respectedRiskLimits: false,
      didNotOvertrade: false,
      maintainedDiscipline: false,
      managedEmotionsWell: false,
      overallExecutionGood: false,
      lesson: '',
      completed: false
    }
  };
}

export async function getPsychologyRecord(
  userId: string,
  date: string,
  accountId?: string
): Promise<PsychologyData> {
  const isMongo = await checkMongo();
  if (!isMongo) {
    const local = getLocalRecords();
    const found = local.find(r => r.userId === userId && r.date === date);
    return found || defaultPsychologyRecord(userId, date, accountId);
  }

  try {
    const doc = await PsychologyModel.findOne({ userId, date });
    if (doc) {
      return {
        id: doc._id.toString(),
        userId: doc.userId,
        accountId: doc.accountId || '',
        date: doc.date,
        preTradeChecklist: doc.preTradeChecklist,
        postTradeReviews: doc.postTradeReviews || [],
        endOfDayReview: doc.endOfDayReview,
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString()
      };
    }
    return defaultPsychologyRecord(userId, date, accountId);
  } catch {
    const local = getLocalRecords();
    const found = local.find(r => r.userId === userId && r.date === date);
    return found || defaultPsychologyRecord(userId, date, accountId);
  }
}

export async function savePsychologyRecord(
  userId: string,
  recordData: Partial<PsychologyData> & { date: string }
): Promise<PsychologyData> {
  const isMongo = await checkMongo();
  const date = recordData.date;

  if (!isMongo) {
    const local = getLocalRecords();
    const idx = local.findIndex(r => r.userId === userId && r.date === date);
    const existing = idx >= 0 ? local[idx] : defaultPsychologyRecord(userId, date, recordData.accountId);
    
    const updated: PsychologyData = {
      ...existing,
      ...recordData,
      preTradeChecklist: {
        ...existing.preTradeChecklist,
        ...(recordData.preTradeChecklist || {})
      },
      postTradeReviews: recordData.postTradeReviews !== undefined 
        ? recordData.postTradeReviews 
        : existing.postTradeReviews,
      endOfDayReview: {
        ...existing.endOfDayReview,
        ...(recordData.endOfDayReview || {})
      },
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      local[idx] = updated;
    } else {
      updated.createdAt = new Date().toISOString();
      local.push(updated);
    }
    saveLocalRecords(local);
    return updated;
  }

  try {
    const updated = await PsychologyModel.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          ...recordData,
          userId,
          date
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return {
      id: updated._id.toString(),
      userId: updated.userId,
      accountId: updated.accountId || '',
      date: updated.date,
      preTradeChecklist: updated.preTradeChecklist,
      postTradeReviews: updated.postTradeReviews || [],
      endOfDayReview: updated.endOfDayReview,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString()
    };
  } catch (err) {
    console.error('Mongo save error, falling back to JSON:', err);
    const local = getLocalRecords();
    const idx = local.findIndex(r => r.userId === userId && r.date === date);
    const existing = idx >= 0 ? local[idx] : defaultPsychologyRecord(userId, date, recordData.accountId);
    const updated: PsychologyData = {
      ...existing,
      ...recordData,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) local[idx] = updated;
    else {
      updated.createdAt = new Date().toISOString();
      local.push(updated);
    }
    saveLocalRecords(local);
    return updated;
  }
}

export async function getPsychologyHistory(userId: string, limitDays: number = 90): Promise<PsychologyData[]> {
  const isMongo = await checkMongo();
  if (!isMongo) {
    const local = getLocalRecords();
    return local
      .filter(r => r.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limitDays);
  }

  try {
    const docs = await PsychologyModel.find({ userId })
      .sort({ date: -1 })
      .limit(limitDays);
    return docs.map(doc => ({
      id: doc._id.toString(),
      userId: doc.userId,
      accountId: doc.accountId || '',
      date: doc.date,
      preTradeChecklist: doc.preTradeChecklist,
      postTradeReviews: doc.postTradeReviews || [],
      endOfDayReview: doc.endOfDayReview,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString()
    }));
  } catch {
    const local = getLocalRecords();
    return local
      .filter(r => r.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limitDays);
  }
}

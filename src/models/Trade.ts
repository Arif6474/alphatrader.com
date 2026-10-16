import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrade extends Document {
  userId: string;
  accountId?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
  {
    userId: { type: String, required: true },
    accountId: { type: String, default: '' },
    pair: { type: String, required: true, uppercase: true, trim: true },
    direction: { type: String, enum: ['Long', 'Short'], required: true },
    orderType: { type: String, enum: ['Market', 'Limit', 'Stop'], required: true },
    strategy: { type: String, default: 'Other' },
    timeframe: { type: String },
    broker: { type: String, default: '' },
    session: { type: String, default: '' },
    tags: [{ type: String }],
    mistakes: [{ type: String }],
    tradeDuration: { type: String, default: '' },
    entryDate: { type: String, required: true },
    exitDate: { type: String },
    closed: { type: Boolean, default: false },
    lotSize: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    stopLossPrice: { type: Number, required: true },
    takeProfitPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    entryReason: { type: String, default: '' },
    lessonsLearned: { type: String, default: '' },
    riskAmount: { type: Number, required: true },
    riskPercentage: { type: Number, required: true },
    accountBalance: { type: Number, required: true },
    pnl: { type: Number },
    grossPnl: { type: Number },
    netPnl: { type: Number },
    fees: { type: Number, default: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    conversionRate: { type: Number },
    status: { type: String, enum: ['Win', 'Loss', 'Breakeven', 'Active', 'Cancelled'], default: 'Active' },
    plannedRiskAmount: { type: Number },
    plannedRR: { type: Number },
    realizedRR: { type: Number },
    psychologyBefore: [{ type: String }],
    psychologyDuring: [{ type: String }],
    psychologyAfter: [{ type: String }],
    psychologyFactors: [{ type: String }],
    chartBefore: { type: String, default: '' },
    chartAfter: { type: String, default: '' },
    assetType: { type: String, enum: ['Forex', 'Crypto', 'Stock', 'Futures'], default: 'Forex' },
    contractSize: { type: Number, required: true }
  },
  {
    timestamps: true
  }
);

// Clean duplicate model creation check for Next.js hot-reloads
const TradeModel: Model<ITrade> = mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);

export default TradeModel;

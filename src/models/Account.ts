import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccount extends Document {
  userId: string;
  name: string;
  firmName?: string;
  startingCapital: number;
  currency?: string;
  maxDailyLossPercent?: number;
  maxTotalDrawdownPercent?: number;
  drawdownType?: 'static' | 'trailing';
  dailyResetHourUtc?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true },
    startingCapital: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    maxDailyLossPercent: { type: Number },
    maxTotalDrawdownPercent: { type: Number },
    drawdownType: { type: String, enum: ['static', 'trailing'], default: 'static' },
    dailyResetHourUtc: { type: Number, default: 21 } // default 5 PM EST = 21:00 UTC
  },
  {
    timestamps: true
  }
);

const AccountModel: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default AccountModel;

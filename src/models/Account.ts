import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccount extends Document {
  userId: string;
  name: string;
  firmName?: string;
  startingCapital: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true },
    startingCapital: { type: Number, required: true, default: 0 }
  },
  {
    timestamps: true
  }
);

const AccountModel: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default AccountModel;

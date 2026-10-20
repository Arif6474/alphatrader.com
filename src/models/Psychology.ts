import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPsychologyRecord extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const PsychologyRecordSchema = new Schema<IPsychologyRecord>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, default: '' },
    date: { type: String, required: true, index: true },
    preTradeChecklist: {
      emotionallyNeutral: { type: Boolean, default: false },
      acceptLoss: { type: Boolean, default: false },
      notChasing: { type: Boolean, default: false },
      noRevenge: { type: Boolean, default: false },
      readyMentallyPhysically: { type: Boolean, default: false },
      followTradingPlan: { type: Boolean, default: false },
      riskAcceptable: { type: Boolean, default: false },
      respectDailyLimits: { type: Boolean, default: false },
      remainPatient: { type: Boolean, default: false },
      judgeExecution: { type: Boolean, default: false },
      completedCount: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      completedAt: { type: String }
    },
    postTradeReviews: [
      {
        tradeId: { type: String },
        pair: { type: String },
        entryRules: { type: String, enum: ['Yes', 'No', 'Partially'], default: 'Yes' },
        exitRules: { type: String, enum: ['Yes', 'No', 'Partially'], default: 'Yes' },
        respectRisk: { type: String, enum: ['Yes', 'No', 'Partially'], default: 'Yes' },
        impulsiveDecisions: { type: String, enum: ['No', 'A little', 'Yes'], default: 'No' },
        feeling: {
          type: String,
          enum: ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Excited'],
          default: 'Calm'
        },
        notes: { type: String, default: '' },
        createdAt: { type: String, default: () => new Date().toISOString() }
      }
    ],
    endOfDayReview: {
      respectedRiskLimits: { type: Boolean, default: false },
      didNotOvertrade: { type: Boolean, default: false },
      maintainedDiscipline: { type: Boolean, default: false },
      managedEmotionsWell: { type: Boolean, default: false },
      overallExecutionGood: { type: Boolean, default: false },
      lesson: { type: String, default: '' },
      completed: { type: Boolean, default: false },
      completedAt: { type: String }
    }
  },
  {
    timestamps: true
  }
);

PsychologyRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const PsychologyModel: Model<IPsychologyRecord> =
  mongoose.models.PsychologyRecord ||
  mongoose.model<IPsychologyRecord>('PsychologyRecord', PsychologyRecordSchema);

export default PsychologyModel;

import { Schema, model } from 'mongoose';

interface TestAttempt {
  topic: string;
  questions: Record<string, unknown>;
  userAnswers: Record<string, unknown>;
  score: number;
  createdAt: Date;
}

const testAttemptSchema = new Schema<TestAttempt>(
  {
    topic: { type: String, required: true, trim: true },
    questions: { type: Schema.Types.Mixed, required: true },
    userAnswers: { type: Schema.Types.Mixed, required: true },
    score: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

export const TestAttemptModel = model<TestAttempt>('TestAttempt', testAttemptSchema);

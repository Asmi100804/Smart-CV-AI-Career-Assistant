import { Schema, model, type InferSchemaType } from "mongoose";

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["mcq", "short_answer"],
    },
    question: { type: String, required: true },
    options: { type: [String], default: undefined },
    difficulty: { type: String, required: true, enum: ["hard"] },
  },
  { _id: false }
);

const answerEntrySchema = new Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const testSchema = new Schema(
  {
    jobProfile: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], required: true },
    correctAnswers: { type: [answerEntrySchema], required: true },
    userAnswers: { type: [answerEntrySchema], default: [] },
    score: { type: Number, default: 0 },
    accuracyPercentage: { type: Number, default: 0 },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export type TestDocument = InferSchemaType<typeof testSchema>;
export const TestModel = model("Test", testSchema);

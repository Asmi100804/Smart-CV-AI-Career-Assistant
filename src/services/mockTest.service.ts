import { randomUUID } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { TestModel } from "../models/Test.js";
import type { GeneratedQuestionPayload, GeminiMockTestService } from "./geminiMockTest.service.js";
import { HttpError } from "../utils/errors.js";

export type SubmitAnswersPayload = Record<string, string>;

export class MockTestService {
  constructor(private readonly geminiService: Pick<GeminiMockTestService, "generate">) {}

  async generateTest(jobProfile: string, mcqCount: number, shortAnswerCount: number) {
    let payload: GeneratedQuestionPayload;
    try {
      payload = await this.geminiService.generate(jobProfile, mcqCount, shortAnswerCount);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(502, "Gemini request failed");
    }

    this.assertQuestionCounts(payload, mcqCount, shortAnswerCount);

    const mcqQuestions = payload.mcqs.slice(0, mcqCount).map((item) => ({
      id: randomUUID(),
      type: "mcq" as const,
      question: item.question.trim(),
      options: item.options.map((x) => x.trim()).slice(0, 4),
      difficulty: "hard" as const,
    }));

    const shortQuestions = payload.shortAnswers.slice(0, shortAnswerCount).map((item) => ({
      id: randomUUID(),
      type: "short_answer" as const,
      question: item.question.trim(),
      difficulty: "hard" as const,
    }));

    const correctAnswers = [
      ...mcqQuestions.map((q, i) => ({ questionId: q.id, answer: payload.mcqs[i].correctAnswer.trim().toUpperCase() })),
      ...shortQuestions.map((q, i) => ({ questionId: q.id, answer: payload.shortAnswers[i].correctAnswer.trim().toLowerCase() })),
    ];

    const test = await TestModel.create({
      jobProfile,
      questions: [...mcqQuestions, ...shortQuestions],
      correctAnswers,
    });

    return {
      testId: test._id,
      jobProfile: test.jobProfile,
      questions: test.questions,
      createdAt: test.createdAt,
    };
  }

  async submitTest(testId: string, userAnswers: SubmitAnswersPayload) {
    if (!isValidObjectId(testId)) {
      throw new HttpError(400, "Invalid testId");
    }

    const test = await TestModel.findById(testId);
    if (!test) {
      throw new HttpError(404, "Test not found");
    }

    const answerMap = new Map(test.correctAnswers.map((x) => [x.questionId, x.answer]));
    let score = 0;

    const breakdown = test.questions.map((question) => {
      const userAnswer = userAnswers[question.id]?.trim() ?? "";
      const correctAnswer = answerMap.get(question.id) ?? "";
      const isCorrect =
        question.type === "mcq"
          ? userAnswer.toUpperCase() === correctAnswer.toUpperCase()
          : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) {
        score += 1;
      }

      return {
        questionId: question.id,
        type: question.type,
        userAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    const totalQuestions = test.questions.length;
    const accuracyPercentage = totalQuestions ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

    test.userAnswers = Object.entries(userAnswers).map(([questionId, answer]) => ({ questionId, answer }));
    test.score = score;
    test.accuracyPercentage = accuracyPercentage;
    test.submittedAt = new Date();
    await test.save();

    return {
      testId: test._id,
      score,
      totalQuestions,
      accuracyPercentage,
      breakdown,
      correctAnswers: Object.fromEntries(answerMap.entries()),
    };
  }

  private assertQuestionCounts(payload: GeneratedQuestionPayload, mcqCount: number, shortAnswerCount: number) {
    if (payload.mcqs.length < mcqCount || payload.shortAnswers.length < shortAnswerCount) {
      throw new HttpError(502, "Gemini did not generate requested question count");
    }

    const invalidMcq = payload.mcqs.slice(0, mcqCount).some((item) => item.options.length !== 4);
    if (invalidMcq) {
      throw new HttpError(502, "Gemini returned MCQ with invalid options");
    }
  }
}

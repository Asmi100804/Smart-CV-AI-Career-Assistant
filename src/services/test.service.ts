import type {
  EvaluateTestRequest,
  EvaluateTestResponse,
  GenerateTestRequest,
  GenerateTestResponse,
  MCQ,
  ShortQuestion,
} from '../types/test';
import { TestAttemptModel } from '../models/testAttempt.model';
import { AppError } from '../utils/errors';
import { parseJsonSafely } from '../utils/json';
import { shuffleArray } from '../utils/shuffle';
import { geminiService } from './gemini.service';

const assertValidGenerateRequest = (payload: GenerateTestRequest): void => {
  if (!payload.jobProfile?.trim()) {
    throw new AppError('jobProfile is required.', 400);
  }
  if (!payload.jobLevel?.trim()) {
    throw new AppError('jobLevel is required.', 400);
  }
  if (!Number.isInteger(payload.numMCQ) || payload.numMCQ <= 0) {
    throw new AppError('numMCQ must be a positive integer.', 400);
  }
  if (!Number.isInteger(payload.numShort) || payload.numShort <= 0) {
    throw new AppError('numShort must be a positive integer.', 400);
  }
};

const isValidMcq = (mcq: MCQ): boolean => {
  return (
    typeof mcq.question === 'string' &&
    mcq.question.trim().length > 0 &&
    Array.isArray(mcq.options) &&
    mcq.options.length === 4 &&
    mcq.options.every((option) => typeof option === 'string' && option.trim().length > 0) &&
    typeof mcq.correctAnswer === 'string' &&
    mcq.options.includes(mcq.correctAnswer)
  );
};

const isValidShortQuestion = (shortQuestion: ShortQuestion): boolean => {
  const answerWordCount = shortQuestion.answer.trim().split(/\s+/).filter(Boolean).length;

  return (
    typeof shortQuestion.question === 'string' &&
    shortQuestion.question.trim().length > 0 &&
    typeof shortQuestion.answer === 'string' &&
    answerWordCount > 0 &&
    answerWordCount <= 2
  );
};

const validateGeneratedTest = (
  response: GenerateTestResponse,
  request: GenerateTestRequest,
): GenerateTestResponse => {
  if (!Array.isArray(response.mcqs) || !Array.isArray(response.shortQuestions)) {
    throw new AppError('Invalid generated test structure.', 502);
  }

  if (response.mcqs.length !== request.numMCQ || response.shortQuestions.length !== request.numShort) {
    throw new AppError('Generated question count does not match the request.', 502);
  }

  const normalizedMcqs = response.mcqs.map((mcq) => {
    if (!isValidMcq(mcq)) {
      throw new AppError('Generated MCQ structure is invalid.', 502);
    }

    return {
      ...mcq,
      options: shuffleArray(mcq.options),
    };
  });

  const normalizedShort = response.shortQuestions.map((shortQuestion) => {
    if (!isValidShortQuestion(shortQuestion)) {
      throw new AppError('Generated short answer question structure is invalid.', 502);
    }

    return shortQuestion;
  });

  return {
    mcqs: normalizedMcqs,
    shortQuestions: normalizedShort,
  };
};

const normalizeAnswer = (value: string): string => value.trim().toLowerCase();

const evaluateShortAnswer = async (question: string, expectedAnswer: string, userAnswer: string): Promise<boolean> => {
  const prompt = [
    'You are grading a short answer.',
    `Question: ${question}`,
    `Correct answer: ${expectedAnswer}`,
    `User answer: ${userAnswer}`,
    'Return ONLY one word: correct or incorrect.',
  ].join('\n');

  const result = (await geminiService.generateText(prompt)).trim().toLowerCase();

  if (result !== 'correct' && result !== 'incorrect') {
    throw new AppError('Invalid evaluation response from Gemini.', 502);
  }

  return result === 'correct';
};

export const generateTest = async (payload: GenerateTestRequest): Promise<GenerateTestResponse> => {
  assertValidGenerateRequest(payload);

  const prompt = [
    'Generate a mock test in strict JSON format only.',
    `Job profile: ${payload.jobProfile}`,
    `Job level: ${payload.jobLevel}`,
    `Number of MCQs: ${payload.numMCQ}`,
    `Number of short answer questions: ${payload.numShort}`,
    'Rules:',
    '- MCQs must be hard level and have exactly 4 options.',
    '- shortQuestions answers must be one or two words only.',
    '- Include the correct answer for every question.',
    'Output format:',
    '{"mcqs":[{"question":"","options":["","","",""] ,"correctAnswer":""}],"shortQuestions":[{"question":"","answer":""}]}',
  ].join('\n');

  const responseText = await geminiService.generateText(prompt);
  const parsed = parseJsonSafely<GenerateTestResponse>(responseText, 'Unable to parse generated test response as JSON.');

  return validateGeneratedTest(parsed, payload);
};

const assertValidEvaluateRequest = (payload: EvaluateTestRequest): void => {
  if (!payload.topic?.trim()) {
    throw new AppError('topic is required.', 400);
  }
  if (!Array.isArray(payload.mcqs) || !Array.isArray(payload.shortQuestions)) {
    throw new AppError('mcqs and shortQuestions are required arrays.', 400);
  }
  if (!payload.userAnswers || !Array.isArray(payload.userAnswers.mcq) || !Array.isArray(payload.userAnswers.short)) {
    throw new AppError('userAnswers.mcq and userAnswers.short are required arrays.', 400);
  }
  if (payload.userAnswers.mcq.length !== payload.mcqs.length) {
    throw new AppError('MCQ answer count mismatch.', 400);
  }
  if (payload.userAnswers.short.length !== payload.shortQuestions.length) {
    throw new AppError('Short answer count mismatch.', 400);
  }
};

export const evaluateTest = async (payload: EvaluateTestRequest): Promise<EvaluateTestResponse> => {
  assertValidEvaluateRequest(payload);

  const mcqScore = payload.mcqs.reduce((score, mcq, index) => {
    const userChoice = normalizeAnswer(payload.userAnswers.mcq[index] ?? '');
    const expected = normalizeAnswer(mcq.correctAnswer);
    return score + (userChoice === expected ? 1 : 0);
  }, 0);

  const shortEvaluationResults = await Promise.all(
    payload.shortQuestions.map((shortQuestion, index) =>
      evaluateShortAnswer(shortQuestion.question, shortQuestion.answer, payload.userAnswers.short[index] ?? ''),
    ),
  );

  const shortScore = shortEvaluationResults.filter(Boolean).length;
  const totalScore = mcqScore + shortScore;

  await TestAttemptModel.create({
    topic: payload.topic,
    questions: {
      mcqs: payload.mcqs,
      shortQuestions: payload.shortQuestions,
    },
    userAnswers: payload.userAnswers,
    score: totalScore,
  });

  return {
    totalScore,
    mcqScore,
    shortScore,
  };
};

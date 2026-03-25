import { HttpError } from "../utils/errors.js";

export const validateGeneratePayload = (body: unknown) => {
  const { jobProfile, mcqCount, shortAnswerCount } = body as Record<string, unknown>;

  if (!jobProfile || typeof jobProfile !== "string" || !jobProfile.trim()) {
    throw new HttpError(400, "jobProfile is required and must be a non-empty string");
  }

  const mcq = Number(mcqCount);
  const shortAnswer = Number(shortAnswerCount);

  if (!Number.isInteger(mcq) || mcq < 0 || mcq > 50) {
    throw new HttpError(400, "mcqCount must be an integer between 0 and 50");
  }

  if (!Number.isInteger(shortAnswer) || shortAnswer < 0 || shortAnswer > 50) {
    throw new HttpError(400, "shortAnswerCount must be an integer between 0 and 50");
  }

  if (mcq + shortAnswer === 0) {
    throw new HttpError(400, "At least one question is required");
  }

  return {
    jobProfile: jobProfile.trim(),
    mcqCount: mcq,
    shortAnswerCount: shortAnswer,
  };
};

export const validateSubmitPayload = (body: unknown) => {
  const { testId, userAnswers } = body as Record<string, unknown>;

  if (!testId || typeof testId !== "string") {
    throw new HttpError(400, "testId is required and must be a string");
  }

  if (!userAnswers || typeof userAnswers !== "object" || Array.isArray(userAnswers)) {
    throw new HttpError(400, "userAnswers is required and must be an object");
  }

  return {
    testId,
    userAnswers: userAnswers as Record<string, string>,
  };
};

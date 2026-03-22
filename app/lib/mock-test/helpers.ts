import type { UserAnswers } from '~/types/mock-test';

export const buildInitialAnswers = (mcqCount: number, shortCount: number): UserAnswers => ({
  mcq: Array.from({ length: mcqCount }, () => ''),
  short: Array.from({ length: shortCount }, () => ''),
});

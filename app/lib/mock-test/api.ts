import axios from 'axios';

import type { EvaluationResponse, TestResponse, TestSetupFormValues, UserAnswers } from '~/types/mock-test';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  timeout: 30000,
});

export const generateMockTest = async (payload: TestSetupFormValues): Promise<TestResponse> => {
  const response = await client.post<TestResponse>('/test/generate', payload);
  return response.data;
};

export const evaluateMockTest = async (payload: {
  topic: string;
  mcqs: TestResponse['mcqs'];
  shortQuestions: TestResponse['shortQuestions'];
  userAnswers: UserAnswers;
}): Promise<EvaluationResponse> => {
  const response = await client.post<EvaluationResponse>('/test/evaluate', payload);
  return response.data;
};

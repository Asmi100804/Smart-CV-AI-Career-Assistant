export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ShortQuestion {
  question: string;
  answer: string;
}

export interface TestResponse {
  mcqs: MCQ[];
  shortQuestions: ShortQuestion[];
}

export interface UserAnswers {
  mcq: string[];
  short: string[];
}

export interface EvaluationResponse {
  totalScore: number;
  mcqScore: number;
  shortScore: number;
}

export interface TestSetupFormValues {
  jobProfile: string;
  jobLevel: string;
  numMCQ: number;
  numShort: number;
}

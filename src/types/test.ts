export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ShortQuestion {
  question: string;
  answer: string;
}

export interface GenerateTestRequest {
  jobProfile: string;
  jobLevel: string;
  numMCQ: number;
  numShort: number;
}

export interface GenerateTestResponse {
  mcqs: MCQ[];
  shortQuestions: ShortQuestion[];
}

export interface UserAnswers {
  mcq: string[];
  short: string[];
}

export interface EvaluateTestRequest {
  topic: string;
  mcqs: MCQ[];
  shortQuestions: ShortQuestion[];
  userAnswers: UserAnswers;
}

export interface EvaluateTestResponse {
  totalScore: number;
  mcqScore: number;
  shortScore: number;
}

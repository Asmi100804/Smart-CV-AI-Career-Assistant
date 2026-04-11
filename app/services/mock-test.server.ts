import { GoogleGenerativeAI } from "@google/generative-ai";

export interface MCQQuestion {
  id: string;
  type: "mcq";
  question: string;
  options: string[];
  difficulty: "medium" ;
}

export interface ShortAnswerQuestion {
  id: string;
  type: "short_answer";
  question: string;
  difficulty: "medium";
}

export type Question = MCQQuestion | ShortAnswerQuestion;

export interface GeneratedTest {
  questions: Question[];
  correctAnswers: Record<string, string>;
}

export interface TestEvaluation {
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  mcqCorrect: number;
  mcqTotal: number;
  shortAnswerCorrect: number;
  shortAnswerTotal: number;
  evaluationDetails: Array<{
    questionId: string;
    questionType: string;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

const MODEL_NAME = "gemini-2.5-flash";

const createModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
};

const safeJsonParse = (rawText: string) => {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export async function generateMockTest(
  jobProfile: string,
  mcqCount: number,
  shortAnswerCount: number,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<GeneratedTest> {
  if (!jobProfile || jobProfile.trim().length === 0) {
    throw new Error("Job profile is required.");
  }

  if (mcqCount < 0 || mcqCount > 50) {
    throw new Error("MCQ count must be between 0 and 50.");
  }

  if (shortAnswerCount < 0 || shortAnswerCount > 50) {
    throw new Error("Short answer count must be between 0 and 50.");
  }

  if (mcqCount + shortAnswerCount === 0) {
    throw new Error("At least one question is required.");
  }

  const model = createModel();

  const prompt = `You are an expert technical interviewer creating a ${difficulty.toUpperCase()}-level mock test for the job profile: "${jobProfile}".

Generate exactly ${mcqCount} Multiple Choice Questions (MCQs) and ${shortAnswerCount} Short Answer questions.

CRITICAL REQUIREMENTS:
1. ALL questions must be MEDIUM difficulty level - suitable for beginners to intermediate users
2. Questions must be highly specific to ${jobProfile}
3. MCQs must have exactly 4 options (A, B, C, D)
4. Only ONE option must be correct for each MCQ
5. Short answer questions must have concise answers (1-3 words maximum)
6. Questions must test deep understanding, not just basic knowledge
7. Include practical scenarios, edge cases, and advanced concepts

Return STRICT JSON in this exact format:
{
  "mcqs": [
    {
      "question": "Complex technical question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A"
    }
  ],
  "shortAnswers": [
    {
      "question": "Technical question requiring short answer?",
      "correctAnswer": "Brief answer"
    }
  ]
}

RULES:
- correctAnswer for MCQs must be exactly "A", "B", "C", or "D"
- correctAnswer for short answers must be concise (1-3 words)
- Questions must be challenging and job-specific
- No markdown, no code fences, ONLY valid JSON
`;

  const result = await model.generateContent(prompt);
  const parsed = safeJsonParse(result.response.text());

  if (!parsed) {
    throw new Error("Gemini returned non-JSON content for test generation.");
  }

  const mcqs: MCQQuestion[] = (Array.isArray(parsed.mcqs) ? parsed.mcqs : [])
    .slice(0, mcqCount)
    .map((mcq: any) => ({
      id: generateQuestionId(),
      type: "mcq" as const,
      question: String(mcq.question ?? "").trim(),
      options: Array.isArray(mcq.options)
        ? mcq.options.map((opt: any) => String(opt ?? "").trim()).slice(0, 4)
        : [],
      difficulty: "medium" as const,
    }))
    .filter((mcq: any) => mcq.question && mcq.options.length === 4);

  const shortAnswers: ShortAnswerQuestion[] = (
    Array.isArray(parsed.shortAnswers) ? parsed.shortAnswers : []
  )
    .slice(0, shortAnswerCount)
    .map((sa: any) => ({
      id: generateQuestionId(),
      type: "short_answer" as const,
      question: String(sa.question ?? "").trim(),
      difficulty: "medium" as const,
    }))
    .filter((sa: any) => sa.question);

  if (mcqs.length < mcqCount || shortAnswers.length < shortAnswerCount) {
    throw new Error("Failed to generate the requested number of questions.");
  }

  const correctAnswers: Record<string, string> = {};

  (Array.isArray(parsed.mcqs) ? parsed.mcqs : [])
    .slice(0, mcqCount)
    .forEach((mcq: any, index: number) => {
      const questionId = mcqs[index]?.id;
      if (questionId) {
        correctAnswers[questionId] = String(mcq.correctAnswer ?? "A")
          .trim()
          .toUpperCase();
      }
    });

  (Array.isArray(parsed.shortAnswers) ? parsed.shortAnswers : [])
    .slice(0, shortAnswerCount)
    .forEach((sa: any, index: number) => {
      const questionId = shortAnswers[index]?.id;
      if (questionId) {
        correctAnswers[questionId] = String(sa.correctAnswer ?? "")
          .trim()
          .toLowerCase();
      }
    });

  const questions: Question[] = [...mcqs, ...shortAnswers];

  return {
    questions,
    correctAnswers,
  };
}

export function evaluateTest(
  questions: Question[],
  correctAnswers: Record<string, string>,
  userAnswers: Record<string, string>
): TestEvaluation {
  let score = 0;
  let mcqCorrect = 0;
  let mcqTotal = 0;
  let shortAnswerCorrect = 0;
  let shortAnswerTotal = 0;

  const evaluationDetails = questions.map((question) => {
    const userAnswer = userAnswers[question.id] || null;
    const correctAnswer = correctAnswers[question.id] || "";

    let isCorrect = false;

    if (userAnswer !== null) {
      if (question.type === "mcq") {
        mcqTotal++;
        isCorrect =
          userAnswer.trim().toUpperCase() === correctAnswer.toUpperCase();
        if (isCorrect) {
          score++;
          mcqCorrect++;
        }
      } else if (question.type === "short_answer") {
        shortAnswerTotal++;
        isCorrect =
          userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
        if (isCorrect) {
          score++;
          shortAnswerCorrect++;
        }
      }
    } else {
      if (question.type === "mcq") {
        mcqTotal++;
      } else if (question.type === "short_answer") {
        shortAnswerTotal++;
      }
    }

    return {
      questionId: question.id,
      questionType: question.type,
      userAnswer,
      correctAnswer,
      isCorrect,
    };
  });

  const totalQuestions = questions.length;
  const accuracyPercentage =
    totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  return {
    score,
    totalQuestions,
    accuracyPercentage: Number(accuracyPercentage.toFixed(2)),
    mcqCorrect,
    mcqTotal,
    shortAnswerCorrect,
    shortAnswerTotal,
    evaluationDetails,
  };
}

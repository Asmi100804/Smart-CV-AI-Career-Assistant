import { GoogleGenerativeAI } from "@google/generative-ai";
import { HttpError } from "../utils/errors.js";
import { safeJsonParse } from "../utils/json.js";

export type GeneratedQuestionPayload = {
  mcqs: Array<{ question: string; options: string[]; correctAnswer: string }>;
  shortAnswers: Array<{ question: string; correctAnswer: string }>;
};

export class GeminiMockTestService {
  private readonly modelName = "gemini-2.5-flash";

  async generate(jobProfile: string, mcqCount: number, shortAnswerCount: number): Promise<GeneratedQuestionPayload> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpError(500, "GEMINI_API_KEY is not configured");
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: this.modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Generate a HARD mock test for ${jobProfile} with ${mcqCount} MCQs and ${shortAnswerCount} short-answer questions.\nReturn strict JSON only in this shape:\n{\n  "mcqs": [{"question":"...","options":["...","...","...","..."],"correctAnswer":"A"}],\n  "shortAnswers": [{"question":"...","correctAnswer":"1-2 words"}]\n}`;

    try {
      const result = await model.generateContent(prompt);
      const parsed = safeJsonParse<GeneratedQuestionPayload>(result.response.text());

      if (!parsed || !Array.isArray(parsed.mcqs) || !Array.isArray(parsed.shortAnswers)) {
        throw new HttpError(502, "Gemini returned invalid JSON payload");
      }

      return parsed;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(502, "Gemini request failed");
    }
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

import { AppError } from '../utils/errors';

class GeminiService {
  private readonly model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new AppError('GEMINI_API_KEY is missing in environment variables.', 500);
    }

    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text()?.trim();

      if (!responseText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      return responseText;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Gemini request failed.', 502);
    }
  }
}

export const geminiService = new GeminiService();

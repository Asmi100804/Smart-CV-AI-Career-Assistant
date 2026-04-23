import OpenAI from "openai";

export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
export const FALLBACK_GROQ_MODEL = "llama-4-scout-17b-16e-instruct";

const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return apiKey;
};

const isRateLimitError = (error: any) => {
  const status = Number(error?.status ?? error?.code ?? 0);
  return status === 429;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createGroqClient = () =>
  new OpenAI({
    apiKey: getGroqApiKey(),
    baseURL: "https://api.groq.com/openai/v1",
  });

interface GroqJsonRequest {
  prompt: string;
  maxRetries?: number;
  primaryModel?: string;
  fallbackModel?: string;
}

export async function generateGroqJsonContent({
  prompt,
  maxRetries = 2,
  primaryModel = DEFAULT_GROQ_MODEL,
  fallbackModel = FALLBACK_GROQ_MODEL,
}: GroqJsonRequest): Promise<string> {
  const client = createGroqClient();
  const modelsToTry = [primaryModel, fallbackModel].filter(Boolean);

  let lastError: unknown;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error("Groq returned an empty response.");
        }

        return content;
      } catch (error: any) {
        lastError = error;
        if (isRateLimitError(error) && attempt < maxRetries) {
          await sleep(400 * (attempt + 1));
          continue;
        }

        if (attempt < maxRetries) continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to get Groq response.");
}

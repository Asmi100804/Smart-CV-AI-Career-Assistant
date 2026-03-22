import { AppError } from './errors';

const MARKDOWN_JSON_BLOCK_REGEX = /```json\s*([\s\S]*?)```/i;
const MARKDOWN_BLOCK_REGEX = /```\s*([\s\S]*?)```/i;

export const cleanJsonResponse = (raw: string): string => {
  const jsonBlockMatch = raw.match(MARKDOWN_JSON_BLOCK_REGEX);
  if (jsonBlockMatch?.[1]) {
    return jsonBlockMatch[1].trim();
  }

  const genericBlockMatch = raw.match(MARKDOWN_BLOCK_REGEX);
  if (genericBlockMatch?.[1]) {
    return genericBlockMatch[1].trim();
  }

  return raw.trim();
};

export const parseJsonSafely = <T>(raw: string, errorMessage: string): T => {
  const cleaned = cleanJsonResponse(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new AppError(errorMessage, 502);
  }
};

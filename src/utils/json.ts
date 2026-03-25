export const safeJsonParse = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

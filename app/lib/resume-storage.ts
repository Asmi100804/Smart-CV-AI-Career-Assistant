const STORAGE_KEY = "smartcv:resumes";

const isBrowser = () => typeof window !== "undefined";

export function getStoredResumes(): Resume[] {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getStoredResumeById(id: string): Resume | null {
  return getStoredResumes().find((resume) => resume.id === id) ?? null;
}

export function saveResumeRecord(resume: Resume): void {
  const records = getStoredResumes();
  const withoutCurrent = records.filter((record) => record.id !== resume.id);
  withoutCurrent.unshift(resume);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutCurrent));
}

export function wipeStoredResumes(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

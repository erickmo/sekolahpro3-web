export const DRAFT_KEY = "ppdb-draft-v1";

export function saveDraft(data: unknown): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage may throw QuotaExceededError or be disabled in some browsers.
  }
}

export function loadDraft<T = unknown>(): T | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

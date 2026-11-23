const STORAGE_KEY = "veyora_recent_searches";
const MAX_RECENT_SEARCHES = 8;

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): string[] {
  const normalized = normalizeSearchQuery(term);
  if (!normalized || typeof window === "undefined") return getRecentSearches();

  try {
    const current = getRecentSearches();
    const filtered = current.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
    const updated = [normalized, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeRecentSearch(term: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== term.toLowerCase());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore storage quota or access issues
  }
}

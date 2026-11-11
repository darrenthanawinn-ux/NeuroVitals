import type { Report } from "./types";

const KEY = "neurovitals.reports.v1";
const DRAFT = "neurovitals.draft.v1";

export function loadReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

export function saveReport(r: Report) {
  try {
    const all = loadReports().filter((x) => x.id !== r.id);
    all.unshift(r);
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 25)));
  } catch {
    /* storage unavailable */
  }
}

export function getReport(id: string): Report | null {
  return loadReports().find((r) => r.id === id) ?? null;
}

export function deleteReport(id: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loadReports().filter((r) => r.id !== id)));
  } catch {
    /* ignore */
  }
}

export function clearAll() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(DRAFT);
  } catch {
    /* ignore */
  }
}

/** Seed a demo report so the dashboard is never empty. */
export function seedDemoIfEmpty(make: () => Report) {
  if (loadReports().length === 0) saveReport(make());
}

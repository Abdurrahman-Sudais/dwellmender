import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("en-GB", opts);
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function daysAgo(iso: string, now = DEMO_NOW) {
  return daysBetween(iso, now.toISOString());
}

/** All demo data is anchored to a fixed "today" so the dashboard looks the same on every run. */
export const DEMO_NOW = new Date("2026-11-21T09:00:00Z");

export function isoDaysAgo(days: number, hour = 9) {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  // never produce a timestamp later than the demo's "now"
  const latest = DEMO_NOW.getTime() - 20 * 60_000;
  return new Date(Math.min(d.getTime(), latest)).toISOString();
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

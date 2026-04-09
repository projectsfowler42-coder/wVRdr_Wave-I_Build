import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtDollar(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return "—";
  return `$${fmt(n, decimals)}`;
}

export function fmtMillions(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return fmtDollar(n);
}

export function signClass(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "text-flat";
  if (n > 0) return "text-up";
  if (n < 0) return "text-down";
  return "text-flat";
}

export function signPrefix(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "";
  return n > 0 ? "+" : "";
}

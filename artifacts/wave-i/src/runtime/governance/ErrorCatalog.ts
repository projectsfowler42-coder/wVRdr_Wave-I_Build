export type WaveIRuntimeErrorKind =
  | "boot"
  | "render"
  | "window_error"
  | "unhandled_rejection"
  | "data"
  | "unknown";

export interface WaveIRuntimeErrorRecord {
  id: string;
  kind: WaveIRuntimeErrorKind;
  severity: "error" | "warning";
  message: string;
  detail: string | null;
  source: string;
  stack: string | null;
  timestamp: string;
  explanation: string;
}

interface RecordInput {
  kind: WaveIRuntimeErrorKind;
  severity?: "error" | "warning";
  message: string;
  detail?: string | null;
  source?: string;
  stack?: string | null;
}

const STORAGE_KEY = "wavei_runtime_error_catalog_v1";
const listeners = new Set<() => void>();
let globalHandlersInstalled = false;
let catalog = loadCatalog();

function loadCatalog(): WaveIRuntimeErrorRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCatalog() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    // swallow storage failures inside the logger itself
  }
}

function emitChange() {
  persistCatalog();
  listeners.forEach((listener) => listener());
}

function nextErrorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wavei-error-${Date.now()}`;
}

export function explainRuntimeError(kind: WaveIRuntimeErrorKind): string {
  switch (kind) {
    case "boot":
      return "The app failed before the Wave-I shell finished mounting.";
    case "render":
      return "A mounted React surface threw during render and was trapped by the shell boundary.";
    case "window_error":
      return "A browser-level script error escaped normal component handling.";
    case "unhandled_rejection":
      return "A promise rejected without a local handler.";
    case "data":
      return "A local data or contract surface failed while the shell remained live.";
    default:
      return "Wave-I recorded a runtime fault that still needs classification.";
  }
}

export function recordRuntimeError(input: RecordInput): WaveIRuntimeErrorRecord {
  const record: WaveIRuntimeErrorRecord = {
    id: nextErrorId(),
    kind: input.kind,
    severity: input.severity ?? "error",
    message: input.message,
    detail: input.detail ?? null,
    source: input.source ?? "unknown",
    stack: input.stack ?? null,
    timestamp: new Date().toISOString(),
    explanation: explainRuntimeError(input.kind),
  };

  catalog = [record, ...catalog].slice(0, 25);
  emitChange();
  return record;
}

export function snapshotRuntimeErrors(): WaveIRuntimeErrorRecord[] {
  return [...catalog];
}

export function latestRuntimeError(): WaveIRuntimeErrorRecord | null {
  return catalog[0] ?? null;
}

export function subscribeRuntimeErrors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installGlobalErrorHandlers() {
  if (globalHandlersInstalled || typeof window === "undefined") return;
  globalHandlersInstalled = true;

  window.addEventListener("error", (event) => {
    recordRuntimeError({
      kind: "window_error",
      message: event.message || "Unknown window error",
      detail: event.filename
        ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}`
        : null,
      source: "window.onerror",
      stack: event.error instanceof Error ? event.error.stack ?? null : null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : null;
    recordRuntimeError({
      kind: "unhandled_rejection",
      message: error?.message ?? String(reason ?? "Unhandled rejection"),
      detail: null,
      source: "window.unhandledrejection",
      stack: error?.stack ?? null,
    });
  });
}

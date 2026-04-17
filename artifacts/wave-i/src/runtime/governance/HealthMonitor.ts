import type { HealthEvent, HealthState } from "@/contracts/health.contract";

type HealthListener = (event: HealthEvent) => void;

const STORAGE_KEY = "wavei_health_events_v1";

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

function parseStoredEvents(): HealthEvent[] {
  const raw = safeStorageGet(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.filter((item): item is HealthEvent => {
      return Boolean(
        item &&
        typeof item === "object" &&
        typeof (item as HealthEvent).subject === "string" &&
        typeof (item as HealthEvent).state === "string" &&
        typeof (item as HealthEvent).occurredAt === "string",
      );
    });
  } catch {
    return [];
  }
}

export class HealthMonitor {
  private readonly state = new Map<string, HealthState>();
  private readonly listeners = new Set<HealthListener>();
  private events: HealthEvent[] = parseStoredEvents();

  constructor() {
    this.events.forEach((event) => {
      this.state.set(event.subject, event.state);
    });
  }

  private persist(): void {
    safeStorageSet(STORAGE_KEY, JSON.stringify(this.events));
  }

  set(subject: string, next: HealthState, reason?: string): HealthEvent {
    this.state.set(subject, next);

    const event: HealthEvent = {
      subject,
      state: next,
      reason,
      occurredAt: new Date().toISOString(),
    };

    this.events = [
      event,
      ...this.events.filter((entry) => entry.subject !== subject),
    ].slice(0, 100);

    this.persist();
    this.listeners.forEach((listener) => listener(event));
    return event;
  }

  get(subject: string): HealthState | null {
    return this.state.get(subject) ?? null;
  }

  snapshot(): Record<string, HealthState> {
    return Object.fromEntries(this.state.entries());
  }

  latestEvents(): HealthEvent[] {
    return [...this.events];
  }

  subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const healthMonitor = new HealthMonitor();

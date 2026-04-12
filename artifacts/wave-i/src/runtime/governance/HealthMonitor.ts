import type { HealthEvent, HealthState } from "@/contracts/health.contract";

type HealthListener = (event: HealthEvent) => void;

export class HealthMonitor {
  private readonly state = new Map<string, HealthState>();
  private readonly listeners = new Set<HealthListener>();

  set(subject: string, next: HealthState, reason?: string): HealthEvent {
    this.state.set(subject, next);

    const event: HealthEvent = {
      subject,
      state: next,
      reason,
      occurredAt: new Date().toISOString(),
    };

    this.listeners.forEach((listener) => listener(event));
    return event;
  }

  get(subject: string): HealthState | null {
    return this.state.get(subject) ?? null;
  }

  snapshot(): Record<string, HealthState> {
    return Object.fromEntries(this.state.entries());
  }

  subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const healthMonitor = new HealthMonitor();

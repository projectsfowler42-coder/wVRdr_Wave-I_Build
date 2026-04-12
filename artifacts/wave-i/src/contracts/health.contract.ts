export type HealthState =
  | "healthy"
  | "degraded"
  | "stale"
  | "malformed"
  | "incompatible"
  | "disabled"
  | "quarantined"
  | "failed";

export interface HealthEvent {
  subject: string;
  state: HealthState;
  reason?: string;
  occurredAt: string;
}

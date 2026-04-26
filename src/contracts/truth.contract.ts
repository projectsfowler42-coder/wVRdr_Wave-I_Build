export const TruthClass = {
  LIVE: 'LIVE',
  DEGRADED: 'DEGRADED',
  STALE: 'STALE',
  FAILED: 'FAILED',
} as const;

export type TruthClass = (typeof TruthClass)[keyof typeof TruthClass];

export interface TruthEnvelope<T> {
  readonly value: T;
  readonly sourceId: string;
  readonly timestamp: number;
  readonly truthClass: TruthClass;
}

export const enforceTruthSpine = <T>(env: TruthEnvelope<T>): TruthClass => {
  const age = (Date.now() - env.timestamp) / 1000;
  return env.truthClass === TruthClass.LIVE && age > 60 ? TruthClass.STALE : env.truthClass;
};

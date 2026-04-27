export enum TruthClass {
  LIVE = 'LIVE',
  DEGRADED = 'DEGRADED',
  STALE = 'STALE',
  FAILED = 'FAILED',
}

export interface TruthEnvelope<T> {
  value: T;
  source: string;
  ts: number;
  truthClass: TruthClass;
}

export const getTruthColor = (tc: TruthClass): string => {
  switch (tc) {
    case TruthClass.LIVE:
      return '#00ffff';
    case TruthClass.DEGRADED:
      return '#ff9f1c';
    case TruthClass.STALE:
      return '#ffe600';
    case TruthClass.FAILED:
      return '#ff2d55';
    default:
      return '#666666';
  }
};

export const mapSourceToTruth = (source?: string | null): TruthClass => {
  const normalized = String(source ?? '').toLowerCase();
  if (normalized === 'live') return TruthClass.LIVE;
  if (normalized === 'stale') return TruthClass.STALE;
  if (normalized === 'fallback') return TruthClass.DEGRADED;
  if (normalized === 'failed') return TruthClass.FAILED;
  return TruthClass.DEGRADED;
};

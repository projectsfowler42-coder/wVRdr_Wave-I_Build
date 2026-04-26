export const TruthClass = {
  LIVE: "LIVE",
  DEGRADED: "DEGRADED",
  STALE: "STALE",
  FAILED: "FAILED",
} as const;

export type TruthClass = (typeof TruthClass)[keyof typeof TruthClass];

export interface TruthEnvelope<T> {
  readonly value: T;
  readonly sourceId: string;
  readonly timestamp: number;
  readonly truthClass: TruthClass;
}

export interface RescueEnvelope<T> extends TruthEnvelope<T> {
  readonly staleRescue?: boolean;
}

export interface TruthRaceResult<T> {
  readonly winner: TruthEnvelope<T>;
  readonly candidates: readonly TruthEnvelope<T>[];
  readonly rejected: readonly TruthEnvelope<T>[];
}

const LIVE_MAX_AGE_SECONDS = 60;
export const RESCUE_TIMEOUT_MS = 3500;

export const ageSeconds = (timestamp: number, now = Date.now()): number => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
};

export const enforceTruthSpine = <T>(env: TruthEnvelope<T>, now = Date.now()): TruthClass => {
  const age = ageSeconds(env.timestamp, now);
  return env.truthClass === TruthClass.LIVE && age > LIVE_MAX_AGE_SECONDS ? TruthClass.STALE : env.truthClass;
};

export const normalizeTruthEnvelope = <T>(env: TruthEnvelope<T>, now = Date.now()): TruthEnvelope<T> => ({
  ...env,
  truthClass: enforceTruthSpine(env, now),
});

const truthRank = (truthClass: TruthClass): number => {
  if (truthClass === TruthClass.LIVE) return 0;
  if (truthClass === TruthClass.DEGRADED) return 1;
  if (truthClass === TruthClass.STALE) return 2;
  return 3;
};

export const raceTruthEnvelopes = <T>(candidates: readonly TruthEnvelope<T>[], now = Date.now()): TruthRaceResult<T> => {
  if (candidates.length === 0) {
    throw new Error("Truth race requires at least one candidate");
  }

  const normalized = candidates.map((candidate) => normalizeTruthEnvelope(candidate, now));
  const sorted = [...normalized].sort((left, right) => {
    const rankDelta = truthRank(left.truthClass) - truthRank(right.truthClass);
    if (rankDelta !== 0) return rankDelta;
    return ageSeconds(left.timestamp, now) - ageSeconds(right.timestamp, now);
  });

  return {
    winner: sorted[0],
    candidates: normalized,
    rejected: sorted.slice(1),
  };
};

export async function raceTruth<T>(
  livePath: () => Promise<TruthEnvelope<T>>,
  fallback: TruthEnvelope<T>,
  timeoutMs = RESCUE_TIMEOUT_MS,
): Promise<RescueEnvelope<T>> {
  const rescued: RescueEnvelope<T> = {
    ...normalizeTruthEnvelope(fallback),
    truthClass: TruthClass.STALE,
    staleRescue: true,
  };

  const timeout = new Promise<RescueEnvelope<T>>((resolve) => {
    window.setTimeout(() => resolve(rescued), timeoutMs);
  });

  const live = livePath()
    .then((result): RescueEnvelope<T> => ({ ...normalizeTruthEnvelope(result), staleRescue: false }))
    .catch((): RescueEnvelope<T> => rescued);

  return Promise.race([live, timeout]);
}

export const failedEnvelope = <T>(value: T, sourceId: string, timestamp = Date.now()): TruthEnvelope<T> => ({
  value,
  sourceId,
  timestamp,
  truthClass: TruthClass.FAILED,
});

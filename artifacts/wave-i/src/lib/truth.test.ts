import { describe, expect, it } from 'vitest';
import { TruthClass, getTruthColor, mapSourceToTruth } from './truth';

describe('Wave-I Truth Spine', () => {
  it('maps connected source labels to explicit truth classes', () => {
    expect(mapSourceToTruth('live')).toBe(TruthClass.LIVE);
    expect(mapSourceToTruth('stale')).toBe(TruthClass.STALE);
    expect(mapSourceToTruth('fallback')).toBe(TruthClass.DEGRADED);
    expect(mapSourceToTruth('failed')).toBe(TruthClass.FAILED);
  });

  it('fails closed to DEGRADED for missing or unknown source labels', () => {
    expect(mapSourceToTruth(undefined)).toBe(TruthClass.DEGRADED);
    expect(mapSourceToTruth(null)).toBe(TruthClass.DEGRADED);
    expect(mapSourceToTruth('manual')).toBe(TruthClass.DEGRADED);
    expect(mapSourceToTruth('seed')).toBe(TruthClass.DEGRADED);
  });

  it('keeps truth colors stable for the cockpit badges', () => {
    expect(getTruthColor(TruthClass.LIVE)).toBe('#00ffff');
    expect(getTruthColor(TruthClass.DEGRADED)).toBe('#ff9f1c');
    expect(getTruthColor(TruthClass.STALE)).toBe('#ffe600');
    expect(getTruthColor(TruthClass.FAILED)).toBe('#ff2d55');
  });
});

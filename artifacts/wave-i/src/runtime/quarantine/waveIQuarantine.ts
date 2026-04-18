export const WAVE_I_ACTIVE_RUNTIME_CONTAINERS = ["|W|", "|M|", "[B]", "[G]"] as const;

export const WAVE_I_QUARANTINED_SYSTEMS = [
  "|P| PURPLE",
  "|Y| YELLOW",
  "[S] SILVER",
  "ITB",
  "tactical probes",
  "anomaly simulation",
  "Monte Carlo",
  "prop-firm simulation",
  "options modeling",
  "macro cause classification",
  "forward-path prediction",
  "regime engines",
  "volatility-asymmetry engines",
  "cross-asset signal engine",
] as const;

export type WaveIQuarantinedSystem = typeof WAVE_I_QUARANTINED_SYSTEMS[number];

export function assertNotWaveIQuarantinedSystem(name: string): void {
  const normalized = name.trim().toLowerCase();
  const match = WAVE_I_QUARANTINED_SYSTEMS.find((system) => system.toLowerCase() === normalized);
  if (match) {
    throw new Error(`${match} is quarantined and cannot be imported into Wave-I runtime.`);
  }
}

export function canAffectWaveIRuntime(name: string): boolean {
  try {
    assertNotWaveIQuarantinedSystem(name);
    return true;
  } catch {
    return false;
  }
}

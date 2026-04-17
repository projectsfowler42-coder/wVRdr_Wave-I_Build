import type { ReleaseRegistryRecord } from "@/contracts/release.contract";

const STORAGE_KEY = "wavei_release_registry_v1";

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

function normalizeReleaseRegistry(input?: Partial<ReleaseRegistryRecord> | null): ReleaseRegistryRecord {
  return {
    active: typeof input?.active === "string" && input.active ? input.active : null,
    previous: typeof input?.previous === "string" && input.previous ? input.previous : null,
    releases: Array.isArray(input?.releases)
      ? input.releases.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [],
  };
}

export function loadReleaseRegistry(): ReleaseRegistryRecord {
  const raw = safeStorageGet(STORAGE_KEY);
  if (!raw) {
    return { active: null, previous: null, releases: [] };
  }

  try {
    return normalizeReleaseRegistry(JSON.parse(raw) as Partial<ReleaseRegistryRecord>);
  } catch {
    return { active: null, previous: null, releases: [] };
  }
}

function persistReleaseRegistry(record: ReleaseRegistryRecord): ReleaseRegistryRecord {
  safeStorageSet(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export const releaseRegistry: ReleaseRegistryRecord = loadReleaseRegistry();

export function registerRelease(release: string): ReleaseRegistryRecord {
  const previous = releaseRegistry.active;
  releaseRegistry.previous = previous;
  releaseRegistry.active = release;

  if (!releaseRegistry.releases.includes(release)) {
    releaseRegistry.releases.unshift(release);
  }

  return persistReleaseRegistry({ ...releaseRegistry, releases: [...releaseRegistry.releases] });
}

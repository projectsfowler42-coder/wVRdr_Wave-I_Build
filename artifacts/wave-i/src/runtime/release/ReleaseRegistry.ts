import type { ReleaseRegistryRecord } from "@/contracts/release.contract";

export const releaseRegistry: ReleaseRegistryRecord = {
  active: null,
  previous: null,
  releases: [],
};

export function registerRelease(release: string): ReleaseRegistryRecord {
  const previous = releaseRegistry.active;
  releaseRegistry.previous = previous;
  releaseRegistry.active = release;

  if (!releaseRegistry.releases.includes(release)) {
    releaseRegistry.releases.unshift(release);
  }

  return { ...releaseRegistry, releases: [...releaseRegistry.releases] };
}

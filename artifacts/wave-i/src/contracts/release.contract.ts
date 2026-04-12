export interface GhostImage {
  release: string;
  createdAt: string;
  artifactFingerprint: string | null;
  dependencyLockFingerprint: string | null;
  modulePointerMap: string;
  contractVersionMap: Record<string, string>;
  schemaVersionMap: Record<string, string>;
  configFingerprint: string | null;
  integrityHash: string | null;
  restoreManifest: {
    artifactPath: string;
    previousStablePointer: string | null;
  };
}

export interface ReleaseRegistryRecord {
  active: string | null;
  previous: string | null;
  releases: string[];
}

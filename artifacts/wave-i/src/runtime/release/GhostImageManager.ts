import type { GhostImage } from "@/contracts/release.contract";

export function isGhostImageComplete(image: GhostImage): boolean {
  return Boolean(
    image.release &&
      image.modulePointerMap &&
      image.contractVersionMap &&
      image.schemaVersionMap &&
      image.restoreManifest?.artifactPath,
  );
}

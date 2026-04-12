import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { hashDirectory, hashFile } from "./hash-artifacts.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const waveIRoot = path.join(repoRoot, "artifacts", "wave-i");

const artifactRoot = path.join(waveIRoot, "dist", "public");
const packageJsonPath = path.join(waveIRoot, "package.json");
const lockfilePath = path.join(repoRoot, "pnpm-lock.yaml");
const modulePointersPath = path.join(
  waveIRoot,
  "src",
  "runtime",
  "registry",
  "module-pointers.json",
);
const schemaPath = path.join(
  waveIRoot,
  "src",
  "data",
  "schemas",
  "instrument.schema.json",
);
const ghostRoot = path.join(repoRoot, "ghost");
const ghostRegistryPath = path.join(ghostRoot, "registry.json");

if (!fs.existsSync(artifactRoot)) {
  throw new Error(`Wave-I artifact root missing: ${artifactRoot}`);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const modulePointers = JSON.parse(fs.readFileSync(modulePointersPath, "utf8"));
const instrumentSchema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const registry = fs.existsSync(ghostRegistryPath)
  ? JSON.parse(fs.readFileSync(ghostRegistryPath, "utf8"))
  : { active: null, previous: null, releases: [] };

const release =
  process.env.WAVE_I_RELEASE_VERSION ||
  `${pkg.version || "0.0.0"}-${new Date().toISOString().slice(0, 10)}`;

const releaseDir = path.join(ghostRoot, "releases", release);
fs.mkdirSync(releaseDir, { recursive: true });

const artifactFingerprint = hashDirectory(artifactRoot);
const dependencyLockFingerprint = fs.existsSync(lockfilePath) ? hashFile(lockfilePath) : null;

const configFingerprint = crypto
  .createHash("sha256")
  .update(JSON.stringify({ basePath: process.env.BASE_PATH ?? "./" }))
  .digest("hex");

const contractVersionMap = Object.fromEntries(
  modulePointers.map((module) => [module.module_name, module.contract_version]),
);

const schemaVersionMap = {
  "wave-i.instrument": instrumentSchema.version ?? "1.0.0",
};

const restoreManifest = {
  artifactPath: `ghost/releases/${release}`,
  previousStablePointer: registry.active ?? null,
};

const ghostImage = {
  release,
  createdAt: new Date().toISOString(),
  artifactFingerprint,
  dependencyLockFingerprint,
  modulePointerMap: "module-map.json",
  contractVersionMap,
  schemaVersionMap,
  configFingerprint,
  integrityHash: null,
  restoreManifest,
};

const integrityHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(ghostImage))
  .digest("hex");

ghostImage.integrityHash = integrityHash;

const checksums = {
  artifactFingerprint,
  dependencyLockFingerprint,
  configFingerprint,
  integrityHash,
};

const proof = {
  release,
  createdAt: ghostImage.createdAt,
  artifactPath: restoreManifest.artifactPath,
  artifactFingerprint,
  dependencyLockFingerprint,
  configFingerprint,
  integrityHash,
  previousStablePointer: restoreManifest.previousStablePointer,
  modulePointerMap: ghostImage.modulePointerMap,
  contractVersionMap,
  schemaVersionMap,
};

fs.writeFileSync(
  path.join(releaseDir, "ghost-image.json"),
  JSON.stringify(ghostImage, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(releaseDir, "module-map.json"),
  JSON.stringify(modulePointers, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(releaseDir, "checksums.json"),
  JSON.stringify(checksums, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(releaseDir, "restore-manifest.json"),
  JSON.stringify(restoreManifest, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(releaseDir, "proof.json"),
  JSON.stringify(proof, null, 2) + "\n",
);

const nextRegistry = {
  active: release,
  previous: registry.active ?? null,
  releases: [release, ...registry.releases.filter((item) => item !== release)],
};

fs.mkdirSync(ghostRoot, { recursive: true });
fs.writeFileSync(ghostRegistryPath, JSON.stringify(nextRegistry, null, 2) + "\n");

console.log(`Wave-I Ghost Image written to ${releaseDir}`);

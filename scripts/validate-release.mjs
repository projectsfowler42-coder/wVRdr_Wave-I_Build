import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const ghostRegistryPath = path.join(repoRoot, "ghost", "registry.json");

function ensureExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing ${label}: ${targetPath}`);
  }
}

ensureExists(ghostRegistryPath, "ghost registry");

const registry = JSON.parse(fs.readFileSync(ghostRegistryPath, "utf8"));
if (!registry.active) {
  throw new Error("ghost/registry.json has no active release pointer");
}

const activeDir = path.join(repoRoot, "ghost", "releases", registry.active);
ensureExists(activeDir, "active release directory");

for (const fileName of [
  "ghost-image.json",
  "checksums.json",
  "restore-manifest.json",
  "module-map.json",
  "proof.json",
]) {
  ensureExists(path.join(activeDir, fileName), fileName);
}

console.log(`Wave-I release validation passed for ${registry.active}`);

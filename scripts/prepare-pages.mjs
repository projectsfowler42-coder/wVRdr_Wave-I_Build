import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const pagesRoot = path.join(repoRoot, "artifacts", "wave-i", "dist", "public");
const indexPath = path.join(pagesRoot, "index.html");
const noJekyllPath = path.join(pagesRoot, ".nojekyll");
const notFoundPath = path.join(pagesRoot, "404.html");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Wave-I Pages prep failed: missing index.html at ${indexPath}`);
}

fs.writeFileSync(noJekyllPath, "\n");
fs.copyFileSync(indexPath, notFoundPath);

console.log(`Prepared Pages assets in ${pagesRoot}`);

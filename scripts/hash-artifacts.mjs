import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function hashFile(filePath) {
  return hashBuffer(fs.readFileSync(filePath));
}

export function listFilesRecursive(rootDir) {
  const out = [];

  function walk(current) {
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(current).sort()) {
        walk(path.join(current, child));
      }
      return;
    }
    out.push(current);
  }

  if (fs.existsSync(rootDir)) {
    walk(rootDir);
  }

  return out;
}

export function hashDirectory(rootDir) {
  const files = listFilesRecursive(rootDir);
  const digest = crypto.createHash("sha256");

  for (const file of files) {
    const relative = path.relative(rootDir, file).replaceAll(path.sep, "/");
    digest.update(relative);
    digest.update(fs.readFileSync(file));
  }

  return digest.digest("hex");
}

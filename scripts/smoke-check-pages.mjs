const url = process.env.PAGES_URL || process.argv[2];

if (!url) {
  throw new Error("PAGES_URL is required for smoke check");
}

const response = await fetch(url, {
  headers: {
    "user-agent": "wave-i-smoke-check",
  },
});

if (!response.ok) {
  throw new Error(`Smoke check failed: ${url} returned ${response.status}`);
}

const html = await response.text();

if (!html.includes("Wave-I")) {
  throw new Error("Smoke check failed: deployed HTML does not contain 'Wave-I'");
}

if (!/(?:src|href)=\"[^\"]+(?:assets|\.js|\.css)/.test(html)) {
  throw new Error("Smoke check failed: deployed HTML does not reference built assets");
}

console.log(`Wave-I Pages smoke check passed for ${url}`);

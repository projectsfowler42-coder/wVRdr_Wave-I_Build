# Wave‑I Block‑1 Candidate

This directory contains a standalone Block‑1 implementation candidate pushed for review on the `block-1-implementation` branch.

Purpose:
- preserve the existing `artifacts/wave-i` app on `main`
- add the stricter Block‑1 data model and wallet separation
- provide a reviewable implementation path before replacing the current app in-place

Run locally:

```bash
cd artifacts/wave-i-block1
npm install
npm run dev
```

This candidate is intentionally self-contained and does not depend on the existing monorepo workspace packages.
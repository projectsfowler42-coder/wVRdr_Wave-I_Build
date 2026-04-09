# Wave-I

Wave-I is the frontend-only, truth-first operator surface for WaveRider.

## Canonical doctrine
- `[B]` and `[G]` are buckets
- `|W|` and `|M|` are wallets
- `|M|` is nested inside `[G]`
- buckets and wallets are different object classes
- no backend, no server routes, no remote truth store, no hidden cloud sync
- no runtime API dependence
- `[Harvest Data]` is the one canonical harvest action
- provenance, truth classes, source classes, and quarantine remain explicit
- weak material may be retained but must not silently become authoritative truth

## Not canonical anymore
Wave-I is not canonically defined as a BDC-only or mREIT-only product.

## Current branch status
This branch keeps the current shell intact while adding an additive Block-2 module spine under `artifacts/wave-i/src/block2/`.

## Remaining blockers
1. replace canonical `vite.config.ts` with the static-friendly equivalent while keeping Vite
2. wire bucket / wallet semantics into the live holdings model and UI
3. wire `[Harvest Data]` into the live shell
4. wire provenance / quarantine / conflict visibility into the live shell
5. add container-aware instrument gating
6. add a test runner and first Block-2 tests

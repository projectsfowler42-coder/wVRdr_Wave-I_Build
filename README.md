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

## Runtime scope now mounted in repo
- `|W| WHITE`
- `|M| MINT`
- `[B] BLUE`
- `[G] GREEN`

## What is now landed on GitHub
- frontend-only Wave-I app under `artifacts/wave-i/`
- B.4-A Ghost Chassis runtime scaffolding under `artifacts/wave-i/src/runtime/`
- contract types under `artifacts/wave-i/src/contracts/`
- inspection surface under `artifacts/wave-i/src/inspection/`
- canonical local Wave-I instrument DB under `artifacts/wave-i/src/data/`
- partial Block-3 premium-shell promotion under `artifacts/wave-i/src/block3/`
- Ghost Image scripts under `scripts/`
- GitHub Pages workflow under `.github/workflows/deploy-wave-i.yml`

## Current repo state
Wave-I is no longer just a Block-2 shell with quarantined Block-3 references.

The repo now contains:
- Block-2 operative foundations
- partial Block-3 promotion into mounted runtime
- B.4-A Ghost Chassis landing on `main`

## Remaining proof gates
1. run typecheck cleanly
2. run tests cleanly
3. run `build:ghost`
4. publish the Pages artifact
5. confirm generated Ghost Image metadata on a real release build

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

## Automated release proof
Wave-I release proof is now designed to be automated from `main`.

A valid automated proof run requires all of the following:
- workspace typecheck passes
- Wave-I tests pass
- Wave-I static build passes
- Ghost Image metadata is generated
- Ghost release package validates
- Pages artifact uploads and deploys
- deployed Pages site passes smoke check

Stable release proof is not just “build succeeded”.
It is:
- green workflow
- Ghost Image package
- rollback-addressable registry pointer
- successful Pages smoke check

## Current repo state
Wave-I is no longer just a Block-2 shell with quarantined Block-3 references.

The repo now contains:
- Block-2 operative foundations
- partial Block-3 promotion into mounted runtime
- B.4-A Ghost Chassis landing on `main`
- release-proof automation path on `main`

## Remaining proof gates
1. run the workflow successfully on `main`
2. confirm Pages publishes cleanly
3. confirm generated Ghost release metadata is committed by the workflow

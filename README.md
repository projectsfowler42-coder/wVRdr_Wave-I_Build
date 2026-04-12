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

## Imported WaveRider overlays now tracked in-repo
- system spine: Aggregator / Gate / Coach / System
- operator discipline: tactical brake, explicit approval, contradiction custody, rules library
- prop-firm stack: Constraint Engine, PreCog, Monte Carlo, Playbook Compiler, Capital Translator, Meta Optimizer, Risk Governor, Output Layer, Evolution Engine

## Current branch status
This branch keeps the current shell intact while exposing imported WaveRider doctrine inside the live frontend.
Current scope includes:
- local M/W/B/G instrument custody
- portfolio tracking stored in browser local storage
- frontend truth / audit / quarantine visibility
- inspection surfaces for runtime and release state
- an additive doctrine panel that compares the broader WaveRider documents against current repo coverage

## Remaining blockers
1. promote the Gate into a real operator-facing tactical brake rather than a doctrine-only panel
2. add a visible rules register with approval, rejection, and quarantine states
3. decide which broader WaveRider modules should remain frontend-visible doctrine versus honest local computation
4. add simulation / PreCog / evolution surfaces only when they can be represented without pretending a hidden backend exists
5. expand tests beyond doctrine coverage into harvest, container semantics, and instrument custody

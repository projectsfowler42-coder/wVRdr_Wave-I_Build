# Block-2 Foundation Correction

This branch corrects Wave-I doctrine without deleting the current running shell.

## Purpose

Wave-I on `main` still canonizes a narrowed BDC/mREIT-only story and does not yet encode the required Block-2 semantics for buckets, wallets, provenance, harvest, quarantine, or truth-state handling.

This document is the branch-level correction notice for Block-2.

## Governing corrections

The following now govern Block-2 work on this branch:

- `[B]` and `[G]` are buckets
- `|W|` and `|M|` are wallets
- buckets and wallets are semantically different object classes
- `|M|` is nested inside `[G]`
- Wave-I remains frontend-only for Block-2
- one-button `[Data Harvest]` is canonical for Wave-I operator refresh/control
- source provenance and truth-state visibility are mandatory
- quarantine-not-delete is mandatory
- weak sources may be retained, but not promoted into authoritative truth

## Branch rule

Until the legacy docs are fully rewritten, the following files on this branch are the active Block-2 authority:

- `docs/BLOCK-2-CHAT-SPECIFIC-CONSTRUCTION-BRIEF.md`
- `docs/BLOCK-2-FOUNDATION-CORRECTION.md`
- `docs/BLOCK-3-QUARANTINE.md`
- all `docs/block2/*`
- all `artifacts/wave-i/src/block2/*`

## Legacy status of current canonical docs on main

The current `README.md`, `WAVE_I_SCOPE.md`, `CURRENT_STATE.md`, and `NEXT_STEPS.md` on `main` are treated as legacy Block-1/early-Wave-I material until they are rewritten on this branch.

They remain useful for:
- current shell inventory
- current running app structure
- component baseline
- migration mapping

They are not sufficient as Block-2 doctrine.

## Block-2 safe migration posture

Block-2 work on this branch must:
- preserve the current War Room shell where useful
- add new truth/provenance/harvest/quarantine modules additively
- avoid breaking the current app before new modules are wired
- leave clean plugs for future Wave-II and later phases

## Completion note

Block-2 is not considered push-ready complete until the canonical top-level docs are rewritten to match this correction.

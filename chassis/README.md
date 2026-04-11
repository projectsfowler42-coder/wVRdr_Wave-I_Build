# Wave-I Ghost Chassis

This directory is the structural boundary for the Wave-I Ghost Chassis.

## Rule

Product UI may read through chassis seams, but must not bypass them for canonical truth custody.

## Intended compartments

- `shell-runtime/`
- `release-registry/`
- `ghost-image-archive/`
- `source-registry/`
- `adapter-core/`
- `adapters/`
- `schema-registry/`
- `raw-evidence-store/`
- `normalized-store/`
- `provenance-ledger/`
- `fault-bus/`
- `quarantine-vault/`
- `swap-controller/`
- `inspection-surface/`

## Law

Nothing lands here unless it is:
- typed
- versioned
- bounded
- fault-state aware
- provenance-safe
- hot-swappable or explicitly preserve-only

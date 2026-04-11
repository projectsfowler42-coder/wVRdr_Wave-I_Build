# Wave-I — B.4-A Ghost Chassis Architecture Pack

This pack defines the **architecture-only** split for Wave-I:

- **B.4-A** = Ghost Chassis Architecture Program
- **B.4-B** = later build hardening / implementation phase

## Intent

Wave-I is treated as the canonical build surface for Block-4 architecture.
This pack is designed for a **frontend-only**, **truth-first**, **no-backend-dependence** Wave-I.

## Included documents

- `architecture/b4a-charter.md`
- `architecture/b4a-repo-scaffold.md`
- `architecture/b4a-module-contracts.md`
- `architecture/b4a-state-enums.md`
- `architecture/b4a-storage-architecture.md`
- `architecture/b4a-ghost-image-spec.md`
- `architecture/b4a-hot-swap-matrix.md`
- `architecture/b4a-failure-doctrine.md`
- `architecture/b4a-acceptance-gates.md`

## Use order

1. Read the charter.
2. Freeze the repo scaffold.
3. Freeze module contracts and state enums.
4. Freeze storage and Ghost Image rules.
5. Freeze hot-swap and failure doctrine.
6. Use acceptance gates as the architecture completion test.

## Governing law

Nothing enters the Wave-I Ghost Chassis unless it is:

- named
- bounded
- typed
- versioned
- provenance-carrying
- fault-state aware
- quarantinable
- hot-swappable
- rollback-addressable
- inspectable

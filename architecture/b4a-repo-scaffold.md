# B.4-A Repo Scaffold — Proposed Wave-I Structure

## Goal

Make the architecture first-class in the repository instead of leaving it implicit in app code.

## Proposed top-level layout

```text
/
  artifacts/
    wave-i/                       # product UI surface only

  lib/
    contracts/                    # shared structural contracts
    storage/                      # local storage/indexeddb abstractions
    manifests/                    # release + ghost image manifests
    hashing/                      # integrity and record hashing helpers

  chassis/
    shell-runtime/
    release-registry/
    ghost-image-archive/
    source-registry/
    adapter-core/
    adapters/
      harvested/
      imported-file/
      manual-entry/
      local-snapshot/
      weak-reference/
    schema-registry/
    raw-evidence-store/
    normalized-store/
    provenance-ledger/
    fault-bus/
    quarantine-vault/
    swap-controller/
    inspection-surface/

  architecture/
    b4a-charter.md
    b4a-repo-scaffold.md
    b4a-module-contracts.md
    b4a-state-enums.md
    b4a-storage-architecture.md
    b4a-ghost-image-spec.md
    b4a-hot-swap-matrix.md
    b4a-failure-doctrine.md
    b4a-acceptance-gates.md
```

## Responsibilities by layer

### `artifacts/wave-i/`
- UI shell
- route mounting
- operator views
- inspection views
- no canonical truth mutation outside contracts

### `lib/`
- shared type-level utilities
- local DB/storage wrappers
- manifest and hashing helpers
- no feature logic

### `chassis/`
- all Ghost Chassis modules
- contract-first seams
- no product-brain logic

### `architecture/`
- frozen doctrine
- frozen contracts
- architecture tests and completion criteria

## Immediate repo rules

1. New chassis modules must land under `chassis/`.
2. Shared structural contracts must land under `lib/contracts/`.
3. Feature UI components must not directly own canonical data transformation.
4. Inspection must read through chassis modules, never bypass them.
5. Release metadata and Ghost Image metadata must not live inside ad hoc UI state.

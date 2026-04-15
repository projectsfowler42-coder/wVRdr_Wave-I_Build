# Block‑1 Push Status

This branch captures the Block‑1 doctrine layer that was not yet present on `main`.

## Added in this branch

- `BLOCK_1_ACCEPTANCE.md` — explicit acceptance checklist for Block‑1.
- `DATA_MODEL.md` — canonical separation of buckets, wallets, holdings and link registry fields.
- `LINK_DOCTRINE.md` — link spine and failover doctrine.

## Why this branch exists

The repository already contains a working Wave‑I application and its primary docs on `main`. This branch adds the missing Block‑1 governance/spec files without touching the current running source until reviewed.

## Suggested next step

Merge this branch first, then apply the larger UI/data-model refactor on a dedicated implementation branch so the Block‑1 doctrine and acceptance criteria are established in-repo before wider source changes land.
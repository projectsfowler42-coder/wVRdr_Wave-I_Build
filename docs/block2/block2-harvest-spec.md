# Block-2 Harvest Spec

## Canonical operator action

Wave-I Block-2 exposes exactly one explicit operator retrieval action:

`[Harvest Data]`

## Block-2 requirements

- frontend-only
- local-only persistence
- single-flight
- mash-proof
- dedupe by source and payload hash
- no silent retries that hide failure
- no silent source downgrade
- no overwrite of canonical truth without an inspectable trail

## Required states

- `idle`
- `running`
- `skipped-duplicate`
- `partial`
- `failed`
- `completed`

## Pipeline

1. fetch/capture
2. fingerprint/hash
3. classify source tier
4. validate schema
5. normalize when possible
6. route to truth candidate / secondary candidate / quarantine
7. persist locally
8. emit visible report

## Honesty rules

- partial harvests must remain partial
- parse failures must remain visible
- official-source absence must not be masked by convenience mirrors
- unresolved conflicts must not silently replace existing truth

## Storage rule

Wave-I harvest persistence is local only:
- IndexedDB for payloads, snapshots, quarantine, provenance, reports
- localStorage only for lightweight UI state

## Out of scope for Block-2

- remote DB
- backend scheduler
- hidden cloud sync
- backend-only reconciliation

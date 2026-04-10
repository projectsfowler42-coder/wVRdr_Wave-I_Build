# Block-2 Truth Model

Block-2 introduces an explicit truth model for Wave-I.

## Core rule

Every persisted and displayed datum must belong to a truth class.

## Truth classes

- `RAW_MARKET` — direct market payloads and quote snapshots
- `RAW_OFFICIAL` — issuer, sponsor, filing, exchange, or regulator truth
- `RAW_USER` — explicit operator-entered truth
- `TRANSFORMED` — derived but deterministic values built from visible inputs
- `SECONDARY` — convenience mirror material that is not official-first truth
- `QUARANTINED` — retained but non-authoritative material
- `SIMULATED` — future-phase or what-if outputs, not active Wave-I truth
- `UNRESOLVED` — conflicting or insufficiently reconciled state

## Per-field requirements

Each critical field must carry:
- value
- truth class
- source class
- source id
- source URL or manifest reference when available
- observed or verified timestamp
- stale/degraded/conflicted flags where relevant
- raw input references if derived
- rule id when selected from conflicting candidates

## Block-2 rule of operation

- raw facts are never overwritten by derived facts
- transformed values must store input manifests
- unresolved conflicts remain visible until operator resolution or explicit rule resolution
- quarantined payloads never feed authoritative truth calculations in Wave-I

## UI implication

Every important number must be inspectable in one interaction and expose:
- truth class
- source
- timestamp
- raw vs resolved state
- derivation inputs when applicable

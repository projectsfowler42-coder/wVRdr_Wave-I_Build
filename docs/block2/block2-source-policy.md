# Block-2 Source Policy

## Source tiers

### Tier 0 — MANUAL
Explicit operator-entered truth.

### Tier 1 — OFFICIAL
Issuer, sponsor, exchange, filing, or regulator truth.

### Tier 2 — SECONDARY
Convenience mirrors such as broker pages or market portals.

### Tier 3 — QUARANTINED
Weak, scraped, social, or otherwise non-authoritative material.

## Wave-I rule

- if official exists, official wins
- if official and secondary disagree, state is unresolved until reconciled
- if only secondary exists, show it as secondary/partial, never as official
- if only weak or unofficial exists, quarantine it

## Required field labels

- OFFICIAL
- SECONDARY
- MANUAL
- QUARANTINED
- PARTIAL
- STALE
- DELAYED
- SIMULATED
- UNRESOLVED

## Source conflict rule

Conflict resolution must preserve:
- raw candidate values
- chosen value
- rule used to choose it
- timestamps
- source classes

No silent best-guess replacement is allowed.

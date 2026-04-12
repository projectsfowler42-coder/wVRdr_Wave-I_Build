# Block-3 Quarantine Addendum — Backend-Free Instrument Matrix

## Status
- Status: `QUARANTINED BUT CANONICAL AS REFERENCE INPUT`
- Phase: `BLOCK-3`
- Scope: `WAVE-I ONLY`
- Runtime authority: `PARTIAL PROMOTION ONLY`
- Doctrine authority: `YES FOR BLOCK-3 PREP`

## Purpose
This addendum preserves the backend-free instrument and bucket doctrine required for Wave-I promotion without letting the legacy two-bucket runtime remain the final authority.

## Wave-I-active bucket family
Wave-I active scope is:
- `|W| WHITE`
- `|M| MINT`
- `[B] BLUE`
- `[G] GREEN`

Broader doctrine may exist, but for Wave-I:
- `[S]` means `SILVER`
- `[S] SILVER` is dormant
- `|Y| YELLOW` is dormant
- `|P| PURPLE` is dormant

## Canonical interpretation rule
Block-3 must not classify instruments by ticker familiarity alone.

The correct read is:
- what does it own
- what pays it
- what hurts it
- what bucket job is it doing
- what shock family does it belong to

Different ticker does not imply different risk.

## Shock-family doctrine
Wave-I must preserve cluster warnings across at least:
- Treasury / near-cash cluster
- enhanced cash / ultra-short credit cluster
- AAA CLO cluster
- senior-loan cluster
- high-yield bond cluster
- higher-output CLO cluster
- covered-call equity-income cluster
- BDC / private-credit equity cluster
- real-asset / lease-cashflow cluster
- Australian dividend / credit cluster

## Repo mismatch that must not be promoted silently
The current operative runtime file `artifacts/wave-i/src/lib/instruments.ts` was a thin two-bucket registry using only `BLUE` and `GREEN`.

That file was acceptable as Block-2 convenience.
It is not acceptable as canonical Block-3 or B.4-A instrument doctrine.

## Canonical backend-free rule
Wave-I instrument logic must remain backend-free.

That means:
- no backend classification service
- no hidden API bucket resolver
- no server-side doctrine source
- no dependency on remote enrichment to know what a name is or what job it does

Allowed:
- local canonical matrix
- local registry files
- local classification metadata
- local shock-family annotations
- local promotion rules

## Promotion requirement
Before full Block-3 promotion, the repo must contain:
- a canonical local instrument registry
- schema-backed instrument records
- selector-safe bucket projection for M / W / B / G
- promotion-safe UI language that does not fake diversification

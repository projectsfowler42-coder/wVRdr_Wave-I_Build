# Block-3 Quarantine Addendum — Backend-Free Instrument Matrix

## Status

- Status: `QUARANTINED BUT CANONICAL AS REFERENCE INPUT`
- Phase: `BLOCK-3`
- Scope: `WAVE-I ONLY`
- Runtime authority: `NOT YET PROMOTED`
- Doctrine authority: `YES FOR BLOCK-3 PREP`

## Purpose

This addendum upgrades the Block-3 quarantine so it preserves not only visual concept material, but also the correct backend-free instrument and bucket doctrine required for future Block-3 promotion.

The original quarantine file preserved visual direction.
This addendum preserves instrument logic, bucket roles, shock-family logic, and promotion constraints so Block-3 does not inherit the wrong semantic model from the current Block-2 runtime.

## Canonical Block-3 bucket model

Block-3 must not be defined by the current two-bucket runtime only.

The canonical backend-free Block-3 bucket system is:

- `|W| WHITE`
- `[B] BLUE`
- `[G] GREEN`
  - `G1`
  - `G2`
  - `G3`
  - `G4`
- `|M| MINT`
- `|Y| YELLOW`
- `|P| PURPLE`
- `[S] SPREAD`

## Canonical bucket jobs

### WHITE
- stabilizer
- dry powder
- defensive reserve
- lowest risk
- lowest payout
- maximum deployability

### BLUE
- safer carry
- safer income engine
- low risk
- modest payout
- ballast / floating-rate / short-duration / higher-quality carry

### GREEN
- core compounding income engine
- real income
- DRiP-compatible carry
- tiered by failure-mode and payout quality

### G1
- conservative Green
- more stable income
- lower drama

### G2
- standard core compounding Green
- main engine tier

### G3
- high-output Green
- higher income
- higher volatility

### G4
- stretch Green / edge-of-Purple
- still possibly investable
- must be sized smaller
- uglier failure mode

### MINT
- front-loaded DRiP reserve
- tactical capital parking
- dip-buy reserve
- not permanent full deployment

### YELLOW
- swing-weight booster
- tactical sizing sleeve
- medium/high tactical risk

### PURPLE
- asymmetry
- probes
- catalysts
- chaos sleeve
- high-risk upside variance

### SPREAD
- nonlinear payoff sleeve
- asymmetry / hedge / paired structures
- high-management tactical layer

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

Block-3 must preserve cluster warnings.

Examples of cluster families that must remain explicit:
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

The current operative runtime file `artifacts/wave-i/src/lib/instruments.ts` is a limited two-bucket registry using only `BLUE` and `GREEN`.

It currently:
- reduces the bucket system to two live classes
- treats that reduction as operative runtime input
- places several BDC names in `BLUE`
- places several mREIT names in `GREEN`

That file is acceptable as a Block-2 runtime convenience registry.
It is **not** acceptable as canonical Block-3 instrument doctrine.

## Explicit non-promotion rule

The following must not happen during Block-3 promotion:

1. The current two-bucket `BLUE/GREEN` runtime model must not be mistaken for final bucket doctrine.
2. The current `instruments.ts` mapping must not become Block-3 authority by inertia.
3. Visual promotion must not occur without semantic promotion.
4. Premium surface treatment must not hide bucket ambiguity.
5. Block-3 must not inherit ticker classification errors under cover of polish.

## Canonical backend-free rule

Block-3 instrument logic must remain backend-free.

That means:
- no backend classification service
- no hidden API bucket resolver
- no server-side instrument doctrine source
- no dependency on live backend enrichment to know what a name is or what job it does

Allowed:
- local canonical matrix
- local registry files
- local classification metadata
- local shock-family annotations
- local promotion rules

## Required Block-3 promotion outputs

Before Block-3 can be promoted from quarantine into operative code, the repo must contain all of the following:

### 1. Canonical instrument registry
A local registry that captures:
- ticker
- name
- type
- canonical bucket
- bucket tier where relevant
- risk/reward job
- what it owns
- what pays it
- what hurts it
- shock family
- backend-free provenance note

### 2. Canonical bucket schema
A local type system that supports:
- WHITE
- BLUE
- GREEN
- G1/G2/G3/G4
- MINT
- YELLOW
- PURPLE
- SPREAD

### 3. Cluster-warning layer
A local mechanism that groups related names by shared shock family.

### 4. Promotion-safe UI language
A Block-3 shell must render:
- bucket job
- risk/reward role
- cluster warnings
- stretch / edge states
- asymmetry sleeves
without pretending unrelated diversification where none exists.

## Required removals from future Block-3 ambiguity

The following ideas must be removed from any future misunderstanding:

- `BLUE = all safer names`
- `GREEN = all yield names`
- `different ticker = diversified`
- `yield ranking alone defines bucket`
- `visual polish can precede semantic repair`

## Final addendum rule

This addendum is now part of the Block-3 quarantine package.

The quarantine is no longer only a visual preservation file.
It is now also a doctrine-preservation file.

Until Block-3 promotion occurs, the repo must be read as follows:
- Block-2 runtime remains operative
- Block-3 semantic instrument doctrine is preserved here
- current runtime instrument buckets are provisional, not final Block-3 authority

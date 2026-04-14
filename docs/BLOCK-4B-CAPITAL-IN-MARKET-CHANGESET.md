# Block-4B Capital-in-Market Changeset

This file records the **known, high-confidence repo changes** required to move Wave-I from a quote-first recovery shell to a **capital-in-market manual cockpit**.

## Product doctrine

Wave-I is:

> my capital inside the market, with the market rendered only to the extent it matters for my next manual move

The mounted product must answer, in order:

1. What is my capital doing?
2. What is the market doing to it?
3. What action does that justify right now?
4. Why did I act?
5. What happened after?

## Immediate repo implications

### 1. Re-center the shell

`artifacts/wave-i/src/pages/WarRoom.tsx` should stop opening on a quote board and instead open on:

- capital summary
- holdings / active plays
- market context attached to those holdings
- decision controls
- memory / review state
- audit / quarantine / provenance / inspection as supporting truth surfaces

### 2. Expand the holding model

`artifacts/wave-i/src/lib/portfolio.ts` should gain explicit capital-action-memory fields.

Minimum additions:

- `thesis?: string`
- `currentAction?: "DRIP" | "HOLD" | "ADD" | "TRIM" | "ROTATE" | "WAIT"`
- `actionReason?: string`
- `expectedOutcome?: string`
- `reviewDate?: string`
- `addBelowPrice?: number | null`
- `trimAbovePrice?: number | null`
- `lastActionAt?: string | null`
- `lastActionType?: ...`
- `outcomeNote?: string`

### 3. Add two first-class local objects

#### `HoldingContext`
A derived, refreshable record answering:

> what is the market doing to this holding right now?

Suggested fields:

- `holdingId`
- `ticker`
- `currentPrice`
- `distanceToCostBasisPct`
- `distanceToAddBandPct`
- `distanceToTrimBandPct`
- `nextPayDate`
- `daysToPay`
- `triggerState`
- `pressureState`
- `snapshotAt`

#### `DecisionRecord`
A manual, append-only record answering:

> what did I decide, why, and what happened after?

Suggested fields:

- `decisionId`
- `holdingId`
- `actionType`
- `actionAt`
- `marketSnapshotRef`
- `reason`
- `expectedOutcome`
- `reviewDate`
- `outcome`
- `outcomeRecordedAt`

### 4. Promote portfolio from ledger to cockpit surface

`artifacts/wave-i/src/components/PortfolioTable.tsx` should keep its capital facts and gain:

- price vs cost basis
- price vs add band
- price vs trim band
- next pay window
- trigger / pressure state
- current action
- rationale
- review date
- outcome note

### 5. Demote the quote board to supporting context

`artifacts/wave-i/src/components/BucketQuoteBoard.tsx` should become a supporting market-context module, not the page identity.

### 6. Remove legacy Blue/Green product assumptions

The following still carry old product semantics and should be rewritten or quarantined:

- `artifacts/wave-i/src/components/QuoteCard.tsx`
- `artifacts/wave-i/src/components/Calculators.tsx`
- `artifacts/wave-i/src/components/ResearchLinks.tsx`
- `artifacts/wave-i/src/lib/research-links.ts`
- `artifacts/wave-i/src/lib/market.ts`

### 7. Make harvest produce context, not just quote refresh

`artifacts/wave-i/src/block2/harvest/harvest-controller.ts` should ultimately emit:

- raw evidence
- normalized market snapshots
- derived `HoldingContext`
- quarantine routing for failures
- a visible report

### 8. Persist capital-action-memory locally

Future IndexedDB stores should include:

- `rawEvidence`
- `truthRecords`
- `provenance`
- `quarantine`
- `releases`
- `modules`
- `health`
- `holdingContext`
- `decisionLog`

## Current scaffold added in this branch

This branch adds:

- `artifacts/wave-i/src/lib/decision-model.ts`
- `artifacts/wave-i/src/lib/capital-summary.ts`
- `artifacts/wave-i/src/components/CapitalSummary.tsx`

These do not change runtime behavior yet. They establish the local model and rendering helpers needed for the next Block-4B refactor pass.

# Wave-I Minimal Live Backend Spec

## Status

Wave-I backend must be the smallest possible live-data truth layer required to make the War Room investor-defensible.

Wave-I active runtime scope is only:

- `|W| WHITE`
- `|M| MINT`
- `[B] BLUE`
- `[G] GREEN`

Out of scope for Wave-I:

- `|P| PURPLE`
- `|Y| YELLOW`
- `[S] SILVER`
- ITB
- tactical probes
- anomaly simulation
- Monte Carlo
- prop-firm simulation
- options modeling
- macro cause classification
- forward-path prediction
- regime engines
- volatility-asymmetry engines

Those are quarantined for Wave-II or later.

---

## Prime directive

Wave-I backend does not predict.

Wave-I backend proves.

It must answer:

1. Is the data connection live?
2. Is the quote live enough to use?
3. Is the number real?
4. Where did the number come from?
5. How old is it?
6. Is it stale, missing, conflicted, simulated, cached, or degraded?
7. What percentage does it imply?
8. Can the War Room defend showing it?

---

## Absolute rule

No aggregation.

Wave-I must not aggregate third-party summaries into a synthetic truth number.

Allowed:

- live quote
- live previous close
- live change %
- live volume
- live timestamp
- official issuer yield when directly retrieved
- official ex-date / pay-date when directly retrieved
- user-entered holding data
- deterministic calculations from visible inputs

Not allowed:

- blended vendor consensus
- AI-estimated yield
- inferred ex-date unless labelled as estimate
- hidden averaging of multiple providers
- silent fallback to stale data
- simulated values displayed as live
- proxy data used as authoritative

---

## Minimal backend jobs

The backend has only five jobs.

### 1. Live quote check

For each active Wave-I ticker, fetch and expose:

- ticker
- price
- previous close
- change $
- change %
- open
- high
- low
- volume
- timestamp
- source
- connection status

Required endpoint:

`GET /api/wave-i/live-quotes`

Response:

```ts
type LiveQuote = {
  ticker: string;
  price: number | null;
  previousClose: number | null;
  changeDollar: number | null;
  changePct: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  observedAt: string | null;
  source: string;
  connectionStatus: "LIVE" | "DEGRADED" | "STALE" | "FAILED";
  ageSeconds: number | null;
  truthClass: "RAW_MARKET" | "UNRESOLVED" | "FAILED";
};
```

No cached quote may be returned as `LIVE`.

Cached data may only be returned as:

- `STALE`
- `DEGRADED`
- `UNRESOLVED`

---

### 2. Official income facts

For each active income instrument, expose only directly sourced facts:

- 30-day SEC yield if available
- distribution yield if available
- trailing 12-month distribution if available
- ex-date
- pay-date
- distribution frequency
- source URL
- observed timestamp

Required endpoint:

`GET /api/wave-i/income-facts`

Response:

```ts
type IncomeFact = {
  ticker: string;
  secYieldPct: number | null;
  distributionYieldPct: number | null;
  trailingDistributionPct: number | null;
  nextExDate: string | null;
  nextPayDate: string | null;
  payoutFrequency: "monthly" | "quarterly" | "unknown";
  source: "issuer" | "exchange" | "operator" | "unavailable";
  sourceUrl?: string;
  observedAt: string | null;
  truthClass:
    | "RAW_OFFICIAL"
    | "RAW_USER"
    | "UNRESOLVED"
    | "FAILED";
};
```

If the source is not official, the UI must not label the number as official.

---

### 3. Holding truth

The backend must store current holdings exactly as operator truth.

Required endpoint:

`GET /api/wave-i/holdings`

Holding schema:

```ts
type Holding = {
  id: string;
  ticker: string;
  container: "|W|" | "|M|" | "[B]" | "[G]";
  shares: number;
  costBasisPerShare: number;
  entryDate: string;
  operatorNotes?: string;
  truthClass: "RAW_USER";
  updatedAt: string;
};
```

Required write endpoint:

`POST /api/wave-i/holdings`

Rules:

- user-entered holdings are `RAW_USER`
- they are not market truth
- they are not official truth
- they are valid only as operator-owned position records

---

### 4. Deterministic position math

The backend may calculate only deterministic values from visible inputs.

Allowed calculations:

- market value
- unrealized gain/loss
- unrealized gain/loss %
- allocation %
- income dollars
- income %
- distance to add price
- distance to trim price
- days to ex-date
- days to pay-date

Required endpoint:

`GET /api/wave-i/position-math`

Response:

```ts
type PositionMath = {
  ticker: string;
  container: "|W|" | "|M|" | "[B]" | "[G]";
  shares: number;
  livePrice: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedDollar: number | null;
  unrealizedPct: number | null;
  allocationPct: number | null;
  expectedAnnualIncomeDollar: number | null;
  expectedAnnualIncomePct: number | null;
  daysToExDate: number | null;
  daysToPayDate: number | null;
  calculationStatus: "VALID" | "BLOCKED";
  blockedReason?: string;
  inputs: string[];
  truthClass: "TRANSFORMED" | "UNRESOLVED";
};
```

If a required live price is stale or failed, calculationStatus must be `BLOCKED`.

---

### 5. Connection health checks

The backend must expose tiny live checks.

Required endpoint:

`GET /api/wave-i/health`

Response:

```ts
type HealthCheck = {
  status: "OK" | "DEGRADED" | "FAILED";
  checkedAt: string;
  quoteFeed: {
    status: "OK" | "DEGRADED" | "FAILED";
    latencyMs: number | null;
    lastSuccessAt: string | null;
    failedTickers: string[];
  };
  issuerFacts: {
    status: "OK" | "DEGRADED" | "FAILED";
    lastSuccessAt: string | null;
    unresolvedTickers: string[];
  };
  storage: {
    status: "OK" | "FAILED";
    lastWriteAt: string | null;
  };
};
```

---

## Required War Room display checks

Every number shown in Wave-I must show:

- value
- %
- source
- timestamp
- truth badge
- live/stale/degraded/failed state

Example:

```text
BKLN
Price: $20.54
Change: -0.31%
Source: Live quote feed
Age: 12s
Truth: RAW_MARKET
Status: LIVE
```

Example:

```text
JAAA income
30-day SEC yield: 4.80%
Source: Issuer
Observed: 2026-04-19
Truth: RAW_OFFICIAL
Status: VALID
```

---

## Data status rules

### LIVE

A number can be `LIVE` only if:

- feed responded successfully
- timestamp is inside the allowed freshness window
- value is numeric
- value is not zero unless zero is valid for that field
- ticker matches requested ticker
- no conflict is detected

### STALE

A number is `STALE` if:

- timestamp is older than freshness window
- data was reused from prior successful fetch
- connection failed but cached data exists

### DEGRADED

A number is `DEGRADED` if:

- secondary transport was used
- partial fields are missing
- source is reachable but incomplete
- issuer data is unavailable but operator data exists

### FAILED

A number is `FAILED` if:

- no live value exists
- no valid timestamp exists
- source failed
- ticker failed lookup
- value is malformed

### UNRESOLVED

A number is `UNRESOLVED` if:

- two sources conflict
- source class is unclear
- official data is unavailable
- value exists but cannot be defended

---

## Freshness windows

Default freshness rules:

- live quotes during market hours: max age 60 seconds
- live quotes outside market hours: must show after-hours or last close state
- issuer yield facts: max age 7 calendar days
- ex-date / pay-date: max age 7 calendar days
- user holdings: current until operator changes them
- derived math: invalid if any required input is stale or failed

---

## Minimal APIs only

Required APIs:

1. `GET /api/wave-i/health`
2. `GET /api/wave-i/live-quotes`
3. `GET /api/wave-i/income-facts`
4. `GET /api/wave-i/holdings`
5. `POST /api/wave-i/holdings`
6. `GET /api/wave-i/position-math`
7. `GET /api/wave-i/wallet-state`
8. `POST /api/wave-i/wallet-flow`

No other APIs are permitted in Wave-I unless they directly support live truth, holdings, income facts, or wallet movement.

---

## Wallet state endpoint

`GET /api/wave-i/wallet-state`

Response:

```ts
type WalletState = {
  container: "|W|" | "|M|" | "[B]" | "[G]";
  targetDollar: number | null;
  currentDollar: number;
  currentPct: number | null;
  targetPct: number | null;
  deltaDollar: number | null;
  deltaPct: number | null;
  status: "NORMAL" | "WATCH" | "BREACH" | "OVER_TARGET" | "UNDER_TARGET";
  truthClass: "TRANSFORMED";
  inputs: string[];
};
```

---

## Wallet flow endpoint

`POST /api/wave-i/wallet-flow`

Request:

```ts
type WalletFlowRequest = {
  source: "|W|" | "|M|" | "[B]" | "[G]";
  destination: "|W|" | "|M|" | "[B]" | "[G]";
  amount: number;
  reason:
    | "DIVIDEND_TO_MINT"
    | "EXCESS_TO_MINT"
    | "MINT_TO_GREEN_DIP"
    | "WHITE_TO_BLUE_STABILIZE"
    | "BLUE_REPAIR"
    | "OPERATOR_ADJUSTMENT";
  operatorConfirmed: boolean;
};
```

Response:

```ts
type WalletFlowResult = {
  allowed: boolean;
  blockedReason?: string;
  eventId?: string;
  sourceBalanceBefore: number;
  sourceBalanceAfter: number | null;
  destinationBalanceBefore: number;
  destinationBalanceAfter: number | null;
  ruleId: string;
  truthClass: "TRANSFORMED";
};
```

Rules:

- no wallet move without an event
- no negative balance
- no silent Mint bypass
- no Purple / Yellow / Silver destination
- no simulated move marked real

---

## Quarantine rules

The following must be quarantined and removed from Wave-I runtime:

- anomaly event classification
- forward-path testing
- reaction testing
- ITB probes
- Purple slots
- Yellow weighting
- Silver asymmetry
- options payoff modeling
- prop challenge simulation
- Monte Carlo pass probability
- macro regime engine
- cross-asset signal engine
- any endpoint that predicts future price behavior

Quarantined code may remain in repo only if:

- it is not imported by Wave-I runtime
- it is clearly marked Wave-II
- it cannot affect Wave-I calculations
- it is excluded from investor demo surface

---

## Investor-spec acceptance criteria

Wave-I backend is investor-ready only when:

1. every visible number has a truth badge
2. every live quote has age, source, and status
3. every stale value is visibly stale
4. every failed connection is visibly failed
5. every percentage is calculated from visible inputs
6. no cached value is shown as live
7. no simulated value is shown as real
8. no quarantined value drives action
9. holdings are stored as operator truth
10. issuer facts are stored as official truth only when directly sourced
11. wallet movements require events
12. wallet balances cannot mutate silently
13. Wave-I runtime contains only `|W|`, `|M|`, `[B]`, `[G]`
14. all Purple / Yellow / Silver material is dormant or removed
15. the War Room can defend every number in one click

---

## Final rule

Wave-I does not need a big backend.

Wave-I needs a live truth backend.

If a backend feature does not make a number more live, more truthful, more defensible, or more inspectable, it does not belong in Wave-I.

---

## Code-level correction

Current Wave-I code already has the problem this spec fixes: `market.ts` can reuse local cache and use a quarantined proxy path, while the War Room displays “best available snapshot” language. That is acceptable for development, but not for investor spec. It must separate live, stale, degraded, and failed instead of letting “best available” feel like truth.

The existing truth model already supports the correct answer: every datum must carry truth class, source, timestamp, stale/degraded/conflicted flags, and derived input references.

The active scope override also supports the quarantine rule: Wave-I runtime is only `|M|`, `|W|`, `[B]`, and `[G]`; `[S]`, `|Y|`, and `|P|` are dormant unless explicitly promoted later.

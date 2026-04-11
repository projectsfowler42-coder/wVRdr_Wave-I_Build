# B.4-A Acceptance Gates

## Architecture is not complete until every gate is green.

## Gate 1 — Contract freeze
- every chassis module has a written contract
- allowed states are explicit
- error states are explicit
- compatibility policy is explicit

## Gate 2 — Storage custody
- raw evidence store is append-only
- normalized store is versioned
- provenance ledger is append-only
- release metadata is separated from record stores

## Gate 3 — Provenance completeness
- every visible record resolves to source class
- adapter version is visible
- schema version is visible
- release version is visible

## Gate 4 — Fault isolation
- one broken source cannot poison another
- one broken adapter cannot poison another
- one broken feature module does not collapse the shell

## Gate 5 — Quarantine
- malformed record path exists
- incompatible module path exists
- quarantine evidence is preserved
- no silent reentry

## Gate 6 — Hot-swap
- adapter swap works by pointer
- schema map switch works explicitly
- inspection module can be replaced independently

## Gate 7 — Ghost Image
- every stable release generates Ghost Image metadata
- Ghost Image has integrity hash
- rollback target resolves
- restore manifest resolves

## Gate 8 — Inspection
- module registry view exists
- source registry view exists
- trace view exists
- quarantine view exists
- release and Ghost Image view exists

## Gate 9 — Investor proof
Wave-I must be able to demonstrate:
1. module isolation
2. provenance
3. quarantine
4. Ghost Image recovery
5. rollback readiness

## Pass / fail standard

If any gate is red, B.4-A is incomplete and B.4-B must not begin.

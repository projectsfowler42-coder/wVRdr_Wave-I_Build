# B.4-A Failure Doctrine

## Primary principle

Wave-I must fail in compartments, not as a fog.

## 1. Fail closed
If a contract breaks, stop propagation.
Do not guess.
Do not auto-heal silently.

## 2. Preserve evidence
Raw evidence survives transform failure, schema mismatch, and render failure.

## 3. Contain locally
One broken source, adapter, schema path, or feature module must not poison unrelated modules.

## 4. Quarantine explicitly
Bad material is marked and isolated with evidence.
No silent cleanup.

## 5. Separate data truth from render truth
A UI render issue does not rewrite data truth.
A bad release does not rewrite evidence custody.

## 6. No hidden authority
Weak reference material must remain weak.
User assertions must remain user assertions.
Derived structural records must remain derived.

## 7. No cross-module direct mutation
Modules may communicate only through contracts, stores, and audited transitions.

## 8. Rollback is not archaeology
Rollback is a pointer move to a prior stable Ghost Image.
Manual reconstruction is failure.

## Failure handling flow

1. detect
2. flag
3. preserve evidence
4. stop propagation
5. quarantine if needed
6. surface inspection state
7. swap or roll back
8. reintegrate only by explicit action

## Minimum hard tests

- dirty source cannot poison unrelated modules
- raw survives transform failure
- malformed records are flagged, not silently corrected
- schema mismatches surface immediately
- quarantined modules stop propagating
- Ghost Image rollback resolves without manual surgery

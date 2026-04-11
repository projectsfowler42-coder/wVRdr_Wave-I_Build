# B.4-A State Enums

## 1. Source class
- harvested
- imported_file
- manual_entry
- local_snapshot
- weak_reference

## 2. Truth class
- authoritative
- derived_structural
- weak_reference
- user_asserted
- quarantined

## 3. Module state
- booting
- ready
- healthy
- degraded
- stale
- malformed
- incompatible
- disabled
- quarantined
- failed
- retired

## 4. Release state
- candidate
- stable
- active
- hotfix
- retired
- rolled_back

## 5. Ghost Image state
- created
- hash_verified
- restore_verified
- stable
- retired

## 6. Record state
- valid
- partial
- malformed
- quarantined

## 7. Quarantine state
- open
- reviewed
- remapped
- released
- retired

## 8. Swap state
- idle
- validating
- swapping
- blocked
- rolled_back

## 9. Inspection state
- ready
- degraded
- failed

## 10. Mandatory reason code families

### source reason codes
- source_unavailable
- source_disabled
- source_payload_unsupported

### adapter reason codes
- parse_failed
- integrity_failed
- adapter_timeout
- adapter_incompatible

### schema reason codes
- schema_missing
- schema_incompatible
- field_missing
- unit_violation

### record reason codes
- record_malformed
- record_partial
- record_hash_mismatch

### release reason codes
- manifest_missing
- ghost_image_missing
- restore_verification_failed
- rollback_target_invalid

### quarantine reason codes
- evidence_required
- authority_conflict
- incompatible_transform
- explicit_operator_hold

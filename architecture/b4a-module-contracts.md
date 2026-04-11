# B.4-A Module Contracts

## Contract law

Every module must define:

- `module_name`
- `module_version`
- `contract_version`
- `purpose`
- `inputs`
- `outputs`
- `allowed_states`
- `error_states`
- `compatibility_policy`
- `rollback_behavior`

No module may depend on:

- hidden globals
- private cross-module mutation
- silent coercion
- silent field dropping
- unversioned state

---

## M1 — Shell Runtime
**Purpose**: boot the app and mount modules through explicit seams.

**Inputs**
- release manifest
- active module pointers
- route registry

**Outputs**
- mounted shell
- lifecycle events
- visible release identity

**Allowed states**
- booting
- ready
- degraded
- failed

**Error states**
- manifest_missing
- module_mount_failed
- route_registry_invalid

**Rollback behavior**
- revert to last-known-good release manifest

---

## M2 — Release Registry
**Purpose**: track current, prior, and stable Wave-I releases.

**Inputs**
- release manifest
- promotion events
- rollback events

**Outputs**
- current release pointer
- last_known_good pointer
- rollback target pointer

**Allowed states**
- candidate
- stable
- active
- retired
- rolled_back

**Error states**
- release_not_found
- ghost_image_missing
- rollback_target_invalid

**Rollback behavior**
- pointer switch to valid prior stable release

---

## M3 — Ghost Image Archive
**Purpose**: store immutable recovery packages for stable releases.

**Inputs**
- release manifest
- artifact fingerprint
- contract map
- schema map
- integrity hash
- restore manifest

**Outputs**
- ghost_image record
- restore_verification result

**Allowed states**
- created
- hash_verified
- restore_verified
- stable
- retired

**Error states**
- archive_incomplete
- hash_mismatch
- restore_verification_failed

**Rollback behavior**
- rehydrate via Ghost Image manifest and active pointer change

---

## M4 — Source Registry
**Purpose**: define accepted source classes and source authority.

**Inputs**
- source definitions
- enable/disable actions

**Outputs**
- source registry entries
- source capability map

**Allowed states**
- active
- disabled
- deprecated

**Error states**
- duplicate_source_id
- unsupported_source_class
- invalid_authority_class

**Rollback behavior**
- disable or revert source definition without touching unrelated sources

---

## M5 — Adapter Layer
**Purpose**: convert source inputs into raw evidence envelopes.

**Inputs**
- source payload
- source registry entry
- adapter config

**Outputs**
- raw evidence envelope
- adapter fault event

**Allowed states**
- ready
- healthy
- degraded
- stale
- quarantined
- disabled

**Error states**
- parse_failed
- integrity_failed
- source_unavailable
- schema_hint_missing

**Rollback behavior**
- revert active adapter pointer to prior compatible adapter

---

## M6 — Schema Registry
**Purpose**: store accepted input and normalized schemas.

**Outputs**
- schema subject/version entries
- compatibility verdicts

**Allowed states**
- active
- deprecated
- incompatible

**Error states**
- schema_missing
- schema_incompatible
- field_missing
- unit_violation

---

## M7 — Raw Evidence Store
**Purpose**: preserve exact source payloads before transformation.

**Outputs**
- immutable raw evidence entries

**Allowed states**
- writable
- read_only
- degraded
- failed

**Error states**
- write_failed
- hash_mismatch
- payload_ref_missing

**Rollback behavior**
- preserve only, never rewrite history

---

## M8 — Normalized Store
**Purpose**: hold typed records safe for rendering.

**Allowed states**
- writable
- degraded
- failed

**Error states**
- schema_version_missing
- normalization_failed
- record_hash_mismatch

---

## M9 — Provenance Ledger
**Purpose**: attach lineage to records and critical state transitions.

**Rollback behavior**
- preserve only, never rewrite history

---

## M10 — Fault Bus
**Purpose**: declare module and record condition.

**Allowed states**
- healthy
- degraded
- stale
- malformed
- incompatible
- disabled
- quarantined
- failed

---

## M11 — Quarantine Vault
**Purpose**: isolate bad records, bad modules, and bad release material with evidence.

**Allowed states**
- open
- reviewed
- remapped
- released
- retired

---

## M12 — Swap Controller
**Purpose**: perform controlled activation, deactivation, replacement, rollback, and reintegration.

**Allowed states**
- idle
- validating
- swapping
- blocked
- rolled_back

---

## M13 — Inspection Surface
**Purpose**: expose source, adapter, schema, trace, quarantine, release, and Ghost Image state for operators and investors.

**Error states**
- trace_unresolved
- registry_unavailable
- inspection_degraded

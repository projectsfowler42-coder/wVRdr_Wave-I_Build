# B.4-A Storage Architecture

## Storage law

Wave-I is frontend-only, but storage must still enforce:

- append-only evidence where required
- versioned structural records
- explicit provenance
- fault-state persistence
- release/rollback metadata
- no silent overwrite of evidence

## Store set

### 1. release_metadata_store
**Purpose**
- release registry
- current release pointer
- last-known-good pointer
- rollback target pointer
- Ghost Image refs

**Mutable**
- active pointer fields only

**Immutable**
- historical release entries

---

### 2. raw_evidence_store
**Purpose**
- append-only custody of exact source envelopes

**Required fields**
- raw_record_id
- source_id
- source_class
- adapter_id
- adapter_version
- payload_hash
- content_type
- source_event_at
- received_at
- truth_class
- payload_ref

**Mutation**
- append-only

---

### 3. normalized_record_store
**Purpose**
- typed records for safe rendering

**Required fields**
- normalized_record_id
- raw_record_id
- schema_subject
- schema_version
- normalized_at
- record_hash
- record_state
- normalized_payload

**Mutation**
- append-only or versioned append
- no destructive overwrite

---

### 4. provenance_ledger_store
**Purpose**
- lineage events and traceability

**Required fields**
- provenance_event_id
- entity_type
- entity_id
- parent_entity_id
- source_id
- adapter_id
- adapter_version
- schema_subject
- schema_version
- release_id
- event_at
- hash_ref

**Mutation**
- append-only

---

### 5. fault_quarantine_store
**Purpose**
- module fault events
- record fault events
- quarantine records

**Required fields**
- fault_event_id
- entity_type
- entity_id
- module_id
- module_version
- state
- reason_code
- observed_at
- evidence_ref

**Mutation**
- append-only evidence + mutable current status fields

---

### 6. manifest_store
**Purpose**
- current manifest
- contract version map
- schema version map
- restore manifest

**Mutation**
- replace-on-release only
- historical manifest snapshots preserved via Ghost Image

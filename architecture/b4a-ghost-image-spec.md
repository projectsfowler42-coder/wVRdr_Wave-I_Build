# B.4-A Ghost Image Specification

## Definition

A Ghost Image is the immutable recovery package for a stable Wave-I release.

A release is not stable unless its Ghost Image exists and can be resolved.

## Required contents

- `ghost_image_id`
- `release_id`
- `build_id`
- `patch_id`
- `artifact_fingerprint`
- `dependency_lock_fingerprint`
- `module_pointer_map`
- `contract_version_map`
- `schema_version_map`
- `config_fingerprint`
- `integrity_hash`
- `restore_manifest`
- `previous_stable_release_id`
- `created_at`

## Required states

- created
- hash_verified
- restore_verified
- stable
- retired

## Promotion gate

A release may become `stable` only if:

1. artifact fingerprint exists
2. manifest exists
3. module pointer map exists
4. contract version map exists
5. schema version map exists
6. integrity hash verifies
7. restore manifest resolves
8. rollback target resolves

## Restore contract

A restore-capable Ghost Image must define:

- release identity
- active module set
- contract versions
- schema versions
- storage compatibility statement
- rollback predecessor

## Non-negotiables

- Ghost Images are immutable
- one stable release = one Ghost Image
- Ghost Images are never silently replaced
- restore verification failure blocks stable promotion

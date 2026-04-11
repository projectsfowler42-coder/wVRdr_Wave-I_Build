# B.4-A Hot-Swap Matrix

## Swap law

A swap is valid only if:

- candidate implements a compatible contract
- activation is pointer-driven
- unrelated modules do not require edits
- provenance continuity survives
- evidence stores remain untouched
- rollback target already exists

## Matrix

| Module | Hot-swappable | Method | Must remain untouched |
|---|---:|---|---|
| Shell Runtime | Yes | release/module pointer | raw evidence, provenance history |
| Release Registry active pointer | Yes | pointer switch | historical release records |
| Ghost Image active target | Yes | rollback pointer | archived Ghost Images |
| Source Registry entry | Yes | enable/disable or versioned definition | unrelated sources |
| Adapter | Yes | adapter pointer by source family | other adapters, raw history |
| Schema Registry active version map | Yes | explicit version map switch | prior schema records |
| Raw Evidence Store | No | preserve only | everything |
| Normalized Store writer/version | Yes | writer pointer/version change | raw history |
| Provenance Ledger | No | preserve only | everything |
| Fault Bus | Yes | versioned module replacement | stored fault history |
| Quarantine Vault UI/review workflow | Yes | module replacement | quarantine evidence history |
| Inspection Surface | Yes | module replacement | core custody layers |

## Reintegration law

A quarantined module or record stream may reenter only if:

1. cause is identified
2. contract compatibility is re-established
3. operator release action is explicit
4. provenance continuity is preserved
5. audit trail is appended

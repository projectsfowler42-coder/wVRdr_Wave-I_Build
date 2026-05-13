# Security Policy

## Core Rule

GitHub stores the chassis.  
Encrypted/local vault stores the brain.  
Secrets live in a password manager, local `.env`, or GitHub Actions encrypted secrets only when CI/CD needs them.

## Never Commit

- `.env` files
- API keys
- broker credentials
- account numbers
- raw financial exports
- private strategy doctrine
- Mouseion/MSP raw dumps
- private prompts
- ZIP/DOC/PDF/XLS/XLSX data bundles

## If a Secret Was Committed

1. Rotate the secret immediately.
2. Remove it from current files.
3. Remove it from Git history with a proper history-cleaning tool.
4. Force-push only after review.
5. Treat exposed broker/API credentials as compromised.

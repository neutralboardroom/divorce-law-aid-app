# Divorce Law Aid deployment carrier

This repository deploys the exact sealed `divorce-law-aid-v0.90.0.zip` artifact only after fail-closed identity, exact-artifact, V40, provider-equivalent, syntax, secret-scan, and vulnerability gates pass.

Canonical domain: `divorcelawaid.com`

Because GitHub's browser uploader rejects the complete 46.8 MB ZIP, the exact artifact is transported as six browser-uploadable binary parts:

- `divorce-law-aid-v0.90.0.zip.smallpart01`
- `divorce-law-aid-v0.90.0.zip.smallpart02`
- `divorce-law-aid-v0.90.0.zip.smallpart03`
- `divorce-law-aid-v0.90.0.zip.smallpart04`
- `divorce-law-aid-v0.90.0.zip.smallpart05`
- `divorce-law-aid-v0.90.0.zip.smallpart06`

The bootstrap verifies every part's exact size and SHA-256, concatenates them byte-for-byte, verifies the reconstructed 46,761,324-byte ZIP against SHA-256 `35d00e17ea59ad5054b7c60a6cc583139996c653d441c323830bed809d430973`, and only then extracts and qualifies the product.

The sealed product source remains unchanged. Deployment-only controls are maintained at the repository root. The previous v0.87 split carrier remains present as a rollback predecessor but is not used by the v0.90 bootstrap.

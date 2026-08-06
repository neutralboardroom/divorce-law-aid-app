# Divorce Law Aid deployment carrier

This branch deploys the exact sealed `divorce-law-aid-v0.87.0.zip` artifact only after fail-closed identity, exact-artifact, provider-equivalent, syntax, secret-scan, and vulnerability gates pass.

Canonical domain: `divorcelawaid.com`

Because GitHub's browser uploader rejects the 41.8 MB ZIP, the exact artifact is transported as two browser-uploadable binary parts:

- `divorce-law-aid-v0.87.0.zip.part01`
- `divorce-law-aid-v0.87.0.zip.part02`

The bootstrap verifies each part's exact size and SHA-256, concatenates them byte-for-byte, verifies the reconstructed ZIP against SHA-256 `26336408cb5a3d3fd85cae7f5fb8df60aca02e68ad8e73caac52ea68bbe705a1`, and only then extracts and qualifies the product.

The sealed product source remains unchanged. Deployment-only controls are maintained at the repository root under the V40 provider-equivalent preflight and owner-action standard.
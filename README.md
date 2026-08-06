# Divorce Law Aid deployment carrier

This branch deploys the exact sealed `divorce-law-aid-v0.87.0.zip` artifact only after fail-closed identity, exact-artifact, deterministic-build, application-audit, local-server, syntax, secret-scan, and vulnerability gates pass.

Canonical domain: `divorcelawaid.com`

The sealed product source remains unchanged. Deployment-only controls are maintained at the repository root under the V40 provider-equivalent preflight and owner-action standard.

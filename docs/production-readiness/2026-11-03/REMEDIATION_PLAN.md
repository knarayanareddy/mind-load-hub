# mind-load-hub remediation plan

Proposed only; no tests or deployments were run. Owner approval is required for employee telemetry, consent, retention, interventions and credentials.

## Phases and dependency map

| Phase | Entry | Exit |
|---|---|---|
| Baseline | Synthetic workspace and pinned source | ML-T1 reproduces bot delivery and time windows |
| Correctness | ML-T1 | ML-T2 establishes reliable, correctly scoped counts |
| Security and privacy | ML-T1 and owner data decision | ML-T3 verifies isolation and consent |
| Automation and UX | ML-T2 and ML-T3 | ML-T4 proves behavior and honest presentation |
| Recovery and independent acceptance | ML-T4 | ML-T5 observes restore and domain sign-off |

### ML-T1 — Reproduce data semantics (ML-1–ML-3)
Prerequisite: isolated synthetic Slack events and fake ingest; observed `slack-bot/app.py`.
1. Record event timestamps, flush cadence and intended definition of each metric.
2. Simulate missing email, failing HTTP responses and restart after aggregation clears.
3. Compare interval counts and after-hours classification against independently calculated daily/timezone fixtures.
Deliverable: reproducible examples and agreed metric contract. Verification: a second reviewer repeats the tests without production data.
- [ ] Loss and mislabelled window are demonstrated or bounded.
- [ ] Owner approves metric definitions and timezone handling.

### ML-T2 — Reliable, idempotent ingest (ML-1–ML-3)
Prerequisite: ML-T1; observed bot and `src/lib/ingest.server.ts`.
1. Define stable batch IDs, event deduplication, per-user day boundaries and workspace/user mapping.
2. Persist pending aggregates before acknowledgement; retry with bounded backoff and a dead-letter path without logging private payloads.
3. Make receiver writes idempotent and retain data until acknowledgement; classify local times with explicit timezone and daylight-saving transitions.
Deliverable: durable delivery and versioned metric contract. Verification: force crash before/after acknowledgement, replay a batch, vary timezone and cross midnight; compare totals with an independently calculated event ledger.
- [ ] No acknowledged test batch is lost or double-counted.
- [ ] Daily values and after-hours classification match fixtures.

### ML-T3 — Consent, authorization and secret boundaries (ML-5)
Prerequisites: ML-T1, privacy owner; observed profile/ingest and authenticated route.
1. Trace every service-role caller and database policy, including workspace membership, individual consent and administrative operations.
2. Test two tenants and revoked consent at API and database boundaries; enforce server-side access and minimal telemetry retention.
3. Review ingest secret handling, URL binding, key rotation, logs and dependency provenance; document deletion and export paths.
Deliverable: threat model, privacy decision and authorization tests. Verification: wrong-tenant, revoked-consent, forged bearer and malformed payload requests must fail without leaking user data.
- [ ] Tenant isolation and consent revocation are observed against real policies.
- [ ] Secrets and sensitive telemetry are absent from test logs and bundles.

### ML-T4 — Behavior gates and responsible UX (ML-4)
Prerequisite: ML-T2 and ML-T3; observed workflow, package manifest and UI.
1. Pin the approved toolchain and define a proposed bot test command; add bot and scoring integration tests alongside the existing web build.
2. Add user-facing missing-data, uncertainty, consent withdrawal and failed-delivery states; validate keyboard and screen-reader behavior.
3. Have an appropriate domain expert validate score interpretation and remove unsupported prevention claims until evidence supports them.
Deliverable: CI behavior gates and a reviewed product vocabulary. Verification: deliberately break deduplication, timezone handling and tenant checks separately and confirm relevant tests fail; observe UX with synthetic users.
- [ ] Tests detect intentional faults, not only mirrored implementation values.
- [ ] Domain and accessibility reviews have explicit observations.

### ML-T5 — Operations and independent acceptance (preventive)
Prerequisite: ML-T4 and approved deployment; observed bot and server.
1. Define alerts for lag, dead-letter backlog and unavailable upstream systems without exposing employee content.
2. Back up an approved synthetic dataset, restore in isolation and verify data, consent state and replay boundaries.
3. Independently review release, rollback and incident procedures with privacy and operational owners.
Deliverable: monitored release and restore drill. Verification: observe an outage/recovery scenario and prove that restoring does not replay delivered batches twice.
- [ ] Restore and replay behavior are observed.
- [ ] Owner approves credentials, consent, release and retention.

## Production acceptance and rollback

- [ ] Measured domain validity, tenant isolation, privacy review, accessibility and recovery evidence are available.
- [ ] Stop ingestion, retain the durable queue, roll back to the last verified version and reconcile batches before restarting. Do not delete employee data or lower gates to unblock release.

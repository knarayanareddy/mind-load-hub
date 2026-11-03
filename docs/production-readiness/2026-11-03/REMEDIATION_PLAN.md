# mind-load-hub remediation plan

Proposed only; no tests, deployments, restores or provider calls were run. Owner approval remains required for employee telemetry, consent, retention, interventions, release authority and credentials.

## Phased roadmap with entry and exit criteria

| Phase | Entry | Exit |
|---|---|---|
| Baseline and reproduction | Pinned SHA evidence and synthetic workspace/event fixtures available | ML-T1 reproduces flush-loss, interval naming and timezone semantics with agreed metric definitions |
| Correctness and data integrity | ML-T1 complete | ML-T2 proves durable, idempotent ingest and explicit day/window handling |
| Security and privacy boundaries | ML-T1 complete and privacy owner engaged | ML-T3 verifies consent, tenant isolation, token scope and retention boundaries |
| Automation and responsible UX | ML-T2 and ML-T3 complete | ML-T4 adds fault-detecting gates and honest user-facing consent/uncertainty states |
| Recovery and independent acceptance | ML-T4 complete and approved deployment target selected | ML-T5 observes restore/replay behavior and completes release-readiness sign-off |

## Task dependency map

| Task | Depends on | Unlocks |
|---|---|---|
| ML-T1 | none | ML-T2, ML-T3 |
| ML-T2 | ML-T1 | ML-T4, ML-T5 |
| ML-T3 | ML-T1, owner privacy decision | ML-T4, ML-T5 |
| ML-T4 | ML-T2, ML-T3 | ML-T5 |
| ML-T5 | ML-T2, ML-T3, ML-T4, approved deployment target | production acceptance |

### ML-T1 — Reproduce data semantics (ML-1–ML-3)
Prerequisite: isolated synthetic Slack events and fake ingest endpoint.
Paths: inspected `slack-bot/app.py`; proposed `slack-bot/tests/test_flush_semantics.py`.
1. Record the intended meaning of each outgoing field in `slack-bot/app.py`, including flush cadence, per-user day boundary and after-hours definition.
2. Reproduce missing-email, failing-HTTP and restart-after-clear cases against synthetic events so the team can observe whether batches are dropped after `aggregates.clear()`.
3. Compare emitted interval counts and after-hours flags with independently calculated fixtures across normal hours, after-hours and midnight boundaries.
Deliverable: reproducible failure notes plus a written metric contract for `messages_today`, `messages_after_hours` and response-latency semantics.
Verification: a second reviewer reruns the same synthetic scenarios without production data and confirms the written contract matches observed outputs.
- [ ] Loss after clear is either demonstrated or disproved with recorded evidence.
- [ ] The owner-approved metric contract distinguishes interval counts from day-bounded totals.
- [ ] Timezone and day-boundary assumptions are explicit.

### ML-T2 — Reliable, idempotent ingest (ML-1–ML-3)
Prerequisite: ML-T1.
Paths: inspected `slack-bot/app.py`; inspected `src/lib/ingest.server.ts`; proposed `src/lib/ingest-outbox.server.ts`.
1. Introduce stable batch identifiers, explicit source timestamps and a durable pending-state/outbox design so bot-side data is not acknowledged solely by clearing memory.
2. Make receiver writes idempotent across retries and restarts, and store enough source/window metadata to distinguish interval input from daily rollups.
3. Recompute after-hours and day-bounded metrics with explicit workspace or user timezone rules, including daylight-saving and midnight transitions.
Deliverable: durable delivery design and implementation notes for ingest semantics, idempotency and timezone handling.
Verification: force crash before and after send acknowledgement, replay a prior batch, and vary timezone/midnight fixtures; totals must match an independent event ledger with no drops or double counts.
- [ ] No acknowledged synthetic batch is lost.
- [ ] Replayed synthetic batches are not double-counted.
- [ ] Daily and after-hours values match independently calculated fixtures.

### ML-T3 — Consent, authorization and secret boundaries (ML-5)
Prerequisites: ML-T1 and owner privacy decision.
Paths: inspected `src/lib/profile.server.ts`; inspected `src/lib/ingest.server.ts`; inspected `src/routes/_authenticated.tsx`; tree-only `supabase/migrations/20260526080000_add_workspace_tokens.sql`.
1. Trace every service-role caller, token type and workspace-binding path, including any migration-backed token schema and every server entrypoint that can read or mutate profile-linked telemetry.
2. Verify consent transitions, workspace membership checks and tenant isolation at both API and database-policy layers, including revoked-consent and wrong-tenant scenarios.
3. Review ingest secret storage, rotation, logging and retention boundaries, and document delete/export procedures for telemetry and inferred wellbeing data.
Deliverable: threat model, authorization matrix, consent decision record and negative-test plan.
Verification: wrong-tenant, revoked-consent, forged-bearer and malformed-payload requests must fail without leaking user data; observed database-policy results must match the written access matrix.
- [ ] Tenant isolation is observed rather than assumed.
- [ ] Consent revocation behavior is observed for ingest and read paths.
- [ ] Secrets and sensitive telemetry are absent from test logs and published bundles.

### ML-T4 — Behavior gates and responsible UX (ML-4, preventive support for ML-5)
Prerequisites: ML-T2 and ML-T3.
Paths: inspected `.github/workflows/ci.yml`; inspected `package.json`; inspected `src/routes/index.tsx`; tree-only `src/components/privacy-compliance-panel.tsx`; tree-only `src/routes/_authenticated/settings.tsx`; proposed `.github/workflows/behavior.yml`.
1. Pin the approved toolchain versions and add explicit behavior gates for Slack ingest, scoring windows, timezone handling and authorization regressions rather than relying on `bun run build` alone.
2. Add user-facing states for missing data, uncertainty, consent withdrawal and failed or paused interventions in the existing settings/privacy surfaces or equivalent approved replacements.
3. Remove or qualify unsupported prevention/intervention language until a qualified domain owner signs off on evidence for those claims.
Deliverable: fault-detecting CI plan plus reviewed UX copy/state requirements for consent and uncertainty.
Verification: deliberately break deduplication, timezone handling and tenant checks in isolated branches or fixtures and confirm the intended tests fail; accessibility review must record actual keyboard and screen-reader observations.
- [ ] Tests fail on intentional faults, not only mirror implementation output.
- [ ] User-facing copy distinguishes measured telemetry from inferred risk and unsupported wellbeing claims.
- [ ] Accessibility and consent-state observations are recorded.

### ML-T5 — Operations, release readiness and independent acceptance (preventive)
Prerequisites: ML-T2, ML-T3, ML-T4 and approved deployment target.
Paths: inspected `src/server.ts`; tree-only `wrangler.jsonc`; tree-only `supabase/config.toml`; proposed `docs/runbooks/release-and-rollback.md`.
1. Define alerts for ingest lag, dead-letter backlog, unavailable upstream systems and replay anomalies without exposing employee content.
2. Back up an approved synthetic dataset, restore it in isolation, and verify data, consent state and replay boundaries after restore.
3. Run an independent release-readiness review covering deployment ownership, rollback authority, incident communication and post-release reconciliation of queued batches.
Deliverable: monitored release checklist, restore drill record and signed independent acceptance notes.
Verification: observe at least one outage/recovery exercise and one restore drill; restoring must not replay already delivered batches twice or widen access beyond the approved tenant boundary.
- [ ] Restore behavior is observed on synthetic data.
- [ ] Replay reconciliation is observed, not presumed.
- [ ] Release authority and incident ownership are documented.

## Production acceptance checklist

- [ ] Metric/window definitions for Slack-derived fields are approved and implemented.
- [ ] Durable ingest, idempotency and timezone handling are verified with fault injection.
- [ ] Tenant isolation, consent revocation, retention and secret handling are verified with negative tests.
- [ ] Supported product language replaces unsupported burnout-prevention or clinical-sounding claims where evidence is absent.
- [ ] Accessibility observations, restore drill evidence and outage/recovery evidence are recorded.

## Changes requiring owner approval

- Any collection or use of employee telemetry or inferred wellbeing/load data.
- Whether managers can view individual-level versus aggregate signals.
- Consent model, revocation flow, retention period, deletion/export workflow and legal/privacy notices.
- Any automated intervention that changes Slack status, calendar state or team workflow.
- Deployment target, credentials, release authority, incident owner and synthetic-data policy for restore drills.

## Release policy

Do not ship from this plan alone. Release only after ML-T1 through ML-T5 are complete, owner-approval items are signed off, negative tests demonstrate failures on intentional regressions, and the deployment target plus credential ownership are documented. Future command examples or pipeline changes must be planned in the repo and then observed in a separate implementation/review cycle; they are not presumed from this static plan.

## Rollback policy

If production behavior diverges from verified expectations, stop new ingest first, preserve the durable queue and diagnostic metadata, roll back to the last independently verified release, and reconcile queued versus delivered batches before resuming delivery. Do not delete employee data, suppress privacy controls or lower behavior gates to unblock release.

# mind-load-hub review

## Scope and verdict

Static prototype review at `0a55c55af026c9d9496b068805720b17a6bb16c1`; runtime, installs and tests **not run**. The [README:1-3](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/README.md#L1-L3) describes a cognitive-load tracker and burnout-prevention platform; those health-related claims and intervention efficacy are not established by the sample. The Slack bot can lose data on delivery failure and does not calculate daily counts as its field name implies.

## Architecture and boundary

The sampled system comprises a TanStack web interface, Supabase integration and Python Slack Socket Mode bot; the README also describes other integrations, whose live implementation was not traced. The bot aggregates Slack events and posts them to an ingest URL ([app.py:1-6](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/slack-bot/app.py#L1-L6)); an authenticated route checks a Supabase user ([route:7-10](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/src/routes/_authenticated.tsx#L7-L10)). Route gating does not establish server-side tenant authorization.

## Findings ledger

- **ML-1 — High, confirmed static:** [slack-bot/app.py:104-114,129-141](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/slack-bot/app.py#L104-L141) clears aggregates before email lookup and HTTP delivery. Missing email, HTTP error, exception or process crash loses that batch; no requeue is shown. Use a durable, idempotent outbox with bounded retry and explicit loss monitoring.
- **ML-2 — High, confirmed static:** [app.py:34,82-86,104-125](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/slack-bot/app.py#L34-L34) collects only since the last flush, default 300 seconds, but sends `messages_today`. This is an interval count labeled as daily; if consumed literally it can distort downstream scores. Specify window/timezone, aggregate to the intended interval and verify end-to-end.
- **ML-3 — Medium, confirmed static:** [app.py:53-55](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/slack-bot/app.py#L53-L55) uses the host timezone for after-hours classification, rather than a user's explicitly selected timezone. Distributed or daylight-saving users may be misclassified. Define timezone and overnight boundaries per user.
- **ML-4 — Medium, confirmed static:** [CI:9-18](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/.github/workflows/ci.yml#L9-L18) uses latest Bun and builds the web app only; it does not test the Python bot or scoring behavior. [Run 36902623587](https://github.com/knarayanareddy/mind-load-hub/actions/runs/36902623587) succeeded at this SHA, but does not prove bot correctness.
- **ML-5 — High, unverified risk / owner decision:** [profile.server.ts:14-17](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/src/lib/profile.server.ts#L14-L17) says a service-role client bypasses RLS. This is not itself a vulnerability, but every caller and tenant predicate must be independently verified before employee telemetry is used. Approve consent, access and retention boundaries with privacy and clinical/domain owners.

## Five-discipline assessment

**Code:** lost intervals and ambiguous counting undermine score reliability. **Automation:** the sampled build is not a behavioral or Python gate. **Operations:** Slack/API downtime, replay, workspace mapping and recovery require evidence. **OWASP:** examine authentication and authorization for all server functions and ingest, input validation/injection, secret binding/rotation and rate limits; wildcard CORS alone is not proof of bypass. Treat telemetry and inferred health data as sensitive; logs at [app.py:136-141](https://github.com/knarayanareddy/mind-load-hub/blob/0a55c55af026c9d9496b068805720b17a6bb16c1/slack-bot/app.py#L136-L141) include user email and response details. Python dependencies are ranges and CI's Bun is floating. **UI/UX:** score and intervention screens are user-facing; consent, uncertainty, accessibility and no-data states need real user testing, not assumed efficacy.

## Blockers and owner questions

Who is the controller, who can see an individual's data, and can managers infer protected health status? Are collection and intervention consent revocable? Define validation of the score, intended use, privacy impact, approved integrations and actual deployment before use on employees. Do not claim medical benefit or production readiness from source alone.

## Evidence and limitations

Snapshot samples: README 1-140; package manifest 1-89; bot requirements 1-3 and app 1-151; CI 1-18; server 1-80; app-shell 1-111; ingest 1-220/337; profile 1-72; authenticated route 1-18; index 1-181; Lovable integration 1-38. No database policies, live Slack, user consent, browser or cross-tenant behavior verified. See [plan](REMEDIATION_PLAN.md).

# Saarthi AI Incident Response Playbook

## Severity levels

- **SEV-1**: complete outage, data-loss risk, auth failure for most users.
- **SEV-2**: major degradation (high error-rate, critical flow broken).
- **SEV-3**: partial degradation with workaround available.

## Response workflow

1. **Acknowledge** alert within 5 minutes.
2. **Assign incident commander** and scribe.
3. **Stabilize service** (rate-limit, feature-flag disable, rollback).
4. **Communicate** status updates every 15 minutes for SEV-1/2.
5. **Recover** and verify with smoke tests.
6. **Postmortem** within 48 hours.

## Alert sources

- Application error monitoring (Sentry-ready integration points).
- Prometheus/Grafana metrics:
  - request latency
  - error rate
  - CPU/memory saturation
  - NeuroRevise daily reviews and retention average
  - SyllabusFlow practice generation and dedup hit-rate
- Uptime checks (external synthetic checks).

## Containment actions

- Disable high-cost endpoints (PDF processing, bulk revision jobs) via flags.
- Scale API replicas and Redis cache tiers.
- Switch read-heavy analytics endpoints to cached mode.

## Security incidents

- Revoke compromised credentials/tokens immediately.
- Rotate JWT secrets and service keys.
- Force logout across sessions when required.
- Preserve audit logs for forensics and compliance.

## Recovery validation checklist

- Authentication and authorization flows pass.
- MCQ generate/take/submit path is healthy.
- Revision due-cards + review updates are healthy.
- SyllabusFlow gating and non-repetition behavior is healthy.
- Storage upload/download checks pass.

# Saarthi AI Deployment Runbook

## Environments

- **Staging**: deployed on `main` branch push (post-merge validation).
- **Production**: deployed on version tags (`v*`).
- **Core managed services**:
  - PostgreSQL (with pgvector extension in managed DB)
  - MongoDB Atlas (dedicated cluster)
  - Redis (managed)
  - Object storage (S3/R2 compatible) + CDN layer

## CI/CD Flow (GitHub Actions)

1. Lint
2. Test
3. Build
4. Deploy (staging or production by trigger)
5. Migration step (`npm run prisma:migrate --workspace backend`) gated by env secrets

## Pre-deploy checklist

- Validate release notes and schema migration impact.
- Confirm environment secrets are present:
  - `STAGING_DATABASE_URL`
  - `PROD_DATABASE_URL`
- Verify backups for PostgreSQL and MongoDB are healthy.
- Verify CDN and storage bucket policy are unchanged.

## Rollback strategy

1. Stop active deployment.
2. Re-deploy last known good release tag.
3. Roll back DB migration only when migration is backward-compatible and approved.
4. Re-run smoke tests:
   - auth login/register
   - daily practice generation
   - revision due-cards fetch
   - mains submission

## Launch plan

### Soft launch (invite-only)

- Enable feature flags for a small user group.
- Monitor error-rate, p95 latency, and CPU/memory.
- Capture user feedback and triage P0/P1 issues.

### Public launch

- Expand access to all users.
- Keep on-call coverage active for first 72 hours.
- Run incident playbook if SLOs breach.

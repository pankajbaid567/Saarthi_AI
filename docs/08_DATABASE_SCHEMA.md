# Database Schema Overview

## Primary SQL schema (PostgreSQL via Prisma)

Source of truth: `backend/prisma/schema.prisma`

### Core entities

- `User` / `Session` for auth and refresh sessions
- `Subject` / `Topic` hierarchy for syllabus graph
- `ContentNode` for study material and embeddings
- `McqQuestion`, `Test`, `TestQuestion`, `TestResponse` for practice engine
- `MainsQuestion` for mains pipeline

### Key indices and constraints

- Unique user email, subject slug, topic slug per subject
- Topic hierarchy indices (`subjectId`, `parentTopicId`, `materializedPath`)
- Test lifecycle indices by user/time and response linkage

## Document schema (MongoDB)

MongoDB stores flexible and high-variance payloads used by AI-heavy modules:

- NeuroRevise micro-notes and adaptive revision artifacts
- SyllabusFlow generation and feedback snapshots
- Second Brain notes and cross-tag connection metadata

## Cache/state schema (Redis)

Redis is used for short-lived and high-frequency state:

- Active test sessions
- Derived analytics cache segments
- Runtime throttling and request-level cache

## Migration policy

- Migrations are generated and versioned through Prisma.
- CI/CD supports `prisma:migrate` step with environment-gated DB URLs.
- Rollback is runbook-driven and requires backward-compatibility review.

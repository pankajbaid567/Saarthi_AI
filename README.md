# Saarthi AI

Saarthi AI is a monorepo for a UPSC preparation platform.

## Week 1 Infrastructure Status

This repository now includes the complete Week 1 Project Setup & Infrastructure baseline:

- Monorepo with `backend` and `frontend` workspaces
- Express + TypeScript backend
- Next.js + TypeScript frontend
- ESLint + Prettier configured for both workspaces
- Docker Compose stack for PostgreSQL, MongoDB, Redis, and MinIO
- Environment variable templates
- Prisma setup with PostgreSQL schema and initial migration
- Mongoose connection + sample MongoDB model
- Redis client setup with ioredis
- Winston logger, centralized error middleware, Zod request validation, and CORS configuration
- GitHub Actions CI workflow for lint, test, and build

## Repository Structure

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   └── tests/
├── frontend/
├── docs/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Setup

```bash
# Install workspace dependencies
npm install

# Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Start infrastructure services
docker-compose up -d

# Generate Prisma client
npm --prefix backend run prisma:generate
```

## Development

```bash
# Backend
npm --prefix backend run dev

# Frontend
npm --prefix frontend run dev
```

## Quality Checks

```bash
# Lint all workspaces
npm run lint

# Run tests
npm run test

# Build all workspaces
npm run build
```

## API Smoke Endpoints

- `GET /health`
- `POST /api/v1/system/echo` (validated with Zod)


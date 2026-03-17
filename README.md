# 🚀 Saarthi AI – UPSC Mastery OS

> **From Zero → AIR under 100**

An AI-powered, full-stack UPSC Civil Services preparation platform built on the philosophy of **Active + Structured + Adaptive** learning.

---

## 🧠 Why Saarthi AI?

Most UPSC platforms fail because they are:
- ❌ **Passive** — Video-heavy, no active engagement
- ❌ **Unstructured** — PDF dump with no connections
- ❌ **Non-adaptive** — Same content for everyone

Saarthi AI is:
- ⚡ **Active** — MCQs, chat quizzes, answer writing, flashcards, active recall
- 📊 **Structured** — Knowledge Graph links everything + syllabus tracker
- 🎯 **Adaptive** — AI identifies weak areas, tracks forgetting curves, auto-adjusts
- 🧠 **Memory-Aware** — NeuroRevise AI tracks what you're forgetting and intervenes
- 📋 **Practice-Gated** — SyllabusFlow ensures you only practice what you've studied

---

## 📦 Core Modules (13 Modules)

| # | Module | Description |
|---|--------|-------------|
| 1 | 🔐 Auth System | JWT auth, Google OAuth, role-based access |
| 2 | 📄 PDF Ingestion | Upload PDFs → AI extracts topics, MCQs, facts |
| 3 | 🕸️ Knowledge Graph | Subject → Topic → Subtopic hierarchy |
| 4 | 📚 Topic Learning | Concept notes, PYQs, highlights, micro-notes |
| 5 | 🧩 MCQ Engine | Topic/PYQ/mixed/AI-weak-area tests + analytics |
| 6 | 💬 Quiz Chat | Chat-based quiz with adaptive difficulty |
| 7 | ✍️ Mains Writing | AI-evaluated answer writing with scoring |
| 8 | 🧠 **NeuroRevise AI** | Adaptive forgetting curves, retention heatmaps, multi-tier micro-notes, active recall, sprints |
| 9 | 📰 Current Affairs | Magazine → topic-linked notes + MCQs |
| 10 | 📊 Performance | Analytics, heat maps, score predictions |
| 11 | 🎯 Strategy Engine | AI-generated daily/weekly study plans |
| 12 | 📋 **SyllabusFlow AI** | Syllabus tracker, gated daily practice, non-repetition, feedback loop, essays |
| 13 | 🧬 **Second Brain** | Auto cross-topic insights & knowledge connections |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **Database** | PostgreSQL (relational) + MongoDB (flexible) |
| **Cache** | Redis |
| **AI** | OpenAI GPT-4o / Claude + RAG pipeline |
| **Embeddings** | pgvector (PostgreSQL) |
| **Queue** | BullMQ (Redis-backed) |
| **Storage** | AWS S3 / Cloudflare R2 |
| **UI** | shadcn/ui + TipTap editor |

---

## 📂 Project Structure

```
UPSC-BEAST/
├── docs/                    # Project documentation
│   ├── 01_IMPLEMENTATION_PLAN.md
│   ├── 02_REQUIREMENTS.md
│   ├── 03_CHECKLIST.md
│   ├── 04_ARCHITECTURE.md
│   └── 05_API_REFERENCE.md
├── backend/                 # Node.js + Express API
│   ├── prisma/              # PostgreSQL schema + migrations
│   └── src/
│       ├── modules/         # Feature modules (13 modules)
│       │   ├── auth/
│       │   ├── subjects/
│       │   ├── topics/
│       │   ├── content/
│       │   ├── mcq/
│       │   ├── quiz-chat/
│       │   ├── mains/
│       │   ├── pdf/
│       │   ├── revision/
│       │   ├── neuro-revise/    # NeuroRevise AI engine
│       │   ├── syllabus-flow/   # SyllabusFlow AI engine
│       │   ├── second-brain/    # Second Brain module
│       │   ├── current-affairs/
│       │   ├── performance/
│       │   ├── strategy/
│       │   └── user/
│       ├── ai/              # LLM + RAG + embeddings + prompts
│       ├── models/          # MongoDB models (14 collections)
│       ├── middleware/       # Auth, validation, etc.
│       └── jobs/            # Background workers (9 jobs)
├── frontend/                # Next.js application
│   └── src/
│       ├── app/             # Pages (App Router, ~35 pages)
│       ├── components/      # React components
│       ├── hooks/           # Custom hooks (15 hooks)
│       └── store/           # State management
└── scripts/                 # Seed data + utilities
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- OpenAI API key (or Anthropic)

### Setup
```bash
# Clone the repo
git clone https://github.com/pankajbaid567/ResearchDigest.git
cd UPSC-BEAST

# Start databases
docker-compose up -d

# Backend setup
cd backend
cp .env.example .env    # Configure env vars
npm install
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- API Docs: http://localhost:3001/api-docs

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Implementation Plan](docs/01_IMPLEMENTATION_PLAN.md) | Full product vision, architecture, phases |
| [Requirements](docs/02_REQUIREMENTS.md) | Functional & non-functional requirements |
| [Checklist](docs/03_CHECKLIST.md) | Task-by-task implementation checklist |
| [Architecture](docs/04_ARCHITECTURE.md) | Technical deep-dive, data flows, project structure |
| [API Reference](docs/05_API_REFERENCE.md) | Complete API endpoint documentation |

---

## 🎯 Development Phases (26 Weeks)

| Phase | Timeline | Focus |
|-------|----------|-------|
| 🔵 Phase 1 | Weeks 1–4 | Foundation: Auth, Knowledge Graph, Topic Reader |
| 🟢 Phase 2 | Weeks 5–8 | Practice: MCQ Engine, Quiz Chat |
| 🟡 Phase 3 | Weeks 9–12 | AI: PDF Ingestion, RAG Pipeline |
| 🟠 Phase 4 | Weeks 13–18 | Mains + **NeuroRevise AI** + **SyllabusFlow AI** |
| 🔴 Phase 5 | Weeks 19–22 | Analytics, Strategy, Current Affairs, Second Brain |
| 🟣 Phase 6 | Weeks 23–26 | Polish, Testing, Deployment |

---

## 🔥 Unique Features

- **🧠 NeuroRevise AI** — Adaptive forgetting curves with subject-aware decay, retention heatmaps, multi-tier micro-notes (30s/2m/5m), active recall boosters, sprint modes
- **📋 SyllabusFlow AI** — Full syllabus tracker, practice ONLY from completed topics, Mains gating, 30-day non-repetition, feedback loop engine, weekly essays
- **🧬 Second Brain** — Auto cross-topic insights, knowledge connections across subjects
- **🧠 UPSC Thinking Mode** — AI teaches elimination like toppers
- **❓ Why You Got This Wrong** — Deep error analysis, not just answers
- **⚡ Last 30 Days Mode** — Crash revision powered by NeuroRevise urgency ranking
- **🧬 Topper Brain Simulation** — AI behaves like AIR < 50 candidate
- **💬 Quiz Chat** — Chat-based quiz with 4 modes (Rapid Fire, Deep Concept, Elimination, Trap)
- **📊 Score Prediction** — AI predicts Prelims score with confidence interval
- **🔒 Practice Gating** — Must complete MCQs before unlocking daily Mains question
- **🔄 Feedback Loop** — Auto-adjusts difficulty & topic distribution based on 7-day rolling accuracy

---

## 📄 License

Private — All rights reserved.

---

**Built with ❤️ for every UPSC aspirant who deserves a mentor.**

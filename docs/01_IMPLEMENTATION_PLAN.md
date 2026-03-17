# 🚀 Saarthi AI – UPSC Mastery OS

## Implementation Plan

> **Tagline:** From Zero → AIR under 100
> **Date:** 28 February 2026
> **Version:** 1.0.0

---

## 📋 Table of Contents

1. [Product Vision](#product-vision)
2. [Core Philosophy](#core-philosophy)
3. [System Architecture Overview](#system-architecture-overview)
4. [Module Breakdown](#module-breakdown)
5. [Phase-wise Implementation](#phase-wise-implementation)
6. [Tech Stack Details](#tech-stack-details)
7. [Database Schema Strategy](#database-schema-strategy)
8. [AI/ML Pipeline](#aiml-pipeline)
9. [API Design](#api-design)
10. [Deployment Strategy](#deployment-strategy)

---

## 1. Product Vision

**Saarthi AI** is a full-stack, AI-powered UPSC Civil Services preparation platform that transforms passive learning into an active, structured, and adaptive experience. It replaces video-heavy, PDF-dump, and one-size-fits-all platforms with a text-first, knowledge-graph-powered, AI-mentored system.

### Why This Wins

| Dimension       | Traditional Platforms | Saarthi AI                              |
| --------------- | --------------------- | --------------------------------------- |
| Learning        | Video-heavy, passive  | Text-first (fastest for UPSC)           |
| Memory          | Random revision       | NeuroRevise AI + forgetting curves      |
| Practice        | Basic MCQs            | MCQs + Mains + AI evaluation            |
| Thinking        | Rote learning         | AI Socratic questioning                 |
| Revision        | Manual, chaotic       | Adaptive scheduler + active recall      |
| Strategy        | Generic schedule      | Dynamic (performance-based)             |
| Current Affairs | Separate reading      | Auto-linked to topic hierarchy          |
| Tracking        | No syllabus tracking  | SyllabusFlow: track → practice → loop   |
| Retention       | No forgetting insight | Forgetting curve + retention scores     |

---

## 2. Core Philosophy

```
⚡ ACTIVE + STRUCTURED + ADAPTIVE
```

### Three Pillars:

1. **Active Recall** — Every interaction forces retrieval (MCQs, chat quizzes, answer writing)
2. **Structured Knowledge** — Knowledge Graph links everything: concepts ↔ PYQs ↔ MCQs ↔ Mains
3. **Adaptive Intelligence** — AI identifies weak areas, adjusts difficulty, generates study plans

### Two Superpower Engines:

4. **NeuroRevise AI** — Intelligent revision with forgetting curve tracking, subject-aware decay rates, multi-tier micro-notes, active recall boosters, and retention scoring
5. **SyllabusFlow AI** — Complete syllabus tracker + practice orchestrator that ensures Study → Mark → Practice → Improve → Track → Repeat

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React/Next.js)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Topic    │ │  MCQ     │ │  Mains   │ │  Dashboard       │   │
│  │  Reader   │ │  Engine  │ │  Writer  │ │  + Analytics     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Quiz    │ │  Revision│ │  Current │ │  Strategy        │   │
│  │  Chat    │ │  Engine  │ │  Affairs │ │  Planner         │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API + WebSocket
┌─────────────────────────┴───────────────────────────────────────┐
│                     API GATEWAY (Express.js)                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │  Auth     │ │  Content  │ │  Quiz     │ │  Evaluation   │   │
│  │  Service  │ │  Service  │ │  Service  │ │  Service      │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │  PDF      │ │  KGraph   │ │  Revision │ │  Strategy     │   │
│  │  Ingestion│ │  Service  │ │  Service  │ │  Service      │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘   │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
│ PostgreSQL  │ │  MongoDB  │ │   Redis   │ │  S3/R2    │
│ (Structured)│ │ (Flexible)│ │  (Cache)  │ │ (Storage) │
└─────────────┘ └───────────┘ └───────────┘ └───────────┘
       │              │
┌──────┴──────────────┴───────────────────────────────────┐
│                    AI / ML LAYER                         │
│  ┌───────────┐ ┌───────────┐ ┌─────────────────────┐   │
│  │  LLM API  │ │  RAG      │ │  Embedding Engine   │   │
│  │  (OpenAI/ │ │  Pipeline │ │  (Vector Search)    │   │
│  │   Claude) │ │           │ │                     │   │
│  └───────────┘ └───────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Module Breakdown

### Module 1: Authentication System
- JWT-based auth with refresh tokens
- Role-based access (Student, Admin, Content Manager)
- OAuth (Google) + Email/Password
- Session management via Redis
- Rate limiting per user

### Module 2: PDF Ingestion System
- Accept PDFs up to 500MB (NCERTs, coaching notes, magazines, test series)
- Multi-stage extraction pipeline:
  1. **Text Extraction** — pdf-parse / Apache Tika
  2. **Structure Detection** — Headings, sections, tables
  3. **Content Classification** — MCQs, concepts, facts, questions
  4. **Entity Extraction** — Topics, subtopics, articles, amendments
  5. **Knowledge Graph Linking** — Auto-link to topic hierarchy
- Queue-based processing (Bull/BullMQ + Redis)
- Progress tracking with WebSocket updates

### Module 3: Knowledge Graph Engine
- Hierarchical structure:
  ```
  Subject → Topic → Subtopic → Content
  Example:
  Polity
   ├── Fundamental Rights
   │    ├── Article 14 (Right to Equality)
   │    │    ├── Concept Notes
   │    │    ├── PYQs (Prelims 2019 Q23, ...)
   │    │    ├── MCQs (45 questions)
   │    │    ├── Mains Questions (8 questions)
   │    │    └── Key Facts (12 facts)
   │    ├── Article 19 (Freedom of Speech)
   │    └── ...
   ├── DPSP
   └── Fundamental Duties
  ```
- Graph stored in PostgreSQL (adjacency list + materialized paths)
- Content linking: Every MCQ, PYQ, note, fact → linked to graph node
- Full-text search + vector similarity search

### Module 4: Topic Learning Module
Each topic page contains:
1. **Concept Notes** — Clean, exam-oriented, static + dynamic
2. **PYQs Section** — Topic-wise Prelims + Mains PYQs
3. **Smart Highlights** — "UPSC loves this", "Trap area", "Elimination trick"
4. **Micro Notes** — 30-second revision bullets
5. **Related Topics** — Knowledge graph connections
6. **Practice Links** — Direct MCQ/Mains practice for this topic

### Module 5: MCQ Engine
- **Question Types:**
  - Topic-wise MCQs
  - Subtopic-wise MCQs
  - Mixed full-length tests (100 Qs, 2 hours)
  - PYQ-based tests
  - AI-generated weak-area tests
  - Current affairs tests
- **During Test:**
  - Timer per question + total
  - Flag for review
  - Mark for doubt
- **Post-Test AI Analysis:**
  - Accuracy %
  - Silly mistakes detection
  - Concept gap detection
  - Guessing pattern analysis
  - Time per question analytics
  - Output: "You are weak in Fundamental Duties + confusing DPSP vs FR"

### Module 6: Quiz Chat System
- Chat-based interface
- User can say: "Ask me 10 MCQs on Federalism"
- AI asks → waits → evaluates → explains
- **Modes:**
  - ⚡ Rapid Fire
  - 🧠 Deep Concept Mode
  - 🎯 Elimination Training
  - 😈 Trap Questions Mode
- Adaptive difficulty based on performance
- Session history saved

### Module 7: Mains Answer Writing + Evaluation
- **Question Bank:** Topic-wise (PYQ + coaching + AI-generated)
- **Answer Input:** Rich text editor with word count
- **AI Evaluation Criteria:**
  - Structure (Intro → Body → Conclusion)
  - Content depth & accuracy
  - Keywords used
  - Missing dimensions
  - Diagrams/flowcharts suggested
  - Current affairs integration
- **Scoring:** X/10 with detailed feedback
- **Topper Copy Overlay:** Compare with model/topper answers

### Module 8: NeuroRevise AI – Intelligent Revision Engine
The most advanced revision system for UPSC — NOT fixed interval reminders, but a true **adaptive memory optimization engine**.

#### 8.1 Adaptive Revision Scheduler
- **NOT fixed Day 1, 3, 7** — dynamically computed per topic per user
- Factors:
  - **Subject-type decay rate:**
    - Polity → Concept-heavy → slower decay (factor: 0.85)
    - History → Fact-heavy → faster decay (factor: 0.65)
    - Economy → Concept + numbers → medium decay (factor: 0.75)
    - Geography → Visual + map → medium-slow decay (factor: 0.80)
    - Environment → Dynamic + static mix → medium decay (factor: 0.70)
  - **User performance signals:**
    - MCQ accuracy on topic (wrong → revise sooner)
    - Mains score on topic (low → revise sooner)
    - Guessed correct (detected by time analysis) → still revise soon
    - Confident correct → delay revision
  - **Time since last revision** — Ebbinghaus forgetting curve model
  - **Effort vs retention optimization** — minimize time, maximize recall
- Example:
  ```
  Topic: Fundamental Rights
  User Performance: MCQ accuracy 60%, Mains score 5/10
  Subject decay: Polity (0.85)
  → Computed next revision: 2 days (not the default 7)
  → Extra MCQs added to revision session
  ```

#### 8.2 Multi-Tier Micro-Revision Notes (Auto-Generated)
AI generates three tiers from every topic's content:
- **⚡ 30-second notes** — 3-5 bullet points, bare essentials
  ```
  Topic: DPSP
  - Non-justiciable
  - Part IV, Articles 36–51
  - Welfare state directive
  ```
- **📝 2-minute notes** — Key concepts with structure
  ```
  Topic: DPSP
  - Articles 36–51, Part IV
  - Gandhian + Socialist + Liberal classification
  - Not enforceable but fundamental in governance
  - Amendments: 42nd, 44th impact
  ```
- **📖 5-minute notes** — Full revision summary
  ```
  Topic: DPSP
  - Complete article-wise breakdown
  - FR vs DPSP comparison table
  - Criticism + Supreme Court evolution
  - Minerva Mills, State of Madras cases
  - Current affairs integration
  ```

#### 8.3 Revision Priority Engine (Dashboard)
Real-time classification of ALL topics:
- 🔴 **URGENT** — Retention score < 40%, high forgetting probability
- 🟡 **MEDIUM** — Retention score 40-70%, approaching decay threshold
- 🟢 **STRONG** — Retention score > 70%, safely retained
- Shows daily revision task list with estimated time

#### 8.4 Forgetting Curve Tracking
Per-topic, per-user memory model:
- Tracks: study timestamps, revision timestamps, recall quality
- Computes **Retention Score** (0-100) for every topic
- Visualizes forgetting curves on dashboard
- Predicts "will forget by [date]" for each topic
- Alerts when topics cross decay threshold

#### 8.5 Subject-Wise Revision Strategy

| Subject | Strategy | Frequency | Method |
|---------|----------|-----------|--------|
| Polity | Conceptual deep revision | Weekly | Concept maps + recall |
| History | Quick fact refresh | Every 3 days | Timeline flashcards |
| Economy | Concept + current linking | Weekly | Data + news connection |
| Geography | Map + visual revision | Weekly | Map quizzes + diagrams |
| Environment | Static + dynamic linking | Every 4 days | Fact cards + current affairs |
| Ethics | Case study practice | Bi-weekly | Scenario analysis |

#### 8.6 Active Recall Booster
Instead of passive re-reading:
- AI generates rapid-fire recall questions:
  - "What is Article 32?"
  - "Difference between FR & DPSP?"
  - "Name 3 Gandhian DPSPs"
- **Rapid Recall Sessions** — timed, 2-minute bursts
- Recall performance feeds back into retention scoring

#### 8.7 Auto Flashcard Generation
AI generates flashcards from:
- Concept notes (key terms → definitions)
- Incorrect MCQs (question → correct answer + explanation)
- PYQs (question → topic + answer approach)
- Key facts (fact → context)
- User highlights (highlighted text → recall question)
- Mind maps from knowledge graph

#### 8.8 Revision Sprint Modes
- **🔥 7-Day Sprint** — Pre-Prelims crash mode
  - Only weak + high-PYQ-frequency topics
  - Ultra-compressed notes only
  - Daily micro-tests (30 MCQs all subjects)
  - Prioritized by forgetting curve urgency
- **⚡ 30-Day Sprint** — Comprehensive revision
  - Full syllabus structured revision
  - Spaced across 30 days with optimization
  - Mixed revision + practice daily
  - Progressive difficulty increase

#### 8.9 Performance-Integrated Feedback Loop
- Poor MCQ performance on topic → **auto-increase revision frequency**
- Poor Mains score → **add extra recall questions**
- Declining retention score → **trigger urgent revision alert**
- Consistent strong performance → **extend intervals, reduce load**

### Module 9: Current Affairs Engine
- Ingest magazine PDFs (Alpha ADU, Vision IAS, etc.)
- AI converts articles → topic-linked notes
- Auto-generates MCQs + Mains questions
- Links to knowledge graph
- Monthly compilation view
- Example:
  ```
  Article: "Election Commission Reform 2026"
  → Linked to: Polity → Elections → ECI
  → Generated: 5 MCQs + 2 Mains Qs
  → Added to: Current Affairs Feb 2026
  ```

### Module 10: Performance Dashboard
- **Tracks:**
  - Subject-wise accuracy
  - Topic-wise strength/weakness heat map
  - Attempt patterns
  - Time management analytics
  - Improvement trajectory
- **AI Predictions:**
  - "At this rate, your Prelims score = 82 ± 5"
  - "Top 3 weak areas to fix this week"
  - "Estimated rank range based on current prep"

### Module 11: Strategy Engine (AI Mentor)
- **Daily Plan Generation:**
  - Based on: syllabus coverage + weak areas + time available
  - Example: "Today: Polity FR + 50 MCQs + 2 Mains answers"
- **Weekly Targets:**
  - Subject rotation
  - Prelims vs Mains balance
  - Revision slots
- **Adaptive:**
  - Adjusts based on performance
  - Detects burnout patterns
  - Suggests break strategies

### Module 12: SyllabusFlow AI – Tracker + Practice Orchestrator
The backbone module that connects **Syllabus → Completed Topics → Practice → Evaluation → Storage → Improvement Loop**. Ensures students never study or practice randomly.

#### 12.1 Complete Syllabus Tracker
- Full UPSC syllabus stored as structured hierarchy:
  ```
  GS Paper 1
   ├── History
   │    ├── Ancient ✅ (completed)
   │    ├── Medieval 🔄 (in progress, 60%)
   │    ├── Modern ⬜ (not started)
   ├── Geography
   ├── Society
  ```
- Features:
  - ✅ Checkbox: Mark topic as completed
  - 📊 Progress bars: Subject-level + overall %
  - ⏱️ Time spent tracking per topic
  - 🔗 Deep linked to: MCQs, Mains Qs, Revision Engine, Notes

#### 12.2 Topic-Based Practice Generation
When a topic is marked **completed**:
- System auto-generates daily practice:
  - 🔹 **Daily MCQs** — ONLY from completed topics
    - Mix: Easy (30%) + Medium (50%) + Hard (20%)
    - Mix: PYQ-based (40%) + Standard (40%) + AI-generated (20%)
  - 🔹 **Progressive Flow:**
    - First batch: 10 MCQs
    - After completion → "Generate More" (tracked, unlimited)
    - Never repeats same question (non-repetition system)

#### 12.3 Smart Mixed Practice
AI creates cross-topic, UPSC-style questions:
- Multi-topic MCQs (like actual UPSC Prelims):
  - Example: Polity + Current Affairs combined
  - Example: Economy + Environment linked
- Interlinked questions that test connection-building
- Difficulty adapts based on cumulative performance

#### 12.4 Daily Mains Answer System
- **2-3 Mains questions daily** based on:
  - Completed topics (primary)
  - Weak areas (secondary)
- **🔒 Gating Constraint:**
  - New questions NOT generated until previous is attempted
  - ✅ Override button: "Generate anyway" (still tracks skip)
- Each question stored with:
  - Topic link, Date generated, Attempt status, Skip status

#### 12.5 Model Answers + AI Evaluation
For every Mains question:
- AI provides: Model answer, Structure template, Key keywords
- After user submits → Full AI evaluation (integrates with Module 7)
- Stores: Score, Feedback, Improvement delta

#### 12.6 Weekly Essay System
- 1 essay topic per week based on:
  - Current affairs themes
  - GS paper themes
  - Previous year patterns
- Features:
  - Essay submission with word count
  - AI evaluation (structure, content, examples, coherence)
  - Model essay comparison

#### 12.7 Non-Repetition System (Critical)
Ensures NO question is ever repeated:
- Tracks per user: Attempted, Unattempted, Skipped
- Question pool deduplication
- Progressive difficulty as easy questions exhausted
- Flags when topic question pool running low → triggers AI generation

#### 12.8 Practice History + Analytics
Complete practice tracking:
- Questions attempted (MCQ + Mains + Essay)
- Accuracy trends over time
- Topic-wise performance breakdown
- Time-per-question trends
- Comparison: completed topics vs accuracy correlation

#### 12.9 Feedback Loop (Most Powerful Feature)
Automatic closed-loop improvement:
```
Weak in Polity (detected)
    │
    ├── → MCQ Engine: Add more Polity MCQs to daily practice
    ├── → Mains: Add more Polity Mains Qs
    ├── → NeuroRevise: Increase Polity revision frequency
    ├── → Strategy: Allocate more Polity study time
    └── → Dashboard: Flag Polity as "needs attention"
```
This loop runs automatically after every test/submission.

### Module 13: Second Brain – Personal Knowledge System
- **Highlight anything** across notes, PYQs, content
- **Personal notes** attached to any topic/content
- **AI auto-generates:**
  - Flashcards from highlights
  - Revision sheets from notes
  - Mind maps from knowledge graph connections
- **Export:** Generate printable revision PDFs

---

## 5. Phase-wise Implementation

### 🔵 Phase 1: Foundation (Weeks 1–4)
**Goal:** Core infrastructure + basic learning

| Week | Tasks |
|------|-------|
| 1 | Project setup, DB schemas, Auth system, basic API structure |
| 2 | Knowledge Graph schema + CRUD, Subject/Topic/Subtopic management |
| 3 | Topic Learning Module (concept notes, PYQs display) |
| 4 | Frontend shell: Navigation, Topic reader, Dark mode |

**Deliverable:** Users can browse subjects → topics → read notes + PYQs

### 🟢 Phase 2: Practice Engine (Weeks 5–8)
**Goal:** MCQ system + quiz chat

| Week | Tasks |
|------|-------|
| 5 | MCQ Engine backend: question storage, test generation, submission |
| 6 | MCQ frontend: test interface, timer, review |
| 7 | Post-test analytics: accuracy, time analysis, AI weak-area detection |
| 8 | Quiz Chat System: chat UI, AI integration, modes |

**Deliverable:** Full MCQ practice + chat-based quizzing

### 🟡 Phase 3: PDF & AI (Weeks 9–12)
**Goal:** PDF ingestion + RAG pipeline

| Week | Tasks |
|------|-------|
| 9 | PDF upload, text extraction, queue processing |
| 10 | AI-powered content classification + entity extraction |
| 11 | Knowledge graph auto-linking, MCQ extraction from PDFs |
| 12 | RAG pipeline: embeddings, vector search, context retrieval |

**Deliverable:** Upload PDF → auto-structured content in knowledge graph

### 🟠 Phase 4: Mains, NeuroRevise & SyllabusFlow (Weeks 13–18)
**Goal:** Answer writing + intelligent revision + syllabus orchestration

| Week | Tasks |
|------|-------|
| 13 | Mains question bank, answer input interface |
| 14 | AI answer evaluation engine |
| 15 | NeuroRevise: Adaptive scheduler, forgetting curve engine, subject-aware decay |
| 16 | NeuroRevise: Multi-tier micro-notes generator, active recall booster, flashcard engine |
| 17 | NeuroRevise: Revision priority dashboard, sprint modes, retention scoring |
| 18 | SyllabusFlow: Syllabus tracker, topic-based practice generation, non-repetition system |

**Deliverable:** Full Mains practice + intelligent revision + syllabus-linked practice loop

### 🔴 Phase 5: Intelligence Layer (Weeks 19–22)
**Goal:** Analytics + strategy + current affairs + feedback loops

| Week | Tasks |
|------|-------|
| 19 | SyllabusFlow: Daily Mains system, weekly essays, feedback loop engine |
| 20 | Performance dashboard: charts, heat maps, trend analysis |
| 21 | AI score prediction, weak-area deep analysis |
| 22 | Current affairs engine + Strategy engine + Second Brain |

**Deliverable:** Full AI-powered analytics + adaptive study plans + closed-loop improvement

### 🟣 Phase 6: Polish & Scale (Weeks 23–26)
**Goal:** UX polish, testing, optimization, deployment

| Week | Tasks |
|------|-------|
| 23 | UX polish: Notion-like interface, transitions, responsiveness |
| 24 | Performance optimization: caching, lazy loading, CDN |
| 25 | Testing: unit, integration, e2e, load testing |
| 26 | Deployment: CI/CD, monitoring, error tracking, launch |

**Deliverable:** Production-ready platform

---

## 6. Tech Stack Details

### Backend
```
Runtime:        Node.js 20+ LTS
Framework:      Express.js 4.x
Language:       TypeScript 5.x
ORM:            Prisma (PostgreSQL) + Mongoose (MongoDB)
Queue:          BullMQ (Redis-backed)
WebSocket:      Socket.io
Validation:     Zod
Logging:        Winston + Morgan
Testing:        Jest + Supertest
```

### Frontend
```
Framework:      Next.js 14+ (App Router)
Language:       TypeScript
Styling:        Tailwind CSS + shadcn/ui
State:          Zustand + React Query (TanStack)
Editor:         TipTap (rich text)
Charts:         Recharts / Chart.js
Chat UI:        Custom + AI SDK
Markdown:       MDX rendering
```

### Databases
```
PostgreSQL 16:  Users, subjects, topics, MCQs, tests, scores,
                knowledge graph, revision schedule, study plans
MongoDB 7:      Notes content, PDF extracted text, flashcards,
                chat history, AI responses, flexible documents
Redis 7:        Session cache, quiz state, rate limiting,
                queue management, leaderboard
```

### AI/ML
```
LLM:            OpenAI GPT-4o / Claude 3.5 Sonnet (via API)
Embeddings:     OpenAI text-embedding-3-small
Vector DB:      pgvector (PostgreSQL extension)
RAG:            LangChain.js / custom pipeline
PDF Parsing:    pdf-parse + Tesseract (OCR fallback)
```

### Infrastructure
```
Hosting:        AWS / Vercel (frontend) + Railway/Render (backend)
Storage:        AWS S3 / Cloudflare R2
CDN:            CloudFront / Cloudflare
CI/CD:          GitHub Actions
Monitoring:     Sentry + Grafana
Containers:     Docker + Docker Compose
```

---

## 7. Database Schema Strategy

### PostgreSQL (Relational – Core Data)

```
users
├── id, email, password_hash, name, role, avatar
├── created_at, updated_at, last_login
└── subscription_tier, study_target_date

subjects
├── id, name, slug, description, icon, order
└── is_active, created_at

topics
├── id, subject_id, parent_topic_id (self-ref for subtopics)
├── name, slug, description, level (1=topic, 2=subtopic, 3=sub-sub)
├── order, materialized_path (e.g., "polity.fundamental_rights.article_14")
└── is_active, created_at

content_nodes (Knowledge Graph)
├── id, topic_id, type (concept|fact|highlight|micro_note)
├── title, body (markdown), metadata (JSONB)
├── source_pdf_id, order
└── embedding_vector (pgvector)

mcq_questions
├── id, topic_id, subtopic_id
├── question_text, options (JSONB), correct_option
├── explanation, difficulty (1-5), type (standard|pyq|ai_generated)
├── year (for PYQs), source, tags (JSONB)
└── times_attempted, times_correct

mains_questions
├── id, topic_id, subtopic_id
├── question_text, marks, word_limit
├── type (pyq|coaching|ai_generated), year
├── model_answer, evaluation_rubric (JSONB)
└── source, tags

tests
├── id, user_id, type (topic|mixed|pyq|weak_area|full_length)
├── title, questions (JSONB array of mcq_ids)
├── time_limit_minutes, status (in_progress|completed)
├── started_at, completed_at
└── score, total, analytics (JSONB)

test_responses
├── id, test_id, question_id, user_id
├── selected_option, is_correct, time_taken_seconds
└── flagged, created_at

mains_submissions
├── id, user_id, question_id
├── answer_text, word_count
├── ai_score, ai_feedback (JSONB)
├── structure_score, content_score, keyword_score
└── created_at

revision_schedule
├── id, user_id, topic_id, content_node_id
├── next_review_date, interval_days, ease_factor
├── review_count, last_reviewed_at
├── retention_score (0-100), decay_rate
├── subject_decay_factor (per subject type)
├── last_recall_quality (1-5)
└── status (pending|due|urgent|mastered)

forgetting_curve_data
├── id, user_id, topic_id
├── study_timestamp, revision_timestamps (JSONB array)
├── recall_scores (JSONB array of {date, quality, time_taken})
├── computed_retention (0.0–1.0)
├── predicted_forget_date
├── decay_coefficient (subject-aware)
└── updated_at

micro_revision_notes
├── id, topic_id
├── tier (30sec|2min|5min)
├── content (markdown), bullet_count
├── generated_from (content_node_ids JSONB)
├── version, is_approved
└── created_at, updated_at

active_recall_questions
├── id, topic_id, user_id
├── question_text, expected_answer
├── type (concept_recall|comparison|factual|application)
├── last_asked, times_asked, times_correct
└── created_at

syllabus_progress
├── id, user_id, topic_id, subject_id
├── status (not_started|in_progress|completed)
├── completion_percentage (0-100)
├── time_spent_minutes
├── started_at, completed_at
├── linked_mcqs_generated (int), linked_mains_generated (int)
└── updated_at

daily_practice_queue
├── id, user_id, date
├── mcq_ids (JSONB array), mains_question_ids (JSONB array)
├── essay_question_id (nullable)
├── source (completed_topics|weak_area|mixed)
├── status (pending|in_progress|completed)
├── completion_percentage
└── created_at

question_attempt_log
├── id, user_id, question_id, question_type (mcq|mains|essay)
├── status (attempted|skipped|unattempted)
├── attempt_date
├── is_correct (for MCQ), score (for Mains)
└── time_taken_seconds

flashcards
├── id, user_id, topic_id
├── front, back, type (auto|manual)
├── next_review_date, ease_factor
└── review_count

study_plans
├── id, user_id, date, plan_data (JSONB)
├── status (pending|in_progress|completed)
└── completion_percentage, ai_notes

performance_snapshots
├── id, user_id, date
├── subject_scores (JSONB), topic_scores (JSONB)
├── overall_accuracy, predicted_score
└── weak_areas (JSONB), strong_areas (JSONB)

pdf_documents
├── id, uploaded_by, filename, s3_key, size_bytes
├── status (uploading|processing|completed|failed)
├── extraction_result (JSONB), page_count
└── created_at, processed_at
```

### MongoDB (Flexible Documents)

```
notes_content
├── _id, topicId, type
├── title, body (rich markdown/HTML)
├── metadata, tags, version
└── createdAt, updatedAt

pdf_extracted_text
├── _id, pdfDocumentId, pageNumber
├── rawText, structuredContent
├── extractedEntities, confidence
└── processedAt

chat_sessions
├── _id, userId, type (quiz_chat|mentor)
├── messages: [{ role, content, metadata, timestamp }]
├── mode (rapid_fire|deep_concept|elimination|trap)
├── topicId, performance
└── createdAt, updatedAt

ai_responses_cache
├── _id, promptHash, response
├── model, tokens, cost
├── expiresAt
└── createdAt

user_highlights
├── _id, userId, contentNodeId
├── highlighted_text, note, color
├── position (JSONB)
└── createdAt

current_affairs
├── _id, title, sourceDocument
├── date, month, year
├── content, linkedTopics: [topicId]
├── generatedMcqs: [mcqId]
├── generatedMainsQs: [mainsQId]
└── tags, createdAt

micro_note_content
├── _id, topicId, tier (30sec|2min|5min)
├── bullets: [{ text, importance }]
├── mnemonics, keyPhrases
├── linkedContentNodeIds
├── version, generatedBy (auto|manual)
└── createdAt, updatedAt

revision_session_log
├── _id, userId, sessionType (daily|sprint|active_recall)
├── topics: [{ topicId, preScore, postScore, timeSpent }]
├── totalCardsReviewed, averageRecall
├── streakMaintained (boolean)
├── startedAt, completedAt

syllabus_snapshot
├── _id, userId, capturedAt
├── subjects: [{
│     subjectId, name, totalTopics,
│     completed, inProgress, notStarted,
│     completionPercentage
│   }]
├── overallCompletion
└── weeklyDelta (compared to last snapshot)

essay_submission
├── _id, userId, questionId
├── body (rich markdown/HTML), wordCount
├── evaluation: { structure, content, language, coherence, totalScore }
├── feedback, modelAnswerComparison
├── submittedAt, evaluatedAt

practice_generation_log
├── _id, userId, date
├── generatedFrom: [{ topicId, questionType, questionId }]
├── nonRepetitionCheck: { deduped, totalCandidates, finalCount }
├── feedbackLoopApplied (boolean)
├── strategy (topic_based|weak_area|mixed|revision)
└── createdAt

second_brain_entries
├── _id, userId
├── type (insight|connection|pattern|question)
├── content, linkedTopics: [topicId]
├── source (auto_generated|user_created)
├── tags, importance
└── createdAt, updatedAt
```

---

## 8. AI/ML Pipeline

### PDF Ingestion Pipeline

```
PDF Upload
    │
    ▼
[Text Extraction] ──→ raw text + page structure
    │
    ▼
[Structure Detection] ──→ headings, sections, tables, lists
    │
    ▼
[Content Classification] ──→ LLM classifies each section:
    │                         - Concept explanation
    │                         - MCQ (extract Q + options + answer)
    │                         - Mains question
    │                         - Key fact
    │                         - Case study
    │
    ▼
[Entity Extraction] ──→ Topics, subtopics, articles,
    │                    amendments, acts, people, dates
    │
    ▼
[Knowledge Graph Linking] ──→ Match to existing topics
    │                         or suggest new nodes
    │
    ▼
[Embedding Generation] ──→ Generate vectors for search
    │
    ▼
[Storage] ──→ PostgreSQL + MongoDB + pgvector
```

### RAG Pipeline (for Quiz Chat, Answer Eval, etc.)

```
User Query
    │
    ▼
[Query Understanding] ──→ Intent detection + entity extraction
    │
    ▼
[Retrieval]
    ├── Vector search (pgvector) for semantic match
    ├── Full-text search (PostgreSQL) for keyword match
    └── Knowledge graph traversal for related content
    │
    ▼
[Context Assembly] ──→ Relevant notes + MCQs + PYQs
    │
    ▼
[LLM Generation] ──→ GPT-4o / Claude with structured prompt
    │
    ▼
[Response Formatting] ──→ Structured output (MCQ format, evaluation, etc.)
```

### Answer Evaluation Pipeline

```
Student Answer + Question
    │
    ▼
[Structure Analysis]
    ├── Intro present? (/2)
    ├── Body organized? (/3)
    ├── Conclusion present? (/2)
    └── Flow & coherence (/1)
    │
    ▼
[Content Analysis]
    ├── Key points covered (vs rubric)
    ├── Constitutional/legal references
    ├── Current affairs integration
    ├── Examples & case studies
    └── Multiple dimensions addressed
    │
    ▼
[Keyword Analysis]
    ├── Essential keywords present
    ├── Technical terminology
    └── UPSC-specific phrases
    │
    ▼
[Comparison] ──→ vs Model answer / Topper answer
    │
    ▼
[Score Generation] ──→ X/10 + detailed breakdown
    │
    ▼
[Improvement Suggestions] ──→ Specific, actionable feedback
```

---

## 9. API Design

### API Structure (RESTful)

```
BASE: /api/v1

AUTH
├── POST   /auth/register
├── POST   /auth/login
├── POST   /auth/refresh
├── POST   /auth/logout
├── GET    /auth/me

SUBJECTS & TOPICS (Knowledge Graph)
├── GET    /subjects
├── GET    /subjects/:id
├── GET    /subjects/:id/topics
├── GET    /topics/:id
├── GET    /topics/:id/subtopics
├── GET    /topics/:id/content
├── GET    /topics/:id/mcqs
├── GET    /topics/:id/pyqs
├── GET    /topics/:id/mains-questions
├── POST   /topics (admin)
├── PUT    /topics/:id (admin)

CONTENT
├── GET    /content/:id
├── POST   /content (admin)
├── PUT    /content/:id (admin)
├── GET    /content/search?q=...

MCQ ENGINE
├── POST   /tests/generate
├── GET    /tests/:id
├── POST   /tests/:id/submit
├── GET    /tests/:id/results
├── GET    /tests/:id/analytics
├── GET    /tests/history

QUIZ CHAT
├── POST   /chat/session
├── POST   /chat/session/:id/message
├── GET    /chat/session/:id
├── GET    /chat/sessions

MAINS
├── GET    /mains/questions
├── GET    /mains/questions/:id
├── POST   /mains/submit
├── GET    /mains/submissions
├── GET    /mains/submissions/:id

PDF INGESTION
├── POST   /pdf/upload
├── GET    /pdf/:id/status
├── GET    /pdf/:id/extracted
├── GET    /pdfs

NEUROREVISE (Adaptive Revision Engine)
├── GET    /revision/dashboard            ← retention heatmap, due counts, streak
├── GET    /revision/due                  ← today's due cards (priority-sorted)
├── GET    /revision/due?tier=30sec|2min|5min  ← filter by micro-note tier
├── POST   /revision/:topicId/review      ← submit recall quality (1-5)
├── GET    /revision/forgetting-curve/:topicId  ← retention data over time
├── GET    /revision/forgetting-curve/bulk  ← bulk curves for subject
├── GET    /revision/retention-scores      ← per-topic retention with decay
├── GET    /revision/micro-notes/:topicId  ← all 3 tiers for a topic
├── POST   /revision/micro-notes/generate  ← auto-generate from content
├── PUT    /revision/micro-notes/:id       ← edit micro-note
├── POST   /revision/active-recall/start   ← begin active recall session
├── POST   /revision/active-recall/:sessionId/answer ← submit recall answer
├── GET    /revision/active-recall/:sessionId/results
├── POST   /revision/sprint/start          ← begin 15/30/45-min sprint
├── POST   /revision/sprint/:sprintId/complete
├── GET    /revision/sprint/history
├── GET    /revision/flashcards
├── POST   /revision/flashcards
├── GET    /revision/streaks               ← revision streak data
├── GET    /revision/predictions            ← what you'll forget by next week

SYLLABUS-FLOW (Tracker + Practice Orchestrator)
├── GET    /syllabus/progress              ← full syllabus tree with %
├── GET    /syllabus/progress/:subjectId   ← subject-level breakdown
├── PUT    /syllabus/topics/:topicId/status ← mark topic status
├── GET    /syllabus/topics/:topicId/practice-ready ← eligible for practice?
├── POST   /practice/daily/generate         ← generate today's practice set
├── GET    /practice/daily                  ← today's practice queue
├── POST   /practice/daily/:questionId/submit ← submit answer
├── GET    /practice/daily/results          ← daily practice results
├── GET    /practice/history               ← past practice sessions
├── POST   /practice/mixed/generate         ← smart mixed practice
├── POST   /mains/daily/submit             ← daily mains answer (gated)
├── GET    /mains/daily/question            ← today's mains question
├── GET    /mains/daily/gate-status         ← has user completed MCQ gate?
├── POST   /mains/daily/override-gate       ← manual gate override
├── POST   /essays/weekly/submit            ← weekly essay submission
├── GET    /essays/weekly/question           ← this week's essay topic
├── GET    /essays/submissions              ← past essay submissions
├── GET    /practice/non-repetition/stats   ← dedup effectiveness stats
├── GET    /practice/feedback-loop          ← what's adapting & why

SECOND BRAIN
├── GET    /second-brain/entries
├── POST   /second-brain/entries
├── PUT    /second-brain/entries/:id
├── DELETE /second-brain/entries/:id
├── GET    /second-brain/connections
├── GET    /second-brain/insights/auto-generated

CURRENT AFFAIRS
├── GET    /current-affairs
├── GET    /current-affairs/:month/:year
├── GET    /current-affairs/:id

PERFORMANCE
├── GET    /performance/overview
├── GET    /performance/subject/:id
├── GET    /performance/topic/:id
├── GET    /performance/predictions
├── GET    /performance/weak-areas

STRATEGY
├── GET    /strategy/today
├── GET    /strategy/week
├── POST   /strategy/generate
├── PUT    /strategy/:id/complete

USER
├── GET    /user/highlights
├── POST   /user/highlights
├── GET    /user/notes
├── POST   /user/notes
├── GET    /user/bookmarks
├── POST   /user/bookmarks
```

---

## 10. Deployment Strategy

### Development Environment
```
Docker Compose:
  - Node.js app (hot reload)
  - PostgreSQL 16 + pgvector
  - MongoDB 7
  - Redis 7
  - MinIO (S3-compatible local storage)
```

### Staging
```
- Railway / Render for backend
- Vercel for frontend
- Managed PostgreSQL (Supabase / Neon)
- MongoDB Atlas (free tier)
- Upstash Redis
- Cloudflare R2 (storage)
```

### Production
```
- AWS ECS / DigitalOcean App Platform
- Vercel (frontend with edge functions)
- AWS RDS PostgreSQL (with pgvector)
- MongoDB Atlas (dedicated)
- ElastiCache Redis
- AWS S3 + CloudFront
- GitHub Actions CI/CD
- Sentry (error tracking)
- Grafana + Prometheus (monitoring)
```

### Scaling Considerations
- Horizontal scaling for API servers
- Read replicas for PostgreSQL
- Redis cluster for high-throughput quiz sessions
- CDN for static content delivery
- Background job workers for PDF processing
- Rate limiting per user tier

---

*Next: See `02_REQUIREMENTS.md` for detailed requirements and `03_CHECKLIST.md` for implementation checklist.*

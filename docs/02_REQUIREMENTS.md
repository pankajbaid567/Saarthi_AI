# 📋 Saarthi AI – UPSC Mastery OS

## Requirements Document

> **Version:** 1.0.0
> **Last Updated:** 28 February 2026

---

## 📋 Table of Contents

1. [Functional Requirements](#1-functional-requirements)
2. [Non-Functional Requirements](#2-non-functional-requirements)
3. [User Stories](#3-user-stories)
4. [Data Requirements](#4-data-requirements)
5. [AI/ML Requirements](#5-aiml-requirements)
6. [Security Requirements](#6-security-requirements)
7. [Performance Requirements](#7-performance-requirements)
8. [UX/UI Requirements](#8-uxui-requirements)

---

## 1. Functional Requirements

### FR-1: Authentication System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | System shall support email/password registration with email verification | P0 |
| FR-1.2 | System shall support Google OAuth login | P1 |
| FR-1.3 | System shall issue JWT access tokens (15min) + refresh tokens (7d) | P0 |
| FR-1.4 | System shall support role-based access: Student, Admin, Content Manager | P0 |
| FR-1.5 | System shall implement rate limiting (100 req/min per user) | P0 |
| FR-1.6 | System shall support password reset via email | P0 |
| FR-1.7 | System shall track last login timestamp and active sessions | P1 |
| FR-1.8 | System shall support account deletion (GDPR compliance) | P2 |

### FR-2: PDF Ingestion System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | System shall accept PDF uploads up to 500MB | P0 |
| FR-2.2 | System shall extract text from PDFs including scanned (OCR) | P0 |
| FR-2.3 | System shall detect document structure (headings, sections, tables) | P0 |
| FR-2.4 | System shall classify content into: concepts, MCQs, mains Qs, facts | P0 |
| FR-2.5 | System shall extract MCQs with question, options, and correct answer | P0 |
| FR-2.6 | System shall auto-link extracted content to knowledge graph topics | P0 |
| FR-2.7 | System shall process PDFs asynchronously with progress updates | P0 |
| FR-2.8 | System shall store original PDFs in cloud storage (S3/R2) | P0 |
| FR-2.9 | System shall support batch PDF upload | P1 |
| FR-2.10 | System shall allow manual correction of extracted content | P1 |
| FR-2.11 | System shall detect duplicate content across PDFs | P2 |
| FR-2.12 | System shall extract and store images/diagrams from PDFs | P2 |

### FR-3: Knowledge Graph

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | System shall maintain hierarchical structure: Subject → Topic → Subtopic | P0 |
| FR-3.2 | System shall support unlimited depth of subtopic nesting | P1 |
| FR-3.3 | System shall link MCQs to specific topics/subtopics | P0 |
| FR-3.4 | System shall link PYQs to specific topics/subtopics | P0 |
| FR-3.5 | System shall link Mains questions to specific topics/subtopics | P0 |
| FR-3.6 | System shall support cross-topic linking (e.g., Polity ↔ History) | P1 |
| FR-3.7 | System shall support full-text search across all knowledge nodes | P0 |
| FR-3.8 | System shall support semantic (vector) search across content | P1 |
| FR-3.9 | System shall track content coverage per topic (% complete) | P1 |
| FR-3.10 | System shall visualize knowledge graph as interactive tree | P2 |

### FR-4: Topic Learning Module

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Each topic page shall display concept notes in clean, readable format | P0 |
| FR-4.2 | Each topic page shall show topic-wise PYQs (Prelims + Mains) | P0 |
| FR-4.3 | Each topic page shall include smart highlights (traps, important facts) | P0 |
| FR-4.4 | Each topic page shall have micro-revision notes (30-sec bullets) | P0 |
| FR-4.5 | System shall support markdown rendering with LaTeX for formulas | P1 |
| FR-4.6 | System shall show related topics from knowledge graph | P1 |
| FR-4.7 | System shall track reading progress per topic per user | P0 |
| FR-4.8 | System shall support user highlighting and note-taking on content | P1 |
| FR-4.9 | System shall show "practice now" links to related MCQs/Mains Qs | P0 |
| FR-4.10 | System shall support bookmarking of topics | P1 |

### FR-5: MCQ Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | System shall generate topic-wise MCQ tests | P0 |
| FR-5.2 | System shall generate subtopic-wise MCQ tests | P0 |
| FR-5.3 | System shall generate mixed full-length tests (100 Qs, 120 min) | P0 |
| FR-5.4 | System shall generate PYQ-based tests (year-wise and topic-wise) | P0 |
| FR-5.5 | System shall generate AI weak-area tests based on past performance | P0 |
| FR-5.6 | System shall implement UPSC negative marking (-0.33 per wrong) | P0 |
| FR-5.7 | System shall display timer (per question + total) during test | P0 |
| FR-5.8 | System shall support flagging questions for review | P0 |
| FR-5.9 | System shall show detailed explanations after test completion | P0 |
| FR-5.10 | System shall track accuracy, time per question, silly mistakes | P0 |
| FR-5.11 | System shall detect guessing patterns | P1 |
| FR-5.12 | System shall identify concept gaps from wrong answers | P0 |
| FR-5.13 | System shall support test resumption if disconnected | P1 |
| FR-5.14 | System shall maintain test history with analytics | P0 |
| FR-5.15 | System shall support custom test creation (select topics, count) | P1 |

### FR-6: Quiz Chat System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | System shall provide chat-based quiz interface | P0 |
| FR-6.2 | User shall be able to request quizzes in natural language | P0 |
| FR-6.3 | AI shall ask questions one at a time and wait for answer | P0 |
| FR-6.4 | AI shall provide explanation after each answer | P0 |
| FR-6.5 | System shall support Rapid Fire mode (timed, no explanation) | P1 |
| FR-6.6 | System shall support Deep Concept mode (detailed explanations) | P1 |
| FR-6.7 | System shall support Elimination Training mode | P1 |
| FR-6.8 | System shall support Trap Questions mode | P1 |
| FR-6.9 | AI shall adapt difficulty based on chat session performance | P0 |
| FR-6.10 | System shall save chat session history | P0 |
| FR-6.11 | System shall support Socratic questioning (guided discovery) | P2 |
| FR-6.12 | System shall track performance per chat session | P0 |

### FR-7: Mains Answer Writing & Evaluation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | System shall provide topic-wise Mains question bank | P0 |
| FR-7.2 | System shall provide rich text editor for answer writing | P0 |
| FR-7.3 | System shall display word count and time tracking | P0 |
| FR-7.4 | AI shall evaluate answer structure (intro-body-conclusion) | P0 |
| FR-7.5 | AI shall evaluate content depth and accuracy | P0 |
| FR-7.6 | AI shall check for essential keywords | P0 |
| FR-7.7 | AI shall identify missing dimensions/perspectives | P0 |
| FR-7.8 | AI shall provide numerical score (X/10) with breakdown | P0 |
| FR-7.9 | AI shall provide specific improvement suggestions | P0 |
| FR-7.10 | System shall show model/topper answer for comparison | P1 |
| FR-7.11 | System shall highlight gaps between user answer and model answer | P1 |
| FR-7.12 | System shall maintain submission history with scores | P0 |
| FR-7.13 | System shall track improvement trajectory per topic | P1 |
| FR-7.14 | AI shall suggest diagrams/flowcharts where applicable | P2 |

### FR-8: NeuroRevise AI – Intelligent Revision Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | System shall implement adaptive spaced repetition with dynamic intervals (NOT fixed schedules) | P0 |
| FR-8.2 | System shall compute per-topic retention scores (0-100) based on recall history | P0 |
| FR-8.3 | System shall track forgetting curves per topic with subject-aware decay coefficients | P0 |
| FR-8.4 | System shall use different decay rates per subject type (factual > conceptual > analytical) | P0 |
| FR-8.5 | System shall auto-generate multi-tier micro-revision notes: 30-second (3-4 bullets), 2-minute (8-10 bullets + mnemonics), 5-minute (detailed with context) | P0 |
| FR-8.6 | System shall provide priority-sorted revision queue (urgent → due → upcoming) | P0 |
| FR-8.7 | System shall display retention heatmap across all subjects/topics | P0 |
| FR-8.8 | System shall implement Active Recall Booster sessions (concept recall, comparison, factual, application questions) | P0 |
| FR-8.9 | System shall auto-generate flashcards from notes and extracted content | P0 |
| FR-8.10 | System shall support manual flashcard creation and editing | P1 |
| FR-8.11 | System shall provide Revision Sprint modes (15-min, 30-min, 45-min timed sessions) | P1 |
| FR-8.12 | System shall predict topics the user will forget within the next 7 days | P1 |
| FR-8.13 | System shall alert users about topics with rapidly declining retention | P0 |
| FR-8.14 | System shall track and display revision streaks with gamification | P1 |
| FR-8.15 | System shall provide per-session performance feedback loop (pre-score vs post-score delta) | P1 |
| FR-8.16 | System shall support "Last 30 Days" crash revision mode with accelerated scheduling | P1 |
| FR-8.17 | System shall generate mind maps from knowledge graph for visual revision | P2 |
| FR-8.18 | System shall filter revision queue by micro-note tier (30sec / 2min / 5min) | P1 |

### FR-9: Current Affairs Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | System shall ingest magazine PDFs and extract articles | P0 |
| FR-9.2 | System shall convert articles to topic-linked notes | P0 |
| FR-9.3 | System shall auto-generate MCQs from current affairs articles | P0 |
| FR-9.4 | System shall auto-generate Mains questions from articles | P1 |
| FR-9.5 | System shall link articles to knowledge graph topics | P0 |
| FR-9.6 | System shall provide monthly compilation view | P1 |
| FR-9.7 | System shall tag articles with date and source | P0 |
| FR-9.8 | System shall support current affairs search | P1 |

### FR-10: Performance Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | System shall display subject-wise accuracy charts | P0 |
| FR-10.2 | System shall display topic-wise strength/weakness heat map | P0 |
| FR-10.3 | System shall track accuracy trend over time | P0 |
| FR-10.4 | System shall display time management analytics | P1 |
| FR-10.5 | System shall identify top 3 weak areas | P0 |
| FR-10.6 | System shall predict Prelims score with confidence interval | P1 |
| FR-10.7 | System shall predict estimated rank range | P2 |
| FR-10.8 | System shall show improvement trajectory | P0 |
| FR-10.9 | System shall compare performance with platform averages | P2 |

### FR-11: Strategy Engine (AI Mentor)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11.1 | System shall generate daily study plans | P0 |
| FR-11.2 | System shall generate weekly targets | P0 |
| FR-11.3 | Plans shall balance Prelims vs Mains preparation | P0 |
| FR-11.4 | Plans shall adapt based on performance data | P0 |
| FR-11.5 | Plans shall include revision slots from spaced repetition | P1 |
| FR-11.6 | System shall track plan completion percentage | P0 |
| FR-11.7 | AI shall detect burnout patterns and suggest breaks | P2 |
| FR-11.8 | System shall support target exam date setting | P0 |
| FR-11.9 | Plans shall prioritize weak areas while maintaining coverage | P0 |

### FR-12: SyllabusFlow AI – Tracker + Practice Orchestrator

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-12.1 | System shall display full UPSC syllabus tree with per-topic completion status (Not Started / In Progress / Completed) | P0 |
| FR-12.2 | System shall compute real-time subject-wise and overall completion percentages | P0 |
| FR-12.3 | System shall generate daily practice sets ONLY from completed topics | P0 |
| FR-12.4 | System shall support smart mixed practice combining weak + strong completed topics (70:30 ratio) | P0 |
| FR-12.5 | System shall gate daily Mains question: user MUST attempt at least X MCQs from daily set before unlocking Mains (with manual override) | P0 |
| FR-12.6 | System shall implement non-repetition system: never ask the same MCQ/Mains Q twice within 30-day window | P0 |
| FR-12.7 | System shall provide weekly essay writing prompt based on completed GS4 + current affairs topics | P1 |
| FR-12.8 | System shall implement Feedback Loop Engine: auto-adjust practice difficulty and topic distribution based on scores | P0 |
| FR-12.9 | System shall track question attempt history per user for dedup verification | P0 |
| FR-12.10 | System shall show practice generation transparency (which topics → which questions → why) | P1 |
| FR-12.11 | System shall provide practice history with scores, time, and topic breakdown | P0 |
| FR-12.12 | System shall auto-create syllabus snapshots weekly for progress comparison | P1 |
| FR-12.13 | System shall surface daily practice completion reminders and streak tracking | P1 |
| FR-12.14 | System shall support manual topic status override by student | P0 |
| FR-12.15 | System shall link syllabus tracker to knowledge graph and PDF-ingested content | P0 |

### FR-13: Second Brain – Knowledge Connections

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-13.1 | System shall auto-generate cross-topic insights and connections from studied content | P1 |
| FR-13.2 | System shall allow users to create manual insight entries (pattern, question, connection) | P1 |
| FR-13.3 | System shall display a Second Brain feed showing connections across subjects | P1 |
| FR-13.4 | System shall tag entries with linked topics and importance level | P1 |
| FR-13.5 | System shall support search within Second Brain entries | P2 |
| FR-13.6 | System shall suggest Second Brain connections during study sessions | P2 |

---

## 2. Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Page load time (first contentful paint) | < 1.5s |
| NFR-1.2 | API response time (95th percentile) | < 300ms |
| NFR-1.3 | MCQ test load time | < 2s |
| NFR-1.4 | PDF processing time (100 pages) | < 5 min |
| NFR-1.5 | AI evaluation response time | < 10s |
| NFR-1.6 | Search results return time | < 500ms |
| NFR-1.7 | Quiz chat response time | < 3s |
| NFR-1.8 | Concurrent users supported | 10,000+ |

### NFR-2: Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | System uptime | 99.9% |
| NFR-2.2 | Data backup frequency | Daily |
| NFR-2.3 | Recovery time objective (RTO) | < 1 hour |
| NFR-2.4 | Recovery point objective (RPO) | < 1 hour |
| NFR-2.5 | Zero data loss for test submissions | Guaranteed |

### NFR-3: Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | Support 100K registered users | Phase 1 |
| NFR-3.2 | Support 10K concurrent users | Phase 2 |
| NFR-3.3 | Handle 1M+ MCQ questions in database | Phase 2 |
| NFR-3.4 | Handle 100K+ PDF documents | Phase 3 |
| NFR-3.5 | Horizontal scaling of API servers | Required |

### NFR-4: Accessibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-4.1 | WCAG 2.1 Level AA compliance | Required |
| NFR-4.2 | Keyboard navigation support | Required |
| NFR-4.3 | Screen reader compatibility | Required |
| NFR-4.4 | Mobile responsive (down to 320px) | Required |
| NFR-4.5 | Offline mode for downloaded content | P2 |

---

## 3. User Stories

### Epic 1: Student Registration & Onboarding

```
US-1.1: As a student, I want to register with my email so I can access the platform.
US-1.2: As a student, I want to set my target exam date so the system can plan accordingly.
US-1.3: As a student, I want to take an initial assessment so the system knows my level.
US-1.4: As a student, I want to select my optional subject so content is personalized.
```

### Epic 2: Learning

```
US-2.1: As a student, I want to browse subjects and topics so I can study systematically.
US-2.2: As a student, I want to read concept notes so I can understand topics.
US-2.3: As a student, I want to see PYQs for each topic so I know what UPSC asks.
US-2.4: As a student, I want to highlight text and take notes so I can remember key points.
US-2.5: As a student, I want micro-notes so I can quickly revise before exam.
US-2.6: As a student, I want to see related topics so I can build connections.
```

### Epic 3: Practice

```
US-3.1: As a student, I want to take topic-wise MCQ tests so I can test my understanding.
US-3.2: As a student, I want to take full-length mock tests so I can simulate exam conditions.
US-3.3: As a student, I want PYQ practice tests so I can understand UPSC patterns.
US-3.4: As a student, I want AI to generate tests on my weak areas.
US-3.5: As a student, I want detailed analytics after each test.
US-3.6: As a student, I want to chat with AI for quiz practice.
US-3.7: As a student, I want to practice Mains answer writing with AI evaluation.
```

### Epic 4: Revision (NeuroRevise AI)

```
US-4.1: As a student, I want an adaptive revision schedule based on my actual forgetting curve, not fixed intervals.
US-4.2: As a student, I want to see my retention score for every topic so I know what's slipping.
US-4.3: As a student, I want flashcards auto-generated from my notes and extracted content.
US-4.4: As a student, I want multi-tier micro-notes (30-sec, 2-min, 5-min) for flexible revision.
US-4.5: As a student, I want active recall sessions that test me with concept, comparison, and application questions.
US-4.6: As a student, I want to start a 15/30/45-minute revision sprint when I have limited time.
US-4.7: As a student, I want to see a retention heatmap so I know which subjects are fading fastest.
US-4.8: As a student, I want the system to warn me about topics I'm about to forget.
US-4.9: As a student, I want a crash revision mode in the final 30 days before exam.
US-4.10: As a student, I want to track my revision streaks and maintain motivation.
```

### Epic 5: Analytics & Strategy

```
US-5.1: As a student, I want to see my performance dashboard.
US-5.2: As a student, I want to know my weak areas.
US-5.3: As a student, I want a daily study plan generated by AI.
US-5.4: As a student, I want score predictions based on my performance.
```

### Epic 6: Content Management (Admin)

```
US-6.1: As an admin, I want to upload PDFs and have them automatically processed.
US-6.2: As an admin, I want to manage the knowledge graph structure.
US-6.3: As an admin, I want to review and approve AI-extracted content.
US-6.4: As an admin, I want to add/edit MCQs and Mains questions manually.
US-6.5: As an admin, I want to upload current affairs magazines.
```

### Epic 7: SyllabusFlow (Tracker + Practice Orchestrator)

```
US-7.1: As a student, I want to see the full UPSC syllabus with my completion percentage per topic.
US-7.2: As a student, I want to mark topics as completed so my practice sets are generated from what I've studied.
US-7.3: As a student, I want daily practice sets generated ONLY from my completed topics.
US-7.4: As a student, I want smart mixed practice that focuses on my weak completed topics.
US-7.5: As a student, I want to unlock the daily Mains question only after completing my MCQ practice (with override option).
US-7.6: As a student, I want to never see the same question repeated within 30 days.
US-7.7: As a student, I want weekly essay prompts based on my studied topics and current affairs.
US-7.8: As a student, I want the system to auto-adjust my practice difficulty based on my recent scores.
US-7.9: As a student, I want to see WHY certain questions were chosen for my daily practice.
US-7.10: As a student, I want to track my daily practice streaks and completion history.
```

### Epic 8: Second Brain

```
US-8.1: As a student, I want auto-generated cross-topic connections and insights.
US-8.2: As a student, I want to create my own insight entries linking multiple topics.
US-8.3: As a student, I want to browse my Second Brain feed for revision and essay prep.
```

---

## 4. Data Requirements

### UPSC Subject Hierarchy (Initial Seed)

```
📚 General Studies Paper I
├── Indian History
│   ├── Ancient India
│   ├── Medieval India
│   ├── Modern India
│   └── Art & Culture
├── Indian Geography
│   ├── Physical Geography
│   ├── Indian Geography
│   ├── World Geography
│   └── Climatology
└── Indian Society
    ├── Diversity
    ├── Women & Population
    └── Globalization

📚 General Studies Paper II
├── Indian Polity
│   ├── Constitutional Framework
│   ├── Fundamental Rights
│   ├── DPSP & Fundamental Duties
│   ├── Parliament
│   ├── State Legislature
│   ├── Judiciary
│   ├── Federalism
│   ├── Local Government
│   ├── Elections
│   └── Constitutional Bodies
├── Governance
├── International Relations
└── Social Justice

📚 General Studies Paper III
├── Indian Economy
│   ├── Economic Planning
│   ├── Agriculture
│   ├── Industry
│   ├── Infrastructure
│   ├── External Sector
│   └── Banking & Finance
├── Science & Technology
├── Environment & Ecology
├── Disaster Management
└── Internal Security

📚 General Studies Paper IV (Ethics)
├── Ethics & Human Interface
├── Attitude
├── Aptitude
├── Emotional Intelligence
├── Public Administration Ethics
└── Case Studies

📚 CSAT (Prelims Paper II)
├── Comprehension
├── Logical Reasoning
├── Analytical Ability
├── Decision Making
├── Data Interpretation
└── Basic Numeracy
```

### Initial Content Requirements

| Content Type | Minimum Count (Launch) | Target (6 months) |
|-------------|----------------------|-------------------|
| Subjects | 8+ | 12+ |
| Topics | 200+ | 500+ |
| Subtopics | 1000+ | 3000+ |
| MCQ Questions | 10,000+ | 50,000+ |
| PYQ Questions | 2,000+ | 5,000+ |
| Mains Questions | 500+ | 3,000+ |
| Concept Notes | 200+ | 500+ |
| Flashcards | 5,000+ | 25,000+ |

---

## 5. AI/ML Requirements

### AI-1: LLM Integration

| ID | Requirement | Details |
|----|-------------|---------|
| AI-1.1 | Primary LLM | GPT-4o or Claude 3.5 Sonnet |
| AI-1.2 | Fallback LLM | GPT-4o-mini for cost optimization |
| AI-1.3 | Response streaming | Required for chat interfaces |
| AI-1.4 | Structured output | JSON mode for MCQ generation, evaluation |
| AI-1.5 | Token budget | Max 4000 tokens per request |
| AI-1.6 | Cost tracking | Per-user AI cost tracking |

### AI-2: RAG Pipeline

| ID | Requirement | Details |
|----|-------------|---------|
| AI-2.1 | Embedding model | text-embedding-3-small (1536 dims) |
| AI-2.2 | Vector storage | pgvector in PostgreSQL |
| AI-2.3 | Chunk size | 512-1024 tokens with overlap |
| AI-2.4 | Retrieval | Hybrid: vector similarity + BM25 |
| AI-2.5 | Context window | Top 5-10 relevant chunks |
| AI-2.6 | Re-ranking | Cross-encoder re-ranking for accuracy |

### AI-3: Content Generation

| ID | Requirement | Details |
|----|-------------|---------|
| AI-3.1 | MCQ generation | Topic-aware, difficulty-calibrated |
| AI-3.2 | Mains Q generation | Aligned with UPSC patterns |
| AI-3.3 | Flashcard generation | Concise, exam-focused |
| AI-3.4 | Explanation generation | Detailed, with references |
| AI-3.5 | Study plan generation | Performance-adaptive |
| AI-3.6 | Content quality | Human review for AI-generated content |

### AI-4: NeuroRevise AI Computation

| ID | Requirement | Details |
|----|-------------|---------|
| AI-4.1 | Forgetting curve modeling | Per-topic retention decay computation using recall history |
| AI-4.2 | Subject-aware decay | Different decay coefficients: factual (fast) > conceptual (medium) > analytical (slow) |
| AI-4.3 | Retention prediction | Predict future retention score at any given date |
| AI-4.4 | Adaptive interval calculation | Dynamic interval based on recall quality, topic difficulty, and past performance |
| AI-4.5 | Micro-note generation | LLM generates 3 tiers (30sec/2min/5min) from source content |
| AI-4.6 | Active recall Q generation | LLM generates concept recall, comparison, and application questions per topic |
| AI-4.7 | Priority engine | Rank revision queue: urgent (retention < 40%) → due → upcoming |

### AI-5: SyllabusFlow AI Computation

| ID | Requirement | Details |
|----|-------------|---------|
| AI-5.1 | Practice generation | Generate daily MCQ sets from completed-topic pool only |
| AI-5.2 | Non-repetition dedup | Track all question attempts; enforce 30-day non-repeat window |
| AI-5.3 | Difficulty adaptation | Feedback Loop: adjust question difficulty ±1 tier based on rolling 7-day accuracy |
| AI-5.4 | Topic distribution | Smart mixing: 70% weak topics, 30% strong topics from completed pool |
| AI-5.5 | Essay prompt generation | LLM generates weekly essay prompts linking GS4 ethics + current affairs |
| AI-5.6 | Gating logic | Compute MCQ-gate threshold; allow override with reason logging |

---

## 6. Security Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-1 | All passwords hashed with bcrypt (12+ rounds) | P0 |
| SEC-2 | All API endpoints authenticated (except public) | P0 |
| SEC-3 | HTTPS enforced everywhere | P0 |
| SEC-4 | SQL injection prevention (parameterized queries) | P0 |
| SEC-5 | XSS prevention (output encoding) | P0 |
| SEC-6 | CSRF protection | P0 |
| SEC-7 | Rate limiting on all endpoints | P0 |
| SEC-8 | File upload validation (type, size, content) | P0 |
| SEC-9 | API keys stored in environment variables | P0 |
| SEC-10 | Regular dependency vulnerability scanning | P1 |
| SEC-11 | Data encryption at rest | P1 |
| SEC-12 | Audit logging for admin actions | P1 |
| SEC-13 | GDPR-compliant data handling | P1 |

---

## 7. Performance Requirements

### Load Targets

| Scenario | Concurrent Users | Response Time |
|----------|-----------------|---------------|
| Normal load | 1,000 | < 200ms |
| Peak load (exam season) | 10,000 | < 500ms |
| MCQ test submission | 5,000 simultaneous | < 1s |
| PDF processing | 50 concurrent | Background |
| AI evaluation | 100 concurrent | < 15s |

### Caching Strategy

```
Layer 1: Browser cache (static assets, 1 year)
Layer 2: CDN cache (public content, 1 hour)
Layer 3: Redis cache (API responses, 5-60 min)
Layer 4: In-memory cache (frequently accessed, 5 min)
```

---

## 8. UX/UI Requirements

### UI-1: Design System

| ID | Requirement | Details |
|----|-------------|---------|
| UI-1.1 | Design language | Clean, Notion-like, minimal |
| UI-1.2 | Color scheme | Warm neutral + accent colors per subject |
| UI-1.3 | Typography | Inter/Plus Jakarta Sans, highly readable |
| UI-1.4 | Dark mode | Full dark mode support (toggle) |
| UI-1.5 | Spacing | Generous whitespace, distraction-free |
| UI-1.6 | Icons | Lucide icons |

### UI-2: Navigation

| ID | Requirement | Details |
|----|-------------|---------|
| UI-2.1 | Sidebar | Collapsible, subject → topic tree |
| UI-2.2 | Breadcrumbs | Always visible for orientation |
| UI-2.3 | Quick search | Cmd+K spotlight search |
| UI-2.4 | Keyboard shortcuts | Full keyboard navigation |
| UI-2.5 | Tab navigation | Quick switch between sections |

### UI-3: Responsive Design

| ID | Requirement | Details |
|----|-------------|---------|
| UI-3.1 | Desktop | Full feature set, multi-panel |
| UI-3.2 | Tablet | Adapted layout, touch-friendly |
| UI-3.3 | Mobile | Simplified, essential features |
| UI-3.4 | Minimum width | 320px |

### UI-4: Reading Experience

| ID | Requirement | Details |
|----|-------------|---------|
| UI-4.1 | Font size | Adjustable (14-22px) |
| UI-4.2 | Line height | 1.6-1.8 for readability |
| UI-4.3 | Max width | 720px for content column |
| UI-4.4 | Highlighting | Multi-color text highlighting |
| UI-4.5 | Focus mode | Hide sidebar, full-screen reading |

---

*Next: See `03_CHECKLIST.md` for implementation checklist.*

# ✅ Saarthi AI – UPSC Mastery OS

## Implementation Checklist

> **Version:** 1.0.0
> **Last Updated:** 28 February 2026
> Track progress by checking off items as completed.

---

## 🔵 Phase 1: Foundation (Weeks 1–4)

### Week 1: Project Setup & Infrastructure

- [x] Initialize monorepo structure (backend + frontend)
- [x] Set up Node.js + Express + TypeScript backend
- [x] Set up Next.js + TypeScript frontend
- [x] Configure ESLint + Prettier for both
- [x] Set up Docker Compose (PostgreSQL, MongoDB, Redis, MinIO)
- [x] Configure environment variables (.env files)
- [x] Set up Prisma ORM with PostgreSQL
- [x] Set up Mongoose with MongoDB
- [x] Set up Redis client (ioredis)
- [x] Create database schemas (PostgreSQL migrations)
- [x] Create MongoDB schemas/models
- [x] Set up Winston logger
- [x] Set up error handling middleware
- [x] Set up request validation (Zod)
- [x] Set up CORS configuration
- [x] Initialize Git repo with .gitignore
- [x] Set up GitHub Actions CI (lint + test)
- [x] Write project README

### Week 1: Authentication System

- [x] **POST /api/v1/auth/register** — Email/password registration
- [x] Email verification flow (send verification email)
- [x] **POST /api/v1/auth/login** — Login with JWT issuance
- [x] **POST /api/v1/auth/refresh** — Refresh token rotation
- [x] **POST /api/v1/auth/logout** — Invalidate refresh token
- [x] **GET /api/v1/auth/me** — Get current user profile
- [x] **POST /api/v1/auth/forgot-password** — Password reset request
- [x] **POST /api/v1/auth/reset-password** — Password reset execution
- [x] Google OAuth integration
- [x] Auth middleware (protect routes)
- [x] Role-based access middleware (student/admin/content_manager)
- [x] Rate limiting middleware (express-rate-limit + Redis store)
- [x] Session management in Redis
- [x] Unit tests for auth service
- [x] Integration tests for auth endpoints

### Week 2: Knowledge Graph — Schema & CRUD

- [x] Create subjects table + API
  - [x] **GET /api/v1/subjects** — List all subjects
  - [x] **GET /api/v1/subjects/:id** — Get subject details
  - [x] **POST /api/v1/subjects** — Create subject (admin)
  - [x] **PUT /api/v1/subjects/:id** — Update subject (admin)
  - [x] **DELETE /api/v1/subjects/:id** — Delete subject (admin)
- [x] Create topics table with self-referencing (parent_topic_id)
  - [x] **GET /api/v1/subjects/:id/topics** — List topics for subject
  - [x] **GET /api/v1/topics/:id** — Get topic with subtopics
  - [x] **GET /api/v1/topics/:id/subtopics** — Get subtopics
  - [x] **POST /api/v1/topics** — Create topic (admin)
  - [x] **PUT /api/v1/topics/:id** — Update topic (admin)
  - [x] **DELETE /api/v1/topics/:id** — Delete topic (admin)
- [x] Implement materialized path for fast hierarchy queries
- [x] Create content_nodes table (concept, fact, highlight, micro_note)
  - [x] **GET /api/v1/topics/:id/content** — Get all content for topic
  - [x] **POST /api/v1/content** — Create content node (admin)
  - [x] **PUT /api/v1/content/:id** — Update content node (admin)
  - [x] **DELETE /api/v1/content/:id** — Delete content node (admin)
- [x] Seed initial UPSC subject hierarchy (8 subjects, 200+ topics)
- [x] Unit tests for knowledge graph service
- [x] Integration tests for knowledge graph endpoints

### Week 3: Topic Learning Module (Backend)

- [x] Notes content model (MongoDB) — rich markdown storage
- [x] **GET /api/v1/topics/:id/notes** — Get concept notes
- [x] **GET /api/v1/topics/:id/pyqs** — Get PYQs for topic
- [x] **GET /api/v1/topics/:id/highlights** — Get smart highlights
- [x] **GET /api/v1/topics/:id/micro-notes** — Get micro revision notes
- [x] User progress tracking
  - [x] **POST /api/v1/progress/topic/:id** — Mark topic reading progress
  - [x] **GET /api/v1/progress** — Get overall progress
- [x] User highlights & notes
  - [x] **POST /api/v1/user/highlights** — Create highlight
  - [x] **GET /api/v1/user/highlights** — Get user highlights
  - [x] **DELETE /api/v1/user/highlights/:id** — Delete highlight
- [x] User bookmarks
  - [x] **POST /api/v1/user/bookmarks** — Create bookmark
  - [x] **GET /api/v1/user/bookmarks** — Get bookmarks
  - [x] **DELETE /api/v1/user/bookmarks/:id** — Delete bookmark
- [x] Full-text search endpoint
  - [x] **GET /api/v1/content/search?q=...** — Search content
- [x] Unit tests for learning module
- [x] Integration tests for learning endpoints

### Week 4: Frontend Shell

- [x] Next.js project structure
  ```
  app/
  ├── (auth)/login/page.tsx
  ├── (auth)/register/page.tsx
  ├── (main)/layout.tsx
  ├── (main)/dashboard/page.tsx
  ├── (main)/subjects/page.tsx
  ├── (main)/subjects/[id]/page.tsx
  ├── (main)/topics/[id]/page.tsx
  └── ...
  ```
- [x] Set up Tailwind CSS + shadcn/ui
- [x] Design system: colors, typography, spacing tokens
- [x] Layout component with sidebar navigation
- [x] Sidebar: Subject → Topic tree (collapsible)
- [x] Breadcrumb navigation
- [x] Cmd+K spotlight search (cmdk library)
- [x] Dark mode toggle (next-themes)
- [x] Auth pages: Login, Register, Forgot Password
- [x] Auth state management (Zustand + React Query)
- [x] API client setup (axios/fetch wrapper)
- [x] Dashboard page (placeholder)
- [x] Subject listing page
- [x] Topic page with tabs:
  - [x] Concept Notes tab (markdown rendering)
  - [x] PYQs tab
  - [x] Smart Highlights tab
  - [x] Micro Notes tab
- [x] Reading experience: adjustable font size, focus mode
- [x] Responsive layout (desktop, tablet, mobile)
- [x] Loading states + error boundaries
- [x] Toast notifications

---

## 🟢 Phase 2: Practice Engine (Weeks 5–8)

### Week 5: MCQ Engine Backend

- [x] MCQ questions table (PostgreSQL)
- [x] Seed initial MCQ data (1000+ questions)
- [x] Test generation service
  - [x] **POST /api/v1/tests/generate** — Generate test
    - [x] Topic-wise generation
    - [x] Subtopic-wise generation
    - [x] Mixed (random across subjects)
    - [x] PYQ-based generation
    - [x] AI weak-area generation
    - [x] Custom (user selects topics + count)
  - [x] Negative marking calculation (-0.33)
- [x] Test session management (Redis for active tests)
- [x] Test submission service
  - [x] **POST /api/v1/tests/:id/submit** — Submit test
  - [x] Calculate score with negative marking
  - [x] Store responses in test_responses table
- [x] Test retrieval
  - [x] **GET /api/v1/tests/:id** — Get test (during/after)
  - [x] **GET /api/v1/tests/:id/results** — Get results
  - [x] **GET /api/v1/tests/history** — Test history
- [x] Test state persistence (resume after disconnect)
- [x] Unit tests for MCQ engine
- [x] Integration tests for MCQ endpoints

### Week 6: MCQ Engine Frontend

- [ ] Test generation page
  - [ ] Subject/topic selection
  - [ ] Test type selection (topic/mixed/PYQ/weak-area)
  - [ ] Question count selector
  - [ ] Time limit selector
- [ ] Test interface
  - [ ] Question display with options (A/B/C/D)
  - [ ] Total timer + per-question timer
  - [ ] Question navigation panel (numbered grid)
  - [ ] Flag for review functionality
  - [ ] Mark for doubt
  - [ ] Next/Previous navigation
  - [ ] Auto-submit on time expiry
  - [ ] Submit confirmation modal
- [ ] Results page
  - [ ] Score display with breakdown
  - [ ] Correct/Incorrect/Skipped summary
  - [ ] Question-by-question review
  - [ ] Explanation display for each question
  - [ ] Correct answer highlighting
- [ ] Test history page
  - [ ] List of past tests with scores
  - [ ] Filter by type, subject, date
  - [ ] Performance trend chart

### Week 7: Post-Test Analytics (AI)

- [ ] Analytics service backend
  - [ ] **GET /api/v1/tests/:id/analytics** — Detailed analytics
  - [ ] Accuracy by subject/topic
  - [ ] Time per question analysis
  - [ ] Silly mistakes detection (changed from right to wrong)
  - [ ] Guessing pattern detection (very fast answers, random patterns)
  - [ ] Concept gap identification (cluster wrong answers by topic)
- [ ] AI analysis generation
  - [ ] LLM-powered weakness analysis prompt
  - [ ] Generate natural language insights
  - [ ] Suggest topics for improvement
- [ ] Analytics frontend
  - [ ] Accuracy pie chart
  - [ ] Time distribution histogram
  - [ ] Topic-wise performance bar chart
  - [ ] AI insights card (natural language)
  - [ ] "Weak areas" section
  - [ ] "Suggested next steps" section

### Week 8: Quiz Chat System

- [ ] Chat session model (MongoDB)
- [ ] Chat service backend
  - [ ] **POST /api/v1/chat/session** — Create new chat session
  - [ ] **POST /api/v1/chat/session/:id/message** — Send message
  - [ ] **GET /api/v1/chat/session/:id** — Get session history
  - [ ] **GET /api/v1/chat/sessions** — List sessions
- [ ] AI quiz generation in chat
  - [ ] Natural language intent parsing ("Ask 10 MCQs on Federalism")
  - [ ] Question generation from topic pool + AI
  - [ ] Wait for answer → evaluate → explain flow
  - [ ] Difficulty adaptation logic
- [ ] Chat modes
  - [ ] Rapid Fire mode (timed, brief feedback)
  - [ ] Deep Concept mode (detailed explanations)
  - [ ] Elimination Training (process of elimination focus)
  - [ ] Trap Questions mode (commonly confused topics)
- [ ] Chat frontend
  - [ ] Chat-like UI (messages, input)
  - [ ] Mode selector
  - [ ] Topic/subject selector
  - [ ] Session history sidebar
  - [ ] MCQ display within chat (clickable options)
  - [ ] Explanation cards within chat
  - [ ] Typing indicator for AI
  - [ ] Session performance summary at end
- [ ] Streaming responses (Server-Sent Events / WebSocket)
- [ ] Unit tests for chat service
- [ ] Integration tests for chat endpoints

---

## 🟡 Phase 3: PDF & AI (Weeks 9–12)

### Week 9: PDF Upload & Text Extraction

- [ ] S3/R2 bucket setup
- [ ] PDF upload endpoint
  - [ ] **POST /api/v1/pdf/upload** — Upload PDF (multipart)
  - [ ] File validation (type, size up to 500MB)
  - [ ] Store in S3/R2
  - [ ] Create pdf_documents record
- [ ] PDF processing queue (BullMQ)
  - [ ] Queue configuration with retry logic
  - [ ] Worker process for PDF extraction
  - [ ] Progress tracking (pages processed / total)
- [ ] Text extraction
  - [ ] pdf-parse for text extraction
  - [ ] Tesseract OCR fallback for scanned PDFs
  - [ ] Page-by-page processing
  - [ ] Table detection and extraction
- [ ] Status tracking
  - [ ] **GET /api/v1/pdf/:id/status** — Processing status
  - [ ] WebSocket/SSE for real-time progress
  - [ ] **GET /api/v1/pdfs** — List uploaded PDFs
- [ ] Store extracted text in MongoDB (pdf_extracted_text)
- [ ] Unit tests for PDF service
- [ ] Integration tests for PDF endpoints

### Week 10: AI Content Classification

- [ ] Structure detection
  - [ ] Heading hierarchy extraction
  - [ ] Section boundary detection
  - [ ] List/bullet point extraction
  - [ ] Table structure preservation
- [ ] Content classification (LLM)
  - [ ] Prompt engineering for classification
  - [ ] Classify sections: concept, fact, MCQ, mains_question, case_study
  - [ ] Confidence scoring
- [ ] MCQ extraction
  - [ ] Detect question patterns
  - [ ] Extract question text
  - [ ] Extract options (A/B/C/D)
  - [ ] Extract correct answer
  - [ ] Extract explanation (if present)
- [ ] Mains question extraction
  - [ ] Detect essay/long-answer question patterns
  - [ ] Extract question text + marks
  - [ ] Extract model answer (if present)
- [ ] Key facts extraction
  - [ ] Important dates, numbers, names
  - [ ] Constitutional articles
  - [ ] Acts and amendments
- [ ] Quality verification
  - [ ] Confidence threshold for auto-approval
  - [ ] Queue low-confidence items for human review
- [ ] PDF extraction result storage
  - [ ] **GET /api/v1/pdf/:id/extracted** — Get extracted content

### Week 11: Knowledge Graph Auto-Linking

- [ ] Topic matching service
  - [ ] Match extracted content to existing topics via:
    - [ ] Keyword matching
    - [ ] Semantic similarity (embeddings)
    - [ ] LLM-based topic classification
  - [ ] Suggest new topics when no match found
- [ ] Auto-linking pipeline
  - [ ] Link extracted MCQs to topics
  - [ ] Link extracted concepts to topics
  - [ ] Link extracted facts to topics
  - [ ] Link extracted mains questions to topics
- [ ] Admin review interface
  - [ ] Review extracted content
  - [ ] Approve/reject/edit links
  - [ ] Merge duplicate content
  - [ ] Create new topics from suggestions
- [ ] Content enrichment
  - [ ] Auto-generate smart highlights from content
  - [ ] Auto-generate micro notes from concepts
  - [ ] Tag difficulty levels on MCQs

### Week 12: RAG Pipeline

- [ ] pgvector extension setup
- [ ] Embedding generation service
  - [ ] Generate embeddings for all content nodes
  - [ ] Batch processing for existing content
  - [ ] Auto-generate on new content creation
- [ ] Vector search implementation
  - [ ] Similarity search function
  - [ ] Hybrid search (vector + BM25)
  - [ ] Search result re-ranking
- [ ] RAG context assembly
  - [ ] Query understanding (intent + entities)
  - [ ] Multi-source retrieval (notes + MCQs + PYQs)
  - [ ] Context window management (token budget)
  - [ ] Source attribution
- [ ] Integration with existing features
  - [ ] Quiz Chat uses RAG for context-aware responses
  - [ ] Content search uses hybrid search
  - [ ] Topic pages show related content via embeddings
- [ ] Search frontend improvements
  - [ ] Semantic search results page
  - [ ] Highlighted search matches
  - [ ] Faceted search (by type, subject, topic)

---

## 🟠 Phase 4: Mains + NeuroRevise + SyllabusFlow (Weeks 13–18)

### Week 13: Mains Question Bank & Interface

- [ ] Mains questions table (PostgreSQL)
- [ ] Seed initial Mains questions (500+)
  - [ ] PYQ mains questions (last 10 years)
  - [ ] Coaching institute questions
  - [ ] AI-generated questions
- [ ] Mains endpoints
  - [ ] **GET /api/v1/mains/questions** — List with filters
  - [ ] **GET /api/v1/mains/questions/:id** — Get question detail
  - [ ] **POST /api/v1/mains/questions** — Create (admin)
- [ ] Mains frontend
  - [ ] Question listing page (filter by topic, type, marks)
  - [ ] Question detail page
  - [ ] Rich text editor for answer writing (TipTap)
  - [ ] Word count display
  - [ ] Timer for answer writing
  - [ ] Save draft functionality
  - [ ] Submit for evaluation

### Week 14: AI Answer Evaluation Engine

- [ ] Evaluation service
  - [ ] **POST /api/v1/mains/submit** — Submit answer
  - [ ] Structure analysis (intro-body-conclusion detection)
  - [ ] Content depth scoring
  - [ ] Keyword presence check (from rubric)
  - [ ] Missing dimensions identification
  - [ ] Current affairs integration check
  - [ ] Diagram/flowchart suggestion
- [ ] Scoring system
  - [ ] Overall score (X/10)
  - [ ] Structure score breakdown
  - [ ] Content score breakdown
  - [ ] Keyword score breakdown
  - [ ] Improvement suggestions (actionable list)
- [ ] Model answer comparison
  - [ ] Show model/topper answer alongside
  - [ ] Highlight gaps
  - [ ] Show what student missed
- [ ] Submission management
  - [ ] **GET /api/v1/mains/submissions** — List submissions
  - [ ] **GET /api/v1/mains/submissions/:id** — Get submission detail
  - [ ] Track improvement over time per topic
- [ ] Evaluation frontend
  - [ ] Score display with gauge/ring chart
  - [ ] Detailed breakdown cards
  - [ ] Side-by-side comparison view
  - [ ] Improvement suggestions list
  - [ ] Historical score trend chart
- [ ] Prompt engineering for UPSC-specific evaluation

### Week 15: NeuroRevise AI – Core Engine

- [ ] Forgetting curve computation service
  - [ ] Per-topic retention score (0-100) based on recall history
  - [ ] Subject-aware decay coefficients (factual > conceptual > analytical)
  - [ ] Retention prediction at any future date
  - [ ] Store in `forgetting_curve_data` table + MongoDB `revision_session_log`
- [ ] Adaptive spaced repetition (DYNAMIC intervals, NOT fixed SM-2)
  - [ ] Interval calculation based on: recall quality (1-5), topic difficulty, subject decay, past history
  - [ ] Ease factor dynamically adjusted per review
  - [ ] Priority engine: urgent (retention < 40%) → due → upcoming
  - [ ] Auto-schedule first review when topic is studied
- [ ] Revision schedule management
  - [ ] **GET /api/v1/revision/due** — Today's due cards (priority-sorted)
  - [ ] **GET /api/v1/revision/due?tier=30sec|2min|5min** — Filter by micro-note tier
  - [ ] **POST /api/v1/revision/:topicId/review** — Submit recall quality (1-5), recompute interval
  - [ ] **GET /api/v1/revision/dashboard** — Retention heatmap, due counts, streak
  - [ ] **GET /api/v1/revision/forgetting-curve/:topicId** — Retention curve data
  - [ ] **GET /api/v1/revision/forgetting-curve/bulk** — Bulk curves per subject
  - [ ] **GET /api/v1/revision/retention-scores** — All per-topic retention scores with decay
- [ ] Multi-tier micro-revision notes
  - [ ] LLM auto-generates 30-second tier (3-4 bullets)
  - [ ] LLM auto-generates 2-minute tier (8-10 bullets + mnemonics)
  - [ ] LLM auto-generates 5-minute tier (detailed with context + examples)
  - [ ] **GET /api/v1/revision/micro-notes/:topicId** — Get all 3 tiers
  - [ ] **POST /api/v1/revision/micro-notes/generate** — Auto-generate from content
  - [ ] **PUT /api/v1/revision/micro-notes/:id** — Edit micro-note
  - [ ] Store in MongoDB `micro_note_content`
- [ ] Unit tests for forgetting curve computation
- [ ] Unit tests for adaptive interval calculation
- [ ] Integration tests for all NeuroRevise endpoints

### Week 16: NeuroRevise AI – Active Recall & Sprints

- [ ] Active Recall Booster
  - [ ] LLM generates recall questions per topic (concept_recall, comparison, factual, application)
  - [ ] Store in `active_recall_questions` table
  - [ ] **POST /api/v1/revision/active-recall/start** — Begin session (select topics, question count)
  - [ ] **POST /api/v1/revision/active-recall/:sessionId/answer** — Submit recall answer
  - [ ] **GET /api/v1/revision/active-recall/:sessionId/results** — Session results with delta
- [ ] Revision Sprint Modes
  - [ ] **POST /api/v1/revision/sprint/start** — Start 15/30/45-min timed sprint
  - [ ] Auto-select topics by priority (urgent first)
  - [ ] **POST /api/v1/revision/sprint/:sprintId/complete** — End sprint + summary
  - [ ] **GET /api/v1/revision/sprint/history** — Past sprints
- [ ] Flashcard system
  - [ ] Auto-generate flashcards from concept notes + key facts (LLM)
  - [ ] **GET /api/v1/revision/flashcards** — Get flashcards (by topic/subject)
  - [ ] **POST /api/v1/revision/flashcards** — Create manual flashcard
  - [ ] Card flip UI with rate recall (easy/good/hard/forgot)
  - [ ] Auto-schedule next review based on rating
- [ ] Revision predictions
  - [ ] **GET /api/v1/revision/predictions** — Topics you'll forget by next week
  - [ ] Alert system for rapidly declining retention
- [ ] Streak tracking
  - [ ] **GET /api/v1/revision/streaks** — Streak data + history
  - [ ] Daily revision streak counter with gamification
  - [ ] Streak recovery grace period (1 day)
- [ ] "Last 30 Days" crash revision mode
  - [ ] Accelerated scheduling (compress all intervals)
  - [ ] Priority: lowest retention topics first
  - [ ] Daily targets based on remaining days
- [ ] NeuroRevise dashboard frontend
  - [ ] Retention heatmap (subject × topic matrix, color-coded 0-100)
  - [ ] Today's due items (priority-sorted, filterable by tier)
  - [ ] Forgetting curve chart per topic (interactive)
  - [ ] Active recall session UI
  - [ ] Sprint mode timer + card flow
  - [ ] Flashcard practice UI (flip, rate, progress bar)
  - [ ] Predictions panel ("About to forget" warnings)
  - [ ] Streak display + calendar view
  - [ ] Crash mode toggle + daily target display

### Week 17: SyllabusFlow AI – Tracker + Practice Generation

- [ ] Syllabus progress tracking
  - [ ] `syllabus_progress` table (user × topic with status, completion %, time spent)
  - [ ] Auto-populate from UPSC syllabus hierarchy seed data
  - [ ] **GET /api/v1/syllabus/progress** — Full syllabus tree with completion %
  - [ ] **GET /api/v1/syllabus/progress/:subjectId** — Subject-level breakdown
  - [ ] **PUT /api/v1/syllabus/topics/:topicId/status** — Mark topic status (not_started / in_progress / completed)
  - [ ] **GET /api/v1/syllabus/topics/:topicId/practice-ready** — Is topic eligible for practice?
  - [ ] Auto-capture weekly syllabus snapshots (MongoDB `syllabus_snapshot`)
- [ ] Daily practice generation engine
  - [ ] Generate MCQ sets ONLY from completed-topic pool
  - [ ] Topic distribution: 70% weak topics + 30% strong topics from completed pool
  - [ ] Non-repetition system: never repeat same question within 30-day window
  - [ ] Track all attempts in `question_attempt_log` table
  - [ ] **POST /api/v1/practice/daily/generate** — Generate today's practice set
  - [ ] **GET /api/v1/practice/daily** — Today's practice queue
  - [ ] **POST /api/v1/practice/daily/:questionId/submit** — Submit answer
  - [ ] **GET /api/v1/practice/daily/results** — Daily results
  - [ ] **GET /api/v1/practice/history** — Past practice sessions
- [ ] Smart mixed practice
  - [ ] **POST /api/v1/practice/mixed/generate** — Cross-subject mixed practice from completed pool
  - [ ] Combine multiple weak areas into single session
- [ ] Store generation metadata in MongoDB `practice_generation_log`
- [ ] Unit tests for practice generation (completed-topic filter, dedup, distribution)
- [ ] Integration tests for all SyllabusFlow endpoints

### Week 18: SyllabusFlow AI – Gating, Essays & Feedback Loop

- [ ] Mains question gating system
  - [ ] **GET /api/v1/mains/daily/question** — Today's daily Mains question
  - [ ] **GET /api/v1/mains/daily/gate-status** — Has user completed required MCQs?
  - [ ] Gate logic: unlock Mains Q only after user attempts ≥ X daily MCQs
  - [ ] **POST /api/v1/mains/daily/override-gate** — Manual override with reason logging
  - [ ] **POST /api/v1/mains/daily/submit** — Submit daily Mains answer (gated)
- [ ] Weekly essay system
  - [ ] LLM generates essay prompts from completed GS4 ethics + current affairs topics
  - [ ] **GET /api/v1/essays/weekly/question** — This week's essay topic
  - [ ] **POST /api/v1/essays/weekly/submit** — Submit essay
  - [ ] **GET /api/v1/essays/submissions** — Past essay submissions with evaluations
  - [ ] AI evaluation: structure, argument quality, language, coherence, total score
  - [ ] Store in MongoDB `essay_submission`
- [ ] Feedback Loop Engine
  - [ ] Analyze rolling 7-day accuracy per topic
  - [ ] Auto-adjust practice difficulty ± 1 tier based on accuracy
  - [ ] Shift topic distribution: increase weak-area weighting if accuracy drops
  - [ ] **GET /api/v1/practice/feedback-loop** — What's adapting & why
  - [ ] **GET /api/v1/practice/non-repetition/stats** — Dedup effectiveness stats
  - [ ] Log all adaptations in `practice_generation_log`
- [ ] SyllabusFlow dashboard frontend
  - [ ] Full syllabus tree view with color-coded completion (not_started → in_progress → completed)
  - [ ] Subject-wise progress bars + overall completion ring
  - [ ] Mark topic status UI (dropdown or quick-action buttons)
  - [ ] Daily practice queue page (MCQ list + Mains gate + essay)
  - [ ] Mains gate indicator (locked/unlocked) with override button
  - [ ] Weekly essay page with rich text editor
  - [ ] Practice history timeline with scores + topic breakdown
  - [ ] Feedback loop transparency panel ("Why these questions?")
  - [ ] Non-repetition stats display
  - [ ] Weekly progress comparison (current vs last snapshot)

---

## 🔴 Phase 5: Intelligence Layer (Weeks 19–22)

### Week 19: Performance Dashboard Backend

- [ ] Performance snapshot service
  - [ ] Calculate daily performance snapshot
  - [ ] Subject-wise accuracy aggregation
  - [ ] Topic-wise accuracy aggregation
  - [ ] Time management metrics
  - [ ] Improvement trajectory calculation
  - [ ] NeuroRevise retention data integration (avg retention per subject)
  - [ ] SyllabusFlow completion data integration (syllabus % in performance)
- [ ] Performance endpoints
  - [ ] **GET /api/v1/performance/overview** — Overall stats (incl. retention + syllabus)
  - [ ] **GET /api/v1/performance/subject/:id** — Subject deep-dive
  - [ ] **GET /api/v1/performance/topic/:id** — Topic deep-dive
  - [ ] **GET /api/v1/performance/weak-areas** — Weak area analysis
- [ ] Scheduled jobs
  - [ ] Daily performance snapshot (cron)
  - [ ] Weekly performance report generation
  - [ ] Monthly trend analysis

### Week 20: AI Score Prediction & Current Affairs

- [ ] Prediction model
  - [ ] Historical performance analysis
  - [ ] Score prediction with confidence interval
  - [ ] Rank range estimation
  - [ ] Factor in retention scores + syllabus completion for better predictions
  - [ ] **GET /api/v1/performance/predictions** — Get predictions
- [ ] Weak area deep analysis
  - [ ] Cluster errors by concept
  - [ ] Identify confusion patterns (e.g., DPSP vs FR)
  - [ ] Priority-ranked improvement areas
  - [ ] AI-generated study recommendations
  - [ ] Cross-reference with NeuroRevise retention data
- [ ] Performance dashboard frontend
  - [ ] Overall score card with trend
  - [ ] Subject-wise accuracy bar chart
  - [ ] Topic-wise heat map (strength/weakness)
  - [ ] Time management scatter plot
  - [ ] Retention overview panel (from NeuroRevise)
  - [ ] Syllabus completion overview (from SyllabusFlow)
  - [ ] Weak areas list with severity
  - [ ] Predicted score display
  - [ ] Improvement trajectory line chart
  - [ ] Weekly/monthly performance comparison
- [ ] Current affairs engine
  - [ ] Magazine ingestion pipeline (upload PDFs → extract articles)
  - [ ] Auto-tag date and source
  - [ ] Convert articles to structured notes → link to knowledge graph
  - [ ] Generate MCQs + Mains questions from articles
  - [ ] Current affairs endpoints: list, monthly view, detail
  - [ ] Current affairs model (MongoDB)
  - [ ] Current affairs frontend: monthly compilation, article cards, linked MCQs/Mains

### Week 21: Strategy Engine + Second Brain

- [ ] Study plan generation service
  - [ ] Daily plan algorithm
    - [ ] Input: syllabus coverage (SyllabusFlow), weak areas, retention urgency (NeuroRevise), time available, target date
    - [ ] Output: specific tasks (study X, practice Y MCQs, write Z answers, revise N topics)
  - [ ] Weekly target generation
  - [ ] Prelims vs Mains balance logic
  - [ ] Include NeuroRevise revision slots in daily plan
  - [ ] Include SyllabusFlow practice sets in daily plan
- [ ] Strategy endpoints
  - [ ] **GET /api/v1/strategy/today** — Today's plan (unified: study + practice + revision)
  - [ ] **GET /api/v1/strategy/week** — Weekly plan
  - [ ] **POST /api/v1/strategy/generate** — Force re-generate
  - [ ] **PUT /api/v1/strategy/:id/complete** — Mark task complete
- [ ] Adaptive logic
  - [ ] Adjust based on completion rates
  - [ ] Increase weak area focus
  - [ ] Detect overload and reduce
  - [ ] Burnout detection (declining engagement)
- [ ] Second Brain module
  - [ ] Auto-generate cross-topic insights from studied content (LLM)
  - [ ] **GET /api/v1/second-brain/entries** — List entries
  - [ ] **POST /api/v1/second-brain/entries** — Create manual entry
  - [ ] **PUT /api/v1/second-brain/entries/:id** — Edit entry
  - [ ] **DELETE /api/v1/second-brain/entries/:id** — Delete entry
  - [ ] **GET /api/v1/second-brain/connections** — Cross-topic connections
  - [ ] **GET /api/v1/second-brain/insights/auto-generated** — AI-generated insights
  - [ ] Store in MongoDB `second_brain_entries`
- [ ] Strategy frontend
  - [ ] Daily plan page (unified task list: study + practice + revision + mains + essay)
  - [ ] Weekly view (calendar-style)
  - [ ] Completion percentage ring
  - [ ] AI mentor suggestions card
  - [ ] Target exam countdown
  - [ ] Plan customization (adjust time available)
- [ ] Second Brain frontend
  - [ ] Feed view of cross-topic connections
  - [ ] Create/edit insight entries
  - [ ] Search within Second Brain
  - [ ] Topic tags + importance indicators

### Week 22: Integration Testing & Cross-Module Polish

- [ ] Cross-module integration
  - [ ] NeuroRevise ↔ Strategy Engine (revision slots in daily plan)
  - [ ] SyllabusFlow ↔ MCQ Engine (practice only from completed topics)
  - [ ] SyllabusFlow ↔ Mains (daily gating integration)
  - [ ] NeuroRevise ↔ Performance Dashboard (retention data)
  - [ ] SyllabusFlow ↔ Performance Dashboard (syllabus data)
  - [ ] Second Brain ↔ Study sessions (auto-generate during study)
  - [ ] Current Affairs ↔ SyllabusFlow essays (linked prompts)
- [ ] End-to-end user flow testing
  - [ ] Complete student journey: register → study → practice → revise → evaluate
  - [ ] SyllabusFlow flow: mark topic → generate practice → gate Mains → submit essay
  - [ ] NeuroRevise flow: study → forgetting curve builds → due cards → review → retention improves
- [ ] Bug fixing and edge case handling
- [ ] Performance profiling for new modules

---

## 🟣 Phase 6: Polish & Scale (Weeks 23–26)

### Week 23: UX Polish

- [ ] Notion-like smooth transitions
- [ ] Page transition animations
- [ ] Skeleton loading states (all pages)
- [ ] Empty states with helpful CTAs
- [ ] Onboarding flow (first-time user)
  - [ ] Welcome screen
  - [ ] Target exam date selection
  - [ ] Optional subject selection
  - [ ] Initial assessment quiz
  - [ ] Syllabus progress initialization (SyllabusFlow)
  - [ ] Dashboard tutorial
- [ ] Keyboard shortcuts guide
- [ ] Tooltip system for UI elements
- [ ] Font size adjustment control
- [ ] Focus mode (hide all navigation)
- [ ] Print-friendly views for notes
- [ ] Notification system (in-app)
  - [ ] Revision reminders (NeuroRevise: "3 topics dropping retention!")
  - [ ] Daily practice reminders (SyllabusFlow: "Today's practice ready")
  - [ ] Mains gate status ("Complete 5 more MCQs to unlock Mains")
  - [ ] Daily plan reminders
  - [ ] Streak alerts (revision + practice streaks)
  - [ ] New content alerts
  - [ ] Weekly essay reminder

### Week 24: Performance Optimization

- [ ] Frontend optimization
  - [ ] Image optimization (next/image)
  - [ ] Code splitting by route
  - [ ] Lazy loading for heavy components (heatmaps, charts, forgetting curves)
  - [ ] Service worker for caching
  - [ ] Preload critical resources
- [ ] Backend optimization
  - [ ] Query optimization (EXPLAIN ANALYZE) — especially forgetting curve bulk queries
  - [ ] N+1 query resolution
  - [ ] Redis caching strategy implementation
    - [ ] Cache subject/topic hierarchy (1h TTL)
    - [ ] Cache popular MCQs (30min TTL)
    - [ ] Cache user performance stats (5min TTL)
    - [ ] Cache retention scores per user (10min TTL)
    - [ ] Cache syllabus progress per user (15min TTL)
    - [ ] Cache daily practice queue per user (until regenerated)
  - [ ] Database indexing review
    - [ ] Compound index on (user_id, topic_id) for forgetting_curve_data
    - [ ] Index on next_review_date for revision_schedule
    - [ ] Index on (user_id, date) for daily_practice_queue
    - [ ] Index on (user_id, question_id) for question_attempt_log
  - [ ] Connection pooling optimization
- [ ] CDN setup
  - [ ] Static assets on CDN
  - [ ] PDF thumbnails on CDN
- [ ] API response compression (gzip)
- [ ] Database partitioning (test_responses by date, question_attempt_log by month)

### Week 25: Testing

- [ ] Unit tests (target: 80% coverage)
  - [ ] Auth service tests
  - [ ] Knowledge graph service tests
  - [ ] MCQ engine service tests
  - [ ] Quiz chat service tests
  - [ ] Mains evaluation service tests
  - [ ] **NeuroRevise service tests** (forgetting curve, adaptive intervals, priority engine, micro-notes)
  - [ ] **SyllabusFlow service tests** (completed-topic filter, non-repetition, gating logic, feedback loop)
  - [ ] **Second Brain service tests**
  - [ ] PDF processing service tests
  - [ ] Performance service tests
  - [ ] Strategy service tests
- [ ] Integration tests
  - [ ] All API endpoints (~120+ endpoints)
  - [ ] Database operations
  - [ ] Redis operations
  - [ ] S3/R2 operations
  - [ ] Cross-module integration (NeuroRevise ↔ Strategy, SyllabusFlow ↔ MCQ Engine)
- [ ] E2E tests (Playwright)
  - [ ] User registration flow
  - [ ] Login flow
  - [ ] Topic browsing + reading
  - [ ] MCQ test flow (generate → take → submit → results)
  - [ ] Quiz chat flow
  - [ ] Mains answer submission
  - [ ] **NeuroRevise flow** (study → due cards appear → review → retention updates → heatmap changes)
  - [ ] **SyllabusFlow flow** (mark topic → generate practice → complete MCQs → gate unlocks → submit Mains)
  - [ ] **Essay flow** (weekly prompt → write → submit → evaluation)
  - [ ] PDF upload flow
  - [ ] Second Brain entry creation
- [ ] Load testing (k6 / Artillery)
  - [ ] 1000 concurrent users scenario
  - [ ] 5000 concurrent test submissions
  - [ ] PDF processing under load
  - [ ] Bulk forgetting curve computation under load
  - [ ] Practice generation under load (dedup performance)
- [ ] Security testing
  - [ ] OWASP Top 10 check
  - [ ] Dependency vulnerability scan (npm audit)
  - [ ] API fuzzing
  - [ ] Gate override abuse testing

### Week 26: Deployment & Launch

- [ ] Production environment setup
  - [ ] AWS/Vercel infrastructure
  - [ ] PostgreSQL (managed, with pgvector)
  - [ ] MongoDB Atlas (dedicated cluster)
  - [ ] Redis (managed)
  - [ ] S3 bucket + CloudFront CDN
- [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Lint → Test → Build → Deploy
  - [ ] Staging auto-deploy on PR merge
  - [ ] Production deploy on release tag
  - [ ] Database migration auto-run
  - [ ] Rollback strategy
- [ ] Monitoring & alerting
  - [ ] Sentry error tracking (frontend + backend)
  - [ ] Grafana dashboards
    - [ ] NeuroRevise: avg retention score, daily reviews, forgetting curve computations
    - [ ] SyllabusFlow: daily practice sets generated, gate overrides, dedup hit rate
  - [ ] Prometheus metrics
  - [ ] Uptime monitoring (UptimeRobot/Checkly)
  - [ ] Alert rules (error rate, response time, CPU/memory)
- [ ] Logging
  - [ ] Structured JSON logging
  - [ ] Log aggregation (ELK / CloudWatch)
  - [ ] Request tracing (correlation IDs)
- [ ] Documentation
  - [ ] API documentation (Swagger/OpenAPI) — all ~120 endpoints
  - [ ] Database schema documentation
  - [ ] NeuroRevise algorithm documentation (forgetting curve, decay coefficients, priority engine)
  - [ ] SyllabusFlow logic documentation (gating, non-repetition, feedback loop)
  - [ ] Deployment runbook
  - [ ] Incident response playbook
- [ ] Pre-launch checks
  - [ ] SSL certificate verification
  - [ ] DNS configuration
  - [ ] Backup verification
  - [ ] Load test in production environment
  - [ ] Security audit
  - [ ] GDPR compliance check
  - [ ] Accessibility audit (Lighthouse)
- [ ] Launch
  - [ ] Soft launch (invite-only)
  - [ ] Monitor error rates
  - [ ] Gather initial feedback
  - [ ] Fix critical issues
  - [ ] Public launch

---

## 🎯 Post-Launch Features (Backlog)

### V1.1 — Community Features
- [ ] Discussion forums per topic
- [ ] Peer answer review
- [ ] Study groups
- [ ] Leaderboards (revision streaks, practice streaks, syllabus completion)

### V1.2 — Advanced AI
- [ ] "UPSC Thinking Mode" — AI teaches elimination like toppers
- [ ] "Topper Brain Simulation" — AI behaves like AIR < 50
- [ ] "Why You Got This Wrong" — deep error analysis with NeuroRevise context
- [ ] Socratic questioning (guided discovery)
- [ ] Voice-based quiz (speech-to-text)
- [ ] NeuroRevise: Group forgetting patterns (cross-user insights)
- [ ] SyllabusFlow: Peer-comparison practice difficulty calibration

### V1.3 — Content Expansion
- [ ] Optional subject modules
- [ ] Interview preparation module
- [ ] State PCS support
- [ ] Multi-language micro-notes (Hindi + English)

### V1.4 — Mobile App
- [ ] React Native or Flutter app
- [ ] Offline mode (cached micro-notes + flashcards + daily practice)
- [ ] Push notifications (revision due, practice ready, streak at risk)
- [ ] Widget for daily revision + practice progress

### V1.5 — Advanced Analytics
- [ ] AI-powered comparative analysis (vs previous year toppers)
- [ ] Custom report generation
- [ ] Parent/mentor dashboard
- [ ] Study pattern optimization
- [ ] NeuroRevise: Long-term retention trends (6-month view)
- [ ] SyllabusFlow: Predicted syllabus completion date

---

## 📊 Progress Summary

| Phase | Weeks | Status | Completion |
|-------|-------|--------|------------|
| Phase 1: Foundation | 1–4 | ⬜ Not Started | 0% |
| Phase 2: Practice Engine | 5–8 | ⬜ Not Started | 0% |
| Phase 3: PDF & AI | 9–12 | ⬜ Not Started | 0% |
| Phase 4: Mains + NeuroRevise + SyllabusFlow | 13–18 | ⬜ Not Started | 0% |
| Phase 5: Intelligence Layer | 19–22 | ⬜ Not Started | 0% |
| Phase 6: Polish & Scale | 23–26 | ⬜ Not Started | 0% |
| **Overall (26 weeks)** | **1–26** | **⬜ Not Started** | **0%** |

---

## 📌 Key Metrics to Track

| Metric | Target |
|--------|--------|
| Total API Endpoints | ~120+ |
| Database Tables (PostgreSQL) | ~22 |
| MongoDB Collections | ~14 |
| Frontend Pages | ~35+ |
| Unit Test Coverage | >80% |
| E2E Test Scenarios | >40 |
| Initial Content (MCQs) | 10,000+ |
| Initial Content (Topics) | 200+ |
| NeuroRevise: Forgetting Curve Models | Per-topic per-user |
| SyllabusFlow: Non-Repetition Window | 30 days |
| Micro-Note Tiers | 3 (30sec / 2min / 5min) |
| Active Recall Question Types | 4 (concept / comparison / factual / application) |

---

*This checklist is the source of truth for implementation progress. Update regularly.*

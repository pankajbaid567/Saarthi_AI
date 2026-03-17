# 🏗️ Saarthi AI – UPSC Mastery OS

## Technical Architecture Deep Dive

> **Version:** 1.0.0
> **Last Updated:** 28 February 2026

---

## 1. Project Structure

```
UPSC-BEAST/
├── docs/                          # Documentation
│   ├── 01_IMPLEMENTATION_PLAN.md
│   ├── 02_REQUIREMENTS.md
│   ├── 03_CHECKLIST.md
│   ├── 04_ARCHITECTURE.md
│   └── 05_API_REFERENCE.md
│
├── backend/                       # Node.js + Express Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   │
│   ├── prisma/                    # PostgreSQL ORM
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── index.ts               # Entry point
│   │   ├── app.ts                 # Express app setup
│   │   ├── config/
│   │   │   ├── database.ts        # DB connections
│   │   │   ├── redis.ts           # Redis client
│   │   │   ├── s3.ts              # S3/R2 client
│   │   │   ├── ai.ts              # LLM client config
│   │   │   └── env.ts             # Environment variables
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── rbac.ts            # Role-based access
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   ├── validator.ts       # Zod validation
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   └── logger.ts          # Request logging
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.schema.ts    # Zod schemas
│   │   │   │   └── auth.test.ts
│   │   │   │
│   │   │   ├── subjects/
│   │   │   │   ├── subjects.routes.ts
│   │   │   │   ├── subjects.controller.ts
│   │   │   │   ├── subjects.service.ts
│   │   │   │   ├── subjects.schema.ts
│   │   │   │   └── subjects.test.ts
│   │   │   │
│   │   │   ├── topics/
│   │   │   │   ├── topics.routes.ts
│   │   │   │   ├── topics.controller.ts
│   │   │   │   ├── topics.service.ts
│   │   │   │   ├── topics.schema.ts
│   │   │   │   └── topics.test.ts
│   │   │   │
│   │   │   ├── content/
│   │   │   │   ├── content.routes.ts
│   │   │   │   ├── content.controller.ts
│   │   │   │   ├── content.service.ts
│   │   │   │   ├── content.schema.ts
│   │   │   │   └── content.test.ts
│   │   │   │
│   │   │   ├── mcq/
│   │   │   │   ├── mcq.routes.ts
│   │   │   │   ├── mcq.controller.ts
│   │   │   │   ├── mcq.service.ts
│   │   │   │   ├── mcq.schema.ts
│   │   │   │   ├── mcq.generator.ts   # Test generation logic
│   │   │   │   ├── mcq.analytics.ts   # Post-test analytics
│   │   │   │   └── mcq.test.ts
│   │   │   │
│   │   │   ├── quiz-chat/
│   │   │   │   ├── chat.routes.ts
│   │   │   │   ├── chat.controller.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   ├── chat.schema.ts
│   │   │   │   ├── chat.modes.ts      # Quiz modes logic
│   │   │   │   └── chat.test.ts
│   │   │   │
│   │   │   ├── mains/
│   │   │   │   ├── mains.routes.ts
│   │   │   │   ├── mains.controller.ts
│   │   │   │   ├── mains.service.ts
│   │   │   │   ├── mains.schema.ts
│   │   │   │   ├── mains.evaluator.ts # AI answer evaluation
│   │   │   │   └── mains.test.ts
│   │   │   │
│   │   │   ├── pdf/
│   │   │   │   ├── pdf.routes.ts
│   │   │   │   ├── pdf.controller.ts
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── pdf.schema.ts
│   │   │   │   ├── pdf.extractor.ts   # Text extraction
│   │   │   │   ├── pdf.classifier.ts  # Content classification
│   │   │   │   ├── pdf.linker.ts      # Knowledge graph linking
│   │   │   │   ├── pdf.worker.ts      # Queue worker
│   │   │   │   └── pdf.test.ts
│   │   │   │
│   │   │   ├── revision/
│   │   │   │   ├── revision.routes.ts
│   │   │   │   ├── revision.controller.ts
│   │   │   │   ├── revision.service.ts
│   │   │   │   ├── revision.schema.ts
│   │   │   │   ├── revision.scheduler.ts # Spaced repetition
│   │   │   │   ├── flashcard.service.ts
│   │   │   │   └── revision.test.ts
│   │   │   │
│   │   │   ├── neuro-revise/          # NeuroRevise AI Engine
│   │   │   │   ├── neuro.routes.ts
│   │   │   │   ├── neuro.controller.ts
│   │   │   │   ├── neuro.service.ts
│   │   │   │   ├── neuro.schema.ts
│   │   │   │   ├── forgetting-curve.engine.ts   # Retention decay computation
│   │   │   │   ├── adaptive-scheduler.ts        # Dynamic interval calculation
│   │   │   │   ├── priority.engine.ts           # Urgent/due/upcoming ranking
│   │   │   │   ├── micro-notes.generator.ts     # Multi-tier note generation
│   │   │   │   ├── active-recall.service.ts     # Recall booster sessions
│   │   │   │   ├── sprint.service.ts            # Timed sprint modes
│   │   │   │   ├── retention.predictor.ts       # Future retention prediction
│   │   │   │   └── neuro.test.ts
│   │   │   │
│   │   │   ├── syllabus-flow/         # SyllabusFlow AI Engine
│   │   │   │   ├── syllabus.routes.ts
│   │   │   │   ├── syllabus.controller.ts
│   │   │   │   ├── syllabus.service.ts
│   │   │   │   ├── syllabus.schema.ts
│   │   │   │   ├── practice.generator.ts        # Daily practice from completed topics
│   │   │   │   ├── non-repetition.engine.ts     # 30-day dedup system
│   │   │   │   ├── gating.service.ts            # Mains question gating logic
│   │   │   │   ├── feedback-loop.engine.ts      # Auto-adjust difficulty/distribution
│   │   │   │   ├── essay.service.ts             # Weekly essay prompt + evaluation
│   │   │   │   ├── snapshot.service.ts          # Weekly syllabus snapshots
│   │   │   │   └── syllabus.test.ts
│   │   │   │
│   │   │   ├── second-brain/          # Second Brain Module
│   │   │   │   ├── brain.routes.ts
│   │   │   │   ├── brain.controller.ts
│   │   │   │   ├── brain.service.ts
│   │   │   │   ├── brain.schema.ts
│   │   │   │   ├── insight.generator.ts         # Auto cross-topic insights
│   │   │   │   └── brain.test.ts
│   │   │   │
│   │   │   ├── current-affairs/
│   │   │   │   ├── ca.routes.ts
│   │   │   │   ├── ca.controller.ts
│   │   │   │   ├── ca.service.ts
│   │   │   │   ├── ca.schema.ts
│   │   │   │   └── ca.test.ts
│   │   │   │
│   │   │   ├── performance/
│   │   │   │   ├── performance.routes.ts
│   │   │   │   ├── performance.controller.ts
│   │   │   │   ├── performance.service.ts
│   │   │   │   ├── performance.schema.ts
│   │   │   │   ├── performance.predictor.ts
│   │   │   │   └── performance.test.ts
│   │   │   │
│   │   │   ├── strategy/
│   │   │   │   ├── strategy.routes.ts
│   │   │   │   ├── strategy.controller.ts
│   │   │   │   ├── strategy.service.ts
│   │   │   │   ├── strategy.schema.ts
│   │   │   │   ├── strategy.planner.ts
│   │   │   │   └── strategy.test.ts
│   │   │   │
│   │   │   └── user/
│   │   │       ├── user.routes.ts
│   │   │       ├── user.controller.ts
│   │   │       ├── user.service.ts
│   │   │       ├── user.schema.ts
│   │   │       └── user.test.ts
│   │   │
│   │   ├── ai/                     # AI/ML Layer
│   │   │   ├── llm.client.ts       # LLM API wrapper
│   │   │   ├── embeddings.ts       # Embedding generation
│   │   │   ├── rag.pipeline.ts     # RAG orchestration
│   │   │   ├── prompts/
│   │   │   │   ├── mcq.generation.ts
│   │   │   │   ├── answer.evaluation.ts
│   │   │   │   ├── content.classification.ts
│   │   │   │   ├── quiz.chat.ts
│   │   │   │   ├── flashcard.generation.ts
│   │   │   │   ├── micro.notes.generation.ts  # 30s/2m/5m tier prompts
│   │   │   │   ├── active.recall.generation.ts # Recall question generation
│   │   │   │   ├── essay.prompt.generation.ts  # Weekly essay topic generation
│   │   │   │   ├── essay.evaluation.ts         # Essay evaluation prompt
│   │   │   │   ├── cross.topic.insights.ts     # Second Brain insights
│   │   │   │   ├── study.plan.ts
│   │   │   │   └── score.prediction.ts
│   │   │   └── vector.search.ts    # pgvector search
│   │   │
│   │   ├── models/                 # MongoDB Models
│   │   │   ├── NotesContent.ts
│   │   │   ├── PdfExtractedText.ts
│   │   │   ├── ChatSession.ts
│   │   │   ├── AiResponseCache.ts
│   │   │   ├── UserHighlight.ts
│   │   │   ├── CurrentAffairs.ts
│   │   │   ├── MicroNoteContent.ts       # Multi-tier micro-notes
│   │   │   ├── RevisionSessionLog.ts     # Per-session revision data
│   │   │   ├── SyllabusSnapshot.ts       # Weekly syllabus progress snapshots
│   │   │   ├── EssaySubmission.ts        # Essay body + evaluation
│   │   │   ├── PracticeGenerationLog.ts  # Practice generation metadata
│   │   │   └── SecondBrainEntry.ts       # Cross-topic insights
│   │   │
│   │   ├── jobs/                   # Background Jobs
│   │   │   ├── queue.ts            # BullMQ queue setup
│   │   │   ├── pdf.processor.job.ts
│   │   │   ├── performance.snapshot.job.ts
│   │   │   ├── revision.scheduler.job.ts
│   │   │   ├── forgetting.curve.job.ts       # Nightly retention recompute
│   │   │   ├── practice.generation.job.ts    # Daily practice set generation
│   │   │   ├── syllabus.snapshot.job.ts      # Weekly syllabus snapshot
│   │   │   ├── essay.prompt.job.ts           # Weekly essay prompt generation
│   │   │   ├── insight.generator.job.ts      # Second Brain auto-insights
│   │   │   └── study.plan.job.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.ts
│   │   │   ├── ApiResponse.ts
│   │   │   ├── asyncHandler.ts
│   │   │   ├── jwt.ts
│   │   │   ├── email.ts
│   │   │   ├── pagination.ts
│   │   │   └── helpers.ts
│   │   │
│   │   └── types/
│   │       ├── express.d.ts
│   │       ├── auth.types.ts
│   │       ├── mcq.types.ts
│   │       ├── mains.types.ts
│   │       └── common.types.ts
│   │
│   └── tests/
│       ├── setup.ts
│       ├── helpers/
│       └── e2e/
│
├── frontend/                      # Next.js Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── .env.local.example
│   │
│   ├── public/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   └── (main)/
│   │   │       ├── layout.tsx       # Main app layout (sidebar)
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── subjects/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── topics/
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx
│   │   │       │       ├── notes/page.tsx
│   │   │       │       ├── pyqs/page.tsx
│   │   │       │       └── practice/page.tsx
│   │   │       ├── practice/
│   │   │       │   ├── page.tsx      # Practice home
│   │   │       │   ├── test/
│   │   │       │   │   ├── new/page.tsx
│   │   │       │   │   ├── [id]/page.tsx  # Take test
│   │   │       │   │   └── [id]/results/page.tsx
│   │   │       │   └── history/page.tsx
│   │   │       ├── quiz-chat/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [sessionId]/page.tsx
│   │   │       ├── mains/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [questionId]/page.tsx
│   │   │       │   └── submissions/page.tsx
│   │   │       ├── revision/
│   │   │       │   ├── page.tsx             # NeuroRevise dashboard
│   │   │       │   ├── flashcards/page.tsx
│   │   │       │   ├── schedule/page.tsx
│   │   │       │   ├── heatmap/page.tsx       # Retention heatmap
│   │   │       │   ├── active-recall/page.tsx # Active recall sessions
│   │   │       │   ├── sprint/page.tsx        # Sprint mode
│   │   │       │   └── curves/[topicId]/page.tsx # Per-topic forgetting curve
│   │   │       ├── syllabus/
│   │   │       │   ├── page.tsx             # Full syllabus tracker tree
│   │   │       │   └── [subjectId]/page.tsx # Subject-level breakdown
│   │   │       ├── daily-practice/
│   │   │       │   ├── page.tsx             # Today's practice queue
│   │   │       │   ├── history/page.tsx     # Practice history
│   │   │       │   └── results/page.tsx     # Daily results
│   │   │       ├── essays/
│   │   │       │   ├── page.tsx             # Weekly essay prompt
│   │   │       │   └── submissions/page.tsx # Past essays
│   │   │       ├── second-brain/
│   │   │       │   └── page.tsx             # Second Brain feed
│   │   │       ├── current-affairs/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── performance/
│   │   │       │   └── page.tsx
│   │   │       ├── strategy/
│   │   │       │   └── page.tsx
│   │   │       ├── pdf/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── CommandMenu.tsx   # Cmd+K
│   │   │   │   └── ThemeToggle.tsx
│   │   │   │
│   │   │   ├── topic/
│   │   │   │   ├── TopicTree.tsx
│   │   │   │   ├── ConceptNotes.tsx
│   │   │   │   ├── PYQSection.tsx
│   │   │   │   ├── SmartHighlights.tsx
│   │   │   │   ├── MicroNotes.tsx
│   │   │   │   └── RelatedTopics.tsx
│   │   │   │
│   │   │   ├── mcq/
│   │   │   │   ├── TestGenerator.tsx
│   │   │   │   ├── QuestionCard.tsx
│   │   │   │   ├── TestTimer.tsx
│   │   │   │   ├── QuestionNav.tsx
│   │   │   │   ├── ResultsSummary.tsx
│   │   │   │   └── AnalyticsCharts.tsx
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── MCQInChat.tsx
│   │   │   │   └── ModeSelector.tsx
│   │   │   │
│   │   │   ├── mains/
│   │   │   │   ├── AnswerEditor.tsx
│   │   │   │   ├── EvaluationDisplay.tsx
│   │   │   │   ├── ScoreBreakdown.tsx
│   │   │   │   └── ComparisonView.tsx
│   │   │   │
│   │   │   ├── revision/
│   │   │   │   ├── RevisionCalendar.tsx
│   │   │   │   ├── FlashcardDeck.tsx
│   │   │   │   ├── StreakDisplay.tsx
│   │   │   │   ├── DueItems.tsx
│   │   │   │   ├── RetentionHeatmap.tsx       # Subject × topic matrix heatmap
│   │   │   │   ├── ForgettingCurveChart.tsx   # Interactive per-topic curve
│   │   │   │   ├── MicroNotesTier.tsx         # 30s/2m/5m tier display
│   │   │   │   ├── ActiveRecallSession.tsx    # Active recall Q&A flow
│   │   │   │   ├── SprintTimer.tsx            # Sprint mode timer + cards
│   │   │   │   ├── RetentionScoreCard.tsx     # Per-topic retention score
│   │   │   │   └── PredictionPanel.tsx        # "About to forget" warnings
│   │   │   │
│   │   │   ├── syllabus-flow/
│   │   │   │   ├── SyllabusTree.tsx           # Full syllabus tree with status
│   │   │   │   ├── ProgressBar.tsx            # Subject + overall completion
│   │   │   │   ├── TopicStatusToggle.tsx      # Mark topic status
│   │   │   │   ├── DailyPracticeQueue.tsx     # Today's MCQ + Mains + Essay
│   │   │   │   ├── MainsGateIndicator.tsx     # Lock/unlock Mains gate
│   │   │   │   ├── PracticeHistory.tsx        # Past practice timeline
│   │   │   │   ├── FeedbackLoopPanel.tsx      # "Why these questions?" transparency
│   │   │   │   ├── NonRepetitionStats.tsx     # Dedup stats display
│   │   │   │   └── WeeklySnapshotCompare.tsx  # Progress comparison
│   │   │   │
│   │   │   ├── essay/
│   │   │   │   ├── EssayEditor.tsx            # Rich text essay writer
│   │   │   │   ├── EssayEvaluation.tsx        # Essay score + feedback
│   │   │   │   └── EssayHistory.tsx           # Past essays list
│   │   │   │
│   │   │   ├── second-brain/
│   │   │   │   ├── InsightFeed.tsx            # Cross-topic insight feed
│   │   │   │   ├── InsightCard.tsx            # Single insight entry
│   │   │   │   └── CreateInsight.tsx          # Manual insight creation
│   │   │   │
│   │   │   ├── performance/
│   │   │   │   ├── AccuracyChart.tsx
│   │   │   │   ├── TopicHeatMap.tsx
│   │   │   │   ├── ScorePredictor.tsx
│   │   │   │   ├── WeakAreas.tsx
│   │   │   │   └── TrendChart.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useSubjects.ts
│   │   │   ├── useTopics.ts
│   │   │   ├── useMCQ.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useMains.ts
│   │   │   ├── useRevision.ts
│   │   │   ├── useNeuroRevise.ts       # Forgetting curves, retention, sprints
│   │   │   ├── useSyllabusFlow.ts      # Syllabus progress, practice, gating
│   │   │   ├── useEssays.ts            # Weekly essays
│   │   │   ├── useSecondBrain.ts       # Insights, connections
│   │   │   ├── usePerformance.ts
│   │   │   ├── useStrategy.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── testStore.ts
│   │   │   ├── chatStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   ├── utils.ts            # Utility functions
│   │   │   └── constants.ts        # App constants
│   │   │
│   │   └── types/
│   │       ├── auth.ts
│   │       ├── subject.ts
│   │       ├── topic.ts
│   │       ├── mcq.ts
│   │       ├── mains.ts
│   │       ├── chat.ts
│   │       ├── revision.ts
│   │       ├── neuro-revise.ts       # Retention, forgetting curves, micro-notes
│   │       ├── syllabus-flow.ts      # Syllabus progress, practice, gating
│   │       ├── essay.ts              # Essay submissions
│   │       ├── second-brain.ts       # Insights, connections
│   │       ├── performance.ts
│   │       └── api.ts
│   │
│   └── tests/
│       ├── components/
│       └── e2e/
│
└── scripts/                       # Utility Scripts
    ├── seed-subjects.ts           # Seed UPSC subject hierarchy
    ├── seed-mcqs.ts               # Seed initial MCQ data
    ├── seed-pyqs.ts               # Seed PYQ data
    └── migrate-and-seed.sh        # Full setup script
```

---

## 2. Data Flow Diagrams

### 2.1 PDF Ingestion Flow

```
User uploads PDF
       │
       ▼
[API: POST /pdf/upload]
       │
       ├──→ Validate (type, size) ──→ 400 if invalid
       │
       ├──→ Upload to S3/R2
       │
       ├──→ Create pdf_documents record (status: "processing")
       │
       └──→ Enqueue to BullMQ "pdf-processing" queue
              │
              ▼
       [PDF Worker Process]
              │
              ├── Step 1: Text Extraction
              │   ├── pdf-parse (text PDFs)
              │   └── Tesseract OCR (scanned PDFs)
              │
              ├── Step 2: Structure Detection
              │   ├── Heading hierarchy
              │   ├── Section boundaries
              │   └── Table structures
              │
              ├── Step 3: Content Classification (LLM)
              │   ├── concepts → content_nodes (type: "concept")
              │   ├── MCQs → mcq_questions
              │   ├── mains Qs → mains_questions
              │   ├── facts → content_nodes (type: "fact")
              │   └── case studies → content_nodes (type: "case_study")
              │
              ├── Step 4: Topic Matching
              │   ├── Keyword matching against topic names
              │   ├── Embedding similarity against topic embeddings
              │   └── LLM classification for ambiguous cases
              │
              ├── Step 5: Knowledge Graph Linking
              │   ├── Link extracted content to matched topics
              │   ├── Queue unmatched for admin review
              │   └── Suggest new topics for unmatched content
              │
              ├── Step 6: Embedding Generation
              │   └── Generate vectors for all new content nodes
              │
              └── Step 7: Update Status
                  ├── Update pdf_documents status: "completed"
                  ├── Store extraction results
                  └── Notify user via WebSocket
```

### 2.2 MCQ Test Flow

```
User requests test
       │
       ▼
[API: POST /tests/generate]
       │
       ├── Input: { type, subjectId, topicIds, count, timeLimit }
       │
       ├── Test Generation Logic:
       │   ├── topic_wise: SELECT from mcq_questions WHERE topic_id IN (...)
       │   ├── mixed: SELECT from all subjects, balanced distribution
       │   ├── pyq_based: SELECT WHERE type = 'pyq'
       │   ├── weak_area: SELECT based on user's worst topics
       │   └── Randomize order, avoid recently seen questions
       │
       ├── Create test record (status: "in_progress")
       │
       └── Return test with questions (no answers)
              │
              ▼
       [User takes test — Frontend]
              │
              ├── Display one question at a time
              ├── Track time per question (sent to backend)
              ├── Allow flag for review
              └── Submit all answers
                     │
                     ▼
              [API: POST /tests/:id/submit]
                     │
                     ├── Calculate score (with -0.33 negative marking)
                     ├── Store all responses in test_responses
                     ├── Update test record (status: "completed")
                     │
                     ├── Trigger Analytics:
                     │   ├── Accuracy by topic
                     │   ├── Time analysis
                     │   ├── Silly mistakes (changed correct → wrong)
                     │   ├── Guessing patterns
                     │   └── Concept gap detection
                     │
                     ├── Update user performance snapshots
                     ├── Update revision schedule (wrong topics = revise sooner)
                     │
                     └── Return results + analytics
```

### 2.3 Quiz Chat Flow

```
User: "Ask 10 MCQs on Fundamental Rights"
       │
       ▼
[API: POST /chat/session] → Create session
[API: POST /chat/session/:id/message]
       │
       ├── Intent Parsing (LLM):
       │   ├── Action: quiz
       │   ├── Count: 10
       │   ├── Topic: "Fundamental Rights"
       │   └── Mode: default
       │
       ├── Fetch Questions:
       │   ├── From mcq_questions WHERE topic matches
       │   ├── Supplement with AI-generated if needed
       │   └── Order by difficulty (adaptive)
       │
       └── AI asks Question 1 → Stream to user
              │
              ▼
       User answers: "B"
              │
              ▼
       [API: POST /chat/session/:id/message]
              │
              ├── Evaluate answer
              ├── Generate explanation (LLM + RAG context)
              ├── Update session performance
              ├── Adapt difficulty for next question
              └── Ask Question 2 → Stream to user
              │
              ▼
       ... (repeat for all questions)
              │
              ▼
       Session Complete:
              ├── Generate session summary
              ├── Performance stats (accuracy, weak areas)
              ├── Update user analytics
              └── Suggest next action
```

### 2.4 Mains Evaluation Flow

```
User submits answer
       │
       ▼
[API: POST /mains/submit]
       │
       ├── Input: { questionId, answerText }
       │
       ├── Retrieve:
       │   ├── Question details + rubric
       │   ├── Model answer (if available)
       │   ├── Topic context (via RAG)
       │   └── Topper answer (if available)
       │
       ├── AI Evaluation (LLM with structured output):
       │   │
       │   ├── Structure Analysis (/2):
       │   │   ├── Introduction present & relevant?
       │   │   ├── Body well-organized?
       │   │   └── Conclusion present & impactful?
       │   │
       │   ├── Content Analysis (/4):
       │   │   ├── Key points from rubric covered?
       │   │   ├── Constitutional/legal references?
       │   │   ├── Multiple dimensions addressed?
       │   │   └── Depth of analysis?
       │   │
       │   ├── Keyword Analysis (/2):
       │   │   ├── Essential keywords present?
       │   │   └── Technical terminology correct?
       │   │
       │   ├── Presentation (/2):
       │   │   ├── Current affairs integration?
       │   │   ├── Examples used?
       │   │   └── Diagram/flowchart applicable?
       │   │
       │   └── Generate:
       │       ├── Overall score (X/10)
       │       ├── Breakdown per category
       │       ├── Missing points list
       │       ├── Improvement suggestions
       │       └── Comparison with model answer
       │
       ├── Store submission + evaluation
       │
              └── Return evaluation results
```

### 2.5 NeuroRevise AI — Forgetting Curve Flow

```
Topic studied / Revision completed
       │
       ▼
[Record event in forgetting_curve_data]
       │
       ├── Store: study_timestamp, recall_quality (1-5)
       │
       ▼
[Forgetting Curve Engine]
       │
       ├── Compute subject-aware decay coefficient:
       │   ├── Factual (History dates, articles) → fast decay (0.7)
       │   ├── Conceptual (Polity, Economy) → medium decay (0.5)
       │   └── Analytical (Ethics, case studies) → slow decay (0.3)
       │
       ├── Compute retention: R(t) = e^(-λ * t)
       │   where λ = subject_decay * difficulty_factor / (review_count^0.5)
       │
       ├── Compute predicted_forget_date (when R < 0.4)
       │
       └── Update retention_score (0-100)
              │
              ▼
[Adaptive Scheduler]
       │
       ├── Calculate next_review_date based on:
       │   ├── Current retention score
       │   ├── Last recall quality (1-5)
       │   ├── Number of prior reviews
       │   ├── Subject decay rate
       │   └── Dynamic ease factor
       │
       ├── Interval is DYNAMIC (not fixed Day 1,3,7,21,45):
       │   ├── Good recall (4-5) → interval increases by 2-3x
       │   ├── Fair recall (3) → interval stays similar
       │   └── Poor recall (1-2) → interval drops to 1 day
       │
       └── Update revision_schedule record
              │
              ▼
[Priority Engine — runs when user opens /revision]
       │
       ├── Urgent: retention < 40% or overdue > 3 days
       ├── Due: scheduled for today
       ├── Upcoming: due within 3 days
       │
       └── Sort and return prioritized revision queue
```

### 2.6 SyllabusFlow AI — Practice Generation Flow

```
User requests daily practice
       │
       ▼
[API: POST /practice/daily/generate]
       │
       ├── Step 1: Get completed topics
       │   └── SELECT topic_id FROM syllabus_progress
       │       WHERE user_id = X AND status = 'completed'
       │
       ├── Step 2: Classify completed topics
       │   ├── Weak topics: topics where recent accuracy < 60%
       │   └── Strong topics: topics where recent accuracy ≥ 60%
       │
       ├── Step 3: Topic distribution (70/30)
       │   ├── 70% questions from weak completed topics
       │   └── 30% questions from strong completed topics
       │
       ├── Step 4: Non-Repetition Check
       │   ├── Get all question_ids attempted in last 30 days
       │   │   └── SELECT question_id FROM question_attempt_log
       │   │       WHERE user_id = X AND attempt_date > NOW() - 30d
       │   ├── Exclude these from candidate pool
       │   └── If not enough unique Qs → expand to older attempted Qs
       │
       ├── Step 5: Difficulty adaptation (Feedback Loop)
       │   ├── Compute rolling 7-day accuracy per topic
       │   ├── If accuracy > 80% → increase difficulty +1 tier
       │   ├── If accuracy < 40% → decrease difficulty -1 tier
       │   └── If 40-80% → maintain current difficulty
       │
       ├── Step 6: Generate practice set
       │   ├── MCQ questions (15-20)
       │   ├── Mains question (1, gated)
       │   └── Essay prompt (weekly, if Saturday)
       │
       ├── Step 7: Log generation metadata
       │   └── Store in practice_generation_log (MongoDB)
       │       ├── Which topics → which questions → why
       │       ├── Non-repetition stats (candidates vs final)
       │       └── Feedback loop adjustments applied
       │
       └── Return daily_practice_queue
              │
              ▼
[Mains Question Gating]
       │
       ├── Check: has user attempted ≥ X MCQs from today's set?
       │   ├── YES → unlock Mains question
       │   └── NO → show lock with progress (3/5 MCQs done)
       │
       └── Override: POST /mains/daily/override-gate (reason required)
```

### 2.7 Feedback Loop Engine Flow

```
User completes daily practice
       │
       ▼
[Store results in question_attempt_log]
       │
       ▼
[Feedback Loop Engine — runs nightly via cron]
       │
       ├── Per-topic analysis (rolling 7 days):
       │   ├── Compute accuracy, avg time, improvement trend
       │   ├── Classify: improving / stable / declining
       │   └── Flag declining topics for increased weighting
       │
       ├── Difficulty calibration:
       │   ├── If avg accuracy > 80% for 3+ days → bump difficulty
       │   ├── If avg accuracy < 40% for 3+ days → reduce difficulty
       │   └── Otherwise → maintain
       │
       ├── Topic distribution shift:
       │   ├── Increase declining-topic percentage in daily set
       │   ├── Decrease strong-topic percentage
       │   └── Ensure minimum coverage across all completed subjects
       │
       ├── Cross-reference with NeuroRevise:
       │   ├── If topic retention dropping AND practice accuracy dropping
       │   │   → Mark as "critical review needed"
       │   └── Feed into strategy engine daily plan
       │
       └── Log all adaptations in practice_generation_log
```---

## 3. Key Design Decisions

### 3.1 Why PostgreSQL + MongoDB (Dual Database)?

| Data Type | PostgreSQL | MongoDB |
|-----------|-----------|---------|
| Users, auth | ✅ Relational, ACID | ❌ |
| Subject/Topic hierarchy | ✅ Joins, constraints | ❌ |
| MCQ questions | ✅ Structured queries | ❌ |
| Test scores | ✅ Aggregation, reporting | ❌ |
| Revision schedule | ✅ Date-based queries | ❌ |
| Rich text notes | ❌ | ✅ Flexible schema |
| PDF extracted text | ❌ | ✅ Variable structure |
| Chat sessions | ❌ | ✅ Nested messages |
| AI response cache | ❌ | ✅ TTL indexes |
| User highlights | ❌ | ✅ Embedded positions |

### 3.2 Why BullMQ for PDF Processing?

- PDF processing is CPU-intensive and time-consuming
- Users shouldn't wait for processing to complete
- Queue provides retry logic for failed jobs
- Separate workers can scale independently
- Progress tracking via job events

### 3.3 Why pgvector over Pinecone/Weaviate?

- No additional infrastructure (lives in PostgreSQL)
- Joins with relational data (content ↔ topics ↔ users)
- Lower cost at scale
- Simpler backup/restore
- Sufficient for expected data volume (< 1M vectors)

### 3.4 Why Adaptive Spaced Repetition (NOT Fixed SM-2)?

Traditional SM-2 uses fixed intervals (Day 1, 3, 7, 21, 45). NeuroRevise uses **dynamic intervals** because:

| Fixed SM-2 | NeuroRevise Adaptive |
|------------|---------------------|
| Same intervals for all subjects | Subject-aware decay (factual decays faster) |
| Based on ease factor only | Based on retention score + decay coefficient + recall quality |
| No concept of "urgency" | Priority engine: urgent / due / upcoming |
| No retention prediction | Predicts when you'll forget (and intervenes before) |
| No multi-tier notes | 30s/2m/5m micro-note tiers for flexible revision |

**Key formula:**
```
R(t) = e^(-λ * t)
where λ = subject_decay * difficulty_factor / (review_count^0.5)
```
This ensures factual-heavy subjects (History dates, constitutional articles) get reviewed more frequently than conceptual subjects (Ethics, governance concepts).

### 3.5 Why Practice ONLY from Completed Topics (SyllabusFlow)?

Most platforms generate practice from the entire question bank. SyllabusFlow gates practice to completed topics because:

- **Avoids exposing students to questions they haven't studied** (reduces discouragement)
- **Forces systematic study** (can't just practice random MCQs without covering the topic)
- **Ensures quality practice** (questions make sense only after topic understanding)
- **Creates natural progression** (complete topic → practice → revise → master)
- **Non-repetition dedup** works better with a growing but controlled pool

### 3.6 Why Mains Gating Behind MCQ Completion?

The daily Mains question is gated behind completing a minimum number of MCQs because:
- **MCQs reinforce factual recall** needed for Mains answers
- **Creates discipline** in daily practice routine
- **Prevents students from skipping practice** and only attempting Mains
- **Override available** for students who have valid reasons
- **Data shows** students who warm up with MCQs write better Mains answers

### 3.7 Why Dual MongoDB + PostgreSQL for NeuroRevise/SyllabusFlow?

| Data | Database | Reason |
|------|----------|--------|
| `forgetting_curve_data` | PostgreSQL | Date-based queries, mathematical computations, joins with users/topics |
| `revision_schedule` | PostgreSQL | Ordered queries (next_review_date), updates with conditions |
| `syllabus_progress` | PostgreSQL | Joins with topics/subjects hierarchy, aggregate queries |
| `question_attempt_log` | PostgreSQL | Non-repetition dedup requires fast lookups by (user, question, date) |
| `micro_note_content` | MongoDB | Variable-length content, nested bullets, flexible schema |
| `revision_session_log` | MongoDB | Nested topic arrays with scores, variable structure |
| `practice_generation_log` | MongoDB | Complex nested metadata (generation reasons, dedup stats) |
| `essay_submission` | MongoDB | Rich text body + nested evaluation object |
| `syllabus_snapshot` | MongoDB | Nested subject arrays with variable depth |

---

## 4. Environment Variables

```env
# ===== Server =====
NODE_ENV=development
PORT=3001
API_VERSION=v1
FRONTEND_URL=http://localhost:3000

# ===== PostgreSQL =====
DATABASE_URL=postgresql://user:password@localhost:5432/saarthi_ai

# ===== MongoDB =====
MONGODB_URI=mongodb://localhost:27017/saarthi_ai

# ===== Redis =====
REDIS_URL=redis://localhost:6379

# ===== JWT =====
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ===== AI =====
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
# OR
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# ===== Cloud Storage =====
S3_BUCKET=saarthi-ai-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
# OR for Cloudflare R2:
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=saarthi-ai-uploads

# ===== Email =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@saarthi-ai.com

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

---

## 5. Unique Differentiator Features (Technical Spec)

### 5.1 "UPSC Thinking Mode"

```
System prompt teaches elimination like toppers:
1. Read all options first
2. Eliminate obviously wrong
3. Find trap keywords ("always", "never", "only")
4. Use constitutional knowledge to narrow
5. If 50/50, apply UPSC patterns

Implementation: Custom prompt chain that walks user through elimination
for each question in Quiz Chat mode.
```

### 5.2 "Why You Got This Wrong"

```
Post-test: For each wrong answer, AI generates:
1. What you likely thought (common misconception)
2. Why it's actually wrong
3. The correct reasoning
4. Related topic to revise
5. Similar PYQ to watch out for

Implementation: LLM with context of question + user's answer + correct answer + topic data
```

### 5.3 "Last 30 Days Mode"

```
Crash revision system (powered by NeuroRevise):
1. Analyze all studied topics + retention scores
2. Rank by forgetting curve urgency (lowest retention first)
3. Generate compressed revision schedule (accelerated intervals)
4. Focus on high-yield topics (PYQ frequency + low retention)
5. Daily micro-tests (30 MCQs covering all subjects)
6. Sprint-only mode: 15-min sprints throughout the day

Implementation: NeuroRevise crash mode + custom scheduling + LLM study plan
```

### 5.4 "Topper Brain Simulation"

```
AI behaves like an AIR < 50 candidate:
1. Answers questions like a topper
2. Explains thinking process
3. Shares "how I would approach this in exam"
4. Gives time management tips per question type
5. Demonstrates answer writing style

Implementation: System prompt engineering + RAG from topper interview data
```

### 5.5 "NeuroRevise Retention Heatmap"

```
Visual retention overview:
1. Subject × Topic matrix with color-coded retention (0-100)
2. Red (< 40%) → Orange (40-60%) → Yellow (60-80%) → Green (> 80%)
3. Click any cell to see forgetting curve chart
4. Animated decay showing how retention drops in real-time
5. "About to forget" warnings for topics approaching threshold

Implementation: Canvas/SVG heatmap + D3.js/Recharts + forgetting curve API
```

### 5.6 "SyllabusFlow Daily Practice Orchestration"

```
Intelligent daily practice system:
1. Only generates from completed topics (forces systematic study)
2. 70% weak + 30% strong topic distribution
3. Non-repetition: never asks same Q within 30 days
4. Mains gated behind MCQ completion (with override)
5. Weekly essay from completed GS4 + current affairs
6. Full transparency: "Why these questions?" panel
7. Feedback loop: auto-adjusts difficulty based on 7-day rolling accuracy

Implementation: Practice generator + dedup engine + gating service + feedback loop
```

### 5.7 "Second Brain — Cross-Topic Connections"

```
Auto-generated knowledge connections:
1. AI detects patterns across studied topics (e.g., "73rd Amendment connects Polity + Governance + Rural Dev")
2. Users can create manual insight entries
3. Feed view shows cross-topic connections during study
4. Useful for Mains essays that need multi-dimensional perspectives
5. Tags with importance + linked topics

Implementation: LLM cross-topic analysis + MongoDB storage + feed UI
```

---

*This document serves as the technical blueprint for building Saarthi AI. Reference alongside 01_IMPLEMENTATION_PLAN.md and 03_CHECKLIST.md.*

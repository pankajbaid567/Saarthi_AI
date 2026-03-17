# 📡 Saarthi AI – UPSC Mastery OS

## API Reference

> **Version:** 1.0.0
> **Base URL:** `/api/v1`
> **Last Updated:** 28 February 2026

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Roles
- `student` — Default user role
- `admin` — Full access
- `content_manager` — Content CRUD access

---

## 1. Auth Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "name": "Pankaj Baid",
  "email": "pankaj@example.com",
  "password": "SecurePassword123!",
  "targetExamDate": "2027-05-25"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Pankaj Baid",
      "email": "pankaj@example.com",
      "role": "student"
    },
    "message": "Verification email sent"
  }
}
```

### POST /auth/login
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "pankaj@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "uuid",
      "name": "Pankaj Baid",
      "email": "pankaj@example.com",
      "role": "student"
    }
  }
}
```

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/logout
Invalidate refresh token. *Auth required.*

### GET /auth/me
Get current user profile. *Auth required.*

### POST /auth/forgot-password
Request password reset.

### POST /auth/reset-password
Reset password with token.

---

## 2. Subjects & Topics

### GET /subjects
List all subjects.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Indian Polity",
      "slug": "indian-polity",
      "description": "Constitutional framework, governance...",
      "icon": "⚖️",
      "order": 1,
      "topicCount": 42,
      "isActive": true
    }
  ]
}
```

### GET /subjects/:id
Get subject details with top-level topics.

### GET /subjects/:id/topics
List all topics for a subject (tree structure).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Fundamental Rights",
      "slug": "fundamental-rights",
      "level": 1,
      "order": 1,
      "mcqCount": 145,
      "pyqCount": 23,
      "mainsCount": 8,
      "userProgress": 65,
      "subtopics": [
        {
          "id": "uuid",
          "name": "Article 14 - Right to Equality",
          "slug": "article-14",
          "level": 2,
          "mcqCount": 32,
          "subtopics": []
        }
      ]
    }
  ]
}
```

### GET /topics/:id
Get topic with all metadata.

### GET /topics/:id/subtopics
Get subtopics of a topic.

### GET /topics/:id/content
Get all content nodes for a topic.

**Query params:** `?type=concept|fact|highlight|micro_note`

### GET /topics/:id/mcqs
Get MCQs for a topic.

**Query params:** `?difficulty=1-5&type=standard|pyq|ai_generated&limit=50`

### GET /topics/:id/pyqs
Get PYQs (Prelims + Mains) for a topic.

**Query params:** `?type=prelims|mains&yearFrom=2015&yearTo=2025`

### GET /topics/:id/mains-questions
Get Mains questions for a topic.

### POST /topics *(Admin)*
Create a new topic.

### PUT /topics/:id *(Admin)*
Update a topic.

---

## 3. Content

### GET /content/:id
Get a specific content node.

### GET /content/search
Search content across all topics.

**Query params:** `?q=fundamental+rights&type=concept&subjectId=uuid&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "Fundamental Rights - Overview",
        "body": "Article 12 to 35...",
        "type": "concept",
        "topicName": "Fundamental Rights",
        "subjectName": "Indian Polity",
        "relevanceScore": 0.95
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

### POST /content *(Admin)*
Create content node.

### PUT /content/:id *(Admin)*
Update content node.

---

## 4. MCQ Engine

### POST /tests/generate
Generate a new test.

**Request:**
```json
{
  "type": "topic_wise",
  "subjectId": "uuid",
  "topicIds": ["uuid1", "uuid2"],
  "questionCount": 30,
  "timeLimitMinutes": 45,
  "difficulty": "mixed",
  "includeTypes": ["standard", "pyq"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "testId": "uuid",
    "title": "Fundamental Rights - 30 Questions",
    "type": "topic_wise",
    "questionCount": 30,
    "timeLimitMinutes": 45,
    "questions": [
      {
        "id": "uuid",
        "questionNumber": 1,
        "questionText": "Which of the following is NOT a Fundamental Right?",
        "options": {
          "A": "Right to Equality",
          "B": "Right to Property",
          "C": "Right to Freedom",
          "D": "Right against Exploitation"
        },
        "difficulty": 2,
        "type": "standard"
      }
    ]
  }
}
```

### GET /tests/:id
Get test details (during or after test).

### POST /tests/:id/submit
Submit test answers.

**Request:**
```json
{
  "responses": [
    {
      "questionId": "uuid",
      "selectedOption": "B",
      "timeTakenSeconds": 45
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "testId": "uuid",
    "score": 18.67,
    "totalMarks": 30,
    "correct": 22,
    "incorrect": 4,
    "skipped": 4,
    "negativeMarks": 1.33,
    "accuracy": 84.6,
    "timeTaken": "38:24",
    "avgTimePerQuestion": 76.8
  }
}
```

### GET /tests/:id/results
Get detailed results with explanations.

### GET /tests/:id/analytics
Get AI-powered analytics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topicWiseAccuracy": {
      "Fundamental Rights": { "correct": 8, "total": 10, "accuracy": 80 },
      "DPSP": { "correct": 3, "total": 5, "accuracy": 60 }
    },
    "timeAnalysis": {
      "avgTimeCorrect": 52,
      "avgTimeIncorrect": 89,
      "fastestCorrect": 15,
      "slowestCorrect": 120
    },
    "sillyMistakes": 1,
    "guessingPatterns": {
      "suspected": 2,
      "avgTimeOnGuessed": 12
    },
    "conceptGaps": [
      "Confusion between DPSP and Fundamental Duties",
      "Weak on Article 19 restrictions"
    ],
    "aiInsight": "You have strong understanding of basic FR concepts but struggle with nuanced differences between DPSP and FR. Focus on comparative study of Part III vs Part IV.",
    "suggestedTopics": ["DPSP", "Fundamental Duties", "Article 19 Restrictions"]
  }
}
```

### GET /tests/history
Get test history.

**Query params:** `?type=topic_wise&subjectId=uuid&page=1&limit=10`

---

## 5. Quiz Chat

### POST /chat/session
Create new chat session.

**Request:**
```json
{
  "mode": "deep_concept",
  "topicId": "uuid",
  "message": "Ask me 10 MCQs on Federalism"
}
```

### POST /chat/session/:id/message
Send message in chat session.

**Request:**
```json
{
  "message": "B"
}
```

**Response (200) — Streamed:**
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "❌ Incorrect! The correct answer is **C**.\n\n**Explanation:** ...",
    "metadata": {
      "questionNumber": 3,
      "isCorrect": false,
      "correctOption": "C",
      "sessionAccuracy": 66.7,
      "nextQuestion": { ... }
    }
  }
}
```

### GET /chat/session/:id
Get session history.

### GET /chat/sessions
List all chat sessions.

---

## 6. Mains Answer Writing

### GET /mains/questions
List Mains questions.

**Query params:** `?topicId=uuid&type=pyq|coaching|ai_generated&marks=10|15&page=1`

### GET /mains/questions/:id
Get question detail with rubric.

### POST /mains/submit
Submit answer for evaluation.

**Request:**
```json
{
  "questionId": "uuid",
  "answerText": "The concept of judicial review in India...",
  "wordCount": 245
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submissionId": "uuid",
    "overallScore": 6.5,
    "maxScore": 10,
    "breakdown": {
      "structure": {
        "score": 1.5,
        "maxScore": 2,
        "feedback": "Good introduction, but conclusion is weak. Add a forward-looking statement."
      },
      "content": {
        "score": 2.5,
        "maxScore": 4,
        "feedback": "Covered basic concepts well. Missing: Judicial Activism debate, Basic Structure Doctrine, comparison with US system.",
        "missingPoints": [
          "Basic Structure Doctrine (Kesavananda Bharati)",
          "Judicial Activism vs Judicial Restraint",
          "Comparison with other countries"
        ]
      },
      "keywords": {
        "score": 1.5,
        "maxScore": 2,
        "present": ["judicial review", "Article 13", "Part III"],
        "missing": ["Marbury v. Madison", "Basic Structure", "PIL"]
      },
      "presentation": {
        "score": 1,
        "maxScore": 2,
        "feedback": "Add a flowchart showing hierarchy of judicial review. Include recent current affairs examples."
      }
    },
    "improvements": [
      "Add the Basic Structure Doctrine as a key dimension",
      "Include a diagram showing judicial review process",
      "Reference recent cases (2024-2025) for current relevance",
      "Strengthen conclusion with a balanced view"
    ],
    "modelAnswer": "...",
    "topperAnswer": "..."
  }
}
```

### GET /mains/submissions
List user's submissions.

### GET /mains/submissions/:id
Get submission detail with evaluation.

---

## 7. PDF Ingestion

### POST /pdf/upload
Upload PDF for processing.

**Request:** Multipart form data with `file` field.

**Response (202):**
```json
{
  "success": true,
  "data": {
    "pdfId": "uuid",
    "filename": "laxmikanth-polity.pdf",
    "status": "processing",
    "pageCount": 450,
    "estimatedTime": "5-8 minutes"
  }
}
```

### GET /pdf/:id/status
Check processing status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pdfId": "uuid",
    "status": "processing",
    "progress": {
      "pagesProcessed": 230,
      "totalPages": 450,
      "percentage": 51,
      "currentStep": "content_classification"
    },
    "extractedSoFar": {
      "concepts": 45,
      "mcqs": 120,
      "mainsQuestions": 15,
      "facts": 89
    }
  }
}
```

### GET /pdf/:id/extracted
Get extracted content.

### GET /pdfs
List uploaded PDFs.

---

## 8. NeuroRevise AI — Adaptive Revision Engine

### GET /revision/dashboard
NeuroRevise dashboard with retention overview.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "retentionOverview": {
      "avgRetention": 68.4,
      "topicsTracked": 142,
      "urgentCount": 8,
      "dueToday": 15,
      "upcomingThisWeek": 32
    },
    "revisionStreak": {
      "current": 15,
      "longest": 28,
      "lastRevisionDate": "2026-02-28"
    },
    "retentionBySubject": [
      {
        "subjectId": "uuid",
        "name": "Indian Polity",
        "avgRetention": 74.2,
        "topicCount": 42,
        "urgentTopics": 2
      }
    ],
    "flashcardsDue": 45,
    "totalDue": 15,
    "overdue": 3
  }
}
```

### GET /revision/due
Get items due for revision today (priority-sorted).

**Query params:** `?tier=30sec|2min|5min`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dueItems": [
      {
        "id": "uuid",
        "topicId": "uuid",
        "topicName": "Fundamental Rights",
        "subjectName": "Indian Polity",
        "priority": "urgent",
        "retentionScore": 32,
        "decayRate": 0.7,
        "lastReviewed": "2026-02-18",
        "intervalDays": 3,
        "reviewCount": 5,
        "microNoteTier": "2min",
        "microNoteBullets": ["Article 14-18 cover Right to Equality...", "..."]
      }
    ],
    "totalDue": 15,
    "urgentCount": 8,
    "estimatedTimeMinutes": 45
  }
}
```

### POST /revision/:topicId/review
Submit recall quality after reviewing a topic.

**Request:**
```json
{
  "quality": 4,
  "timeSpentSeconds": 120,
  "tier": "2min"
}
```
Quality: 1 (forgot completely) → 5 (effortless recall)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topicId": "uuid",
    "previousRetention": 32,
    "newRetention": 61,
    "previousInterval": 3,
    "newInterval": 8,
    "nextReviewDate": "2026-03-08",
    "status": "due"
  }
}
```

### GET /revision/forgetting-curve/:topicId
Get forgetting curve data for a specific topic.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topicId": "uuid",
    "topicName": "Fundamental Rights",
    "subjectDecayCoefficient": 0.5,
    "dataPoints": [
      { "date": "2026-02-01", "retention": 100, "event": "studied" },
      { "date": "2026-02-03", "retention": 78, "event": "reviewed", "quality": 4 },
      { "date": "2026-02-10", "retention": 55, "event": "reviewed", "quality": 3 },
      { "date": "2026-02-21", "retention": 32, "event": null }
    ],
    "predictedForgotDate": "2026-03-02",
    "currentRetention": 32
  }
}
```

### GET /revision/forgetting-curve/bulk
Bulk forgetting curves for a subject.

**Query params:** `?subjectId=uuid`

### GET /revision/retention-scores
Get per-topic retention scores with decay info.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "topicId": "uuid",
        "topicName": "Fundamental Rights",
        "subjectName": "Indian Polity",
        "retentionScore": 32,
        "decayRate": 0.7,
        "status": "urgent",
        "lastReviewed": "2026-02-18",
        "nextReview": "2026-02-28"
      }
    ]
  }
}
```

### GET /revision/micro-notes/:topicId
Get all 3 tiers of micro-notes for a topic.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topicId": "uuid",
    "topicName": "Fundamental Rights",
    "tiers": {
      "30sec": {
        "id": "mongo-id",
        "bullets": [
          "Article 12-35: Fundamental Rights (6 categories)",
          "Article 14: Right to Equality",
          "Article 19: 6 Freedoms (speech, assembly, association, movement, residence, profession)"
        ],
        "bulletCount": 3
      },
      "2min": {
        "id": "mongo-id",
        "bullets": [
          "Article 12-35: FRs are justiciable, enforceable by courts",
          "6 categories: Equality (14-18), Freedom (19-22), Exploitation (23-24), Religion (25-28), Cultural (29-30), Constitutional Remedies (32)",
          "Article 19(2-6): Reasonable restrictions on each freedom",
          "Mnemonic: EFERCR for 6 categories",
          "..."
        ],
        "mnemonics": ["EFERCR = Equality, Freedom, Exploitation, Religion, Cultural, Remedies"],
        "bulletCount": 10
      },
      "5min": {
        "id": "mongo-id",
        "bullets": ["...detailed with examples, cases, PYQ references..."],
        "bulletCount": 18,
        "keyPhrases": ["Kesavananda Bharati", "Maneka Gandhi", "Golden Triangle"]
      }
    }
  }
}
```

### POST /revision/micro-notes/generate
Auto-generate micro-notes from topic content using LLM.

**Request:**
```json
{
  "topicId": "uuid"
}
```

### PUT /revision/micro-notes/:id
Edit a micro-note.

### POST /revision/active-recall/start
Start an active recall booster session.

**Request:**
```json
{
  "topicIds": ["uuid1", "uuid2"],
  "questionCount": 10,
  "types": ["concept_recall", "comparison", "application"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "questions": [
      {
        "id": "uuid",
        "type": "concept_recall",
        "questionText": "Explain the difference between Article 14 and Article 15 in the context of equality.",
        "expectedAnswer": "Article 14 guarantees equality before law (general), while Article 15 prohibits discrimination on specific grounds (religion, race, caste, sex, place of birth)..."
      }
    ],
    "totalQuestions": 10
  }
}
```

### POST /revision/active-recall/:sessionId/answer
Submit an answer in active recall session.

**Request:**
```json
{
  "questionId": "uuid",
  "userAnswer": "Article 14 is about general equality, Article 15 is about specific non-discrimination...",
  "confidenceLevel": 3
}
```

### GET /revision/active-recall/:sessionId/results
Get active recall session results.

### POST /revision/sprint/start
Start a timed revision sprint.

**Request:**
```json
{
  "durationMinutes": 30,
  "subjectId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "sprintId": "uuid",
    "durationMinutes": 30,
    "topics": [
      {
        "topicId": "uuid",
        "topicName": "Fundamental Rights",
        "priority": "urgent",
        "retentionScore": 32,
        "microNoteTier": "2min"
      }
    ],
    "totalTopics": 8,
    "startedAt": "2026-02-28T10:00:00Z"
  }
}
```

### POST /revision/sprint/:sprintId/complete
Complete a sprint and get summary.

### GET /revision/sprint/history
Get past sprint sessions.

### GET /revision/flashcards
Get flashcards (by topic/subject, due only, etc.)

**Query params:** `?topicId=uuid&due=true&limit=30`

### POST /revision/flashcards
Create manual flashcard.

### GET /revision/streaks
Get revision streak data.

### GET /revision/predictions
Topics you'll forget within the next 7 days.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictedToForget": [
      {
        "topicId": "uuid",
        "topicName": "Indian Economy - External Sector",
        "currentRetention": 48,
        "predictedRetentionIn7Days": 28,
        "decayRate": 0.7,
        "recommendation": "Review within 2 days to maintain above 40%"
      }
    ]
  }
}
```

---

## 9. Current Affairs

### GET /current-affairs
List current affairs articles.

**Query params:** `?month=2&year=2026&topicId=uuid&page=1`

### GET /current-affairs/:month/:year
Monthly compilation.

### GET /current-affairs/:id
Article detail with linked MCQs and Mains Qs.

---

## 10. Performance

### GET /performance/overview
Overall performance stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "testsAttempted": 45,
      "totalQuestions": 1350,
      "accuracy": 72.4,
      "avgScore": 72.4,
      "improvement": "+5.2% from last month"
    },
    "subjectWise": [
      {
        "subjectId": "uuid",
        "name": "Indian Polity",
        "accuracy": 78.5,
        "testsAttempted": 12,
        "trend": "improving"
      }
    ],
    "recentTests": [...],
    "studyStreak": 15,
    "totalStudyHours": 245
  }
}
```

### GET /performance/subject/:id
Subject deep-dive.

### GET /performance/topic/:id
Topic deep-dive.

### GET /performance/predictions
AI score predictions.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "prelimsPrediction": {
      "score": 82,
      "confidenceInterval": [77, 87],
      "outOf": 200,
      "category": "Safe zone",
      "trend": "improving"
    },
    "weakAreas": [
      {
        "topic": "Indian Economy - External Sector",
        "accuracy": 45,
        "importance": "high",
        "suggestion": "Focus on Balance of Payments and Exchange Rate mechanisms"
      }
    ],
    "estimatedRank": {
      "range": "150-300",
      "confidence": "moderate",
      "note": "Improve Economy and Geography for sub-100"
    }
  }
}
```

### GET /performance/weak-areas
Weak area analysis.

---

## 11. Strategy

### GET /strategy/today
Get today's study plan.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-28",
    "targetExamDate": "2027-05-25",
    "daysRemaining": 451,
    "tasks": [
      {
        "id": "uuid",
        "type": "study",
        "subject": "Indian Polity",
        "topic": "Fundamental Rights",
        "description": "Read and make notes on Article 19-22",
        "estimatedMinutes": 60,
        "priority": "high",
        "completed": false
      },
      {
        "id": "uuid",
        "type": "practice",
        "description": "50 MCQs on Polity (mixed topics)",
        "estimatedMinutes": 45,
        "priority": "high",
        "completed": false
      },
      {
        "id": "uuid",
        "type": "mains",
        "description": "Write 2 Mains answers on Fundamental Rights",
        "estimatedMinutes": 40,
        "priority": "medium",
        "completed": false
      },
      {
        "id": "uuid",
        "type": "revision",
        "description": "Revise: Ancient India, Geography basics (due today)",
        "estimatedMinutes": 30,
        "priority": "high",
        "completed": false
      }
    ],
    "totalMinutes": 175,
    "completionPercentage": 0,
    "aiNote": "Focus on Polity today — it has the highest PYQ frequency and your accuracy is improving. Spend extra time on Article 19 restrictions."
  }
}
```

### GET /strategy/week
Get weekly plan.

### POST /strategy/generate
Force re-generate plan.

### PUT /strategy/:id/complete
Mark task as complete.

---

## 12. User

### GET /user/highlights
Get user's text highlights.

### POST /user/highlights
Create highlight.

### GET /user/notes
Get user's personal notes.

### POST /user/notes
Create personal note.

### GET /user/bookmarks
Get bookmarks.

### POST /user/bookmarks
Create bookmark.

### DELETE /user/bookmarks/:id
Delete bookmark.

---

## 13. SyllabusFlow AI — Tracker + Practice Orchestrator

### GET /syllabus/progress
Full syllabus tree with completion percentages.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overallCompletion": 34.5,
    "subjects": [
      {
        "subjectId": "uuid",
        "name": "Indian Polity",
        "totalTopics": 42,
        "completed": 18,
        "inProgress": 5,
        "notStarted": 19,
        "completionPercentage": 42.9,
        "topics": [
          {
            "topicId": "uuid",
            "name": "Fundamental Rights",
            "status": "completed",
            "completionPercentage": 100,
            "timeSpentMinutes": 180,
            "linkedMcqsGenerated": 45,
            "linkedMainsGenerated": 3
          }
        ]
      }
    ]
  }
}
```

### GET /syllabus/progress/:subjectId
Subject-level breakdown.

### PUT /syllabus/topics/:topicId/status
Update topic status.

**Request:**
```json
{
  "status": "completed"
}
```
Status: `not_started` | `in_progress` | `completed`

### GET /syllabus/topics/:topicId/practice-ready
Check if topic is eligible for practice generation.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topicId": "uuid",
    "practiceReady": true,
    "status": "completed",
    "availableMcqs": 145,
    "availableMainsQs": 8,
    "lastPracticedDate": "2026-02-25"
  }
}
```

### POST /practice/daily/generate
Generate today's daily practice set.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-28",
    "mcqs": [
      {
        "questionId": "uuid",
        "topicName": "Fundamental Rights",
        "difficulty": 3,
        "source": "weak_area"
      }
    ],
    "mcqCount": 20,
    "mainsQuestion": {
      "questionId": "uuid",
      "topicName": "DPSP",
      "marks": 10,
      "gateStatus": "locked",
      "mcqsRequiredToUnlock": 15,
      "mcqsCompleted": 0
    },
    "essayQuestion": null,
    "generationMetadata": {
      "topicDistribution": {
        "weakTopics": 14,
        "strongTopics": 6
      },
      "nonRepetitionStats": {
        "candidatePool": 850,
        "excludedAsRecent": 120,
        "finalSelected": 20
      },
      "feedbackLoopApplied": true,
      "difficultyAdjustments": [
        { "topic": "Fundamental Rights", "adjustment": "+1 (accuracy > 80%)" }
      ]
    }
  }
}
```

### GET /practice/daily
Get today's practice queue.

### POST /practice/daily/:questionId/submit
Submit answer for a daily practice question.

**Request:**
```json
{
  "selectedOption": "B",
  "timeTakenSeconds": 52
}
```

### GET /practice/daily/results
Get today's practice results.

### GET /practice/history
Past practice sessions.

**Query params:** `?page=1&limit=10&subjectId=uuid`

### POST /practice/mixed/generate
Generate smart mixed practice from completed topics.

### GET /mains/daily/question
Get today's daily Mains question.

### GET /mains/daily/gate-status
Check if user has completed required MCQs to unlock Mains.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gateStatus": "locked",
    "mcqsRequired": 15,
    "mcqsCompleted": 8,
    "remaining": 7,
    "overrideAvailable": true
  }
}
```

### POST /mains/daily/override-gate
Manually override the Mains gate.

**Request:**
```json
{
  "reason": "Already completed practice on another platform today"
}
```

### POST /mains/daily/submit
Submit daily Mains answer (gated).

### GET /essays/weekly/question
Get this week's essay topic.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "questionId": "uuid",
    "topic": "Is judicial activism a threat to the doctrine of separation of powers?",
    "wordLimit": 1200,
    "linkedTopics": ["Judicial Review", "Separation of Powers", "PIL"],
    "currentAffairsContext": "Recent Supreme Court verdicts on...",
    "weekOf": "2026-02-24"
  }
}
```

### POST /essays/weekly/submit
Submit weekly essay.

**Request:**
```json
{
  "questionId": "uuid",
  "body": "The doctrine of separation of powers...",
  "wordCount": 1050
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submissionId": "mongo-id",
    "evaluation": {
      "structure": { "score": 8, "maxScore": 10, "feedback": "Clear thesis statement. Good paragraph transitions." },
      "content": { "score": 7, "maxScore": 10, "feedback": "Good coverage. Missing international comparisons." },
      "language": { "score": 8, "maxScore": 10, "feedback": "Clear writing. Some sentences are too long." },
      "coherence": { "score": 7, "maxScore": 10, "feedback": "Arguments flow well. Conclusion could be stronger." },
      "totalScore": 30,
      "maxTotalScore": 40,
      "percentage": 75
    },
    "feedback": "Strong essay overall. To improve: add international examples (UK, US), strengthen conclusion with forward-looking statement.",
    "submittedAt": "2026-02-28T18:30:00Z"
  }
}
```

### GET /essays/submissions
Past essay submissions.

### GET /practice/non-repetition/stats
Deduplication effectiveness stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalQuestionsAttempted": 1450,
    "uniqueQuestionsInLast30Days": 1200,
    "deduplicationRate": 99.2,
    "avgCandidatePool": 850,
    "avgExcluded": 120,
    "avgFinalSelected": 20
  }
}
```

### GET /practice/feedback-loop
What's adapting and why.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recentAdaptations": [
      {
        "date": "2026-02-27",
        "topic": "Indian Economy",
        "change": "difficulty_increased",
        "reason": "7-day rolling accuracy at 85% (threshold: 80%)",
        "previousDifficulty": 3,
        "newDifficulty": 4
      },
      {
        "date": "2026-02-26",
        "topic": "Indian Geography",
        "change": "weight_increased",
        "reason": "7-day rolling accuracy at 38% (declining)",
        "previousWeight": 0.15,
        "newWeight": 0.25
      }
    ]
  }
}
```

---

## 14. Second Brain

### GET /second-brain/entries
List Second Brain entries.

**Query params:** `?type=insight|connection|pattern|question&topicId=uuid&page=1`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "mongo-id",
        "type": "connection",
        "content": "73rd Amendment connects Polity (constitutional amendment process), Governance (Panchayati Raj), Rural Development (local self-governance), and Social Justice (reservation in local bodies).",
        "linkedTopics": [
          { "topicId": "uuid", "name": "Constitutional Amendments" },
          { "topicId": "uuid", "name": "Panchayati Raj" },
          { "topicId": "uuid", "name": "Rural Development" }
        ],
        "source": "auto_generated",
        "importance": "high",
        "tags": ["polity", "governance", "social-justice"],
        "createdAt": "2026-02-28T12:00:00Z"
      }
    ],
    "total": 45
  }
}
```

### POST /second-brain/entries
Create manual insight entry.

**Request:**
```json
{
  "type": "pattern",
  "content": "UPSC frequently asks about the tension between Fundamental Rights and DPSP — Minerva Mills case is key.",
  "linkedTopicIds": ["uuid1", "uuid2"],
  "importance": "high",
  "tags": ["polity", "upsc-pattern"]
}
```

### PUT /second-brain/entries/:id
Edit an entry.

### DELETE /second-brain/entries/:id
Delete an entry.

### GET /second-brain/connections
Get cross-topic connections graph.

### GET /second-brain/insights/auto-generated
Get AI auto-generated insights.

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

*This API reference will be auto-generated from OpenAPI spec once implementation begins.*

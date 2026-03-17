-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('topic_wise', 'subtopic_wise', 'mixed', 'pyq', 'weak_area', 'custom');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('active', 'submitted');

-- CreateTable
CREATE TABLE "McqQuestion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "isPyq" BOOLEAN NOT NULL DEFAULT false,
    "pyqYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TestType" NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'active',
    "totalQuestions" INTEGER NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResponse" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "McqQuestion_topicId_idx" ON "McqQuestion"("topicId");

-- CreateIndex
CREATE INDEX "McqQuestion_isPyq_idx" ON "McqQuestion"("isPyq");

-- CreateIndex
CREATE INDEX "Test_userId_createdAt_idx" ON "Test"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_testId_questionId_key" ON "TestQuestion"("testId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_testId_sequence_key" ON "TestQuestion"("testId", "sequence");

-- CreateIndex
CREATE INDEX "TestQuestion_questionId_idx" ON "TestQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResponse_testId_questionId_key" ON "TestResponse"("testId", "questionId");

-- CreateIndex
CREATE INDEX "TestResponse_testId_idx" ON "TestResponse"("testId");

-- CreateIndex
CREATE INDEX "TestResponse_questionId_idx" ON "TestResponse"("questionId");

-- AddForeignKey
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResponse" ADD CONSTRAINT "TestResponse_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResponse" ADD CONSTRAINT "TestResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

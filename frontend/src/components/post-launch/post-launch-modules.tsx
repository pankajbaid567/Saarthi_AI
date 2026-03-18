'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { postLaunchApi } from '@/lib/api-client';

const fallbackCommunity = {
  forumsByTopic: [
    { topicId: 'polity-federalism', topicName: 'Polity: Federalism', threads: 0, activeUsers: 0 },
    { topicId: 'economy-inflation', topicName: 'Economy: Inflation', threads: 0, activeUsers: 0 },
  ],
  recentMessages: [],
  peerAnswerReview: { pendingReviews: 0, reviewedThisWeek: 0, avgScoreDelta: 0 },
  studyGroups: [],
  leaderboards: { revisionStreak: [], practiceStreak: [], syllabusCompletion: [] },
  refreshedAt: new Date(0).toISOString(),
};

const fallbackAdvancedAi = {
  modes: [
    { id: 'upsc-thinking', name: 'UPSC Thinking Mode', focus: 'Elimination logic like toppers' },
    { id: 'topper-brain', name: 'Topper Brain Simulation', focus: 'AIR < 50 style reasoning' },
    { id: 'socratic', name: 'Socratic Questioning', focus: 'Guided discovery with counter-questions' },
  ],
  voiceQuiz: { enabled: true, engine: 'speech-to-text', languageSupport: ['en-IN', 'hi-IN'] },
  neuroReviseGroupPatterns: { strongestForgettingWindowHours: 48, recommendedGroupRevisionSlot: '20:30-21:00' },
  syllabusFlowPeerCalibration: { suggestedDifficulty: 'medium', peerPercentile: 65 },
};

const fallbackContent = {
  optionalSubjectModules: ['Public Administration', 'Geography', 'Sociology'],
  interviewPreparation: { enabled: true, mockPanels: 0, stressQuestionsBank: 0 },
  statePcsSupport: ['UPPCS', 'BPSC'],
  multiLanguageMicroNotes: { supportedLanguages: ['English', 'Hindi'], translatedNotesCount: 0 },
};

const fallbackMobile = {
  platform: 'React Native',
  offlineMode: { cachedAssets: ['micro-notes', 'flashcards'], maxOfflineDays: 14 },
  pushNotifications: ['revision-due', 'practice-ready', 'streak-at-risk'],
  widget: { enabled: true, metrics: ['daily-revision-progress', 'daily-practice-progress'] },
};

const fallbackAnalytics = {
  comparativeAnalysis: { topperBaselineScore: 72, currentUserScore: 64, gapAreas: ['Revision consistency'] },
  customReportGeneration: { formats: ['pdf'], latestGeneratedAt: new Date(0).toISOString() },
  parentMentorDashboard: { enabled: true, sharableDigest: true, weeklyDigestDay: 'Sunday' },
  studyPatternOptimization: { bestStudyBlock: '06:30-08:00', bestRevisionBlock: '20:30-21:00' },
  neuroReviseLongTermRetentionTrend: [
    { month: '2025-10', retentionPercent: 61 },
    { month: '2025-11', retentionPercent: 65 },
    { month: '2025-12', retentionPercent: 69 },
    { month: '2026-01', retentionPercent: 71 },
    { month: '2026-02', retentionPercent: 75 },
    { month: '2026-03', retentionPercent: 79 },
  ],
  syllabusFlowPredictedCompletionDate: '2026-07-15',
};

export function PostLaunchModules() {
  const queryClient = useQueryClient();
  const [forumMessage, setForumMessage] = useState('');
  const [errorInput, setErrorInput] = useState({
    questionId: 'q-1',
    topicId: 'economy-inflation',
    userAnswer: '',
    correctAnswer: '',
  });
  const [errorAnalysisResult, setErrorAnalysisResult] = useState<string | null>(null);

  const communityQuery = useQuery({
    queryKey: ['post-launch', 'community'],
    queryFn: async () => (await postLaunchApi.getCommunity()).data,
  });
  const advancedAiQuery = useQuery({
    queryKey: ['post-launch', 'advanced-ai'],
    queryFn: async () => (await postLaunchApi.getAdvancedAi()).data,
  });
  const contentQuery = useQuery({
    queryKey: ['post-launch', 'content-expansion'],
    queryFn: async () => (await postLaunchApi.getContentExpansion()).data,
  });
  const mobileQuery = useQuery({
    queryKey: ['post-launch', 'mobile'],
    queryFn: async () => (await postLaunchApi.getMobileCompanion()).data,
  });
  const analyticsQuery = useQuery({
    queryKey: ['post-launch', 'advanced-analytics'],
    queryFn: async () => (await postLaunchApi.getAdvancedAnalytics()).data,
  });

  const addForumMessageMutation = useMutation({
    mutationFn: async () => postLaunchApi.addForumMessage('polity-federalism', forumMessage),
    onSuccess: async () => {
      setForumMessage('');
      await queryClient.invalidateQueries({ queryKey: ['post-launch', 'community'] });
    },
  });

  const errorAnalysisMutation = useMutation({
    mutationFn: async () => (await postLaunchApi.analyzeError(errorInput)).data,
    onSuccess: (data) => {
      setErrorAnalysisResult(`${data.whyYouGotThisWrong} · Next: ${data.neuroReviseContext.nextBestAction}`);
    },
  });

  const loading = [communityQuery, advancedAiQuery, contentQuery, mobileQuery, analyticsQuery].some((query) => query.isLoading);
  const hasError = [communityQuery, advancedAiQuery, contentQuery, mobileQuery, analyticsQuery].some((query) => query.isError);
  const community = communityQuery.data ?? fallbackCommunity;
  const advancedAi = advancedAiQuery.data ?? fallbackAdvancedAi;
  const content = contentQuery.data ?? fallbackContent;
  const mobile = mobileQuery.data ?? fallbackMobile;
  const analytics = analyticsQuery.data ?? fallbackAnalytics;

  const comparativeGap = useMemo(
    () => analytics.comparativeAnalysis.topperBaselineScore - analytics.comparativeAnalysis.currentUserScore,
    [analytics],
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Post-Launch Features (V1.1 → V1.5)</h2>
        <p className="text-sm text-muted-foreground">These features are now available directly inside the main platform.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading post-launch modules...</p> : null}
      {hasError ? (
        <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Unable to load one or more modules. Please verify authentication and backend availability.
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold">V1.1 — Community Features</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Forums, peer answer review, study groups, and streak leaderboards are now available through a unified API.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {community.forumsByTopic.map((forum) => (
            <div key={forum.topicId} className="rounded border border-border p-3">
              <p className="font-medium">{forum.topicName}</p>
              <p className="text-xs text-muted-foreground">{forum.threads} threads · {forum.activeUsers} active learners</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={forumMessage}
            onChange={(event) => setForumMessage(event.target.value)}
            placeholder="Add a forum message..."
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!forumMessage.trim() || addForumMessageMutation.isPending}
            onClick={() => addForumMessageMutation.mutate()}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold">V1.2 — Advanced AI</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {advancedAi.modes.map((mode) => (
            <div key={mode.id} className="rounded border border-border p-3">
              <p className="font-medium">{mode.name}</p>
              <p className="text-xs text-muted-foreground">{mode.focus}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <input
            value={errorInput.questionId}
            onChange={(event) => setErrorInput((prev) => ({ ...prev, questionId: event.target.value }))}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Question ID"
          />
          <input
            value={errorInput.userAnswer}
            onChange={(event) => setErrorInput((prev) => ({ ...prev, userAnswer: event.target.value }))}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Your answer"
          />
          <input
            value={errorInput.correctAnswer}
            onChange={(event) => setErrorInput((prev) => ({ ...prev, correctAnswer: event.target.value }))}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Correct answer"
          />
          <button
            type="button"
            onClick={() => errorAnalysisMutation.mutate()}
            disabled={!errorInput.userAnswer || !errorInput.correctAnswer || errorAnalysisMutation.isPending}
            className="rounded border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Analyze error
          </button>
        </div>
        {errorAnalysisResult ? <p className="mt-3 text-sm text-muted-foreground">{errorAnalysisResult}</p> : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold">V1.3 — Content Expansion</h3>
        <p className="mt-2 text-sm">Optional modules: {content.optionalSubjectModules.join(', ')} · State PCS: {content.statePcsSupport.join(', ')}</p>
        <p className="text-sm text-muted-foreground">
          Micro-notes language support: {content.multiLanguageMicroNotes.supportedLanguages.join(' + ')} ({content.multiLanguageMicroNotes.translatedNotesCount}{' '}
          translated notes)
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold">V1.4 — Mobile App</h3>
        <p className="mt-2 text-sm">Platform: {mobile.platform}</p>
        <p className="text-sm text-muted-foreground">Offline cache: {mobile.offlineMode.cachedAssets.join(', ')} · Max {mobile.offlineMode.maxOfflineDays} days</p>
        <p className="text-sm text-muted-foreground">Push: {mobile.pushNotifications.join(', ')}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold">V1.5 — Advanced Analytics</h3>
        <p className="mt-2 text-sm">
          Comparative gap vs topper baseline: <span className="font-medium">{comparativeGap} points</span>
        </p>
        <p className="text-sm text-muted-foreground">Predicted syllabus completion: {analytics.syllabusFlowPredictedCompletionDate}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {analytics.neuroReviseLongTermRetentionTrend.map((point) => (
            <span key={point.month} className="rounded-full border border-border px-2 py-1 text-xs">
              {point.month}: {point.retentionPercent}%
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}

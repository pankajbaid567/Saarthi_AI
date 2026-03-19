import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuestionOption } from '@/lib/test-engine';

interface MCQState {
  testId: string | null;
  currentIndex: number;
  answers: Record<string, QuestionOption | null>;
  flagged: string[];
  doubts: string[];
  timeSpentRef: Record<string, number>;
  timeRemainingSeconds: number;
  isSubmitting: boolean;
  
  // Actions
  initializeTest: (testId: string, initialTimeSeconds: number) => void;
  setCurrentIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: QuestionOption | null) => void;
  toggleFlag: (questionId: string) => void;
  toggleDoubt: (questionId: string) => void;
  incrementTimeSpent: (questionId: string) => void;
  decrementTimeRemaining: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
}

export const useMCQStore = create<MCQState>()(
  persist(
    (set) => ({
      testId: null,
      currentIndex: 0,
      answers: {},
      flagged: [],
      doubts: [],
      timeSpentRef: {},
      timeRemainingSeconds: 0,
      isSubmitting: false,

      initializeTest: (testId, initialTimeSeconds) => 
        set({
          testId,
          currentIndex: 0,
          answers: {},
          flagged: [],
          doubts: [],
          timeSpentRef: {},
          timeRemainingSeconds: initialTimeSeconds,
          isSubmitting: false,
        }),

      setCurrentIndex: (index) => set({ currentIndex: index }),
      
      setAnswer: (questionId, answer) => 
        set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
      
      toggleFlag: (questionId) => 
        set((state) => ({
          flagged: state.flagged.includes(questionId)
            ? state.flagged.filter((id) => id !== questionId)
            : [...state.flagged, questionId],
        })),

      toggleDoubt: (questionId) => 
        set((state) => ({
          doubts: state.doubts.includes(questionId)
            ? state.doubts.filter((id) => id !== questionId)
            : [...state.doubts, questionId],
        })),

      incrementTimeSpent: (questionId) => 
        set((state) => ({
          timeSpentRef: {
            ...state.timeSpentRef,
            [questionId]: (state.timeSpentRef[questionId] || 0) + 1,
          },
        })),

      decrementTimeRemaining: () => 
        set((state) => ({
          timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1),
        })),

      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      reset: () => 
        set({
          testId: null,
          currentIndex: 0,
          answers: {},
          flagged: [],
          doubts: [],
          timeSpentRef: {},
          timeRemainingSeconds: 0,
          isSubmitting: false,
        }),
    }),
    {
      name: 'mcq-storage',
      partialize: (state) => ({
        testId: state.testId,
        currentIndex: state.currentIndex,
        answers: state.answers,
        flagged: state.flagged,
        doubts: state.doubts,
        timeSpentRef: state.timeSpentRef,
        timeRemainingSeconds: state.timeRemainingSeconds,
      }),
    }
  )
);

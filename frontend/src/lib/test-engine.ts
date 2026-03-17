export type TestType = 'topic' | 'mixed' | 'pyq' | 'weak-area';

export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface TestQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  type: Exclude<TestType, 'topic'> | 'topic';
  prompt: string;
  options: Record<QuestionOption, string>;
  correctOption: QuestionOption;
  explanation: string;
}

export interface GeneratedTest {
  id: string;
  type: TestType;
  subjectId: string;
  subjectName: string;
  topicIds: string[];
  questionCount: number;
  timeLimitMinutes: number;
  createdAt: string;
  questions: TestQuestion[];
}

export interface TestResultQuestionReview {
  questionId: string;
  prompt: string;
  options: Record<QuestionOption, string>;
  selectedOption: QuestionOption | null;
  correctOption: QuestionOption;
  explanation: string;
  isCorrect: boolean;
  isSkipped: boolean;
}

export interface TestResult {
  testId: string;
  subjectName: string;
  type: TestType;
  attemptedAt: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  questionCount: number;
  timeLimitMinutes: number;
  questionReviews: TestResultQuestionReview[];
}

export interface SubjectTopic {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  topics: SubjectTopic[];
}

interface TestGenerationConfig {
  type: TestType;
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  timeLimitMinutes: number;
}

const GENERATED_TESTS_STORAGE_KEY = 'saarthi-generated-tests';
const TEST_RESULTS_STORAGE_KEY = 'saarthi-test-results';
const NEGATIVE_MARKING_PENALTY = 0.33;

const subjects: Subject[] = [
  {
    id: 'history',
    name: 'History',
    topics: [
      { id: 'modern-india', name: 'Modern India' },
      { id: 'ancient-india', name: 'Ancient India' },
    ],
  },
  {
    id: 'polity',
    name: 'Polity',
    topics: [
      { id: 'constitution', name: 'Constitution' },
      { id: 'parliament', name: 'Parliament' },
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    topics: [
      { id: 'climatology', name: 'Climatology' },
      { id: 'indian-geography', name: 'Indian Geography' },
    ],
  },
];

const questionBank: TestQuestion[] = [
  {
    id: 'q1',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'modern-india',
    topicName: 'Modern India',
    type: 'pyq',
    prompt: 'Who founded the Indian National Congress in 1885?',
    options: { A: 'A.O. Hume', B: 'Dadabhai Naoroji', C: 'Bal Gangadhar Tilak', D: 'W.C. Banerjee' },
    correctOption: 'A',
    explanation: 'A.O. Hume played a key role in founding INC in 1885.',
  },
  {
    id: 'q2',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'ancient-india',
    topicName: 'Ancient India',
    type: 'topic',
    prompt: 'The capital of Magadha under Ajatashatru was:',
    options: { A: 'Pataliputra', B: 'Rajagriha', C: 'Vaishali', D: 'Ujjaini' },
    correctOption: 'B',
    explanation: 'Ajatashatru ruled from Rajagriha before Pataliputra gained prominence.',
  },
  {
    id: 'q3',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'constitution',
    topicName: 'Constitution',
    type: 'topic',
    prompt: 'Which article of the Constitution provides for equality before law?',
    options: { A: 'Article 14', B: 'Article 19', C: 'Article 21', D: 'Article 32' },
    correctOption: 'A',
    explanation: 'Article 14 guarantees equality before law and equal protection of laws.',
  },
  {
    id: 'q4',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'parliament',
    topicName: 'Parliament',
    type: 'pyq',
    prompt: 'Money Bill can be introduced only in:',
    options: { A: 'Rajya Sabha', B: 'Lok Sabha', C: 'Joint sitting', D: 'State Legislature' },
    correctOption: 'B',
    explanation: 'Money Bills are introduced only in the Lok Sabha under Article 109.',
  },
  {
    id: 'q5',
    subjectId: 'geography',
    subjectName: 'Geography',
    topicId: 'climatology',
    topicName: 'Climatology',
    type: 'weak-area',
    prompt: 'Which layer of atmosphere contains the ozone layer?',
    options: { A: 'Troposphere', B: 'Stratosphere', C: 'Mesosphere', D: 'Thermosphere' },
    correctOption: 'B',
    explanation: 'The ozone layer is concentrated in the stratosphere.',
  },
  {
    id: 'q6',
    subjectId: 'geography',
    subjectName: 'Geography',
    topicId: 'indian-geography',
    topicName: 'Indian Geography',
    type: 'mixed',
    prompt: 'The Western Ghats are also known as:',
    options: { A: 'Sahyadri', B: 'Satpura', C: 'Aravalli', D: 'Vindhya' },
    correctOption: 'A',
    explanation: 'Western Ghats are called the Sahyadri range.',
  },
  {
    id: 'q7',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'modern-india',
    topicName: 'Modern India',
    type: 'mixed',
    prompt: 'The Non-Cooperation Movement was launched in:',
    options: { A: '1919', B: '1920', C: '1922', D: '1930' },
    correctOption: 'B',
    explanation: 'Mahatma Gandhi launched the Non-Cooperation Movement in 1920.',
  },
  {
    id: 'q8',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'constitution',
    topicName: 'Constitution',
    type: 'weak-area',
    prompt: 'Fundamental Duties were added by which amendment?',
    options: { A: '24th', B: '42nd', C: '44th', D: '52nd' },
    correctOption: 'B',
    explanation: 'The 42nd Constitutional Amendment introduced Fundamental Duties.',
  },
  {
    id: 'q9',
    subjectId: 'geography',
    subjectName: 'Geography',
    topicId: 'climatology',
    topicName: 'Climatology',
    type: 'pyq',
    prompt: 'Which one is a local wind in India?',
    options: { A: 'Chinook', B: 'Mistral', C: 'Loo', D: 'Sirocco' },
    correctOption: 'C',
    explanation: 'Loo is a strong local hot wind over northwestern India.',
  },
  {
    id: 'q10',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'ancient-india',
    topicName: 'Ancient India',
    type: 'weak-area',
    prompt: 'The famous teacher of Chandragupta Maurya was:',
    options: { A: 'Panini', B: 'Patanjali', C: 'Kautilya', D: 'Kalidasa' },
    correctOption: 'C',
    explanation: 'Kautilya (Chanakya) mentored Chandragupta Maurya.',
  },
];

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const canUseStorage = () => typeof window !== 'undefined';

const getStoredTests = () => {
  if (!canUseStorage()) {
    return [] as GeneratedTest[];
  }
  return parseJson<GeneratedTest[]>(window.localStorage.getItem(GENERATED_TESTS_STORAGE_KEY), []);
};

const setStoredTests = (tests: GeneratedTest[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(GENERATED_TESTS_STORAGE_KEY, JSON.stringify(tests));
};

const getStoredResults = () => {
  if (!canUseStorage()) {
    return [] as TestResult[];
  }
  return parseJson<TestResult[]>(window.localStorage.getItem(TEST_RESULTS_STORAGE_KEY), []);
};

const setStoredResults = (results: TestResult[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify(results));
};

export const getSubjects = () => subjects;

export const getTopicsBySubject = (subjectId: string) => subjects.find((subject) => subject.id === subjectId)?.topics ?? [];

export const createTest = (config: TestGenerationConfig): GeneratedTest => {
  const selectedSubject = subjects.find((subject) => subject.id === config.subjectId) ?? subjects[0];
  const topicScope = config.topicIds.length > 0 ? new Set(config.topicIds) : null;

  const questionPool = questionBank.filter((question) => {
    if (question.subjectId !== selectedSubject.id) {
      return false;
    }

    if (config.type !== 'mixed' && question.type !== config.type) {
      return false;
    }

    if (topicScope && !topicScope.has(question.topicId)) {
      return false;
    }

    return true;
  });

  const fallbackPool = questionBank.filter((question) => question.subjectId === selectedSubject.id);
  const source = questionPool.length > 0 ? questionPool : fallbackPool;

  const uniqueId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const questions: TestQuestion[] = Array.from({ length: config.questionCount }, (_, index) => {
    const baseQuestion = source[index % source.length];
    return {
      ...baseQuestion,
      id: `${baseQuestion.id}-${index + 1}-${uniqueId()}`,
    };
  });

  const test: GeneratedTest = {
    id: `test-${uniqueId()}`,
    type: config.type,
    subjectId: selectedSubject.id,
    subjectName: selectedSubject.name,
    topicIds: config.topicIds,
    questionCount: config.questionCount,
    timeLimitMinutes: config.timeLimitMinutes,
    createdAt: new Date().toISOString(),
    questions,
  };

  const tests = getStoredTests();
  setStoredTests([test, ...tests]);

  return test;
};

export const getTestById = (testId: string) => getStoredTests().find((test) => test.id === testId) ?? null;

export const submitTest = (test: GeneratedTest, answers: Record<string, QuestionOption | null>): TestResult => {
  const questionReviews = test.questions.map((question) => {
    const selectedOption = answers[question.id] ?? null;
    const isSkipped = selectedOption === null;
    const isCorrect = !isSkipped && selectedOption === question.correctOption;

    return {
      questionId: question.id,
      prompt: question.prompt,
      options: question.options,
      selectedOption,
      correctOption: question.correctOption,
      explanation: question.explanation,
      isCorrect,
      isSkipped,
    } satisfies TestResultQuestionReview;
  });

  const correctCount = questionReviews.filter((question) => question.isCorrect).length;
  const skippedCount = questionReviews.filter((question) => question.isSkipped).length;
  const incorrectCount = questionReviews.length - correctCount - skippedCount;
  const maxScore = test.questionCount;
  const score = Number((correctCount - incorrectCount * NEGATIVE_MARKING_PENALTY).toFixed(2));

  const result: TestResult = {
    testId: test.id,
    subjectName: test.subjectName,
    type: test.type,
    attemptedAt: new Date().toISOString(),
    score,
    maxScore,
    correctCount,
    incorrectCount,
    skippedCount,
    questionCount: test.questionCount,
    timeLimitMinutes: test.timeLimitMinutes,
    questionReviews,
  };

  const results = getStoredResults().filter((entry) => entry.testId !== test.id);
  setStoredResults([result, ...results]);

  return result;
};

export const getResultByTestId = (testId: string) => getStoredResults().find((result) => result.testId === testId) ?? null;

export const getAllResults = () => getStoredResults();

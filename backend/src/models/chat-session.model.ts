import { Schema, model, models, type InferSchemaType } from 'mongoose';

export type ChatMode = 'rapid_fire' | 'deep_concept' | 'elimination_training' | 'trap_questions';
export type ChatActor = 'user' | 'assistant';

const mcqOptionSchema = new Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const chatQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [mcqOptionSchema], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
  },
  { _id: false },
);

const chatMessageSchema = new Schema(
  {
    actor: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    question: { type: chatQuestionSchema, required: false },
    isCorrect: { type: Boolean, required: false },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const performanceSchema = new Schema(
  {
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false },
);

const chatSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ['rapid_fire', 'deep_concept', 'elimination_training', 'trap_questions'],
      required: true,
    },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    messages: { type: [chatMessageSchema], default: [] },
    pendingQuestion: { type: chatQuestionSchema, required: false },
    performance: { type: performanceSchema, default: () => ({ attempted: 0, correct: 0, accuracy: 0 }) },
    difficultyLevel: { type: Number, default: 1 },
    isComplete: { type: Boolean, default: false },
    targetQuestions: { type: Number, default: 10 },
  },
  {
    timestamps: true,
  },
);

export type ChatSessionDocument = InferSchemaType<typeof chatSessionSchema> & { id: string };
export type ChatMessage = InferSchemaType<typeof chatMessageSchema>;

export const ChatSessionModel =
  models.ChatSession || model('ChatSession', chatSessionSchema);

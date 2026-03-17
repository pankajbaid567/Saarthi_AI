'use client';

import { create } from 'zustand';
import type { ChatMode, ChatSession } from '@/lib/chat-api';

type ChatState = {
  selectedMode: ChatMode;
  selectedSubject: string;
  selectedTopic: string;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  setMode: (mode: ChatMode) => void;
  setSubject: (subject: string) => void;
  setTopic: (topic: string) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  selectedMode: 'rapid_fire',
  selectedSubject: 'General Studies',
  selectedTopic: 'Federalism',
  sessions: [],
  currentSession: null,
  setMode: (selectedMode) => set({ selectedMode }),
  setSubject: (selectedSubject) => set({ selectedSubject }),
  setTopic: (selectedTopic) => set({ selectedTopic }),
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (currentSession) => set({ currentSession }),
}));

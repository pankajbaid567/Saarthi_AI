import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { ChatService } from '../src/services/chat.service.js';

describe('chat service', () => {
  it('creates session, parses quiz intent, evaluates answers, and tracks summary', () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Federalism' });

    knowledgeGraphService.createContentNode({
      topicId: topic.id,
      type: 'concept',
      title: 'Division of powers',
      body: 'Union, state and concurrent lists define federal balance.',
    });

    const chatService = new ChatService(knowledgeGraphService);
    const session = chatService.createSession({
      userId: 'student-1',
      mode: 'deep_concept',
      subject: 'Polity',
      topic: 'Federalism',
    });

    expect(session.messages[0]?.text).toContain('Deep Concept');

    const prompt = chatService.sendMessage({
      userId: 'student-1',
      sessionId: session.id,
      message: 'Ask 1 MCQ on Federalism',
    });

    expect(prompt.response).toContain('Deep Concept question');
    expect(prompt.session.pendingQuestion).not.toBeNull();

    const answered = chatService.sendMessage({
      userId: 'student-1',
      sessionId: session.id,
      message: 'A',
    });

    expect(answered.response).toContain('Deep Concept insight');
    expect(answered.response).toContain('RAG sources');
    expect(answered.session.performance.attempted).toBe(1);
    expect(answered.summary?.attempted).toBe(1);
    expect(answered.session.isComplete).toBe(true);

    const sessions = chatService.listSessions('student-1', 10);
    expect(sessions).toHaveLength(1);

    const chunks = chatService.buildSseChunks('This is a sample streaming response from AI.');
    expect(chunks.length).toBeGreaterThan(0);
  });
});

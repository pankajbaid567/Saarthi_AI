import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { LearningService } from '../src/services/learning.service.js';

describe('learning service', () => {
  it('returns section content, tracks progress, and supports user highlights/bookmarks/search', () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Fundamental Rights' });

    knowledgeGraphService.createContentNode({
      topicId: topic.id,
      type: 'concept',
      title: 'Article 14',
      body: 'Equality before law in markdown format.',
    });
    const pyq = knowledgeGraphService.createContentNode({
      topicId: topic.id,
      type: 'pyq',
      title: 'UPSC PYQ 2021',
      body: 'Which article guarantees equality before law?',
    });
    const highlight = knowledgeGraphService.createContentNode({
      topicId: topic.id,
      type: 'highlight',
      title: 'Exam tip',
      body: 'Remember Article 14 is foundational.',
    });
    const microNote = knowledgeGraphService.createContentNode({
      topicId: topic.id,
      type: 'micro_note',
      title: 'Revision',
      body: 'A14 = Equality',
    });

    const learningService = new LearningService({ knowledgeGraphService });
    const notes = learningService.getTopicNotes(topic.id);
    const pyqs = learningService.getTopicSectionContent(topic.id, 'pyqs');
    const highlights = learningService.getTopicSectionContent(topic.id, 'highlights');
    const microNotes = learningService.getTopicSectionContent(topic.id, 'micro-notes');

    expect(notes).toHaveLength(1);
    expect(notes[0]?.markdown).toContain('markdown');
    expect(pyqs.map((item) => item.id)).toContain(pyq.id);
    expect(highlights.map((item) => item.id)).toContain(highlight.id);
    expect(microNotes.map((item) => item.id)).toContain(microNote.id);

    const progress = learningService.markTopicProgress('user-1', topic.id, { progressPercent: 40 });
    expect(progress.progressPercent).toBe(40);

    const overall = learningService.getOverallProgress('user-1');
    expect(overall.items).toHaveLength(1);
    expect(overall.summary.inProgressTopics).toBe(1);

    const userHighlight = learningService.createUserHighlight('user-1', {
      topicId: topic.id,
      contentNodeId: pyq.id,
      highlightedText: 'equality before law',
      note: 'important phrase',
    });
    expect(learningService.listUserHighlights('user-1')).toHaveLength(1);
    learningService.deleteUserHighlight('user-1', userHighlight.id);
    expect(learningService.listUserHighlights('user-1')).toHaveLength(0);

    const bookmark = learningService.createUserBookmark('user-1', {
      topicId: topic.id,
      contentNodeId: pyq.id,
      title: 'Revise this PYQ',
      note: 'for weekend revision',
    });
    expect(learningService.listUserBookmarks('user-1')).toHaveLength(1);
    learningService.deleteUserBookmark('user-1', bookmark.id);
    expect(learningService.listUserBookmarks('user-1')).toHaveLength(0);

    const searchResults = learningService.searchContent('equality');
    expect(searchResults.length).toBeGreaterThan(0);
  });
});

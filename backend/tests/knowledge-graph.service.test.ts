import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';

describe('knowledge graph service', () => {
  it('seeds initial UPSC hierarchy with 8 subjects and 200+ topics', () => {
    const service = new KnowledgeGraphService();

    const subjects = service.listSubjects();
    expect(subjects.length).toBeGreaterThanOrEqual(8);

    const totalTopics = subjects.reduce((sum, subject) => {
      return sum + service.listTopicsForSubject(subject.id).length;
    }, 0);

    expect(totalTopics).toBeGreaterThanOrEqual(200);
  });

  it('supports subject CRUD operations', () => {
    const service = new KnowledgeGraphService({ seedData: false });

    const created = service.createSubject({ name: 'Ethics' });
    expect(service.listSubjects()).toHaveLength(1);

    const updated = service.updateSubject(created.id, {
      name: 'Ethics and Integrity',
      description: 'GS Paper 4',
    });

    expect(updated.name).toBe('Ethics and Integrity');
    expect(updated.description).toBe('GS Paper 4');

    service.deleteSubject(created.id);
    expect(service.listSubjects()).toHaveLength(0);
  });

  it('supports topic hierarchy and materialized path updates', () => {
    const service = new KnowledgeGraphService({ seedData: false });
    const subject = service.createSubject({ name: 'Polity' });
    const rootTopic = service.createTopic({ subjectId: subject.id, name: 'Parliament' });
    const childTopic = service.createTopic({
      subjectId: subject.id,
      parentTopicId: rootTopic.id,
      name: 'Rajya Sabha',
    });

    expect(childTopic.materializedPath).toContain(rootTopic.id);

    const moved = service.updateTopic(childTopic.id, {
      parentTopicId: null,
    });

    expect(moved.parentTopicId).toBeNull();
    expect(moved.materializedPath).toBe(`${subject.id}.${childTopic.id}`);
  });

  it('supports content node CRUD operations', () => {
    const service = new KnowledgeGraphService({ seedData: false });
    const subject = service.createSubject({ name: 'Economy' });
    const topic = service.createTopic({ subjectId: subject.id, name: 'Inflation' });

    const content = service.createContentNode({
      topicId: topic.id,
      type: 'concept',
      title: 'Inflation basics',
      body: 'Inflation is the rate at which prices rise.',
    });

    expect(service.getTopicContent(topic.id)).toHaveLength(1);

    const updated = service.updateContentNode(content.id, {
      type: 'highlight',
      body: 'CPI and WPI trends are key indicators.',
    });

    expect(updated.type).toBe('highlight');

    service.deleteContentNode(content.id);
    expect(service.getTopicContent(topic.id)).toHaveLength(0);
  });

  it('supports week 11 auto-link review and enrichment workflow', () => {
    const service = new KnowledgeGraphService({ seedData: false });
    const subject = service.createSubject({ name: 'Polity' });
    const topic = service.createTopic({ subjectId: subject.id, name: 'Fundamental Rights' });

    const created = service.autoLinkExtractedContent({
      concepts: [{ text: 'Fundamental rights protect liberty, equality and constitutional remedies.' }],
      facts: [{ text: 'Article 32 is called the heart and soul of the Constitution.' }],
      mcqs: [
        {
          question: 'Which article is called the heart and soul of the Constitution?',
          options: ['Article 14', 'Article 19', 'Article 32', 'Article 226'],
        },
      ],
      mainsQuestions: [{ question: 'Discuss the significance of Article 32 in Indian Polity.', marks: 10 }],
    });

    expect(created).toHaveLength(4);
    expect(created.some((item) => item.smartHighlights.length > 0)).toBe(true);
    expect(created.some((item) => item.type === 'concept' && item.microNote !== null)).toBe(true);
    expect(created.some((item) => item.type === 'mcq' && item.difficulty !== null)).toBe(true);

    const conceptItem = created.find((item) => item.type === 'concept');
    expect(conceptItem).toBeDefined();

    const approved = service.approveAutoLinkReviewItem(conceptItem!.id, { topicId: topic.id });
    expect(approved.status).toBe('approved');
    expect(approved.linkedTopicId).toBe(topic.id);

    const rejected = service.rejectAutoLinkReviewItem(created[1]!.id);
    expect(rejected.status).toBe('rejected');

    const merged = service.mergeAutoLinkReviewItems(created[2]!.id, created[3]!.id);
    expect(merged.status).toBe('merged');
    expect(merged.mergedIntoId).toBe(created[2]!.id);
  });
});

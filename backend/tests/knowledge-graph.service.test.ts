import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';

describe('knowledge graph service', () => {
  it('seeds initial UPSC hierarchy with 8 subjects and 200+ topics', () => {
    const service = new KnowledgeGraphService();

    const subjects = service.listSubjects();
    expect(subjects).toHaveLength(8);

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
});

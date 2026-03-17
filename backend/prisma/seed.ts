import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const toSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
};

const subjectNames = [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Environment',
  'Science and Technology',
  'International Relations',
  'Current Affairs',
];

const MATERIALIZED_PATH_PENDING_SEGMENT = 'pending';

const main = async () => {
  for (const subjectName of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { slug: toSlug(subjectName) },
      update: {
        name: subjectName,
        description: `${subjectName} for UPSC preparation`,
      },
      create: {
        name: subjectName,
        slug: toSlug(subjectName),
        description: `${subjectName} for UPSC preparation`,
      },
    });

    for (let index = 1; index <= 20; index += 1) {
      const topicSlug = `${toSlug(subjectName)}-topic-${index}`;
      const rootTopic = await prisma.topic.upsert({
        where: {
          subjectId_slug: {
            subjectId: subject.id,
            slug: topicSlug,
          },
        },
        update: {
          name: `${subjectName} Topic ${index}`,
          description: `Core ${subjectName} topic ${index}`,
        },
        create: {
          subjectId: subject.id,
          name: `${subjectName} Topic ${index}`,
          slug: topicSlug,
          description: `Core ${subjectName} topic ${index}`,
          materializedPath: `${subject.id}.${MATERIALIZED_PATH_PENDING_SEGMENT}`,
        },
      });

      await prisma.topic.update({
        where: { id: rootTopic.id },
        data: { materializedPath: `${subject.id}.${rootTopic.id}` },
      });

      if (index <= 6) {
        const subtopicSlug = `${toSlug(subjectName)}-subtopic-${index}`;
        const subtopic = await prisma.topic.upsert({
          where: {
            subjectId_slug: {
              subjectId: subject.id,
              slug: subtopicSlug,
            },
          },
          update: {
            name: `${subjectName} Subtopic ${index}`,
            description: `Detailed ${subjectName} subtopic ${index}`,
            parentTopicId: rootTopic.id,
          },
          create: {
            subjectId: subject.id,
            parentTopicId: rootTopic.id,
            name: `${subjectName} Subtopic ${index}`,
            slug: subtopicSlug,
            description: `Detailed ${subjectName} subtopic ${index}`,
            materializedPath: `${subject.id}.${rootTopic.id}.${MATERIALIZED_PATH_PENDING_SEGMENT}`,
          },
        });

        await prisma.topic.update({
          where: { id: subtopic.id },
          data: { materializedPath: `${subject.id}.${rootTopic.id}.${subtopic.id}` },
        });
      }
    }
  }
};

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

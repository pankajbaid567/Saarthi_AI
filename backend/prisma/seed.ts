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

type OptionKey = 'A' | 'B' | 'C' | 'D';

const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

const difficultyByIndex = [1, 2, 2, 3, 2];

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

  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const questionsToCreate = topics.flatMap((topic, topicIndex) => {
    return Array.from({ length: 5 }, (_value, questionIndex) => {
      const correctOption = optionKeys[(topicIndex + questionIndex) % optionKeys.length]!;
      const isPyq = questionIndex === 0 || (topicIndex + questionIndex) % 8 === 0;
      return {
        topicId: topic.id,
        questionText: `${topic.name}: MCQ ${questionIndex + 1} - identify the most appropriate statement.`,
        optionA: `${topic.name} option A`,
        optionB: `${topic.name} option B`,
        optionC: `${topic.name} option C`,
        optionD: `${topic.name} option D`,
        correctOption,
        explanation: `Reference explanation for ${topic.name} question ${questionIndex + 1}.`,
        difficulty: difficultyByIndex[questionIndex]!,
        isPyq,
        pyqYear: isPyq ? 2015 + ((topicIndex + questionIndex) % 11) : null,
      };
    });
  });

  await prisma.mcqQuestion.deleteMany();
  if (questionsToCreate.length > 0) {
    await prisma.mcqQuestion.createMany({
      data: questionsToCreate,
    });
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

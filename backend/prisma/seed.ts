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

const MATERIALIZED_PATH_PENDING_SEGMENT = 'pending';

type OptionKey = 'A' | 'B' | 'C' | 'D';
type MainsQuestionType = 'gs' | 'essay' | 'ethics' | 'optional';
type MainsQuestionSource = 'pyq' | 'coaching' | 'ai_generated';

const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
const mainsQuestionTypes: MainsQuestionType[] = ['gs', 'essay', 'ethics', 'optional'];
const mainsQuestionSources: MainsQuestionSource[] = ['pyq', 'coaching', 'ai_generated'];

const difficultyByIndex = [1, 2, 2, 3, 2];

type SyllabusEntry = {
  paper: string;
  subjects: Array<{
    name: string;
    description: string;
    topics: Array<{ name: string; subtopics: string[] }>;
  }>;
};

const syllabus: SyllabusEntry[] = [
  {
    paper: 'PRE_GS1',
    subjects: [
      {
        name: 'History',
        description: 'Indian History from ancient to modern period',
        topics: [
          { name: 'Ancient India', subtopics: ['Prehistoric cultures & Indus Valley Civilisation', 'Vedic Age & Mahajanapadas', 'Mauryan Empire & post-Mauryan polities', 'Gupta Empire & regional kingdoms', 'Art, architecture & literature of ancient India'] },
          { name: 'Medieval India', subtopics: ['Delhi Sultanate', 'Mughal Empire', 'Bhakti & Sufi movements', 'Vijayanagara & other regional kingdoms', 'Society, economy & culture in medieval India'] },
          { name: 'Modern India', subtopics: ['European penetration & British conquest', 'Socio-religious reform movements', 'Revolt of 1857 & aftermath', 'Indian National Movement phases', 'Post-1947 consolidation & integration'] },
        ],
      },
      {
        name: 'Geography',
        description: 'Physical, Indian & world geography',
        topics: [
          { name: 'Physical Geography', subtopics: ['Geomorphology & landforms', 'Climatology & atmospheric circulation', 'Oceanography', 'Biogeography & soils'] },
          { name: 'Indian Geography', subtopics: ['Physiographic divisions', 'Drainage systems & river basins', 'Monsoon mechanism & climate regions', 'Natural resources & mineral distribution', 'Population distribution & urbanisation'] },
          { name: 'World Geography', subtopics: ['Continents & major physical features', 'Global climate patterns', 'Resource distribution worldwide'] },
        ],
      },
      {
        name: 'Polity',
        description: 'Indian Polity & governance',
        topics: [
          { name: 'Constitutional Framework', subtopics: ['Historical background & making of Constitution', 'Preamble & salient features', 'Fundamental Rights & Duties', 'Directive Principles of State Policy', 'Amendment process & basic structure doctrine'] },
          { name: 'Union & State Government', subtopics: ['Parliament: composition, powers & privileges', 'President & Vice-President', 'Prime Minister & Council of Ministers', 'State legislature & Governor', 'Centre-State relations'] },
          { name: 'Judiciary', subtopics: ['Supreme Court & High Courts', 'Judicial review & PIL', 'Tribunals & quasi-judicial bodies'] },
          { name: 'Local Governance', subtopics: ['Panchayati Raj (73rd Amendment)', 'Municipalities (74th Amendment)', 'Scheduled & Tribal Areas'] },
        ],
      },
      {
        name: 'Economy',
        description: 'Indian Economy & economic development',
        topics: [
          { name: 'Macroeconomics & Planning', subtopics: ['National income accounting', 'Planning Commission to NITI Aayog', 'Fiscal policy & budgeting', 'Monetary policy & RBI functions'] },
          { name: 'Sectors of Indian Economy', subtopics: ['Agriculture & food management', 'Industry & manufacturing policy', 'Services sector & IT', 'Infrastructure: energy, transport, telecom'] },
          { name: 'External Sector', subtopics: ['Balance of Payments & trade policy', 'WTO & international economic bodies', 'Foreign investment & exchange reserves'] },
        ],
      },
      {
        name: 'Environment & Ecology',
        description: 'Environment, ecology, biodiversity & climate change',
        topics: [
          { name: 'Ecology Fundamentals', subtopics: ['Ecosystems & food chains', 'Biodiversity: types, threats & conservation', 'Biomes & biogeochemical cycles'] },
          { name: 'Environmental Issues', subtopics: ['Pollution: air, water, soil, noise', 'Climate change & global warming', 'Waste management & circular economy'] },
          { name: 'Environmental Governance', subtopics: ['Environmental laws & policies in India', 'International agreements (Paris, CBD, Ramsar)', 'Protected areas & wildlife conservation'] },
        ],
      },
      {
        name: 'Science & Technology',
        description: 'General science, technology & space',
        topics: [
          { name: 'Basic Sciences', subtopics: ['Physics in everyday life', 'Chemistry in everyday life', 'Biology & human health'] },
          { name: 'Technology & Innovation', subtopics: ['IT, computers & cyber security', 'Space technology & ISRO missions', 'Defence technology & indigenisation', 'Nuclear technology'] },
          { name: 'Emerging Technologies', subtopics: ['Artificial intelligence & machine learning', 'Biotechnology & genetic engineering', 'Nanotechnology & robotics'] },
        ],
      },
      {
        name: 'Current Affairs',
        description: 'National & international current events',
        topics: [
          { name: 'National Events', subtopics: ['Government schemes & policies', 'Awards & appointments', 'Important legislation'] },
          { name: 'International Events', subtopics: ['Summits & conferences', 'Global conflicts & geopolitics', 'International organisations'] },
        ],
      },
    ],
  },
  {
    paper: 'PRE_GS2',
    subjects: [
      {
        name: 'Aptitude & Reasoning',
        description: 'Comprehension, logical reasoning, analytical ability, decision-making & basic numeracy',
        topics: [
          { name: 'Reading Comprehension', subtopics: ['Passage-based questions', 'Inference & critical reasoning from passages'] },
          { name: 'Logical Reasoning', subtopics: ['Deductive & inductive reasoning', 'Syllogisms & logical connectives', 'Coding-decoding & series', 'Blood relations & direction sense', 'Venn diagrams & arrangements'] },
          { name: 'Analytical Ability', subtopics: ['Data interpretation (tables, graphs, charts)', 'Data sufficiency', 'Pattern recognition'] },
          { name: 'Decision Making & Problem Solving', subtopics: ['Administrative decision making', 'Situational judgement'] },
          { name: 'Basic Numeracy & Data Handling', subtopics: ['Number systems & simplification', 'Percentage, ratio & proportion', 'Time, speed, distance & work', 'Probability & statistics basics'] },
        ],
      },
    ],
  },
  {
    paper: 'MAINS_ESSAY',
    subjects: [
      {
        name: 'Essay Writing',
        description: 'Two essays on topics of national/international relevance',
        topics: [
          { name: 'Philosophical & Abstract', subtopics: ['Value-based & ethical themes', 'Quotes & proverbs analysis'] },
          { name: 'Socio-Economic', subtopics: ['Poverty, inequality & development', 'Education & social empowerment', 'Urbanisation & rural issues'] },
          { name: 'Political & Governance', subtopics: ['Democracy, governance & policy', 'Federalism & decentralisation'] },
          { name: 'Science, Technology & Environment', subtopics: ['Technology and society', 'Climate change & sustainability'] },
          { name: 'International & Strategic', subtopics: ['India & the global order', 'Geopolitical & security themes'] },
        ],
      },
    ],
  },
  {
    paper: 'MAINS_GS1',
    subjects: [
      {
        name: 'Indian Heritage & Culture',
        description: 'Art, architecture, literature & cultural history',
        topics: [
          { name: 'Art & Architecture', subtopics: ['Temple architecture styles (Nagara, Dravida, Vesara)', 'Buddhist, Jain & Islamic architecture', 'Paintings: miniature, mural, folk traditions', 'Sculpture traditions across periods'] },
          { name: 'Literature & Philosophy', subtopics: ['Vedic & classical Sanskrit literature', 'Regional languages & literary movements', 'Indian philosophical schools'] },
          { name: 'Performing Arts & Traditions', subtopics: ['Classical dance forms', 'Classical & folk music traditions', 'Theatre & puppetry', 'Festivals & fairs'] },
        ],
      },
      {
        name: 'Modern Indian History',
        description: 'From mid-18th century to present',
        topics: [
          { name: 'British Rule & Resistance', subtopics: ['East India Company to Crown rule', 'Revenue & administrative reforms', 'Tribal & peasant movements', 'Revolt of 1857'] },
          { name: 'Freedom Movement', subtopics: ['Moderate & Extremist phases', 'Gandhian movements (NCM, CDM, QIM)', 'Revolutionary movements', 'Role of women & marginalised groups', 'Towards partition & independence'] },
        ],
      },
      {
        name: 'Post-Independence India',
        description: 'Consolidation & reorganisation after 1947',
        topics: [
          { name: 'Integration & State Reorganisation', subtopics: ['Princely states integration', 'States Reorganisation Commission & linguistic states'] },
          { name: 'Political & Economic Development', subtopics: ['Nehruvian era & five-year plans', 'Green Revolution & industrial policy', 'Liberalisation & reforms (1991 onwards)'] },
        ],
      },
      {
        name: 'World History',
        description: '18th century world events to present',
        topics: [
          { name: 'Revolutions & Wars', subtopics: ['French Revolution & Napoleonic era', 'American Revolution & Civil War', 'World War I & its aftermath', 'World War II & UN formation'] },
          { name: 'Colonialism & Decolonisation', subtopics: ['Imperialism in Asia & Africa', 'Decolonisation movements', 'Cold War & bipolar world'] },
          { name: 'Political Ideologies', subtopics: ['Communism, capitalism & socialism', 'Nationalism & self-determination'] },
        ],
      },
      {
        name: 'Indian Society',
        description: 'Social structure, diversity, issues & globalisation',
        topics: [
          { name: 'Social Structure & Diversity', subtopics: ['Caste system & its transformations', 'Tribal communities & their issues', 'Regional, linguistic & religious diversity'] },
          { name: 'Social Issues', subtopics: ['Women & gender issues', 'Population & demographic trends', 'Urbanisation challenges', 'Communalism, regionalism & secularism'] },
          { name: 'Globalisation & Society', subtopics: ['Effects on Indian culture & society', 'Role of civil society & NGOs'] },
        ],
      },
      {
        name: 'Geography',
        description: 'Physical geography and resource distribution for Mains GS1',
        topics: [
          { name: 'Physical Geography', subtopics: ['Geomorphology & weathering', 'Climatology & global pressure belts', 'Oceanography: currents, tides, salinity'] },
          { name: 'Human & Economic Geography', subtopics: ['Population & settlement geography', 'Migration patterns & urbanisation', 'Resource distribution worldwide'] },
          { name: 'Geographical Phenomena', subtopics: ['Earthquakes, volcanoes & tsunamis', 'Cyclones & floods'] },
        ],
      },
    ],
  },
  {
    paper: 'MAINS_GS2',
    subjects: [
      {
        name: 'Polity & Constitution',
        description: 'Indian Constitution, governance, political system',
        topics: [
          { name: 'Constitutional Design', subtopics: ['Federalism & Centre-State relations', 'Separation of powers & checks', 'Constitutional amendments & landmark judgements', 'Comparison with other constitutions'] },
          { name: 'Parliament & State Legislatures', subtopics: ['Parliamentary procedures & committees', 'Legislative process & delegated legislation', 'Anti-defection law & parliamentary reforms'] },
          { name: 'Executive & Judiciary', subtopics: ['Executive accountability & ministerial responsibility', 'Judicial activism & judicial overreach', 'Appointment & transfer of judges', 'Dispute redressal mechanisms'] },
          { name: 'Elections & Representation', subtopics: ['Election Commission & electoral reforms', 'Representation of People Act', 'Political parties & pressure groups'] },
        ],
      },
      {
        name: 'Governance',
        description: 'Government policies, transparency, e-governance & accountability',
        topics: [
          { name: 'Government Policies & Interventions', subtopics: ['Design & implementation of welfare schemes', 'Role of NGOs & SHGs', 'Citizens charters & service delivery'] },
          { name: 'Transparency & Accountability', subtopics: ['RTI Act & its impact', 'Lokpal & Lokayuktas', 'CVC, CBI & anti-corruption mechanisms'] },
          { name: 'E-Governance', subtopics: ['Digital India & e-governance initiatives', 'Challenges of e-governance implementation'] },
        ],
      },
      {
        name: 'Social Justice',
        description: 'Welfare, health, education & vulnerable sections',
        topics: [
          { name: 'Welfare Schemes & Institutions', subtopics: ['Schemes for SC/ST/OBC/minorities/women', 'Labour laws & social security', 'Issues relating to poverty & hunger'] },
          { name: 'Health & Education', subtopics: ['Healthcare policies & public health', 'Education policy (NEP) & reforms', 'Issues of access & quality'] },
          { name: 'Vulnerable Sections', subtopics: ['Children & child labour', 'Elderly, disabled & transgender rights', 'Tribal welfare & displacement issues'] },
        ],
      },
      {
        name: 'International Relations',
        description: 'India bilateral & multilateral relations',
        topics: [
          { name: 'India & Neighbourhood', subtopics: ['India-Pakistan relations', 'India-China relations', 'Relations with SAARC & BIMSTEC nations', 'India-Sri Lanka & India-Bangladesh'] },
          { name: 'Bilateral & Global Relations', subtopics: ['India-USA relations', 'India-Russia & India-EU', 'India-Africa & India-ASEAN', 'Act East & Look West policies'] },
          { name: 'International Organisations', subtopics: ['UN system & reform', 'WTO, IMF, World Bank', 'Regional groupings (BRICS, SCO, G20, Quad)'] },
          { name: 'Issues in International Relations', subtopics: ['Indian diaspora & soft power', 'Effect of other countries\u2019 policies on India'] },
        ],
      },
    ],
  },
  {
    paper: 'MAINS_GS3',
    subjects: [
      {
        name: 'Economic Development',
        description: 'Indian economy, growth, development & related issues',
        topics: [
          { name: 'Growth & Development', subtopics: ['Inclusive growth & sustainability', 'Poverty, unemployment & inequality', 'Government budgeting & fiscal policy'] },
          { name: 'Financial Sector', subtopics: ['Banking & financial inclusion', 'Capital markets & insurance', 'Monetary policy & inflation management'] },
          { name: 'Industry & Infrastructure', subtopics: ['Industrial policy & Make in India', 'Investment models & PPP', 'Infrastructure development: roads, ports, energy'] },
          { name: 'External Economics', subtopics: ['Liberalisation & globalisation effects', 'Trade agreements & exports strategy', 'Effects of global economic crises on India'] },
        ],
      },
      {
        name: 'Agriculture',
        description: 'Agriculture, food processing & related issues',
        topics: [
          { name: 'Agricultural Practices', subtopics: ['Cropping patterns & land reforms', 'Irrigation & water management', 'Farm mechanisation & technology'] },
          { name: 'Food Security & Supply Chain', subtopics: ['MSP, PDS & buffer stocks', 'Food processing & value addition', 'Supply chain management & e-NAM'] },
          { name: 'Agricultural Reforms', subtopics: ['Farm subsidies & their rationalisation', 'Agricultural marketing reforms', 'Animal husbandry & allied activities'] },
        ],
      },
      {
        name: 'Science & Technology',
        description: 'Developments in S&T and their applications',
        topics: [
          { name: 'Indigenisation & Space', subtopics: ['Indigenisation of technology & developing new tech', 'ISRO missions & space policy', 'Defence & strategic technologies'] },
          { name: 'IT & Emerging Tech', subtopics: ['AI, robotics & automation', 'Cyber security & data protection', 'Blockchain & fintech'] },
          { name: 'Biotech & Health Tech', subtopics: ['Biotechnology applications in agriculture & health', 'IPR & technology transfer'] },
        ],
      },
      {
        name: 'Environment & Disaster Management',
        description: 'Environmental conservation, pollution & disaster management',
        topics: [
          { name: 'Conservation & Biodiversity', subtopics: ['Wildlife protection & conservation efforts', 'Forest governance & community reserves', 'Environmental Impact Assessment'] },
          { name: 'Pollution & Climate', subtopics: ['Air & water pollution control', 'Climate change mitigation & adaptation', 'Carbon credits & green finance'] },
          { name: 'Disaster Management', subtopics: ['NDMA & SDMA framework', 'Disaster preparedness & response', 'Flood, drought & earthquake management', 'Role of technology in disaster risk reduction'] },
        ],
      },
      {
        name: 'Internal Security',
        description: 'Security challenges, border management, extremism & cyber security',
        topics: [
          { name: 'Security Threats', subtopics: ['Left-wing extremism (Naxalism)', 'Terrorism & cross-border threats', 'Insurgency in North-East India'] },
          { name: 'Border & Coastal Security', subtopics: ['Border management & fencing', 'Coastal security & maritime threats', 'Role of BSF, ITBP, Coast Guard'] },
          { name: 'Organised Crime & Cyber', subtopics: ['Money laundering & organised crime', 'Cyber warfare & cyber crime', 'Linkages between crime & terror'] },
          { name: 'Security Architecture', subtopics: ['Role of media & social media in security', 'Security forces & their mandate', 'Intelligence agencies & coordination'] },
        ],
      },
    ],
  },
  {
    paper: 'MAINS_GS4',
    subjects: [
      {
        name: 'Ethics, Integrity & Aptitude',
        description: 'Ethics & human interface, attitude, aptitude, emotional intelligence, public service values',
        topics: [
          { name: 'Ethics & Human Interface', subtopics: ['Essence, determinants & consequences of ethics', 'Dimensions of ethics: private & public relationships', 'Human values: role of family, society & education', 'Contributions of moral thinkers (Indian & Western)'] },
          { name: 'Attitude', subtopics: ['Content, structure & function of attitudes', 'Influence on thought & behaviour', 'Moral & political attitudes', 'Persuasion & attitude change'] },
          { name: 'Aptitude & Emotional Intelligence', subtopics: ['Civil service aptitude & foundational values', 'Integrity, impartiality & non-partisanship', 'Emotional intelligence: concepts & application', 'Tolerance, compassion & empathy in governance'] },
          { name: 'Public Administration Ethics', subtopics: ['Ethical concerns in public administration', 'Laws, rules & conscience as sources of guidance', 'Accountability & ethical governance', 'Strengthening ethical & moral values in governance', 'Code of conduct & code of ethics'] },
          { name: 'Probity in Governance', subtopics: ['Concept of public service & philosophy', 'Information sharing & transparency', 'RTI, codes of ethics & citizen charters', 'Work culture & quality of service delivery', 'Challenges of corruption'] },
          { name: 'Case Studies', subtopics: ['Ethical dilemma scenarios', 'Conflict of interest situations', 'Administrative ethics case analysis'] },
        ],
      },
    ],
  },
];

const main = async () => {
  for (const paperData of syllabus) {
    for (const subjectData of paperData.subjects) {
      const subjectSlug = toSlug(`${paperData.paper}-${subjectData.name}`);
      const subject = await prisma.subject.upsert({
        where: { slug: subjectSlug },
        update: {
          name: subjectData.name,
          description: subjectData.description,
          paper: paperData.paper,
        },
        create: {
          name: subjectData.name,
          slug: subjectSlug,
          description: subjectData.description,
          paper: paperData.paper,
        },
      });

      for (const topicData of subjectData.topics) {
        const topicSlug = toSlug(`${subjectSlug}-${topicData.name}`);
        const rootTopic = await prisma.topic.upsert({
          where: {
            subjectId_slug: {
              subjectId: subject.id,
              slug: topicSlug,
            },
          },
          update: {
            name: topicData.name,
            description: `${subjectData.name} — ${topicData.name}`,
          },
          create: {
            subjectId: subject.id,
            name: topicData.name,
            slug: topicSlug,
            description: `${subjectData.name} — ${topicData.name}`,
            materializedPath: `${subject.id}.${MATERIALIZED_PATH_PENDING_SEGMENT}`,
          },
        });

        await prisma.topic.update({
          where: { id: rootTopic.id },
          data: { materializedPath: `${subject.id}.${rootTopic.id}` },
        });

        for (const subtopicName of topicData.subtopics) {
          const subtopicSlug = toSlug(`${topicSlug}-${subtopicName}`).slice(0, 80);
          const subtopic = await prisma.topic.upsert({
            where: {
              subjectId_slug: {
                subjectId: subject.id,
                slug: subtopicSlug,
              },
            },
            update: {
              name: subtopicName,
              description: `${topicData.name} — ${subtopicName}`,
              parentTopicId: rootTopic.id,
            },
            create: {
              subjectId: subject.id,
              parentTopicId: rootTopic.id,
              name: subtopicName,
              slug: subtopicSlug,
              description: `${topicData.name} — ${subtopicName}`,
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

  const mainsQuestionsToCreate = topics.flatMap((topic, topicIndex) => {
    return Array.from({ length: 3 }, (_value, questionIndex) => {
      const source = mainsQuestionSources[(topicIndex + questionIndex) % mainsQuestionSources.length]!;
      const type = mainsQuestionTypes[(topicIndex + questionIndex) % mainsQuestionTypes.length]!;
      const marks = [10, 12, 15][questionIndex % 3]!;
      return {
        topicId: topic.id,
        type,
        source,
        marks,
        questionText: `${topic.name}: Analyze the key dimensions of this theme and propose a balanced policy response.`,
        modelAnswer: `Model answer for ${topic.name} (${type}) question ${questionIndex + 1}.`,
        suggestedWordLimit: marks === 15 ? 300 : 250,
        year: source === 'pyq' ? 2015 + ((topicIndex + questionIndex) % 11) : null,
      };
    });
  });

  await prisma.mainsQuestion.deleteMany();
  if (mainsQuestionsToCreate.length > 0) {
    await prisma.mainsQuestion.createMany({
      data: mainsQuestionsToCreate,
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

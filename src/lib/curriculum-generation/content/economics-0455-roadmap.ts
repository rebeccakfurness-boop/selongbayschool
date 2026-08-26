/**
 * The full planned lesson sequence and syllabus map for Tom's Cambridge IGCSE Economics 0455
 * course, transcribed directly from rebeccakfurness-boop/selongbayschool-teaching's
 * courses/tom-economics/data/{syllabus.json,lessons.json} -- static reference data, not a
 * curriculum_terms row, so it renders in the admin dashboard with no database round trip.
 *
 * Only lessons 1-6 (see ./economics-0455-tom.ts) have real authored interactive_content ready to
 * import; lessons 7-74 below have a title, date and syllabus reference already planned out, but no
 * lesson content written yet -- exactly what source repo's lessons.json's own
 * materials_generated flag says. `known` on a syllabus subtopic is Tom's own prior-knowledge
 * signal from before this course started (syllabus.json), not this app's workbook-mastery feature.
 */
export interface RoadmapSubtopic {
  id: string;
  title: string;
  known: boolean;
  note?: string;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  subtopics: RoadmapSubtopic[];
}

export type RoadmapLessonPhase = 'content' | 'review' | 'revision' | 'exam-skill' | 'past-paper' | 'buffer';

export interface RoadmapLesson {
  lesson: number;
  date: string;
  weekday: string;
  phase: RoadmapLessonPhase;
  syllabusRef: string;
  title: string;
  materialsGenerated: boolean;
}

export const economics0455Roadmap = {
  code: '0455',
  title: 'Cambridge IGCSE Economics',
  examSeries: 'June 2027',
  className: 'Secondary 8',
  subject: 'Economics',
  totalSlotsAvailable: 76,
  syllabusTopics: [
    {
      id: '1',
      title: 'The basic economic problem',
      subtopics: [
        { id: '1.1', title: 'The nature of the basic economic problem', known: true },
        { id: '1.2', title: 'Factors of production', known: false },
        { id: '1.3', title: 'Opportunity cost', known: true },
        { id: '1.4', title: 'Production possibility curve (PPC) diagrams', known: true },
      ],
    },
    {
      id: '2',
      title: 'The allocation of resources',
      subtopics: [
        { id: '2.1', title: 'The role of markets in allocating resources', known: true },
        { id: '2.2', title: 'Demand', known: true },
        { id: '2.3', title: 'Supply', known: true },
        { id: '2.4', title: 'Price determination', known: true, note: '2.4.1-2.4.2 known; 2.4.3 disequilibrium covered in Lesson 2' },
        { id: '2.5', title: 'Price changes', known: false },
        { id: '2.6', title: 'Price elasticity of demand (PED)', known: false },
        { id: '2.7', title: 'Price elasticity of supply (PES)', known: false },
        { id: '2.8', title: 'Market economic system', known: false },
        { id: '2.9', title: 'Market failure', known: false },
        { id: '2.10', title: 'Mixed economic system', known: false },
      ],
    },
    {
      id: '3',
      title: 'Microeconomic decision-makers',
      subtopics: [
        { id: '3.1', title: 'Money and banking', known: false },
        { id: '3.2', title: 'Households', known: false },
        { id: '3.3', title: 'Workers', known: false },
        { id: '3.4', title: 'Firms', known: false },
        { id: '3.5', title: 'Firms and production', known: false },
        { id: '3.6', title: "Firms' costs, revenue and objectives", known: false },
        { id: '3.7', title: 'Types of markets', known: false },
      ],
    },
    {
      id: '4',
      title: 'Government and the macroeconomy',
      subtopics: [
        { id: '4.1', title: 'Government macroeconomic intervention', known: false },
        { id: '4.2', title: 'Fiscal policy', known: false },
        { id: '4.3', title: 'Monetary policy', known: false },
        { id: '4.4', title: 'Supply-side policy', known: false },
        { id: '4.5', title: 'Economic growth', known: false },
        { id: '4.6', title: 'Employment and unemployment', known: false },
        { id: '4.7', title: 'Inflation', known: false },
      ],
    },
    {
      id: '5',
      title: 'Economic development',
      subtopics: [
        { id: '5.1', title: 'Living standards', known: false },
        { id: '5.2', title: 'Poverty', known: false },
        { id: '5.3', title: 'Population', known: false },
        { id: '5.4', title: 'Differences in economic development between countries', known: false },
      ],
    },
    {
      id: '6',
      title: 'International trade and globalisation',
      subtopics: [
        { id: '6.1', title: 'Specialisation and free trade', known: false },
        { id: '6.2', title: 'Globalisation and trade restrictions', known: false },
        { id: '6.3', title: 'Foreign exchange rates', known: false },
        { id: '6.4', title: 'Current account of the balance of payments', known: false },
      ],
    },
  ] satisfies RoadmapTopic[],
  lessons: [
    { lesson: 1, date: '2026-07-30', weekday: 'Thursday', phase: 'content', syllabusRef: '1.2', title: 'Factors of production', materialsGenerated: true },
    { lesson: 2, date: '2026-08-04', weekday: 'Tuesday', phase: 'content', syllabusRef: '2.4.3 / 2.5', title: 'Market disequilibrium & price changes', materialsGenerated: true },
    { lesson: 3, date: '2026-08-06', weekday: 'Thursday', phase: 'content', syllabusRef: '2.6', title: 'PED: definition, calculation, determinants', materialsGenerated: true },
    { lesson: 4, date: '2026-08-11', weekday: 'Tuesday', phase: 'content', syllabusRef: '2.6', title: 'PED: revenue relationship & significance', materialsGenerated: true },
    { lesson: 5, date: '2026-08-13', weekday: 'Thursday', phase: 'content', syllabusRef: '2.7', title: 'Price elasticity of supply (PES)', materialsGenerated: true },
    { lesson: 6, date: '2026-08-18', weekday: 'Tuesday', phase: 'content', syllabusRef: '2.8', title: 'Market economic system', materialsGenerated: true },
    { lesson: 7, date: '2026-08-20', weekday: 'Thursday', phase: 'content', syllabusRef: '2.9', title: 'Market failure: key definitions', materialsGenerated: false },
    { lesson: 8, date: '2026-08-27', weekday: 'Thursday', phase: 'content', syllabusRef: '2.9', title: 'Market failure: causes & consequences', materialsGenerated: false },
    { lesson: 9, date: '2026-09-01', weekday: 'Tuesday', phase: 'content', syllabusRef: '2.10', title: 'Mixed economy & price controls/tax/subsidies', materialsGenerated: false },
    { lesson: 10, date: '2026-09-03', weekday: 'Thursday', phase: 'content', syllabusRef: '2.10', title: 'Other government intervention (regulation, privatisation, nationalisation, quotas)', materialsGenerated: false },
    { lesson: 11, date: '2026-09-08', weekday: 'Tuesday', phase: 'review', syllabusRef: '1-2', title: 'Review & consolidation: Topics 1-2', materialsGenerated: false },
    { lesson: 12, date: '2026-09-10', weekday: 'Thursday', phase: 'content', syllabusRef: '3.1', title: 'Money and banking', materialsGenerated: false },
    { lesson: 13, date: '2026-09-15', weekday: 'Tuesday', phase: 'content', syllabusRef: '3.2 / 3.3', title: 'Households & choice of occupation', materialsGenerated: false },
    { lesson: 14, date: '2026-09-17', weekday: 'Thursday', phase: 'content', syllabusRef: '3.3', title: 'Wage determination & NMW diagrams', materialsGenerated: false },
    { lesson: 15, date: '2026-09-22', weekday: 'Tuesday', phase: 'content', syllabusRef: '3.3', title: 'Wage differences, mobility, division of labour', materialsGenerated: false },
    { lesson: 16, date: '2026-09-24', weekday: 'Thursday', phase: 'content', syllabusRef: '3.4', title: 'Types of firms & mergers', materialsGenerated: false },
    { lesson: 17, date: '2026-09-29', weekday: 'Tuesday', phase: 'content', syllabusRef: '3.4', title: 'Economies & diseconomies of scale', materialsGenerated: false },
    { lesson: 18, date: '2026-10-01', weekday: 'Thursday', phase: 'content', syllabusRef: '3.5', title: 'Firms and production', materialsGenerated: false },
    { lesson: 19, date: '2026-10-13', weekday: 'Tuesday', phase: 'content', syllabusRef: '3.6', title: 'Costs of production (calculations)', materialsGenerated: false },
    { lesson: 20, date: '2026-10-15', weekday: 'Thursday', phase: 'content', syllabusRef: '3.6', title: "Revenue & firms' objectives", materialsGenerated: false },
    { lesson: 21, date: '2026-10-20', weekday: 'Tuesday', phase: 'content', syllabusRef: '3.7', title: 'Types of markets: competitive vs monopoly', materialsGenerated: false },
    { lesson: 22, date: '2026-10-22', weekday: 'Thursday', phase: 'review', syllabusRef: '3', title: 'Review & consolidation: Topic 3', materialsGenerated: false },
    { lesson: 23, date: '2026-10-27', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.1', title: 'Macroeconomic aims & conflicts', materialsGenerated: false },
    { lesson: 24, date: '2026-10-29', weekday: 'Thursday', phase: 'content', syllabusRef: '4.2', title: 'Government budget & taxation', materialsGenerated: false },
    { lesson: 25, date: '2026-11-03', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.2', title: 'Fiscal policy measures & effects', materialsGenerated: false },
    { lesson: 26, date: '2026-11-05', weekday: 'Thursday', phase: 'content', syllabusRef: '4.3', title: 'Monetary policy', materialsGenerated: false },
    { lesson: 27, date: '2026-11-10', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.4', title: 'Supply-side policy', materialsGenerated: false },
    { lesson: 28, date: '2026-11-12', weekday: 'Thursday', phase: 'content', syllabusRef: '4.5', title: 'Economic growth', materialsGenerated: false },
    { lesson: 29, date: '2026-11-17', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.5', title: 'Recession & growth policies', materialsGenerated: false },
    { lesson: 30, date: '2026-11-19', weekday: 'Thursday', phase: 'content', syllabusRef: '4.6', title: 'Unemployment: definitions, measurement, types', materialsGenerated: false },
    { lesson: 31, date: '2026-11-24', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.6', title: 'Unemployment: consequences & policies', materialsGenerated: false },
    { lesson: 32, date: '2026-11-26', weekday: 'Thursday', phase: 'content', syllabusRef: '4.7', title: 'Inflation: definitions, measurement, causes', materialsGenerated: false },
    { lesson: 33, date: '2026-12-01', weekday: 'Tuesday', phase: 'content', syllabusRef: '4.7', title: 'Inflation: consequences & policies', materialsGenerated: false },
    { lesson: 34, date: '2026-12-03', weekday: 'Thursday', phase: 'review', syllabusRef: '4', title: 'Review & consolidation: Topic 4', materialsGenerated: false },
    { lesson: 35, date: '2026-12-08', weekday: 'Tuesday', phase: 'content', syllabusRef: '5.1', title: 'Living standards (GDP/head, HDI)', materialsGenerated: false },
    { lesson: 36, date: '2026-12-10', weekday: 'Thursday', phase: 'content', syllabusRef: '5.2', title: 'Poverty', materialsGenerated: false },
    { lesson: 37, date: '2027-01-12', weekday: 'Tuesday', phase: 'content', syllabusRef: '5.3', title: 'Population', materialsGenerated: false },
    { lesson: 38, date: '2027-01-14', weekday: 'Thursday', phase: 'content', syllabusRef: '5.4', title: 'International development differences', materialsGenerated: false },
    { lesson: 39, date: '2027-01-19', weekday: 'Tuesday', phase: 'review', syllabusRef: '5', title: 'Review & consolidation: Topic 5', materialsGenerated: false },
    { lesson: 40, date: '2027-01-21', weekday: 'Thursday', phase: 'content', syllabusRef: '6.1', title: 'Specialisation & free trade', materialsGenerated: false },
    { lesson: 41, date: '2027-01-26', weekday: 'Tuesday', phase: 'content', syllabusRef: '6.2', title: 'Globalisation & multinational companies', materialsGenerated: false },
    { lesson: 42, date: '2027-01-28', weekday: 'Thursday', phase: 'content', syllabusRef: '6.2', title: 'Trade restrictions', materialsGenerated: false },
    { lesson: 43, date: '2027-02-02', weekday: 'Tuesday', phase: 'content', syllabusRef: '6.3', title: 'Foreign exchange rates: basics & reasons to trade currency', materialsGenerated: false },
    { lesson: 44, date: '2027-02-04', weekday: 'Thursday', phase: 'content', syllabusRef: '6.3', title: 'Exchange rate determination & consequences', materialsGenerated: false },
    { lesson: 45, date: '2027-02-09', weekday: 'Tuesday', phase: 'content', syllabusRef: '6.4', title: 'Balance of payments: structure & causes', materialsGenerated: false },
    { lesson: 46, date: '2027-02-11', weekday: 'Thursday', phase: 'content', syllabusRef: '6.4', title: 'Balance of payments: consequences & policies', materialsGenerated: false },
    { lesson: 47, date: '2027-02-16', weekday: 'Tuesday', phase: 'review', syllabusRef: '6', title: 'Review & consolidation: Topic 6 + full syllabus map', materialsGenerated: false },
    { lesson: 48, date: '2027-02-18', weekday: 'Thursday', phase: 'revision', syllabusRef: '1', title: 'Revision blitz: Topic 1', materialsGenerated: false },
    { lesson: 49, date: '2027-02-23', weekday: 'Tuesday', phase: 'revision', syllabusRef: '2', title: 'Revision blitz: Topic 2', materialsGenerated: false },
    { lesson: 50, date: '2027-02-25', weekday: 'Thursday', phase: 'revision', syllabusRef: '3', title: 'Revision blitz: Topic 3', materialsGenerated: false },
    { lesson: 51, date: '2027-03-02', weekday: 'Tuesday', phase: 'revision', syllabusRef: '4', title: 'Revision blitz: Topic 4', materialsGenerated: false },
    { lesson: 52, date: '2027-03-04', weekday: 'Thursday', phase: 'revision', syllabusRef: '5', title: 'Revision blitz: Topic 5', materialsGenerated: false },
    { lesson: 53, date: '2027-03-23', weekday: 'Tuesday', phase: 'revision', syllabusRef: '6', title: 'Revision blitz: Topic 6', materialsGenerated: false },
    { lesson: 54, date: '2027-03-25', weekday: 'Thursday', phase: 'exam-skill', syllabusRef: 'P1', title: 'Paper 1 command words & MCQ technique + timed set', materialsGenerated: false },
    { lesson: 55, date: '2027-03-30', weekday: 'Tuesday', phase: 'exam-skill', syllabusRef: 'P1', title: 'Paper 1 timed practice set 2 + review', materialsGenerated: false },
    { lesson: 56, date: '2027-04-01', weekday: 'Thursday', phase: 'exam-skill', syllabusRef: 'P2-A', title: 'Paper 2 Section A (data response) technique', materialsGenerated: false },
    { lesson: 57, date: '2027-04-06', weekday: 'Tuesday', phase: 'exam-skill', syllabusRef: 'P2-B', title: 'Paper 2 Section B part (d) evaluation technique (Level 3 answers)', materialsGenerated: false },
    { lesson: 58, date: '2027-04-08', weekday: 'Thursday', phase: 'past-paper', syllabusRef: 'PP1', title: 'Past paper 1: sit (P1+P2 extract)', materialsGenerated: false },
    { lesson: 59, date: '2027-04-13', weekday: 'Tuesday', phase: 'past-paper', syllabusRef: 'PP1', title: 'Past paper 1: review & feedback', materialsGenerated: false },
    { lesson: 60, date: '2027-04-15', weekday: 'Thursday', phase: 'past-paper', syllabusRef: 'PP2', title: 'Past paper 2: sit', materialsGenerated: false },
    { lesson: 61, date: '2027-04-20', weekday: 'Tuesday', phase: 'past-paper', syllabusRef: 'PP2', title: 'Past paper 2: review & feedback', materialsGenerated: false },
    { lesson: 62, date: '2027-04-22', weekday: 'Thursday', phase: 'past-paper', syllabusRef: 'PP3', title: 'Past paper 3: sit', materialsGenerated: false },
    { lesson: 63, date: '2027-04-27', weekday: 'Tuesday', phase: 'past-paper', syllabusRef: 'PP3', title: 'Past paper 3: review & feedback', materialsGenerated: false },
    { lesson: 64, date: '2027-04-29', weekday: 'Thursday', phase: 'past-paper', syllabusRef: 'PP4', title: 'Past paper 4: sit', materialsGenerated: false },
    { lesson: 65, date: '2027-05-04', weekday: 'Tuesday', phase: 'past-paper', syllabusRef: 'PP4', title: 'Past paper 4: review & feedback', materialsGenerated: false },
    { lesson: 66, date: '2027-05-06', weekday: 'Thursday', phase: 'past-paper', syllabusRef: 'PP5', title: 'Past paper 5: sit', materialsGenerated: false },
    { lesson: 67, date: '2027-05-11', weekday: 'Tuesday', phase: 'past-paper', syllabusRef: 'PP5', title: 'Past paper 5: review & feedback', materialsGenerated: false },
    { lesson: 68, date: '2027-05-13', weekday: 'Thursday', phase: 'buffer', syllabusRef: '-', title: 'Flex/re-teach slot (weakest topic, reactive)', materialsGenerated: false },
    { lesson: 69, date: '2027-05-18', weekday: 'Tuesday', phase: 'buffer', syllabusRef: '-', title: 'Flex/re-teach slot (weakest topic, reactive)', materialsGenerated: false },
    { lesson: 70, date: '2027-05-25', weekday: 'Tuesday', phase: 'buffer', syllabusRef: '-', title: 'Flex/re-teach slot (weakest topic, reactive)', materialsGenerated: false },
    { lesson: 71, date: '2027-05-27', weekday: 'Thursday', phase: 'buffer', syllabusRef: '-', title: 'Final mixed past-paper drill', materialsGenerated: false },
    { lesson: 72, date: '2027-06-03', weekday: 'Thursday', phase: 'buffer', syllabusRef: '-', title: 'Final mixed past-paper drill', materialsGenerated: false },
    { lesson: 73, date: '2027-06-08', weekday: 'Tuesday', phase: 'buffer', syllabusRef: '-', title: 'Confidence-building light review', materialsGenerated: false },
    { lesson: 74, date: '2027-06-10', weekday: 'Thursday', phase: 'buffer', syllabusRef: '-', title: 'Confidence-building light review + exam-day logistics chat', materialsGenerated: false },
  ] satisfies RoadmapLesson[],
};

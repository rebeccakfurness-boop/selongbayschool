import type { SampleTermSeed } from './curriculum-seed-types';

/** Draft Economics content for Secondary 6 and Secondary 8 only — an enrichment/foundation subject
 * rather than a full Primary-to-IGCSE progression like Mathematics, English, and Science. Unlike
 * those three, Economics isn't part of Cambridge's Primary or Lower Secondary frameworks (Cambridge
 * only offers it from IGCSE, typically Secondary 9–10 in this school's numbering), so these two
 * programmes are original writing built as an age-appropriate bridge toward that later IGCSE
 * content rather than a staged Cambridge sequence — hence "Introductory Economics" rather than a
 * Cambridge framework label. Still explicitly a DRAFT: see curriculum-seed.ts for the full
 * explanation of why every unit/lesson here needs a teacher's review before real use.
 */
export const ECONOMICS_TERMS: SampleTermSeed[] = [
  {
    className: 'Secondary 6',
    subject: 'Economics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Introductory Economics (draft)',
    units: [
      {
        title: 'Basic Economic Concepts',
        description: 'Why economics exists: limited resources against unlimited wants.',
        lessons: [
          { title: 'Scarcity and choice', objectives: 'Explain why scarcity means every individual and society must make choices about how to use resources.' },
          { title: 'Needs, wants and opportunity cost', objectives: 'Distinguish needs from wants and explain opportunity cost using everyday examples.' },
        ],
      },
      {
        title: 'Resources and Production',
        description: 'What it takes to produce the goods and services people use.',
        lessons: [
          { title: 'The factors of production', objectives: 'Identify land, labour, capital, and enterprise as the factors of production and give an example of each.' },
          { title: 'From resources to finished goods', objectives: 'Describe, for a simple product, the resources and stages involved in producing it.' },
        ],
      },
      {
        title: 'Money and Exchange',
        description: 'Why societies use money instead of trading goods directly.',
        lessons: [
          { title: 'Barter and its problems', objectives: 'Explain how a barter system works and identify its main drawbacks.' },
          { title: 'The functions of money', objectives: 'Describe the functions of money, including as a medium of exchange and a store of value.' },
        ],
      },
      {
        title: 'Markets: Buying and Selling',
        description: 'A first, informal look at how prices are set.',
        lessons: [
          { title: 'What is a market?', objectives: 'Explain what a market is and identify examples of markets in everyday life.' },
          { title: 'Why prices change', objectives: 'Give simple reasons why the price of a good might rise or fall, such as popularity or scarcity.' },
        ],
      },
      {
        title: 'Households and Spending',
        description: 'Personal finance basics: income, budgeting, and saving.',
        lessons: [
          { title: 'Income and spending', objectives: 'Distinguish sources of household income and explain the difference between needs-based and wants-based spending.' },
          { title: 'Making a simple budget', objectives: 'Create a simple budget that balances income against planned spending and saving.' },
        ],
      },
      {
        title: 'Businesses and Work',
        description: 'Why businesses exist and why people work.',
        lessons: [
          { title: 'Why people work', objectives: 'Explain the main reasons people work, including income, skills, and personal satisfaction.' },
          { title: 'What a business does', objectives: 'Describe, in simple terms, how a business turns resources into a product or service that customers will pay for.' },
        ],
      },
      {
        title: 'Economics in Everyday Life',
        description: 'Connecting classroom ideas to the wider world.',
        lessons: [
          { title: 'Where our things come from', objectives: 'Trace a familiar product back to where its raw materials might come from, including from other countries.' },
          { title: 'Spotting economics in the news', objectives: 'Identify an economic idea, such as price, trade, or scarcity, in a simple news story or headline.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 8',
    subject: 'Economics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Introductory Economics, extended (draft)',
    units: [
      {
        title: 'The Economic Problem',
        description: 'Revisiting scarcity and choice with more formal language and reasoning.',
        lessons: [
          { title: 'Scarcity, choice and opportunity cost', objectives: 'Explain the economic problem formally and use opportunity cost to evaluate a choice between alternatives.' },
          { title: 'How economic systems answer the basic questions', objectives: 'Describe, at an introductory level, how different economic systems decide what, how, and for whom to produce.' },
        ],
      },
      {
        title: 'Demand and Supply',
        description: 'A first formal look at how markets set prices.',
        lessons: [
          { title: 'The demand curve', objectives: 'Explain the law of demand and draw a simple demand curve, identifying factors that could shift it.' },
          { title: 'The supply curve', objectives: 'Explain the law of supply and draw a simple supply curve, identifying factors that could shift it.' },
          { title: 'Market equilibrium', objectives: 'Use demand and supply curves together to identify the equilibrium price and quantity in a market.' },
        ],
      },
      {
        title: 'Markets and Prices',
        description: 'What happens when market conditions change, and why governments sometimes step in.',
        lessons: [
          { title: 'Changes in market price', objectives: 'Predict and explain how a shift in demand or supply changes the equilibrium price and quantity.' },
          { title: 'Why governments intervene in markets', objectives: 'Give reasons a government might intervene in a market, such as setting a minimum or maximum price.' },
        ],
      },
      {
        title: 'Business Economics',
        description: 'How a business is organised and how it makes money.',
        lessons: [
          { title: 'Types of business organisation', objectives: 'Compare sole traders, partnerships, and companies in terms of ownership and responsibility.' },
          { title: 'Costs, revenue and profit', objectives: 'Distinguish fixed from variable costs and calculate a simple business’s profit from its revenue and costs.' },
        ],
      },
      {
        title: 'Money, Banking and Finance',
        description: 'How banks connect savers and borrowers.',
        lessons: [
          { title: 'What banks do', objectives: 'Explain the role banks play in accepting deposits and lending money.' },
          { title: 'Saving, borrowing and interest', objectives: 'Explain what interest is and calculate simple interest on a saving or borrowing example.' },
        ],
      },
      {
        title: 'Government and the Economy',
        description: 'How governments raise and spend money.',
        lessons: [
          { title: 'Taxation', objectives: 'Explain why governments collect tax and give examples of different types of tax.' },
          { title: 'Public spending', objectives: 'Give examples of what governments spend tax revenue on and explain why these are usually provided publicly.' },
        ],
      },
      {
        title: 'International Trade',
        description: 'Why countries trade with each other, at an introductory level.',
        lessons: [
          { title: 'Why countries trade', objectives: 'Explain, using a simple example, why a country might specialise and trade rather than produce everything itself.' },
          { title: 'Imports, exports and exchange rates', objectives: 'Define imports and exports and explain, in simple terms, what an exchange rate is.' },
        ],
      },
    ],
  },
];

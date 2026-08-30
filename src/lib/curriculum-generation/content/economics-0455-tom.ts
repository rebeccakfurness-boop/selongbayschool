import type { CurriculumTermContentModule } from './types';

/**
 * Real, already-taught content for Tom's Cambridge IGCSE Economics 0455 course (June 2027 exam
 * series) -- ported directly from rebeccakfurness-boop/selongbayschool-teaching's
 * courses/tom-economics (a separate, 1-on-1 tutoring prototype repo, same owner). Every
 * definition, worked example, quiz question and flashcard below is transcribed from that
 * repo's lesson-01..lesson-06 lesson.html/flashcards.txt/guide.html files -- not invented -- and
 * reshaped onto this app's interactive-content-types.ts step schema.
 *
 * Filed under class_name 'Secondary 8' per explicit confirmation (Tom's own course data has no
 * class_name field, since it's a single-student tutoring course, not tied to this school's real
 * classes).
 *
 * Only 6 of the syllabus's 74 planned lessons have real authored materials so far (source repo's
 * data/lessons.json marks lessons 7-74 as materials_generated: false) -- so parsedSyllabus.topicTree
 * below deliberately lists only the two top-level topics these 6 lessons actually cover (topic 1
 * fully, topic 2 partially: 2.4.3-2.8 of 2.1-2.10). generateCurriculumTerm() loops over every topic
 * in topicTree and calls provider.generateUnit() unconditionally for each one (see generate.ts) --
 * listing a topic here with no matching entry in `units` below would make StaticContentGenerationProvider
 * throw. As more of Tom's lessons get authored, add their topics/units here (or a follow-up content
 * module with the same termLabel + allowUpdatingExistingTerm: true) -- generateCurriculumTerm()
 * appends new units to the existing term rather than replacing it, so this rollout is designed to
 * run again incrementally, not all at once.
 */
const economics0455Tom: CurriculumTermContentModule = {
  input: {
    className: 'Secondary 8',
    subject: 'Economics',
    termLabel: 'Cambridge IGCSE Economics 0455 (June 2027 exam series)',
    frameworkLabel: 'Cambridge IGCSE 0455',
    syllabusText:
      'Cambridge IGCSE Economics 0455, June 2027 exam series. Topic 1: The basic economic problem ' +
      '(1.1 scarcity, choice and opportunity cost; 1.2 factors of production; 1.3 production possibility ' +
      'curves; 1.4 economic classification of production). Topic 2: The allocation of resources (2.1 ' +
      'demand; 2.2 supply; 2.3 market equilibrium; 2.4 market disequilibrium; 2.5 price changes; 2.6 ' +
      'price elasticity of demand; 2.7 price elasticity of supply; 2.8 market economic system; 2.9 ' +
      'mixed economic system; 2.10 market failure). Only 1.2 and 2.4.3-2.8 have authored lessons so far.',
    allowUpdatingExistingTerm: true,
  },
  content: {
    parsedSyllabus: {
      subject: 'Economics',
      frameworkLabel: 'Cambridge IGCSE 0455',
      topicTree: [
        {
          id: 'topic-1',
          title: 'The basic economic problem',
          subtopics: [
            { id: '1.1', title: 'The nature of the basic economic problem' },
            { id: '1.2', title: 'Factors of production' },
            { id: '1.3', title: 'Opportunity cost' },
            { id: '1.4', title: 'Production possibility curve (PPC) diagrams' },
          ],
        },
        {
          id: 'topic-2',
          title: 'The allocation of resources',
          subtopics: [
            { id: '2.1', title: 'The role of markets in allocating resources' },
            { id: '2.2', title: 'Demand' },
            { id: '2.3', title: 'Supply' },
            { id: '2.4', title: 'Price determination' },
            { id: '2.5', title: 'Price changes' },
            { id: '2.6', title: 'Price elasticity of demand (PED)' },
            { id: '2.7', title: 'Price elasticity of supply (PES)' },
            { id: '2.8', title: 'Market economic system' },
            { id: '2.9', title: 'Market failure' },
            { id: '2.10', title: 'Mixed economic system' },
          ],
        },
      ],
      assessmentObjectives: [
        'AO1 Knowledge and understanding',
        'AO2 Application',
        'AO3 Analysis',
        'AO4 Evaluation',
      ],
      components: [],
    },
    units: {
      'topic-1': {
        topicId: 'topic-1',
        title: 'The basic economic problem',
        description: 'Syllabus 1.2 -- factors of production and their rewards; quantity vs quality of a factor.',
        lessons: [
          {
            title: 'Lesson 1 -- Factors of Production',
            syllabusRef: '1.2',
            objectives:
              'Define the four factors of production (land, labour, capital, enterprise), state each one’s ' +
              'reward (rent, wages, interest, profit), and explain what changes a factor’s quantity vs quality.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-flip',
                  type: 'flip_card',
                  kicker: 'Lesson 1 · 30 minutes',
                  title: 'Factors of Production',
                  lede: 'How does Tom’s Print Co. actually make stuff? First, a 60-second check that Term 1 stuck. Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'Scarcity', definition: 'Unlimited wants, limited resources — the basic economic problem that forces every choice.' },
                    { term: 'Opportunity Cost', definition: 'The value of the next best alternative you give up when you make a choice.' },
                    { term: 'Economic vs Free Goods', definition: 'Economic goods are scarce and have a cost (headphones, a car). Free goods don’t (sunlight, fresh air).' },
                    { term: 'Production Possibility Curve', definition: 'Shows the maximum combinations of two goods an economy can produce with its resources.' },
                  ],
                },
                {
                  id: 'explain-four-factors',
                  type: 'explanation',
                  kicker: 'Hook → Big idea',
                  title: 'Four Categories, Every Business, Always',
                  lede: 'If you were going to actually start Tom’s Print Co. this weekend, what four types of thing would you need — not a shopping list, but categories?',
                  conceptId: 'factors-of-production',
                  definition:
                    'Every single thing any business produces is only possible because it combines resources from four ' +
                    'categories, called the factors of production: Land, Labour, Capital, and Enterprise. Spotting which ' +
                    'one something is — that’s the actual exam skill.',
                  example:
                    'Tom’s Print Co. 3D-prints custom padel paddle grips and personalised Lego-compatible minifigure ' +
                    'accessories — every input it uses sorts into one of these four boxes.',
                },
                {
                  id: 'explain-land',
                  type: 'explanation',
                  kicker: 'Factor 1 of 4',
                  title: '🌍 Land',
                  conceptId: 'factors-of-production',
                  definition:
                    'Land means any natural resource used in production — not just literal ground or soil. It includes ' +
                    'raw materials, minerals, oil, water, forests — anything nature provides that a business uses. ' +
                    'Reward: RENT.',
                  example:
                    'In Tom’s Print Co., the PLA plastic filament Tom prints with is made from petroleum — a natural ' +
                    'resource. Even though a spool of filament doesn’t look anything like “land”, in economics it ' +
                    'counts as land, because it’s a raw material taken from nature and turned into something usable.',
                },
                {
                  id: 'explain-labour',
                  type: 'explanation',
                  kicker: 'Factor 2 of 4',
                  title: '🧑‍🔧 Labour',
                  definition: 'Labour means human physical or mental effort used in production — anyone actually doing the work. Reward: WAGES.',
                  example:
                    'In Tom’s Print Co., every hour Tom spends designing a CAD file, running the printer, sanding a ' +
                    'rough edge, or packaging an order — that’s labour. A friend hired to help pack orders supplies labour too.',
                },
                {
                  id: 'explain-capital',
                  type: 'explanation',
                  kicker: 'Factor 3 of 4',
                  title: '🖨️ Capital',
                  definition:
                    'Capital means manufactured goods used to produce other goods or services — machinery, tools, ' +
                    'equipment, buildings. Reward: INTEREST. The #1 mix-up: in everyday language “capital” often means ' +
                    'money or savings. In economics it does NOT — capital is the physical machinery itself.',
                  example:
                    'In Tom’s Print Co., the 3D printer itself, Tom’s laptop for designing, his calipers and sandpaper ' +
                    '— all capital. The cash Tom used to buy the printer is finance, not capital — the printer sitting ' +
                    'in his workshop is the capital.',
                },
                {
                  id: 'explain-enterprise',
                  type: 'explanation',
                  kicker: 'Factor 4 of 4',
                  title: '🎲 Enterprise',
                  definition:
                    'Enterprise means the willingness and ability to take risks and organise the other three factors, in ' +
                    'pursuit of profit. Reward: PROFIT. Profit is different from the other three rewards — rent, wages ' +
                    'and interest are usually agreed in advance and guaranteed. Profit is what’s left over, and it can be negative.',
                  example:
                    'In Tom’s Print Co., Tom deciding to actually start the business — choosing what to make, risking ' +
                    'his own savings on a printer that might not pay off, organising land, labour and capital into something ' +
                    'that works — that decision-making and risk-taking is enterprise.',
                },
                {
                  id: 'sort-which-factor',
                  type: 'sort_classify',
                  kicker: 'Now you try',
                  title: 'Which Factor Is It?',
                  lede: 'Sort each input from Tom’s Print Co. into the correct factor.',
                  testsConceptIds: ['factors-of-production'],
                  categories: ['Land', 'Labour', 'Capital', 'Enterprise'],
                  items: [
                    { id: 'filament', label: '🧵 PLA filament spool (made from petroleum)', correctCategory: 'Land', reason: 'A natural resource used in production — not manufactured.' },
                    { id: 'printer', label: '🖨️ The 3D printer itself', correctCategory: 'Capital', reason: 'A manufactured good used to produce other goods — not money.' },
                    { id: 'toms-hours', label: '⏰ Tom’s own hours designing & printing', correctCategory: 'Labour', reason: 'Human physical/mental effort used in production.' },
                    { id: 'decision', label: '💡 Tom’s decision to start the business', correctCategory: 'Enterprise', reason: 'Risk-taking and organising the other three factors.' },
                    { id: 'workshop', label: '🏢 The rented workshop space', correctCategory: 'Land', reason: 'Another natural-resource-linked input — space/land, not manufactured.' },
                    { id: 'friend', label: '🧑‍🤝‍🧑 A friend hired to help pack orders', correctCategory: 'Labour', reason: 'More human effort supplied to the business.' },
                  ],
                },
                {
                  id: 'flip-match-reward',
                  type: 'flip_card',
                  kicker: 'Quick memory check',
                  title: 'Match the Reward',
                  lede: 'Tap each factor to check you’ve got its reward memorised.',
                  testsConceptIds: ['factors-of-production'],
                  cards: [
                    { term: '🌍 Land', definition: 'Reward: RENT' },
                    { term: '🧑‍🔧 Labour', definition: 'Reward: WAGES' },
                    { term: '🖨️ Capital', definition: 'Reward: INTEREST' },
                    { term: '🎲 Enterprise', definition: 'Reward: PROFIT (not guaranteed!)' },
                  ],
                },
                {
                  id: 'explain-quantity-quality',
                  type: 'explanation',
                  kicker: 'A second dimension',
                  title: 'Factors Can Also Change',
                  conceptId: 'quantity-quality-factors',
                  definition:
                    'Each factor can change in two ways: QUANTITY (how much of a factor exists — more of the same) ' +
                    'and QUALITY (how good that factor is — the same amount, but improved).',
                  example:
                    'Tom buying a second 3D printer is a change in quantity of capital. Tom upgrading to a faster, more ' +
                    'precise printer is a change in quality of capital — same number of machines, just a better one.',
                },
                {
                  id: 'tap-quantity-or-quality',
                  type: 'tap_reveal_grid',
                  kicker: 'Now you try',
                  title: 'Quantity or Quality?',
                  lede: 'Tap each scenario to check your answer.',
                  cards: [
                    { id: 'second-printer', icon: '🖨️', label: '2nd printer bought', content: 'QUANTITY — more units of the same capital.' },
                    { id: 'faster-printer', icon: '⚡', label: 'Faster printer bought', content: 'QUALITY — same number, better machine.' },
                    { id: 'friend-joins', icon: '🧑‍🤝‍🧑', label: 'Friend joins to help', content: 'QUANTITY — more units of labour.' },
                    { id: 'cad-course', icon: '🎓', label: 'Tom does a CAD course', content: 'QUALITY — same labour, more skilled.' },
                    { id: 'new-supplier', icon: '🧵', label: 'New filament supplier found', content: 'QUANTITY — more of the raw material available.' },
                    { id: 'stronger-filament', icon: '✨', label: 'Switch to stronger-grade filament', content: 'QUALITY — same amount, better material.' },
                  ],
                },
                {
                  id: 'guess-mixups',
                  type: 'guess_reveal',
                  kicker: 'Common mix-ups',
                  title: 'Watch Out For These',
                  lede: 'Guess first, then tap to reveal.',
                  testsConceptIds: ['factors-of-production'],
                  cards: [
                    { question: 'Is the cash in Tom’s business bank account “capital”?', answer: 'No — in economics, capital means physical manufactured goods (the printer, tools), not money. Cash is finance, not a factor of production.' },
                    { question: 'Does “land” only mean literal ground/soil?', answer: 'No — land means any natural resource, including the raw filament material itself (made from petroleum).' },
                    { question: 'Is an employee Tom hires supplying “enterprise”?', answer: 'No — an employee supplies labour (paid wages). Enterprise is Tom himself, organising and risking capital, rewarded by profit.' },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  lede: 'Three quick ones to make sure it’s all clicked into place.',
                  testsConceptIds: ['factors-of-production', 'quantity-quality-factors'],
                  questions: [
                    {
                      question: 'Which of the following is an example of capital in economics?',
                      options: ['The money Tom uses to buy filament', 'Tom’s 3D printer', 'Tom’s decision to start the business', 'The rent Tom pays for his workshop'],
                      correctOptionIndex: 1,
                      feedback: 'The printer is a manufactured good used to produce other goods — that’s capital. Cash is finance, not capital.',
                    },
                    {
                      question: 'A worker’s reward for supplying labour is called:',
                      options: ['Rent', 'Profit', 'Interest', 'Wages'],
                      correctOptionIndex: 3,
                      feedback: 'Wages are the reward to labour.',
                    },
                    {
                      question: 'Tom buys a second 3D printer. Is this a change in quantity or quality of capital?',
                      options: ['Quantity', 'Quality'],
                      correctOptionIndex: 0,
                      feedback: 'Quantity — it’s more units of the same capital good, not a better one.',
                    },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'Land: A natural resource used in production.',
                    'Labour: Human physical or mental effort used in production.',
                    'Capital: Manufactured goods used to produce other goods/services — not money.',
                    'Enterprise: Willingness/ability to take risks and organise the other factors, in pursuit of profit.',
                    'Rent, Wages, Interest, Profit: The rewards to land, labour, capital and enterprise, in that order.',
                  ],
                  homeworkItems: ['Definitions table', 'Apply it: Tom’s Print Co. scenario', 'Quantity vs quality examples', 'Exam-style MCQs + 4-mark question'],
                },
              ],
            },
            teachingScript: {
              overview:
                'Introduces the four factors of production (land, labour, capital, enterprise) and their rewards ' +
                '(rent, wages, interest, profit), using Tom’s Print Co. as the running example, then covers how ' +
                'each factor’s quantity and quality can change.',
              steps: [
                {
                  stepId: 'explain-four-factors',
                  talkingPoints: ['Ask what four categories of thing you’d need to start Tom’s Print Co. this weekend, and let him guess loosely before naming the four factors.'],
                  timingMinutes: 3,
                },
                {
                  stepId: 'explain-capital',
                  talkingPoints: ['Flag the #1 mix-up explicitly: capital means the physical machinery, not money — cash used to buy the printer is finance, not capital.'],
                  timingMinutes: 12,
                  misconceptions: ['“Capital = money.” In economics capital is the physical manufactured stuff (the printer, tools) — not cash or savings.'],
                },
                {
                  stepId: 'explain-quantity-quality',
                  talkingPoints: ['Explain quantity (more of the same) vs quality (same amount, improved), then ask Tom to generate one more pair himself before moving on.'],
                  timingMinutes: 8,
                },
                {
                  stepId: 'guess-mixups',
                  talkingPoints: ['Correct “land only means soil” and “labour vs enterprise” mix-ups immediately if they come up.'],
                  misconceptions: ['Land only means soil/ground.', 'Mixing up labour and enterprise.', 'Treating profit as guaranteed like wages.'],
                },
                {
                  stepId: 'recap-key-words',
                  talkingPoints: ['Set the worksheet and flashcards for self-directed time; preview Lesson 2’s padel court shortage example.'],
                  timingMinutes: 2,
                },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — Factors of Production',
              instructions: 'Answer in full sentences using Tom’s Print Co. as your example wherever asked.',
              questions: [
                { prompt: 'Name the four factors of production and state the reward paid to each one.', marks: 4, answer: 'Land — rent; Labour — wages; Capital — interest; Enterprise — profit.' },
                { prompt: 'Identify the factor of production each of these belongs to for Tom’s Print Co.: (a) the PLA filament, (b) the 3D printer, (c) Tom’s time designing CAD files, (d) Tom’s decision to start the business.', marks: 4, answer: '(a) Land (b) Capital (c) Labour (d) Enterprise.' },
                { prompt: 'Explain the difference between the quantity and the quality of a factor of production, using Tom buying a second 3D printer versus upgrading to a faster one as your example.', marks: 4, answer: 'Quantity is how much of a factor exists — buying a second printer increases the quantity of capital. Quality is how productive/effective a factor is — upgrading to a faster, more precise printer increases the quality of capital without changing how many printers Tom owns.' },
                { prompt: 'Tom says: "Capital just means the money I have saved up." Explain why this is a common misconception in economics.', marks: 3, answer: 'In economics, capital means the physical manufactured goods used to produce other things (machinery, tools, equipment) — e.g. the 3D printer itself, not the cash used to buy it. Money used to buy capital is finance, not capital.' },
                { prompt: 'Explain why profit is described as a "residual" reward, unlike rent, wages, and interest.', marks: 3, answer: 'Profit is not guaranteed — it is what is left over after all other costs (rent, wages, interest) have been paid, so it can be negative (a loss), unlike rent, wages, and interest which are fixed, contractual payments.' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Factors of production', definition: 'The resources used to produce goods and services — classified into land, labour, capital and enterprise.' },
              { term: 'Land', definition: 'A factor of production consisting of natural resources used in production, e.g. raw materials, oil, minerals. In Tom’s Print Co., the PLA filament (made from petroleum) counts as land. Its reward is rent.' },
              { term: 'Labour', definition: 'A factor of production consisting of human physical or mental effort used in production. In Tom’s Print Co., this is Tom’s own time designing CAD files, running the printer, and packaging orders. Its reward is wages.' },
              { term: 'Capital', definition: 'A factor of production consisting of manufactured goods used to produce other goods and services, e.g. machinery, tools, buildings. In Tom’s Print Co., this is the 3D printer, laptop, and tools. Capital is not the same as money — cash itself is not a factor of production. Its reward is interest.' },
              { term: 'Enterprise', definition: 'A factor of production involving the willingness and ability to take risks, organise the other three factors of production, and innovate, in pursuit of profit. In Tom’s Print Co., this is Tom’s decision to start the business and risk his savings. Its reward is profit.' },
              { term: 'Rent', definition: 'The reward paid to the factor of production land.' },
              { term: 'Wages', definition: 'The reward paid to the factor of production labour.' },
              { term: 'Interest', definition: 'The reward paid to the factor of production capital.' },
              { term: 'Profit', definition: 'The reward paid to the factor of production enterprise. Unlike rent, wages and interest, profit is not guaranteed — it is a residual reward and can be negative (a loss).' },
              { term: 'Quantity of a factor of production', definition: 'How much of that factor exists, e.g. Tom buying a second 3D printer increases the quantity of capital.' },
              { term: 'Quality of a factor of production', definition: 'How productive or effective that factor is, e.g. Tom upgrading to a faster, more precise 3D printer increases the quality of capital (the quantity of printers stays the same).' },
              { term: 'Common misconception — capital vs money', definition: 'In everyday language “capital” often means money or savings. In economics, capital means the physical manufactured goods (machinery, tools, equipment) used to produce other things. Money used to buy a 3D printer is finance; the printer itself is capital.' },
            ],
          },
        ],
      },
      'topic-2': {
        topicId: 'topic-2',
        title: 'The allocation of resources',
        description: 'Syllabus 2.4.3-2.8 -- market disequilibrium, price changes, PED, PES, and the market economic system.',
        lessons: [
          {
            title: 'Lesson 2 -- Disequilibrium & Price Changes',
            syllabusRef: '2.4.3 / 2.5',
            objectives:
              'Define market disequilibrium and distinguish a shortage from a surplus, read them off a demand-supply ' +
              'diagram/schedule, and explain that price changes are caused by shifts in demand and/or supply.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-flip',
                  type: 'flip_card',
                  kicker: 'Lesson 2 · 30 minutes',
                  title: 'Disequilibrium & Price Changes',
                  lede: 'Why can’t you ever get a padel court at 6pm? First, a quick check that equilibrium stuck. Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'Demand', definition: 'How much consumers are willing and able to buy at a given price — slopes downward as price falls.' },
                    { term: 'Supply', definition: 'How much producers are willing and able to sell at a given price — slopes upward as price rises.' },
                    { term: 'Market Equilibrium', definition: 'The price where quantity demanded exactly equals quantity supplied — Qd = Qs.' },
                    { term: 'Factors of Production', definition: 'Land, labour, capital, enterprise — rewarded by rent, wages, interest, profit.' },
                  ],
                },
                {
                  id: 'explain-disequilibrium',
                  type: 'explanation',
                  kicker: 'Hook → New idea',
                  title: 'When Price Gets It “Wrong”',
                  lede: '6–8pm weekdays: fully booked out weeks in advance, people still asking for more slots. 9am weekdays: courts regularly sit empty. Same price both times. What’s going on?',
                  conceptId: 'market-disequilibrium',
                  definition:
                    'Whenever the current price is not the equilibrium price, quantity demanded and quantity supplied ' +
                    'won’t match. Economists call this market disequilibrium.',
                  example: 'The padel club has a fixed number of courts, but demand is wildly different at different times of day — giving both flavours of disequilibrium on the same day.',
                },
                {
                  id: 'explain-shortage-surplus',
                  type: 'explanation',
                  kicker: 'Two flavours',
                  title: 'Shortage vs Surplus',
                  conceptId: 'market-disequilibrium',
                  definition:
                    'Shortage: quantity demanded is greater than quantity supplied at the current price — there isn’t ' +
                    'enough to go around. Surplus: quantity supplied is greater than quantity demanded at the current ' +
                    'price — there’s too much sitting unused.',
                  example: 'At 6–8pm, 140 bookings are wanted against 90 fixed courts (shortage). At 9am, only 40 are wanted against the same 90 courts (surplus).',
                },
                {
                  id: 'bar-shortage',
                  type: 'proportional_bar_compare',
                  kicker: 'Shortage, visualised',
                  title: '6–8pm Peak Slot',
                  items: [
                    { label: 'Quantity demanded (6–8pm)', value: 140, tone: 'orange' },
                    { label: 'Quantity supplied (fixed courts)', value: 90, tone: 'teal' },
                  ],
                },
                {
                  id: 'bar-surplus',
                  type: 'proportional_bar_compare',
                  kicker: 'Surplus, visualised',
                  title: '9am Quiet Slot',
                  items: [
                    { label: 'Quantity demanded (9am)', value: 40, tone: 'orange' },
                    { label: 'Quantity supplied (fixed courts)', value: 90, tone: 'teal' },
                  ],
                },
                {
                  id: 'calculator-shortage-or-surplus',
                  type: 'interactive_calculator',
                  kicker: 'Explore it',
                  title: 'Shortage or Surplus?',
                  lede: 'Pick a time slot and see what’s actually happening in that market.',
                  scenarios: [
                    {
                      id: '9am',
                      label: '9am (quiet)',
                      readouts: [
                        { label: 'Qty demanded / week', value: '40' },
                        { label: 'Qty supplied (fixed courts)', value: '90' },
                        { label: 'Market state', value: 'Surplus — quantity supplied > quantity demanded at this price, empty courts.' },
                      ],
                    },
                    {
                      id: 'peak',
                      label: '6–8pm (peak)',
                      readouts: [
                        { label: 'Qty demanded / week', value: '140' },
                        { label: 'Qty supplied (fixed courts)', value: '90' },
                        { label: 'Market state', value: 'Shortage — quantity demanded > quantity supplied at this price, no courts left.' },
                      ],
                    },
                  ],
                },
                {
                  id: 'explain-price-mechanism',
                  type: 'explanation',
                  kicker: 'How markets fix themselves',
                  title: 'The Price Mechanism',
                  lede: 'Disequilibrium doesn’t last forever — price does the fixing.',
                  conceptId: 'market-disequilibrium',
                  definition:
                    'When there’s a shortage, sellers raise the price, which reduces quantity demanded until it matches ' +
                    'the fixed quantity supplied — a new, higher equilibrium. When there’s a surplus, sellers cut the ' +
                    'price to attract more buyers, increasing quantity demanded until it matches supply — a new, lower equilibrium.',
                  example: 'This is exactly why the padel club could charge more at 6-8pm and less at 9am — it’s pushing each time slot’s price toward its own true equilibrium.',
                },
                {
                  id: 'guess-what-should-club-do',
                  type: 'guess_reveal',
                  kicker: 'Now you try',
                  title: 'What Should the Club Do?',
                  lede: 'Guess first, then tap to reveal.',
                  testsConceptIds: ['market-disequilibrium'],
                  cards: [
                    { question: 'Should the club raise or lower the price for the 6–8pm slot?', answer: 'Raise it. That reduces quantity demanded (movement along the demand curve) until it matches the fixed number of courts — clearing the shortage at a new, higher equilibrium.', tags: [{ label: 'RAISE ↑', tone: 'up' }] },
                    { question: 'Should the club raise or lower the price for the 9am slot?', answer: 'Lower it. That increases quantity demanded until it matches quantity supplied — clearing the surplus at a new, lower equilibrium.', tags: [{ label: 'LOWER ↓', tone: 'down' }] },
                  ],
                },
                {
                  id: 'guess-lego-example',
                  type: 'guess_reveal',
                  kicker: 'A second example',
                  title: '🧩 Retired Lego Sets',
                  lede: 'The exact same mechanism shows up in a completely different market. A Lego set gets discontinued — no more will ever be made — but plenty of collectors still want one. Guess, then reveal.',
                  testsConceptIds: ['market-disequilibrium'],
                  cards: [
                    { question: 'What happens to quantity demanded vs quantity supplied at the old retail price, once the set is retired?', answer: 'Supply is now fixed (or falling) while demand persists — a shortage forms at the old price.', tags: [{ label: 'SHORTAGE', tone: 'down' }] },
                    { question: 'What happens to the resale price over time, and why?', answer: 'It rises — quantity demanded falls back as price rises, until it matches the fixed quantity available. A new, higher equilibrium.', tags: [{ label: 'PRICE RISES ↑', tone: 'up' }] },
                  ],
                },
                {
                  id: 'explain-causes-vs-consequences',
                  type: 'explanation',
                  kicker: 'Watch out',
                  title: 'Causes vs. Consequences',
                  lede: 'This is the easiest thing to mix up in this whole topic — worth being really precise about.',
                  conceptId: 'causes-vs-consequences',
                  definition:
                    'A shortage or surplus is not what causes a price to change — it’s the other way round. The actual ' +
                    'chain is: something changes → that shifts demand and/or supply → that creates a shortage/surplus ' +
                    'at the old price → that is what pushes the price to move.',
                  example: 'A shortage/surplus is a symptom that price hasn’t caught up yet — not the original cause.',
                },
                {
                  id: 'guess-causes-vs-consequences-check',
                  type: 'guess_reveal',
                  kicker: 'Now you try',
                  title: 'Causes vs. Consequences — Check',
                  lede: 'Guess first, then tap to reveal.',
                  testsConceptIds: ['causes-vs-consequences'],
                  cards: [
                    { question: 'What actually CAUSES a price to change in a market?', answer: 'A shift in demand and/or supply — caused by a change in a non-price determinant (income, tastes, cost of production, etc). A shortage/surplus is a symptom of price not yet being at the new equilibrium, not the cause itself.', tags: [{ label: 'Shift in D or S', tone: 'neutral' }] },
                    { question: 'True or false: “A price change on its own causes the whole demand curve to shift.”', answer: 'False. A price change alone causes a movement ALONG an existing curve. A shift of the whole curve needs a non-price determinant to change.', tags: [{ label: 'FALSE', tone: 'down' }] },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  testsConceptIds: ['market-disequilibrium', 'causes-vs-consequences'],
                  questions: [
                    {
                      question: 'At the padel club’s 9am price, quantity supplied exceeds quantity demanded. This is an example of:',
                      options: ['Market equilibrium', 'A shortage', 'A surplus', 'Price elasticity'],
                      correctOptionIndex: 2,
                      feedback: 'A surplus — supply exceeds demand at the current price.',
                    },
                    {
                      question: 'Which best explains why a retired Lego set’s resale price rises?',
                      options: ['Quantity supplied is fixed while demand persists, causing a shortage at the old price', 'The government taxed Lego', 'The manufacturer increased production', 'Quantity demanded fell sharply'],
                      correctOptionIndex: 0,
                      feedback: 'Fixed/falling supply plus persistent demand creates a shortage, pushing the price up.',
                    },
                    {
                      question: 'A price change on its own causes:',
                      options: ['A shift of the whole demand curve', 'A movement along the existing demand curve', 'No change at all', 'A change in a non-price determinant'],
                      correctOptionIndex: 1,
                      feedback: 'A price change moves you along the curve — it doesn’t shift the curve itself.',
                    },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'Market disequilibrium: When quantity demanded and quantity supplied are not equal at the current price.',
                    'Shortage: Quantity demanded exceeds quantity supplied at the current price.',
                    'Surplus: Quantity supplied exceeds quantity demanded at the current price.',
                    'Cause of a price change: A shift in demand and/or supply — not the shortage/surplus itself.',
                  ],
                  homeworkItems: ['Definitions', 'Apply it: padel club scenario', 'Lego resale prediction', 'Causes vs consequences', 'Exam-style MCQs + 6-mark question'],
                },
              ],
            },
            teachingScript: {
              overview:
                'Tom already knows demand, supply and market equilibrium solidly — this lesson touches equilibrium ' +
                'only briefly as an anchor before introducing what’s new: shortage vs surplus, and that price changes ' +
                'are caused by shifts in demand/supply, not the other way round.',
              steps: [
                { stepId: 'explain-disequilibrium', talkingPoints: ['Quick anchor: “At equilibrium, what’s true about quantity demanded and quantity supplied?” (They’re equal.) Move on fast — confirmed knowledge, not new content.'], timingMinutes: 3 },
                { stepId: 'explain-shortage-surplus', talkingPoints: ['Draw both on a D/S diagram: shortage = price line below equilibrium; surplus = price line above it. Get Tom to sketch both.'], timingMinutes: 9 },
                { stepId: 'explain-price-mechanism', talkingPoints: ['Ask what he’d actually do about the 6pm shortage and the empty 9am courts before revealing the rule.', 'Reinforce with the discontinued Lego set example — same mechanism, different market.'], timingMinutes: 8 },
                { stepId: 'explain-causes-vs-consequences', talkingPoints: ['State plainly: price changes are caused by shifts in demand/supply, not by shortages/surpluses themselves.', 'Flag explicitly that how much quantity changes is price elasticity of demand — the next lesson.'], timingMinutes: 6, misconceptions: ['Movement along vs shift of a curve.', '“Shortage” doesn’t mean zero stock exists — it means Qd > Qs at the current price.', 'Assuming prices adjust instantly and perfectly.'] },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — Disequilibrium & Price Changes',
              instructions: 'Sketch a demand/supply diagram where asked, labelling the equilibrium and the price line described.',
              questions: [
                { prompt: 'Define market disequilibrium.', marks: 2, answer: 'A situation where quantity demanded does not equal quantity supplied at the current price, i.e. price is not at its equilibrium level.' },
                { prompt: 'At 6pm the padel club has more people wanting to book courts than courts available. Name this type of disequilibrium and sketch a diagram showing where the price line sits relative to equilibrium.', marks: 3, answer: 'A shortage (excess demand). The price line sits below the equilibrium price, so quantity demanded exceeds quantity supplied.' },
                { prompt: 'At 9am the padel club has courts sitting empty. Name this type of disequilibrium and explain what happens to price as a result.', marks: 3, answer: 'A surplus (excess supply). Price falls towards equilibrium as sellers cut price to clear unsold capacity/stock.' },
                { prompt: 'Explain the price mechanism that eventually eliminates a shortage.', marks: 3, answer: 'Excess demand pushes price up; as price rises, quantity demanded falls and quantity supplied rises, until quantity demanded equals quantity supplied at the new equilibrium.' },
                { prompt: 'A shop discontinues a popular Lego set. Explain, using the idea of a shortage, why second-hand prices for that set often rise sharply.', marks: 3, answer: 'With no new stock, supply stays fixed or falls while demand from collectors continues, creating a shortage at the old price; second-hand sellers raise price until quantity demanded falls to match the limited quantity available.' },
                { prompt: 'Explain the difference between what causes a price change and what a price change itself causes.', marks: 3, answer: 'Price changes are caused by shifts in demand and/or supply (not by shortages/surpluses themselves, which are just the disequilibrium symptom); the price change itself then causes quantity demanded and quantity supplied to adjust back towards equilibrium.' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Market disequilibrium', definition: 'A situation where quantity demanded and quantity supplied are not equal at the current price — the market is not at equilibrium.' },
              { term: 'Shortage', definition: 'A situation where quantity demanded exceeds quantity supplied at the current price, e.g. padel courts at 6-8pm when the price is set below the true equilibrium for that time slot.' },
              { term: 'Surplus', definition: 'A situation where quantity supplied exceeds quantity demanded at the current price, e.g. empty padel courts at 9am when the price is set above the true equilibrium for that time slot.' },
              { term: 'How a shortage is cleared', definition: 'Price rises, causing a movement along the demand curve (quantity demanded falls) until it matches the fixed quantity supplied, reaching a new, higher equilibrium.' },
              { term: 'How a surplus is cleared', definition: 'Price falls, causing a movement along the demand curve (quantity demanded rises) until it matches quantity supplied, reaching a new, lower equilibrium.' },
              { term: 'Cause of a price change', definition: 'A shift in demand and/or a shift in supply, driven by a change in one of their non-price determinants (e.g. a Lego set being discontinued reduces future supply).' },
              { term: 'Consequence of a price change', definition: 'A change in the quantity bought and sold. How much it changes depends on price elasticity (covered in the next lesson).' },
              { term: 'Movement along a curve vs a shift of a curve', definition: 'A price change on its own causes a movement along an existing demand or supply curve. A shift of the whole curve is caused by a change in a non-price determinant.' },
              { term: 'Worked example — retired Lego set', definition: 'Once a set is discontinued, supply becomes fixed (or shrinks) while demand often persists or grows. At the old retail price this creates a shortage. On the resale market, price rises until quantity demanded falls back to match the fixed quantity available — a new, higher equilibrium.' },
            ],
          },
          {
            title: 'Lesson 3 -- Price Elasticity of Demand',
            syllabusRef: '2.6',
            objectives: 'Define price elasticity of demand (PED), calculate and classify it, and explain the main determinants of elastic vs inelastic demand.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-flip',
                  type: 'flip_card',
                  kicker: 'Lesson 3 · 30 minutes',
                  title: 'Price Elasticity of Demand',
                  lede: 'If Tom raises his prices, does he lose a few customers — or a lot? First, a quick check that Lesson 2 stuck. Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'Market Disequilibrium', definition: 'When quantity demanded and quantity supplied are not equal at the current price.' },
                    { term: 'Shortage', definition: 'Quantity demanded exceeds quantity supplied at the current price.' },
                    { term: 'Surplus', definition: 'Quantity supplied exceeds quantity demanded at the current price.' },
                    { term: 'Cause of a price change', definition: 'A shift in demand and/or supply — not the shortage/surplus itself, which is a symptom.' },
                  ],
                },
                {
                  id: 'explain-ped',
                  type: 'explanation',
                  kicker: 'Hook → New idea',
                  title: 'Introducing PED',
                  lede: 'Tom puts up the price of custom padel grips by 10%. Would he lose a few customers, or a lot? What would that actually depend on?',
                  conceptId: 'ped',
                  definition:
                    'Price elasticity of demand (PED) measures how responsive quantity demanded is to a change in price. ' +
                    'PED = %ΔQd ÷ %ΔP. It’s technically always negative (law of demand); economists usually just ' +
                    'discuss its size, ignoring the minus sign.',
                  example: 'Read it as: the percentage change in quantity demanded, divided by the percentage change in price that caused it.',
                },
                {
                  id: 'worked-ped-calc',
                  type: 'worked_example',
                  kicker: 'Worked together',
                  title: 'Let’s Calculate One, Step by Step',
                  lede: 'Padel club casual court booking: price rises from $20 to $22, and weekly bookings fall from 100 to 80.',
                  testsConceptIds: ['ped'],
                  steps: [
                    { label: 'Step 1 — % change in price', detail: '($22 − $20) ÷ $20 = +10%' },
                    { label: 'Step 2 — % change in quantity demanded', detail: '(80 − 100) ÷ 100 = −20%' },
                    { label: 'Step 3 — divide quantity change by price change', detail: 'PED = −20% ÷ 10% = −2' },
                    { label: 'Step 4 — classify it (ignore the minus sign)', detail: 'Size is 2, which is greater than 1 → Elastic' },
                  ],
                },
                {
                  id: 'calculator-work-out-ped',
                  type: 'interactive_calculator',
                  kicker: 'Now you try',
                  title: 'Work Out the PED',
                  lede: 'Pick a different scenario and calculate it the same way.',
                  scenarios: [
                    { id: 'lego', label: '🧩 Retired Lego set', readouts: [{ label: 'Price', value: '$50 → $55' }, { label: 'Quantity', value: '40 → 38' }, { label: 'PED', value: '−0.5' }, { label: 'Category', value: 'Inelastic — buyers have few substitutes.' }] },
                    { id: 'grips', label: '🖨️ Tom’s padel grips', readouts: [{ label: 'Price', value: '$8 → $10' }, { label: 'Quantity', value: '60 → 54' }, { label: 'PED', value: '−0.4' }, { label: 'Category', value: 'Inelastic — buyers have few substitutes.' }] },
                  ],
                },
                {
                  id: 'tap-five-categories',
                  type: 'tap_reveal_grid',
                  kicker: 'Why classify it? → The spectrum',
                  title: 'Five Categories of PED',
                  lede: 'A PED number on its own isn’t that useful in an exam — Cambridge wants the category. Tap each one to see its value and an example.',
                  cards: [
                    { id: 'perfectly-inelastic', icon: '📍', label: 'Perfectly inelastic', content: 'PED = 0. Quantity demanded doesn’t change at all, whatever the price.' },
                    { id: 'inelastic', icon: '🐢', label: 'Inelastic', content: '0 < PED < 1. Quantity changes proportionally less than price. e.g. the retired Lego set.' },
                    { id: 'unitary', icon: '⚖️', label: 'Unitary', content: 'PED = 1 exactly. Quantity changes by exactly the same % as price.' },
                    { id: 'elastic', icon: '🐇', label: 'Elastic', content: 'PED > 1. Quantity changes proportionally more than price. e.g. padel casual bookings.' },
                    { id: 'perfectly-elastic', icon: '♾️', label: 'Perfectly elastic', content: 'PED = infinite. Any price rise at all sends quantity demanded to zero.' },
                  ],
                },
                {
                  id: 'tap-determinants',
                  type: 'tap_reveal_grid',
                  kicker: 'Determinants',
                  title: 'What Makes Demand Elastic or Inelastic?',
                  lede: 'Padel casual bookings turned out elastic. The retired Lego set turned out inelastic — not random. Tap each factor to reveal how it affects PED.',
                  cards: [
                    { id: 'substitutes', icon: '🔄', label: 'Substitutes', content: 'More/closer substitutes = MORE elastic. Easy to switch away.' },
                    { id: 'necessity', icon: '🍞', label: 'Necessity vs luxury', content: 'Necessities = MORE inelastic. Hard to go without.' },
                    { id: 'income-share', icon: '💷', label: 'Share of income', content: 'Bigger share of income = MORE elastic. Price change is noticeable.' },
                    { id: 'habit', icon: '🚬', label: 'Habit-forming', content: 'Addictive goods = MORE inelastic. Buyers keep buying anyway.' },
                    { id: 'time-period', icon: '⏳', label: 'Time period', content: 'MORE elastic in the long run — buyers find alternatives over time.' },
                    { id: 'width-definition', icon: '🔎', label: 'Width of definition', content: 'Broadly defined goods = MORE inelastic than narrowly defined ones.' },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  testsConceptIds: ['ped'],
                  questions: [
                    { question: 'A 10% price rise causes quantity demanded to fall by 25%. This good’s demand is:', options: ['Perfectly inelastic', 'Inelastic', 'Unitary', 'Elastic'], correctOptionIndex: 3, feedback: '25% > 10%, so PED’s size is greater than 1 — elastic.' },
                    { question: 'Which would most likely make demand for a good MORE elastic?', options: ['The good is addictive', 'The good has many close substitutes', 'The good is a tiny share of income', 'The good is a necessity'], correctOptionIndex: 1, feedback: 'More substitutes make it easy to switch away when price rises — more elastic.' },
                    { question: 'Retired Lego set: price +10%, quantity −5%. What’s the PED category?', options: ['Elastic', 'Perfectly elastic', 'Inelastic', 'Perfectly inelastic'], correctOptionIndex: 2, feedback: 'PED = −5/10 = −0.5 — size between 0 and 1, so inelastic.' },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'PED: Price elasticity of demand — how responsive quantity demanded is to a price change.',
                    'PED formula: % change in quantity demanded ÷ % change in price.',
                    'Elastic / Inelastic: PED size > 1 = elastic (very responsive). PED size < 1 = inelastic (not very responsive).',
                    'Determinants: Substitutes, necessity, income share, habit, time period, width of definition.',
                  ],
                  homeworkItems: ['Definitions + PED category table', 'Worked calculations', 'Determinants questions', 'Exam-style MCQs + 6-mark question'],
                },
              ],
            },
            teachingScript: {
              overview: 'Introduces price elasticity of demand: the formula, how to calculate and classify it into five categories, and the six determinants of whether a good’s demand is elastic or inelastic.',
              steps: [
                { stepId: 'explain-ped', talkingPoints: ['Ask: would a 10% price rise on padel grips lose Tom a few customers or a lot? Let him speculate before defining PED.', 'Flag immediately that PED is technically negative but economists discuss its size, ignoring the sign.'], timingMinutes: 4 },
                { stepId: 'worked-ped-calc', talkingPoints: ['Walk through both worked examples (padel bookings elastic, Lego resale inelastic) together, then have Tom name the category out loud for each.'], timingMinutes: 8 },
                { stepId: 'tap-determinants', talkingPoints: ['Go through each determinant, always landing on a Tom’s Print Co./padel/Lego example.'], timingMinutes: 8, misconceptions: ['Sign confusion — elastic/inelastic is about size, not sign.', 'Elastic ≠ “big price change” — it’s about responsiveness relative to the price change.', 'Confusing PED determinants with demand shifters.'] },
                { stepId: 'recap-key-words', talkingPoints: ['Set the worksheet + flashcards; preview Lesson 4: what PED means for revenue.'], timingMinutes: 2 },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — Price Elasticity of Demand',
              instructions: 'Show your working for every calculation. Give your answer to 2 decimal places where relevant.',
              questions: [
                { prompt: 'Define price elasticity of demand (PED).', marks: 2, answer: 'PED measures the responsiveness (or sensitivity) of quantity demanded to a change in price: PED = % change in quantity demanded ÷ % change in price.' },
                { prompt: 'PED is technically a negative number for almost every good. Explain why economists usually ignore the sign and just discuss its size.', marks: 2, answer: 'Because price and quantity demanded move in opposite directions for almost all goods (the law of demand), PED is always negative; the sign carries no extra information, so economists focus on the size (magnitude) to judge how responsive demand is.' },
                { prompt: 'Padel court bookings fall from 200 to 150 per week when price rises by 10%. Calculate PED and state whether demand is elastic or inelastic.', marks: 4, answer: '% change in quantity demanded = (150-200)/200 × 100 = -25%. PED = -25% ÷ 10% = -2.5 (size 2.5). Since the size is greater than 1, demand is elastic.' },
                { prompt: 'Lego resale prices rise by 20% but quantity demanded only falls from 100 to 95. Calculate PED and state whether demand is elastic or inelastic.', marks: 4, answer: '% change in quantity demanded = (95-100)/100 × 100 = -5%. PED = -5% ÷ 20% = -0.25 (size 0.25). Since the size is less than 1, demand is inelastic.' },
                { prompt: 'Name three determinants of PED and explain how each one affects the size of PED.', marks: 6, answer: 'Any three of: availability of substitutes (more substitutes = more elastic); proportion of income spent on the good (higher proportion = more elastic); necessity vs luxury (necessities = more inelastic, luxuries = more elastic); time period (demand becomes more elastic over a longer time as consumers find alternatives); addictiveness/habit-forming nature (more addictive = more inelastic).' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Price elasticity of demand (PED)', definition: 'A measure of how responsive quantity demanded is to a change in price.' },
              { term: 'PED formula', definition: 'PED = % change in quantity demanded ÷ % change in price. PED is technically always negative (law of demand), but economists usually discuss its size, ignoring the minus sign.' },
              { term: 'Perfectly inelastic demand', definition: 'PED = 0. Quantity demanded does not change at all when price changes.' },
              { term: 'Inelastic demand', definition: 'PED is between 0 and 1 (ignoring sign). Quantity demanded changes proportionally less than price, e.g. a retired Lego set’s resale demand (price +10%, quantity -5%, PED = -0.5).' },
              { term: 'Unitary elastic demand', definition: 'PED = 1 exactly. Quantity demanded changes by exactly the same percentage as price.' },
              { term: 'Elastic demand', definition: 'PED is greater than 1 (ignoring sign). Quantity demanded changes proportionally more than price, e.g. padel club casual court bookings (price +10%, quantity -20%, PED = -2).' },
              { term: 'Perfectly elastic demand', definition: 'PED is infinite. Any price rise at all causes quantity demanded to fall to zero.' },
              { term: 'Determinant — substitutes', definition: 'More and closer substitutes make demand more elastic, because buyers can easily switch away when price rises.' },
              { term: 'Determinant — necessity vs luxury', definition: 'Necessities have more inelastic demand than luxuries, since buyers can’t easily go without them.' },
              { term: 'Determinant — proportion of income', definition: 'The bigger the share of a buyer’s income a good takes up, the more elastic its demand, since a price change is more noticeable.' },
              { term: 'Determinant — habit-forming/addictive goods', definition: 'Addictive goods tend to have inelastic demand, since buyers keep purchasing even as price rises.' },
              { term: 'Determinant — time period', definition: 'Demand tends to become more elastic over a longer time period, as buyers have more opportunity to find and switch to alternatives.' },
              { term: 'Determinant — width of definition of the good', definition: 'A broadly defined good has more inelastic demand than a narrowly defined one, because the broad category has fewer substitutes.' },
            ],
            calculationChecks: [{ description: 'PED for padel casual bookings (Lesson 3 worked example)', expression: '-20/10', expectedResult: -2 }],
          },
          {
            title: 'Lesson 4 -- PED: Revenue & Significance',
            syllabusRef: '2.6',
            objectives: 'Calculate total revenue before and after a price change, explain why revenue rises or falls depending on PED, and explain why PED matters to firms, consumers and government.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-fixes',
                  type: 'guess_reveal',
                  kicker: 'Lesson 4 · 30 minutes',
                  title: 'PED: Revenue & Significance',
                  lede: 'If Tom raises his prices, does he end up richer — or poorer? First, two quick fixes from last time.',
                  cards: [
                    { question: '🔧 Quick fix: what’s the difference between land as a factor of production, and a free good?', answer: 'Land (1.2) is a factor of production — a resource used to produce things, like the raw filament material. A free good (1.1.3) has no opportunity cost to obtain, like sunlight. Land is usually scarce and often costs money (rent); most free goods aren’t factors of production at all.' },
                    { question: '🔧 Quick fix: what actually CAUSES a price to change in a market?', answer: 'A shift in demand and/or supply — caused by a change in a non-price determinant. A shortage or surplus is a symptom of price not yet being at the new equilibrium, not the cause.' },
                  ],
                },
                {
                  id: 'explain-ped-refresher',
                  type: 'explanation',
                  kicker: 'Recap',
                  title: 'Quick PED Refresher',
                  lede: 'Last lesson you learned to calculate and classify PED. Before we build on it today, let’s remind ourselves of the formula.',
                  definition: 'PED = %ΔQd ÷ %ΔP. Work out the % change in price, work out the % change in quantity demanded, then divide quantity’s % change by price’s % change.',
                  example: 'Size < 1 = inelastic. Size > 1 = elastic. Size = 1 = unitary.',
                },
                {
                  id: 'warmup-practice-ped',
                  type: 'guess_reveal',
                  kicker: 'Warm-up',
                  title: 'Practice: Calculate the PED',
                  lede: 'Three new scenarios, same method as last lesson. Work each one out on paper first, then tap to reveal the answer.',
                  cards: [
                    { question: '🎾 Racket restring service: price $15 → $18 (+20%), 50 → 45 bookings/week (−10%). Calculate the PED and classify it.', answer: 'PED = −10% ÷ 20% = −0.5 → Inelastic. Restringing is routine maintenance for a paying padel player — hard to skip, and there’s no obvious substitute.', tags: [{ label: 'INELASTIC', tone: 'neutral' }] },
                    { question: '🏓 Limited-edition padel paddle: price $150 → $165 (+10%), 20 → 18 sold (−10%). Calculate the PED and classify it.', answer: 'PED = −10% ÷ 10% = −1 → Unitary. A rare “knife-edge” case — quantity changed by exactly the same percentage as price.', tags: [{ label: 'UNITARY', tone: 'neutral' }] },
                    { question: '🧱 Generic Lego minifigure: price $5 → $6 (+20%), 100 → 70 sold (−30%). Calculate the PED and classify it.', answer: 'PED = −30% ÷ 20% = −1.5 → Elastic. Generic, still-in-production minifigures have loads of close substitutes — easy to switch away from, unlike the one-off retired set from Lesson 3.', tags: [{ label: 'ELASTIC', tone: 'neutral' }] },
                  ],
                },
                {
                  id: 'explain-total-revenue',
                  type: 'explanation',
                  kicker: 'Hook → New idea',
                  title: 'Total Revenue',
                  lede: 'Tom puts up the price of his padel grips. More money per grip sold... but does he end up with more total money? Revenue isn’t profit — it’s simply the total money coming in from sales, before any costs are subtracted.',
                  conceptId: 'ped-revenue-relationship',
                  definition: 'TR = P × Q — total revenue is price times quantity sold.',
                  example: 'If Tom sells 60 grips at $8 each, his revenue is $480 — all the money changing hands, regardless of what it cost him to make them.',
                },
                {
                  id: 'explain-two-effects',
                  type: 'explanation',
                  kicker: 'Why isn’t this obvious?',
                  title: 'Two Things Move at Once',
                  lede: 'When Tom changes his price, it doesn’t just change P. Because of PED, it also changes Q — quantity sold moves too. And TR depends on both.',
                  conceptId: 'ped-revenue-relationship',
                  definition: 'Raise the price, and P goes up — that alone would raise revenue. But quantity demanded falls at the same time — that alone would lower revenue. Which effect wins depends entirely on PED.',
                  example: 'That’s the whole lesson, and it’s why “just raise the price” isn’t always the right call.',
                },
                {
                  id: 'worked-revenue-example',
                  type: 'worked_example',
                  kicker: 'Worked together',
                  title: 'Let’s Work One Through Fully',
                  lede: 'Padel casual bookings: price $20 → $22 (+10%), quantity 100 → 80 (−20%). We know from Lesson 3 this is PED = −2, elastic.',
                  testsConceptIds: ['ped-revenue-relationship'],
                  steps: [
                    { label: 'Step 1 — total revenue BEFORE the price change', detail: 'TR = $20 × 100 = $2000' },
                    { label: 'Step 2 — total revenue AFTER the price change', detail: 'TR = $22 × 80 = $1760' },
                    { label: 'Step 3 — compare', detail: '$1760 is LESS than $2000' },
                    { label: 'Result', detail: 'Revenue FELL by $240, despite the price rise — because demand is elastic' },
                  ],
                },
                {
                  id: 'guess-revenue-rise-fall',
                  type: 'guess_reveal',
                  kicker: 'Now you try',
                  title: 'Does Revenue Rise or Fall?',
                  lede: 'Same method — guess out loud before you tap each one.',
                  testsConceptIds: ['ped-revenue-relationship'],
                  cards: [
                    { question: '🧩 Retired Lego set: $50→$55 (+10%), 40→38 sets (−5%). PED = −0.5, inelastic. Revenue?', answer: 'TR before = $50×40 = $2000. TR after = $55×38 = $2090. Revenue ROSE this time.', tags: [{ label: 'ROSE ↑', tone: 'up' }] },
                    { question: '🖨️ Tom’s grips: $8→$10, 60→54 (PED = −0.4, inelastic — your turn to work it out). Revenue?', answer: 'TR before = $8×60 = $480. TR after = $10×54 = $540. Revenue rose — inelastic, again.', tags: [{ label: 'ROSE ↑', tone: 'up' }] },
                  ],
                },
                {
                  id: 'data-table-revenue-lab',
                  type: 'data_table',
                  kicker: 'Revenue lab',
                  title: 'All Three, Side by Side',
                  lede: 'Notice: the two inelastic products both gained revenue from a price rise. The elastic one lost revenue, despite the higher price.',
                  columns: ['Scenario', 'Price', 'Quantity', 'TR before → after', 'PED'],
                  rows: [
                    ['🎾 Padel booking', '$20 → $22', '100 → 80', '$2000 → $1760', 'Elastic'],
                    ['🧩 Retired Lego set', '$50 → $55', '40 → 38', '$2000 → $2090', 'Inelastic'],
                    ['🖨️ Tom’s grips', '$8 → $10', '60 → 54', '$480 → $540', 'Inelastic'],
                  ],
                },
                {
                  id: 'explain-the-pattern',
                  type: 'explanation',
                  kicker: 'Spot the pattern',
                  title: 'So What’s the Actual Rule?',
                  lede: 'Look back at those three results. Notice the pattern isn’t about whether price went up — it’s about how elastic the demand was.',
                  conceptId: 'ped-revenue-relationship',
                  definition: 'When demand is inelastic, quantity barely reacts, so the higher price mostly just sticks — revenue rises. When demand is elastic, quantity reacts more than price did, so the loss in sales outweighs the higher price — revenue falls.',
                  example: 'The same logic works in reverse for a price cut.',
                },
                {
                  id: 'data-table-rule',
                  type: 'data_table',
                  kicker: 'The rule',
                  title: 'Revenue & PED — the Rule',
                  columns: ['PED', 'Price rises', 'Price falls'],
                  rows: [
                    ['Inelastic (<1)', 'Revenue rises', 'Revenue falls'],
                    ['Elastic (>1)', 'Revenue falls', 'Revenue rises'],
                    ['Unitary (=1)', 'No change', 'No change'],
                  ],
                },
                {
                  id: 'tap-firms-consumers-govt',
                  type: 'tap_reveal_grid',
                  kicker: 'Zooming out → Why it matters',
                  title: 'Firms, Consumers, Government',
                  lede: 'This isn’t just a maths trick you’ll never use again — PED genuinely drives real decisions for three different groups. Tap each one.',
                  cards: [
                    { id: 'firms', icon: '🏭', label: 'Firms', content: 'Use PED to set prices for maximum revenue — raise prices on inelastic products, avoid raising (or cut) prices on elastic ones.' },
                    { id: 'consumers', icon: '🛒', label: 'Consumers', content: 'Inelastic necessities hurt household budgets most when prices rise — you can’t easily cut back.' },
                    { id: 'government', icon: '🏛️', label: 'Government', content: 'Taxes work best on inelastic goods (fuel, cigarettes) — quantity barely falls, so tax revenue stays high and reliable.' },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  testsConceptIds: ['ped-revenue-relationship'],
                  questions: [
                    { question: 'A firm’s product has PED = −3. It’s considering a price rise. Good idea or bad idea?', options: ['Good idea — revenue will rise', 'Bad idea — revenue will fall'], correctOptionIndex: 1, feedback: 'PED = −3 is highly elastic — a price rise causes a bigger proportional fall in quantity, so revenue falls.' },
                    { question: 'A firm’s product has PED = −0.2. Same question — raise the price?', options: ['Good idea — revenue will rise', 'Bad idea — revenue will fall'], correctOptionIndex: 0, feedback: 'PED = −0.2 is very inelastic — quantity barely falls, so revenue rises.' },
                    { question: 'Why do governments often tax fuel and cigarettes rather than luxury holidays?', options: ['Fuel/cigarettes have inelastic demand — tax revenue stays high and reliable', 'Luxury holidays are illegal to tax', 'Fuel/cigarettes are free goods', 'There’s no reason — it’s random'], correctOptionIndex: 0, feedback: 'Inelastic demand means quantity barely falls when tax raises price, so the tax raises substantial, reliable revenue.' },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'Total Revenue (TR): TR = Price × Quantity — the total money a firm receives from sales.',
                    'Inelastic demand & revenue: Price and revenue move together — a price rise increases revenue.',
                    'Elastic demand & revenue: Price and revenue move opposite — a price rise decreases revenue.',
                    'Significance of PED: Guides firms’ pricing decisions, explains consumer budget impact, and shapes government tax policy.',
                  ],
                  homeworkItems: ['TR formula + rule table', 'Two new worked calculations', 'Significance essay questions', 'Exam-style MCQs + 6-mark question'],
                },
              ],
            },
            teachingScript: {
              overview: 'Introduces total revenue (TR = P×Q), the rule linking PED to whether a price change raises or lowers revenue, and why PED matters to firms, consumers and government.',
              steps: [
                { stepId: 'recap-fixes', talkingPoints: ['Fix two specific misconceptions from the Lesson 2 worksheet before starting new content — load-bearing for the rest of the lesson.'], timingMinutes: 4 },
                { stepId: 'explain-total-revenue', talkingPoints: ['TR = P×Q is the whole engine of the lesson: a price change moves both P and Q, and those moves can fight each other.'], timingMinutes: 4 },
                { stepId: 'worked-revenue-example', talkingPoints: ['Let him guess whether revenue rises or falls before revealing the padel bookings and Lego resale calculations.'], timingMinutes: 8 },
                { stepId: 'explain-the-pattern', talkingPoints: ['Ask for the rule hiding in the two worked examples before stating it outright.'], timingMinutes: 6 },
                { stepId: 'tap-firms-consumers-govt', talkingPoints: ['Ask why governments prefer to tax cigarettes over luxury holidays — ties PED directly to real policy.'], timingMinutes: 6 },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — PED, Revenue & Significance',
              instructions: 'Remember: Total Revenue (TR) = Price (P) × Quantity (Q).',
              questions: [
                { prompt: 'State the formula for total revenue.', marks: 1, answer: 'Total Revenue = Price × Quantity.' },
                { prompt: 'Padel court bookings are price elastic. Explain what happens to total revenue if the club raises its price.', marks: 3, answer: 'When demand is elastic, a price rise causes a proportionally larger fall in quantity demanded, so total revenue falls (the fall in quantity outweighs the rise in price).' },
                { prompt: 'Lego resale demand is price inelastic. Explain what happens to total revenue if a seller raises the price.', marks: 3, answer: 'When demand is inelastic, a price rise causes a proportionally smaller fall in quantity demanded, so total revenue rises (the rise in price outweighs the small fall in quantity).' },
                { prompt: 'The padel club cuts its price by 10% and bookings rise by 25%. Calculate the change in total revenue as a percentage, and explain whether this confirms demand is elastic.', marks: 4, answer: 'A 10% price cut with a 25% rise in quantity means revenue rises overall (quantity effect outweighs price effect) — TR moves in the same direction as quantity, confirming PED size > 1, i.e. demand is elastic.' },
                { prompt: 'Explain why a government trying to raise tax revenue would prefer to tax a good with inelastic demand (e.g. cigarettes) rather than a good with elastic demand (e.g. luxury holidays).', marks: 4, answer: 'Taxing an inelastic good barely reduces quantity demanded, so the government collects tax on almost the same volume of sales and raises significant, predictable revenue. Taxing an elastic good causes a large fall in quantity demanded, undermining the tax base and raising much less revenue.' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Total revenue (TR)', definition: 'The total amount of money a firm receives from selling its product. TR = Price × Quantity sold.' },
              { term: 'PED and revenue when demand is inelastic (PED < 1)', definition: 'Price and revenue move in the same direction — a price rise increases total revenue, a price fall decreases total revenue, because quantity demanded changes only a little.' },
              { term: 'PED and revenue when demand is elastic (PED > 1)', definition: 'Price and revenue move in opposite directions — a price rise decreases total revenue, a price fall increases total revenue, because quantity demanded changes proportionally more than price.' },
              { term: 'PED and revenue when demand is unitary elastic (PED = 1)', definition: 'Total revenue stays the same whether price rises or falls, because the percentage change in quantity demanded exactly offsets the percentage change in price.' },
              { term: 'Worked example — elastic demand', definition: 'Padel club casual court booking. Price $20 to $22 (+10%), quantity 100 to 80 bookings/week (-20%), PED = -2. TR before = $2000, TR after = $1760. Revenue fell despite the price rise.' },
              { term: 'Worked example — inelastic demand', definition: 'Retired Lego set resale. Price $50 to $55 (+10%), quantity 40 to 38 sets/month (-5%), PED = -0.5. TR before = $2000, TR after = $2090. Revenue rose.' },
              { term: 'Significance of PED for firms', definition: 'Firms use PED to set prices for maximum revenue — raising prices on products with inelastic demand increases revenue, while raising prices on products with elastic demand decreases revenue.' },
              { term: 'Significance of PED for consumers', definition: 'A price rise in a good with inelastic demand (a necessity) affects a household’s budget more than a price rise in a good with elastic demand (a luxury), because inelastic goods are harder to cut back on or substitute away from.' },
              { term: 'Significance of PED for government', definition: 'Governments prefer to tax goods with inelastic demand (e.g. fuel, cigarettes) because quantity demanded falls only a little when the tax raises price, so the tax raises substantial and reliable revenue.' },
            ],
            calculationChecks: [
              { description: 'TR before price rise (padel bookings)', expression: '20*100', expectedResult: 2000 },
              { description: 'TR after price rise (padel bookings)', expression: '22*80', expectedResult: 1760 },
              { description: 'TR before price rise (retired Lego set)', expression: '50*40', expectedResult: 2000 },
              { description: 'TR after price rise (retired Lego set)', expression: '55*38', expectedResult: 2090 },
              { description: 'TR before price rise (Tom’s grips)', expression: '8*60', expectedResult: 480 },
              { description: 'TR after price rise (Tom’s grips)', expression: '10*54', expectedResult: 540 },
            ],
          },
          {
            title: 'Lesson 5 -- Price Elasticity of Supply',
            syllabusRef: '2.7',
            objectives: 'Define price elasticity of supply (PES), calculate and classify it, and explain the main determinants of elastic vs inelastic supply.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-flip',
                  type: 'flip_card',
                  kicker: 'Lesson 5 · 30 minutes',
                  title: 'Price Elasticity of Supply',
                  lede: 'Last lesson was all about how buyers react to price. Today it’s the seller’s turn. First, a quick check that revenue stuck. Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'Total Revenue (TR)', definition: 'TR = Price × Quantity — the total money a firm receives from sales, before costs.' },
                    { term: 'Inelastic demand & revenue', definition: 'Price and revenue move together — a price rise increases revenue.' },
                    { term: 'Elastic demand & revenue', definition: 'Price and revenue move opposite — a price rise decreases revenue.' },
                    { term: 'Significance of PED', definition: 'Guides firms’ pricing, explains consumer budget impact, and shapes government tax policy.' },
                  ],
                },
                {
                  id: 'guess-calc-practice-refresh',
                  type: 'guess_reveal',
                  kicker: 'Calculation practice',
                  title: 'Keep PED & TR Sharp',
                  lede: 'Before we start a new elasticity, let’s make sure last time’s skills — PED and total revenue — are still solid. Work each one out on paper first, then tap to reveal the answer.',
                  cards: [
                    { question: '🔑 Tom’s Print Co keychain: price $4 → $5 (+25%), weekly sales 80 → 60 (−25%). Calculate the PED and classify it.', answer: 'PED = −25% ÷ 25% = −1 → Unitary. A rare knife-edge case — quantity changed by exactly the same percentage as price.', tags: [{ label: 'UNITARY', tone: 'neutral' }] },
                    { question: '🎾 Padel club kids’ coaching: price $15 → $18 (+20%), attendance 40 → 36 sessions/week (−10%). Calculate the PED, then TR before and after. Did revenue rise or fall?', answer: 'PED = −10% ÷ 20% = −0.5 → Inelastic. TR before = $15 × 40 = $600. TR after = $18 × 36 = $648. Revenue ROSE — consistent with inelastic demand and a price rise.', tags: [{ label: 'ROSE ↑', tone: 'up' }] },
                  ],
                },
                {
                  id: 'explain-pes',
                  type: 'explanation',
                  kicker: 'Hook → New idea',
                  title: 'Introducing PES',
                  lede: 'The padel club wants more courts this summer because demand is booming. Tom wants to make more grips this week because an order just came in. Which one can actually ramp up supply faster — and why?',
                  conceptId: 'pes',
                  definition:
                    'Price elasticity of supply (PES) measures how responsive quantity supplied is to a change in price. ' +
                    'PES = %ΔQs ÷ %ΔP. Same shape as PED, but for sellers. Unlike PED, PES is (almost) always positive ' +
                    '— the law of supply says price and quantity supplied move in the same direction.',
                  example: 'The padel club can’t ramp up courts fast; Tom can ramp up grip production fast — PES tells us exactly how differently they react.',
                },
                {
                  id: 'worked-pes-calc',
                  type: 'worked_example',
                  kicker: 'Worked together',
                  title: 'Let’s Calculate One, Step by Step',
                  lede: 'Tom’s padel grips: an order surge pushes the price from $8 to $10, and Tom ramps up weekly production from 60 to 90 grips.',
                  testsConceptIds: ['pes'],
                  steps: [
                    { label: 'Step 1 — % change in price', detail: '($10 − $8) ÷ $8 = +25%' },
                    { label: 'Step 2 — % change in quantity supplied', detail: '(90 − 60) ÷ 60 = +50%' },
                    { label: 'Step 3 — divide quantity change by price change', detail: 'PES = 50% ÷ 25% = 2' },
                    { label: 'Result', detail: 'PES = 2, which is greater than 1 → Elastic' },
                  ],
                },
                {
                  id: 'guess-practice-pes',
                  type: 'guess_reveal',
                  kicker: 'Now you try',
                  title: 'Practice: Calculate the PES',
                  lede: 'Three new scenarios. Work each one out on paper first, then tap to reveal the answer.',
                  testsConceptIds: ['pes'],
                  cards: [
                    { question: '🎾 Padel courts this summer: price of court hire rises 20%, but the club can’t build new courts before autumn — quantity supplied stays at 0% change. Calculate the PES and classify it.', answer: 'PES = 0% ÷ 20% = 0 → Perfectly inelastic. No matter how high the price goes this summer, supply can’t respond — courts take months to build.', tags: [{ label: 'PERFECTLY INELASTIC', tone: 'neutral' }] },
                    { question: '🧩 Custom Lego minifigure accessories: price rises 10%, and Tom’s spare printer capacity lets weekly output rise 30%. Calculate the PES and classify it.', answer: 'PES = 30% ÷ 10% = 3 → Elastic. Spare capacity plus a fast production process means Tom can ramp up quickly when price rises.', tags: [{ label: 'ELASTIC', tone: 'up' }] },
                    { question: '🕹️ A retired Lego set (no more will ever be made): price rises 50% in the resale market, but quantity supplied stays at 0% change. Calculate the PES and classify it.', answer: 'PES = 0% ÷ 50% = 0 → Perfectly inelastic. This is exactly why the resale price just kept climbing in Lesson 2 — supply literally cannot increase, whatever collectors are willing to pay.', tags: [{ label: 'PERFECTLY INELASTIC', tone: 'neutral' }] },
                  ],
                },
                {
                  id: 'tap-five-categories-pes',
                  type: 'tap_reveal_grid',
                  kicker: 'Why classify it? → The spectrum',
                  title: 'Five Categories of PES',
                  lede: 'Just like with PED, Cambridge wants the category, not just the number. Tap each one to see its value and an example.',
                  cards: [
                    { id: 'perfectly-inelastic', icon: '📍', label: 'Perfectly inelastic', content: 'PES = 0. Quantity supplied doesn’t change at all, whatever the price. e.g. this summer’s padel courts.' },
                    { id: 'inelastic', icon: '🐢', label: 'Inelastic', content: '0 < PES < 1. Quantity supplied changes proportionally less than price.' },
                    { id: 'unitary', icon: '⚖️', label: 'Unitary', content: 'PES = 1 exactly. Quantity supplied changes by exactly the same % as price.' },
                    { id: 'elastic', icon: '🐇', label: 'Elastic', content: 'PES > 1. Quantity supplied changes proportionally more than price. e.g. Tom’s grips.' },
                    { id: 'perfectly-elastic', icon: '♾️', label: 'Perfectly elastic', content: 'PES = infinite. Producers will supply any amount at one exact price, and none below it.' },
                  ],
                },
                {
                  id: 'tap-determinants-pes',
                  type: 'tap_reveal_grid',
                  kicker: 'Determinants',
                  title: 'What Makes Supply Elastic or Inelastic?',
                  lede: 'Tom’s grips turned out elastic. The padel club’s courts turned out inelastic — not random. Tap each factor to reveal how it affects PES.',
                  cards: [
                    { id: 'spare-capacity', icon: '🏭', label: 'Spare capacity', content: 'Unused machinery/staff time = MORE elastic. Tom’s idle second printer can start up immediately.' },
                    { id: 'factor-mobility', icon: '🔄', label: 'Factor mobility', content: 'Easy for labour/capital to switch tasks = MORE elastic. Hard-to-retrain specialist staff = MORE inelastic.' },
                    { id: 'time-period', icon: '⏳', label: 'Time period', content: 'MORE elastic in the long run — more time to build capacity, hire staff, or build new courts.' },
                    { id: 'stock', icon: '📦', label: 'Ability to store stock', content: 'Goods that can be stockpiled and released later = MORE elastic. A padel lesson (a service) can’t be stored — MORE inelastic.' },
                    { id: 'gestation', icon: '🏗️', label: 'Production/gestation period', content: 'Quick to make = MORE elastic (a grip prints in minutes). Slow to make = MORE inelastic (a new court takes months).' },
                    { id: 'producers', icon: '🔢', label: 'Number of producers', content: 'More producers able to enter the market = MORE elastic supply, especially in the long run.' },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  testsConceptIds: ['pes'],
                  questions: [
                    { question: 'A padel club can’t add courts this season no matter the price. What’s its PES this season?', options: ['PES = 0, perfectly inelastic', 'PES = infinite, perfectly elastic', 'PES = 1, unitary', 'Cannot be calculated'], correctOptionIndex: 0, feedback: 'Quantity supplied literally cannot change — PES = 0, perfectly inelastic.' },
                    { question: 'Which factor would make Tom’s grip supply MORE elastic?', options: ['His printer is already running 24/7 with no spare capacity', 'He has a second, idle printer ready to switch on', 'Filament takes 6 months to order in', 'He’s the only 3D-print supplier in town'], correctOptionIndex: 1, feedback: 'Spare capacity lets a producer ramp up output quickly when price rises — more elastic.' },
                    { question: 'Why is a retired Lego set’s supply perfectly inelastic, even at a very high resale price?', options: ['Collectors don’t want more of them', 'The manufacturer refuses to sell them', 'No more can physically be made — supply is fixed at whatever exists already', 'The price never actually rises'], correctOptionIndex: 2, feedback: 'Once production stops, the total quantity in existence is fixed — no price can increase it.' },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'PES: Price elasticity of supply — how responsive quantity supplied is to a price change.',
                    'PES formula: % change in quantity supplied ÷ % change in price. Almost always positive.',
                    'Elastic / Inelastic supply: PES size > 1 = elastic (very responsive). PES size < 1 = inelastic (not very responsive).',
                    'Determinants: Spare capacity, factor mobility, time period, ability to store stock, production period, number of producers.',
                  ],
                  homeworkItems: ['Definitions + PES formula', 'Worked calculations', 'Determinants questions', 'Exam-style MCQs + 6-mark question'],
                },
              ],
            },
            teachingScript: {
              overview: 'Introduces price elasticity of supply as the seller-side counterpart to PED: the formula, worked calculation, five-category spectrum, and six determinants.',
              steps: [
                { stepId: 'explain-pes', talkingPoints: ['Ask who can ramp up supply faster — the padel club (more courts) or Tom (more grips) — and why, before defining PES.', 'Flag the sign difference from PED: PES is almost always positive.'], timingMinutes: 4 },
                { stepId: 'worked-pes-calc', talkingPoints: ['Walk through the padel-grips worked example step by step: price +25%, quantity +50%, PES = 2, elastic.'], timingMinutes: 6 },
                { stepId: 'tap-determinants-pes', talkingPoints: ['Go through each determinant, landing on a Tom’s Print Co./padel example for each.'], timingMinutes: 8 },
                { stepId: 'recap-key-words', talkingPoints: ['Set the worksheet + flashcards; preview Lesson 6: how a whole market economy decides what gets made.'], timingMinutes: 2 },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — Price Elasticity of Supply',
              instructions: 'Show your working for every calculation.',
              questions: [
                { prompt: 'Define price elasticity of supply (PES).', marks: 2, answer: 'PES measures the responsiveness of quantity supplied to a change in price: PES = % change in quantity supplied ÷ % change in price.' },
                { prompt: 'Explain why PES is almost always a positive number, unlike PED.', marks: 2, answer: 'Price and quantity supplied usually move in the same direction (the law of supply — a higher price incentivises firms to supply more), so PES is almost always positive, unlike PED where price and quantity demanded move in opposite directions.' },
                { prompt: 'The price of padel grips rises by 25% and the quantity Tom supplies rises by 50%. Calculate PES and state whether supply is elastic or inelastic.', marks: 4, answer: 'PES = 50% ÷ 25% = 2. Since PES is greater than 1, supply is elastic.' },
                { prompt: 'Explain why Tom (a small 3D-printing business) can usually increase supply faster than the padel club can add more courts.', marks: 3, answer: 'Tom can buy another 3D printer and print more grips relatively quickly and cheaply, whereas building new padel courts requires land, planning permission, construction time and much larger capital investment — so Tom’s supply is more elastic (responsive) than the padel club’s in the short run.' },
                { prompt: 'Name three determinants of PES and explain how each one affects the size of PES.', marks: 6, answer: 'Any three of: spare capacity (more spare capacity = more elastic supply); ease of storing stock (easier to store = more elastic); time period (supply becomes more elastic over a longer time as firms can build new capacity); ease of switching between production of different goods (easier to switch = more elastic); availability of factors of production (more readily available = more elastic).' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Price elasticity of supply (PES)', definition: 'A measure of how responsive quantity supplied is to a change in price.' },
              { term: 'PES formula', definition: 'PES = % change in quantity supplied ÷ % change in price. Unlike PED, PES is almost always positive, since the law of supply means price and quantity supplied move in the same direction.' },
              { term: 'Perfectly inelastic supply', definition: 'PES = 0. Quantity supplied does not change at all when price changes, e.g. this summer’s padel courts (fixed — no new courts can be built in time).' },
              { term: 'Inelastic supply', definition: 'PES is between 0 and 1. Quantity supplied changes proportionally less than price.' },
              { term: 'Unitary elastic supply', definition: 'PES = 1 exactly. Quantity supplied changes by exactly the same percentage as price.' },
              { term: 'Elastic supply', definition: 'PES is greater than 1. Quantity supplied changes proportionally more than price, e.g. Tom’s padel grips (price +25%, quantity +50%, PES = 2).' },
              { term: 'Perfectly elastic supply', definition: 'PES is infinite. Producers will supply any quantity at one exact price, and none below it.' },
              { term: 'Determinant — spare capacity', definition: 'Unused machinery or staff time makes supply more elastic, since a producer can increase output quickly without new investment. Tom’s idle second 3D printer is an example.' },
              { term: 'Determinant — factor mobility', definition: 'Supply is more elastic when labour and capital can easily switch between uses, and more inelastic when factors are specialised and hard to redeploy.' },
              { term: 'Determinant — time period', definition: 'Supply tends to become more elastic over a longer time period, since producers have more time to build capacity, hire staff, or for new firms to enter.' },
              { term: 'Determinant — ability to store stock', definition: 'Goods that can be produced in advance and stockpiled have more elastic supply. Services that can’t be stored (like a padel coaching session) have more inelastic supply.' },
              { term: 'Determinant — production/gestation period', definition: 'A short production time (a grip prints in minutes) makes supply more elastic. A long production time (a new padel court takes months to build) makes supply more inelastic.' },
              { term: 'Determinant — number of producers', definition: 'The more producers able to enter a market, the more elastic supply tends to be, especially in the long run.' },
            ],
            calculationChecks: [
              { description: '% change in price (Tom’s grips)', expression: '(10-8)/8', expectedResult: 0.25 },
              { description: '% change in quantity supplied (Tom’s grips)', expression: '(90-60)/60', expectedResult: 0.5 },
              { description: 'PES for Tom’s grips', expression: '0.5/0.25', expectedResult: 2 },
            ],
          },
          {
            title: 'Lesson 6 -- The Market Economic System',
            syllabusRef: '2.8',
            objectives: 'Explain how the price mechanism answers the three basic economic questions in a market economy, describe its defining characteristics, and evaluate its advantages and disadvantages.',
            interactiveContent: {
              steps: [
                {
                  id: 'recap-flip',
                  type: 'flip_card',
                  kicker: 'Lesson 6 · 30 minutes',
                  title: 'The Market Economic System',
                  lede: 'Zooming out from single markets to a whole economic system. First, a quick check that PES stuck. Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'PES formula', definition: 'PES = %ΔQs ÷ %ΔP — how responsive quantity supplied is to a price change.' },
                    { term: 'PES sign', definition: 'Almost always positive — price and quantity supplied move in the same direction (law of supply).' },
                    { term: 'Perfectly inelastic supply', definition: 'This summer’s padel courts — fixed no matter the price, since new courts take months to build.' },
                    { term: 'Elastic supply', definition: 'Tom’s grips — spare printer capacity lets output ramp up fast when price rises.' },
                  ],
                },
                {
                  id: 'guess-calc-practice-refresh',
                  type: 'guess_reveal',
                  kicker: 'Calculation practice',
                  title: 'Keep PED & TR Sharp',
                  lede: 'Before today’s new topic, a quick check that PED and total revenue — the core calculation skills from Lessons 3 and 4 — are still solid. Work each one out on paper first, then tap to reveal the answer.',
                  cards: [
                    { question: '👜 Padel club logo tote bag: price $12 → $15 (+25%), monthly sales 50 → 30 (−40%). Calculate the PED and classify it.', answer: 'PED = −40% ÷ 25% = −1.6 → Elastic. Quantity reacted more than price did — plenty of substitute bags to switch to.', tags: [{ label: 'ELASTIC', tone: 'down' }] },
                    { question: '📱 Tom’s Print Co phone stands: price $10 → $8 (−20%), weekly sales 45 → 63 (+40%). Calculate the PED, then TR before and after. Did revenue rise or fall?', answer: 'PED = +40% ÷ −20% = −2 → Elastic. TR before = $10 × 45 = $450. TR after = $8 × 63 = $504. Revenue ROSE — with elastic demand, a price CUT brings in proportionally more extra sales than the discount costs.', tags: [{ label: 'ROSE ↑', tone: 'up' }] },
                  ],
                },
                {
                  id: 'explain-price-mechanism',
                  type: 'explanation',
                  kicker: 'Hook → New idea',
                  title: 'The Price Mechanism',
                  lede: 'Nobody at Tom’s Print Co has ever received a government order saying “make 60 padel grips this week, price them at $8.” Yet somehow, roughly the right amount of stuff gets made, priced, and sold. How?',
                  conceptId: 'market-economic-system',
                  definition:
                    'In a market economic system, the price mechanism (sometimes called the “invisible hand”) coordinates ' +
                    'everything without any central planner giving instructions — millions of tiny two-way price signals ' +
                    'pull resources toward whatever people actually want.',
                  example: 'When more people want padel grips than Tom is making, the price gets bid up — signalling Tom to make more, and some buyers to look elsewhere.',
                },
                {
                  id: 'explain-three-questions',
                  type: 'explanation',
                  kicker: 'The framework',
                  title: 'Three Questions Every Economy Must Answer',
                  lede: 'Every economic system — market, planned, or mixed — has to answer the same three basic questions. What’s distinctive about a market system is how it answers them.',
                  conceptId: 'market-economic-system',
                  definition:
                    'What to produce? Whatever earns a profit. How to produce? However keeps costs lowest. For whom to ' +
                    'produce? Whoever is willing and able to pay the market price — not decided by need, lottery, or the state.',
                  example: 'Competition punishes wasteful producers with lower profit, which is how the market answers “how to produce” without anyone planning it centrally.',
                },
                {
                  id: 'tap-characteristics',
                  type: 'tap_reveal_grid',
                  kicker: 'Defining features',
                  title: 'Characteristics of a Market Economy',
                  lede: 'A “pure” market economy has five defining characteristics — each one is a decision left to individuals, not the state. Tap each to see it in action.',
                  cards: [
                    { id: 'private-ownership', icon: '🔐', label: 'Private ownership', content: 'Individuals and firms own resources — Tom owns his printer and business, not the state.' },
                    { id: 'profit-motive', icon: '💰', label: 'Profit motive', content: 'Producers are driven by the goal of making a profit — that’s what decides what gets made.' },
                    { id: 'freedom-of-choice', icon: '🙋', label: 'Freedom of choice', content: 'Consumers choose what to buy; producers choose what to sell and at what price. Nobody is assigned a job or a product.' },
                    { id: 'competition', icon: '⚔️', label: 'Competition', content: 'Rival producers compete for customers, pushing prices down and quality/innovation up.' },
                    { id: 'minimal-government', icon: '🏛️', label: 'Minimal government role', content: 'The state mostly stays out of day-to-day production and pricing decisions.' },
                  ],
                },
                {
                  id: 'sort-market-or-not',
                  type: 'sort_classify',
                  kicker: 'Now you try',
                  title: 'Market Economy — or Not?',
                  lede: 'Classify each situation, then check your answer.',
                  testsConceptIds: ['market-economic-system'],
                  categories: ['Market economy', 'Planned economy'],
                  items: [
                    { id: 'tom-decides', label: 'Tom decides what to make based on what sells best', correctCategory: 'Market economy', reason: 'Private producers respond to price signals and consumer demand, not government orders.' },
                    { id: 'gov-sets-price', label: 'A government official sets the price of padel court hire for every club in the country', correctCategory: 'Planned economy', reason: 'Prices set by a central authority, not by supply and demand — not how a market system works.' },
                    { id: 'anyone-can-start', label: 'Anyone can start a 3D-printing business if they think they can make a profit', correctCategory: 'Market economy', reason: 'Freedom of enterprise and low barriers to entry are hallmarks of a market system.' },
                    { id: 'gov-owns-clubs', label: 'The government owns and runs every padel club, deciding how many courts each town gets', correctCategory: 'Planned economy', reason: 'State ownership and central allocation of resources, not private ownership and price signals.' },
                  ],
                },
                {
                  id: 'explain-advantages',
                  type: 'explanation',
                  kicker: 'The upside',
                  title: 'Advantages of the Market Economic System',
                  lede: 'Relying on the price mechanism instead of a central planner has some real strengths.',
                  conceptId: 'market-adv-disadv',
                  definition:
                    'Efficient allocation — resources flow toward what consumers actually want. Consumer choice — many ' +
                    'competing products rather than one state-approved option. Incentive to innovate — competition rewards ' +
                    'firms that cut costs or build something better. No costly bureaucracy — nobody needs to pay planners ' +
                    'to decide production levels centrally.',
                  example: 'Three 3D-print shops opening near the padel club and competing for Tom’s customers usually means lower prices and better quality for buyers.',
                },
                {
                  id: 'guess-spot-advantage',
                  type: 'guess_reveal',
                  kicker: 'Spot it in action',
                  title: 'Which Advantage Is This?',
                  lede: 'Guess which advantage each scenario shows, then tap to check.',
                  testsConceptIds: ['market-adv-disadv'],
                  cards: [
                    { question: 'Three different 3D-print shops open near the padel club, all competing for Tom’s customers. Good or bad for buyers, and why?', answer: 'Good — competition usually means lower prices and better quality, since each shop has to work to win customers rather than being guaranteed sales.', tags: [{ label: 'Efficiency & choice', tone: 'up' }] },
                    { question: 'Tom notices padel players want faster delivery, so he redesigns his workflow to cut turnaround from a week to two days — no government told him to. Which advantage does this show?', answer: 'Innovation driven by the profit motive — Tom improved his product because doing so wins him more customers and more profit, entirely on his own initiative.', tags: [{ label: 'Innovation', tone: 'up' }] },
                  ],
                },
                {
                  id: 'explain-disadvantages',
                  type: 'explanation',
                  kicker: 'The downside',
                  title: 'Disadvantages of the Market Economic System',
                  lede: 'The same price mechanism that makes markets efficient also creates some real problems.',
                  conceptId: 'market-adv-disadv',
                  definition:
                    'Inequality — the market only responds to effective demand (willingness AND ability to pay). Public ' +
                    'goods under-provided — some useful goods can’t easily be sold to individual buyers. Externalities ' +
                    'ignored — the market price often leaves out costs that spill over onto third parties. Monopoly power ' +
                    '— if competition breaks down, one firm can raise prices and cut quality.',
                  example: 'Someone who needs something but can’t afford it simply doesn’t count, market-wise — that’s inequality in action.',
                },
                {
                  id: 'guess-spot-disadvantage',
                  type: 'guess_reveal',
                  kicker: 'Spot it in action',
                  title: 'Which Problem Is This?',
                  lede: 'Guess which disadvantage each scenario shows, then tap to check.',
                  testsConceptIds: ['market-adv-disadv'],
                  cards: [
                    { question: 'Tom’s 3D printer produces plastic waste that ends up in a local stream. Does the $8 price of a padel grip include the cost of that pollution?', answer: 'No — that’s a negative externality. The cost falls on people who live near the stream, not on Tom or his customers, so the market price doesn’t reflect it.', tags: [{ label: 'Externality', tone: 'down' }] },
                    { question: 'A family that can’t afford padel court fees wants to play, but has no money to back that want. Does the market respond to their desire to play?', answer: 'No — the market only responds to effective demand (wanting AND being able to pay). Genuine need with no money behind it is invisible to the price mechanism.', tags: [{ label: 'Inequality', tone: 'down' }] },
                    { question: 'Nobody privately installs streetlights along the path to the padel club, even though everyone using it at night would benefit. Why not, in a pure market system?', answer: 'It’s a public good — hard to charge individual walkers for lighting they’d benefit from anyway, so there’s no profit incentive for a private firm to provide it.', tags: [{ label: 'Public goods', tone: 'down' }] },
                  ],
                },
                {
                  id: 'inline-quiz-before-homework',
                  type: 'inline_quiz',
                  kicker: 'Quick check',
                  title: 'Before Homework...',
                  testsConceptIds: ['market-economic-system', 'market-adv-disadv'],
                  questions: [
                    { question: 'In a market economy, who decides “for whom” goods are produced?', options: ['The government, based on need', 'Whoever is willing and able to pay the market price', 'A random lottery', 'Producers decide based on friendship'], correctOptionIndex: 1, feedback: 'The market allocates to whoever has effective demand — willingness AND ability to pay — not need, chance, or favouritism.' },
                    { question: 'Which of these is a genuine disadvantage of relying purely on the price mechanism?', options: ['It always produces exactly equal outcomes for everyone', 'It automatically accounts for pollution costs', 'It can leave genuine needs unmet if buyers can’t afford to pay', 'It requires a large government planning department'], correctOptionIndex: 2, feedback: 'Effective demand requires ability to pay — real need with no money behind it goes unmet in a pure market system.' },
                    { question: 'Three padel-adjacent 3D print shops compete hard for customers. Which characteristic does this best illustrate?', options: ['Public ownership', 'Central planning', 'Competition', 'Minimum wage laws'], correctOptionIndex: 2, feedback: 'Rival producers competing for the same customers is the characteristic of competition in action.' },
                  ],
                },
                {
                  id: 'recap-key-words',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: 'Today’s Key Words',
                  summaryPoints: [
                    'Price mechanism: The system where prices, driven by supply and demand, coordinate what gets produced, how, and for whom — without central planning.',
                    'Market economic system: An economy where resources are allocated mainly through the price mechanism, with private ownership and minimal government intervention.',
                    'Effective demand: Wanting a good or service AND having the money to actually buy it — only this counts in the market.',
                    'Externality: A cost or benefit of a transaction that spills over onto a third party not involved in it.',
                  ],
                  homeworkItems: ['Definitions + characteristics', 'Apply it: Tom’s Print Co scenarios', 'Advantages & disadvantages questions', 'Exam-style MCQs + 6-mark question'],
                },
              ],
            },
            teachingScript: {
              overview: 'Zooms out from single markets to the market economic system as a whole: the price mechanism, the three basic economic questions, its five defining characteristics, and its advantages and disadvantages.',
              steps: [
                { stepId: 'explain-price-mechanism', talkingPoints: ['Ask how the right amount of stuff gets made with nobody in charge, before naming the price mechanism / invisible hand.'], timingMinutes: 5 },
                { stepId: 'tap-characteristics', talkingPoints: ['Go through each characteristic, tying it back to Tom’s Print Co. each time.'], timingMinutes: 8 },
                { stepId: 'explain-advantages', talkingPoints: ['Cover efficient allocation, consumer choice, incentive to innovate, no costly bureaucracy — with a concrete example for each.'], timingMinutes: 6 },
                { stepId: 'explain-disadvantages', talkingPoints: ['Cover inequality, public goods, externalities, monopoly power — the same price mechanism that makes markets efficient also creates these problems.'], timingMinutes: 6, misconceptions: ['Assuming a pure market economy has no downsides.', 'Confusing effective demand with need — wanting something is not the same as being able to pay for it.'] },
                { stepId: 'recap-key-words', talkingPoints: ['Set the worksheet + flashcards for self-directed time.'], timingMinutes: 2 },
              ],
            },
            worksheetContent: {
              title: 'Worksheet — The Market Economic System',
              instructions: 'Answer in full sentences, referring to the price mechanism where relevant.',
              questions: [
                { prompt: 'Define a market economic system.', marks: 2, answer: 'An economic system in which resource allocation decisions (what, how, and for whom to produce) are made by the interaction of buyers and sellers through the price mechanism, with little or no government intervention.' },
                { prompt: 'State two characteristics of a market economic system.', marks: 2, answer: 'Any two of: private ownership of resources; the price mechanism allocates resources; freedom of choice for consumers and producers; profit motive drives firms; minimal government intervention.' },
                { prompt: 'Explain two advantages of a market economic system.', marks: 6, answer: 'Any two of: efficient allocation of resources (prices signal what consumers want, so resources flow to where they are most valued); wide consumer choice (firms compete to offer variety); incentive to innovate (profit motive rewards efficiency and new ideas); no costly bureaucracy needed to plan the economy (the price mechanism does the coordinating).' },
                { prompt: 'Explain two disadvantages of a market economic system.', marks: 6, answer: 'Any two of: inequality (those who own more resources/earn more can buy more, creating a gap between rich and poor); public goods may be under-provided (no profit incentive to provide non-excludable, non-rival goods); externalities are ignored (firms don’t account for costs/benefits to third parties, e.g. pollution); monopoly power can develop, reducing consumer choice and raising prices.' },
                { prompt: 'Explain the difference between "demand" (wanting something) and "effective demand" (being willing and able to pay for it), and why this distinction matters in a market economy.', marks: 3, answer: 'Demand is simply wanting a good or service; effective demand also requires the ability and willingness to pay for it. In a market economy, only effective demand actually influences resource allocation through the price mechanism — a want with no purchasing power behind it does not affect what gets produced.' },
              ],
            },
            quizQuestions: [],
            flashcards: [
              { term: 'Price mechanism', definition: 'The system where prices, driven by supply and demand, coordinate what gets produced, how it’s produced, and for whom — without any central planner.' },
              { term: 'Market economic system', definition: 'An economy where resources are allocated mainly through the price mechanism, with private ownership of resources and minimal government intervention.' },
              { term: 'The three basic economic questions', definition: 'Every economy must answer what to produce, how to produce it, and for whom. A market system answers all three through prices, not central planning.' },
              { term: 'What to produce (market answer)', definition: 'Whatever earns a profit — signalled by what consumers are willing to pay for.' },
              { term: 'How to produce (market answer)', definition: 'However keeps costs lowest — competition punishes wasteful producers with lower profit.' },
              { term: 'For whom to produce (market answer)', definition: 'Whoever is willing AND able to pay the market price — not decided by need, lottery, or the state.' },
              { term: 'Characteristic — private ownership', definition: 'Individuals and firms own resources, not the state. Tom owns his 3D printer and business outright.' },
              { term: 'Characteristic — profit motive', definition: 'Producers are driven by the goal of making a profit — that’s what decides what gets made.' },
              { term: 'Characteristic — freedom of choice', definition: 'Consumers choose what to buy; producers choose what to sell and at what price.' },
              { term: 'Characteristic — competition', definition: 'Rival producers compete for customers, pushing prices down and quality/innovation up.' },
              { term: 'Characteristic — minimal government role', definition: 'The state mostly stays out of day-to-day production and pricing decisions.' },
              { term: 'Advantage — efficient allocation', definition: 'Resources flow toward whatever consumers actually want, without anyone needing to plan or predict demand in advance.' },
              { term: 'Advantage — consumer choice', definition: 'Buyers pick from many competing products rather than one state-approved option.' },
              { term: 'Advantage — incentive to innovate', definition: 'Competition rewards firms that cut costs or build something better, since profit depends on it.' },
              { term: 'Advantage — no costly bureaucracy', definition: 'There’s no need to pay an army of planners to decide production levels for millions of goods.' },
              { term: 'Effective demand', definition: 'Wanting a good or service AND having the money to actually buy it. Only this combination counts in the market — need alone is not enough.' },
              { term: 'Disadvantage — inequality', definition: 'The market only responds to effective demand, so someone who needs something but can’t afford it simply doesn’t count, market-wise.' },
              { term: 'Externality', definition: 'A cost or benefit of a transaction that spills over onto a third party not involved in it, e.g. pollution from a 3D printer affecting people who live near a stream.' },
              { term: 'Disadvantage — public goods under-provided', definition: 'Some useful goods (like street lighting) can’t easily be sold to individual buyers, so no private firm has a profit incentive to provide them.' },
              { term: 'Disadvantage — monopoly power', definition: 'If competition breaks down and one firm dominates a market, it can raise prices and cut quality without losing many customers.' },
            ],
          },
        ],
      },
    },
  },
};

export default economics0455Tom;

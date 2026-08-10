import type { SampleTermSeed } from './curriculum-seed-types';

/** Draft first-term English content for Primary 1–6, organised around the Cambridge Primary
 * English curriculum framework's stage-by-stage progression through Reading, Writing, and
 * Speaking & Listening (with phonics and grammar woven into the early stages). Original
 * lesson-plan writing informed by the publicly known structure of that framework, not a
 * reproduction of Cambridge's own copyrighted materials — see curriculum-seed.ts for the full
 * explanation of why every one of these is explicitly a draft.
 */
export const ENGLISH_TERMS: SampleTermSeed[] = [
  {
    className: 'Primary 1',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 1 (draft)',
    units: [
      {
        title: 'Phonics and Early Reading',
        description: 'Building the foundations of decoding before independent reading begins.',
        lessons: [
          { title: 'Letter sounds', objectives: 'Recognise and say the sound for each letter of the alphabet.' },
          { title: 'Blending simple words', objectives: 'Blend three sounds together to read simple consonant-vowel-consonant (CVC) words.' },
          { title: 'High-frequency words', objectives: 'Read a set of common high-frequency words on sight.' },
        ],
      },
      {
        title: 'Reading for Meaning',
        description: 'Moving from decoding to understanding a simple story.',
        lessons: [
          { title: 'Retelling a story in order', objectives: 'Retell the main events of a familiar story in the correct order, using picture prompts.' },
          { title: 'Answering questions about a text', objectives: 'Answer simple who, what, and where questions about a text that has been read aloud.' },
        ],
      },
      {
        title: 'Early Writing',
        description: 'From correct letter formation to writing a simple, complete sentence.',
        lessons: [
          { title: 'Forming letters correctly', objectives: 'Form all lower-case letters starting and finishing in the right place.' },
          { title: 'Writing captions', objectives: "Write a simple caption for a picture, using a capital letter and a full stop." },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Everyday classroom talk skills.',
        lessons: [
          { title: 'Sharing ideas in a group', objectives: 'Take turns to share an idea clearly in a small group.' },
          { title: 'Following instructions', objectives: 'Listen to and follow a simple two-step spoken instruction.' },
        ],
      },
      {
        title: 'Stories and Rhymes',
        description: 'Developing a love of stories and an ear for rhyme.',
        lessons: [
          { title: 'Joining in with rhymes', objectives: 'Join in with familiar rhymes and repeated refrains in a story.' },
          { title: 'Predicting what happens next', objectives: 'Make a sensible prediction about what might happen next in a story.' },
        ],
      },
      {
        title: 'Simple Sentences',
        description: 'A first, gentle introduction to sentence-level grammar.',
        lessons: [
          { title: 'Writing a simple sentence', objectives: 'Write a simple sentence with a subject and a verb that makes sense.' },
          { title: 'Joining ideas with "and"', objectives: 'Use the word "and" to join two ideas in a sentence.' },
        ],
      },
      {
        title: 'Non-Fiction',
        description: 'A first look at books written to give information.',
        lessons: [
          { title: 'Using picture and label books', objectives: 'Use a simple picture or label book to find information about a topic.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 2',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 2 (draft)',
    units: [
      {
        title: 'Phonics and Spelling',
        description: 'Extending phonics knowledge to more complex letter patterns.',
        lessons: [
          { title: 'Digraphs and trigraphs', objectives: 'Read and spell words containing common digraphs and trigraphs (e.g. sh, ch, igh).' },
          { title: 'Common exception words', objectives: 'Spell a set of common exception words correctly.' },
        ],
      },
      {
        title: 'Reading for Meaning',
        description: 'Reading with growing independence and understanding.',
        lessons: [
          { title: 'Making simple inferences', objectives: 'Make simple inferences from pictures and text about how a character might be feeling.' },
          { title: 'Discussing favourite words and phrases', objectives: 'Identify and discuss favourite words and phrases in a story.' },
        ],
      },
      {
        title: 'Writing Sentences and Short Texts',
        description: 'Joining sentences together to form a short narrative.',
        lessons: [
          { title: 'Writing a sequence of sentences', objectives: 'Write a short sequence of sentences to form a simple narrative with a beginning, middle, and end.' },
          { title: 'Using adjectives', objectives: 'Use adjectives to add detail and interest to writing.' },
        ],
      },
      {
        title: 'Grammar and Punctuation',
        description: 'Consolidating and extending sentence punctuation.',
        lessons: [
          { title: 'Sentence punctuation', objectives: 'Use capital letters, full stops, question marks, and exclamation marks correctly.' },
          { title: 'Joining clauses', objectives: 'Use "and", "but", and "so" to join two clauses in a sentence.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Structuring talk and asking good questions.',
        lessons: [
          { title: 'Retelling a story with structure', objectives: 'Retell a story with a clear beginning, middle, and end.' },
          { title: 'Asking relevant questions', objectives: 'Ask a relevant question about something they have heard or read.' },
        ],
      },
      {
        title: 'Poetry and Performance',
        description: 'Reading poems aloud and noticing how they sound.',
        lessons: [
          { title: 'Reading poems with expression', objectives: 'Read a short poem aloud with appropriate expression and volume.' },
          { title: 'Noticing rhyme and rhythm', objectives: 'Identify rhyming words and a repeated rhythm in a poem.' },
        ],
      },
      {
        title: 'Non-Fiction Writing',
        description: 'Writing for a real purpose.',
        lessons: [
          { title: 'Writing lists and labels', objectives: 'Write a simple list or set of labels for a clear purpose.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 3',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 3 (draft)',
    units: [
      {
        title: 'Reading Fluency and Comprehension',
        description: 'Reading aloud with growing fluency and answering deeper questions.',
        lessons: [
          { title: 'Reading aloud with expression', objectives: 'Read aloud with expression and understanding, pausing appropriately at punctuation.' },
          { title: 'Retrieval and inference questions', objectives: 'Answer both retrieval and simple inference questions about a text.' },
        ],
      },
      {
        title: 'Story Writing',
        description: 'Planning and writing a complete story with a setting.',
        lessons: [
          { title: 'Planning a story', objectives: 'Plan a story with a clear structure: opening, build-up, problem, and resolution.' },
          { title: 'Setting the scene', objectives: 'Use descriptive language to set a scene for the reader.' },
        ],
      },
      {
        title: 'Grammar',
        description: 'Extending sentences and using tense consistently.',
        lessons: [
          { title: 'Using conjunctions to extend sentences', objectives: 'Use a range of conjunctions (because, if, when) to extend sentences.' },
          { title: 'Consistent tense', objectives: 'Use the present and past tense consistently and correctly in writing.' },
        ],
      },
      {
        title: 'Punctuation',
        description: 'Extending punctuation to commas and apostrophes.',
        lessons: [
          { title: 'Commas in a list', objectives: 'Use commas correctly to separate items in a list.' },
          { title: 'Apostrophes for contraction', objectives: "Use an apostrophe correctly to show contraction (e.g. don't, it's)." },
        ],
      },
      {
        title: 'Vocabulary and Word Study',
        description: 'Building independence with unfamiliar words.',
        lessons: [
          { title: 'Using a dictionary', objectives: 'Use a dictionary to check the meaning and spelling of an unfamiliar word.' },
          { title: 'Synonyms', objectives: 'Identify synonyms for common words to add variety to writing.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Presenting to an audience and responding to others.',
        lessons: [
          { title: 'Presenting a short talk', objectives: 'Prepare and deliver a short talk to the class on a familiar topic.' },
          { title: 'Listening and responding', objectives: "Listen to a classmate's talk and respond with a relevant comment or question." },
        ],
      },
      {
        title: 'Non-Fiction',
        description: 'Writing instructions and comparing information sources.',
        lessons: [
          { title: 'Writing instructions', objectives: 'Write a clear set of instructions in the correct order, using imperative verbs.' },
          { title: 'Comparing two non-fiction texts', objectives: 'Compare information from two non-fiction texts on the same topic.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 4',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 4 (draft)',
    units: [
      {
        title: 'Reading Comprehension',
        description: 'Inferring character and summarising longer texts.',
        lessons: [
          { title: "Inferring characters' feelings", objectives: "Infer a character's feelings and motives from their actions and speech." },
          { title: 'Summarising a text', objectives: 'Summarise the main points of a text in a few sentences.' },
        ],
      },
      {
        title: 'Narrative Writing',
        description: 'Developing setting, character, and paragraph organisation.',
        lessons: [
          { title: 'Developing setting and character', objectives: 'Write a story with a well-developed setting and a character described through action and dialogue.' },
          { title: 'Organising writing into paragraphs', objectives: 'Organise a piece of narrative writing into clear paragraphs.' },
        ],
      },
      {
        title: 'Grammar',
        description: 'A wider range of conjunctions and sentence openers.',
        lessons: [
          { title: 'A wider range of conjunctions', objectives: 'Use a wider range of conjunctions (because, although, when) to link ideas.' },
          { title: 'Fronted adverbials', objectives: 'Use fronted adverbials, followed by a comma, to open a sentence.' },
        ],
      },
      {
        title: 'Punctuation',
        description: 'Direct speech and possessive apostrophes.',
        lessons: [
          { title: 'Punctuating direct speech', objectives: 'Use inverted commas correctly to punctuate direct speech.' },
          { title: 'Apostrophes for possession', objectives: 'Use an apostrophe correctly to show possession.' },
        ],
      },
      {
        title: 'Poetry',
        description: 'Writing with figurative language for the first time.',
        lessons: [
          { title: 'Writing descriptive poetry', objectives: 'Write a short poem using descriptive language and a simile.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Group discussion skills.',
        lessons: [
          { title: 'Taking part in a group discussion', objectives: 'Take part in a group discussion, building respectfully on what others have said.' },
        ],
      },
      {
        title: 'Non-Fiction',
        description: 'Writing to persuade and identifying fact from opinion.',
        lessons: [
          { title: 'Writing a persuasive letter', objectives: 'Write a persuasive letter or advertisement using persuasive language techniques.' },
          { title: 'Fact versus opinion', objectives: 'Identify statements of fact and statements of opinion within a text.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 5',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 5 (draft)',
    units: [
      {
        title: 'Reading Comprehension',
        description: 'Comparing viewpoints and identifying purpose and bias.',
        lessons: [
          { title: 'Comparing viewpoints in texts', objectives: 'Compare how two different texts present a similar topic or event.' },
          { title: "Identifying an author's purpose", objectives: "Identify an author's purpose and any bias in a text." },
        ],
      },
      {
        title: 'Narrative Writing',
        description: 'Developing plot tension and character through dialogue.',
        lessons: [
          { title: 'Building tension and resolution', objectives: 'Develop a story plot that builds tension before reaching a resolution.' },
          { title: 'Developing character through dialogue', objectives: 'Use dialogue to reveal character, punctuated correctly.' },
        ],
      },
      {
        title: 'Grammar',
        description: 'Relative clauses and modal verbs.',
        lessons: [
          { title: 'Relative clauses', objectives: 'Use relative clauses (using who, which, that) to add information to a sentence.' },
          { title: 'Modal verbs', objectives: 'Use modal verbs (might, could, must) to indicate degrees of possibility.' },
        ],
      },
      {
        title: 'Punctuation',
        description: 'Wider sentence-structuring punctuation.',
        lessons: [
          { title: 'Colons and semicolons', objectives: 'Use a colon or semicolon correctly to structure a sentence.' },
          { title: 'Brackets for parenthesis', objectives: 'Use brackets or dashes correctly to add a parenthetical aside.' },
        ],
      },
      {
        title: 'Poetry and Figurative Language',
        description: 'Writing with metaphor and personification.',
        lessons: [
          { title: 'Writing with metaphor and personification', objectives: 'Write a poem that uses metaphor or personification for effect.' },
          { title: 'How poets use structure', objectives: 'Explore how a poem’s structure (line length, stanza, repetition) affects its meaning.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Persuasive speech and reasoned debate.',
        lessons: [
          { title: 'Delivering a persuasive speech', objectives: 'Plan and deliver a short persuasive speech on a topic of choice.' },
          { title: 'Debating with reasoned arguments', objectives: 'Take part in a debate, presenting a reasoned argument and responding to a counterpoint.' },
        ],
      },
      {
        title: 'Non-Fiction',
        description: 'Balanced discussion writing and simple research.',
        lessons: [
          { title: 'Writing a balanced discussion', objectives: 'Write a balanced discussion text presenting both sides of an issue.' },
          { title: 'Researching and presenting a report', objectives: 'Research a topic from more than one source and present findings in a short report.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 6',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary English, Stage 6 (draft)',
    units: [
      {
        title: 'Reading Comprehension',
        description: 'Analysing language choices and evaluating sources.',
        lessons: [
          { title: 'Analysing language for effect', objectives: 'Analyse how an author’s choice of language creates a particular effect on the reader.' },
          { title: 'Evaluating the reliability of sources', objectives: 'Evaluate how reliable a source of information is likely to be, and why.' },
        ],
      },
      {
        title: 'Narrative Writing',
        description: 'An extended story with a controlled narrative voice.',
        lessons: [
          { title: 'Controlling narrative voice', objectives: 'Write an extended narrative maintaining a consistent and controlled narrative voice throughout.' },
          { title: 'Using flashback or multiple viewpoints', objectives: 'Experiment with flashback or more than one viewpoint to add structure and interest to a story.' },
        ],
      },
      {
        title: 'Grammar',
        description: 'The passive voice and a wide range of sentence structures.',
        lessons: [
          { title: 'The passive voice', objectives: 'Recognise and use the passive voice, and understand why a writer might choose it.' },
          { title: 'Varying sentence structure', objectives: 'Use a deliberate range of sentence structures and lengths for effect.' },
        ],
      },
      {
        title: 'Punctuation',
        description: 'Accurate punctuation across an extended piece of writing.',
        lessons: [
          { title: 'Punctuation in extended writing', objectives: 'Use the full range of punctuation studied so far accurately across an extended piece of writing.' },
        ],
      },
      {
        title: 'Poetry',
        description: 'Writing an original poem and comparing traditions.',
        lessons: [
          { title: 'Writing and performing an original poem', objectives: 'Write and perform an original poem, making deliberate choices of language and structure.' },
          { title: 'Comparing poems from different traditions', objectives: 'Compare how two poems from different cultures or traditions treat a similar theme.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Leading discussion and formal presentation.',
        lessons: [
          { title: 'Chairing a group discussion', objectives: 'Chair a small-group discussion, making sure every voice is heard.' },
          { title: 'A formal talk with visual aids', objectives: 'Present a formal talk supported by visual aids.' },
        ],
      },
      {
        title: 'Non-Fiction',
        description: 'Formal report writing and synthesising sources.',
        lessons: [
          { title: 'Writing a formal report or article', objectives: 'Write a formal report or article in an appropriate register for its audience and purpose.' },
          { title: 'Synthesising multiple sources', objectives: 'Evaluate and synthesise information from more than one source into a single piece of writing.' },
        ],
      },
    ],
  },
];

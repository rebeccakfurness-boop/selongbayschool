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

  // Secondary 6–10: see the equivalent note in curriculum-seed-mathematics.ts for the assumed
  // Secondary-number-to-Cambridge-stage mapping this continues.
  {
    className: 'Secondary 6',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary English, Stage 7 (draft)',
    units: [
      {
        title: 'Reading Fiction',
        description: 'Inference and characterisation in a longer, more demanding text.',
        lessons: [
          { title: 'Making inferences', objectives: 'Infer a character’s feelings or motives from their actions and dialogue, supporting inferences with evidence from the text.' },
          { title: 'How writers build character', objectives: 'Identify the methods a writer uses to build a character, such as description, dialogue, and action.' },
        ],
      },
      {
        title: 'Reading Non-Fiction',
        description: 'Distinguishing fact from opinion and reading with purpose in mind.',
        lessons: [
          { title: 'Fact versus opinion', objectives: 'Distinguish statements of fact from statements of opinion in a non-fiction text.' },
          { title: 'Purpose and audience', objectives: 'Identify the purpose and intended audience of a non-fiction text and how this shapes its language.' },
        ],
      },
      {
        title: 'Narrative Writing',
        description: 'Building a complete short story with a clear structure.',
        lessons: [
          { title: 'Setting the scene', objectives: 'Use descriptive language to establish a vivid setting at the start of a story.' },
          { title: 'Structuring a short story', objectives: 'Plan and write a short story with a clear opening, build-up, climax, and resolution.' },
        ],
      },
      {
        title: 'Grammar and Punctuation',
        description: 'A structured review of word classes, sentence types, and punctuation.',
        lessons: [
          { title: 'Word classes review', objectives: 'Identify nouns, verbs, adjectives, and adverbs in a sentence and explain the effect of word choice.' },
          { title: 'Simple, compound and complex sentences', objectives: 'Write and identify simple, compound, and complex sentences, and vary sentence type for effect.' },
        ],
      },
      {
        title: 'Poetry',
        description: 'Exploring form and imagery, and reading poems aloud.',
        lessons: [
          { title: 'Poetic form and structure', objectives: 'Identify features of a poem’s form, such as stanza, rhyme, and rhythm, and comment on their effect.' },
          { title: 'Reading poetry aloud', objectives: 'Read a poem aloud with attention to pace, pause, and emphasis to convey meaning.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Structured talk and active listening in a group.',
        lessons: [
          { title: 'Giving a short presentation', objectives: 'Plan and deliver a short, structured presentation to the class on a chosen topic.' },
          { title: 'Listening and responding in discussion', objectives: 'Listen actively in a group discussion and build on others’ points with relevant contributions.' },
        ],
      },
      {
        title: 'Non-Fiction Writing',
        description: 'Writing for real-world purposes: letters, articles, and instructions.',
        lessons: [
          { title: 'Writing a formal letter', objectives: 'Write a formal letter using appropriate layout, tone, and conventions.' },
          { title: 'Writing clear instructions', objectives: 'Write a set of instructions in a logical order using imperative verbs and sequencing language.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 7',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary English, Stage 8 (draft)',
    units: [
      {
        title: 'Reading Fiction',
        description: 'Viewpoint and theme in extended fiction.',
        lessons: [
          { title: 'Narrative viewpoint', objectives: 'Identify first- and third-person narrative viewpoint and discuss the effect of the writer’s choice.' },
          { title: 'Identifying theme', objectives: 'Identify a central theme in a text and support this with evidence from different parts of the text.' },
        ],
      },
      {
        title: 'Reading Non-Fiction and Media',
        description: 'Spotting bias and the techniques writers use to persuade.',
        lessons: [
          { title: 'Recognising bias', objectives: 'Identify bias in a non-fiction or media text and explain how language choices reveal it.' },
          { title: 'Rhetorical devices', objectives: 'Identify rhetorical devices such as rhetorical questions, repetition, and emotive language, and their intended effect.' },
        ],
      },
      {
        title: 'Narrative and Descriptive Writing',
        description: 'Building tension and writing convincing dialogue.',
        lessons: [
          { title: 'Building tension', objectives: 'Use sentence length, pacing, and description to build tension in a piece of narrative writing.' },
          { title: 'Writing convincing dialogue', objectives: 'Write dialogue that reveals character and moves the story forward, punctuated correctly.' },
        ],
      },
      {
        title: 'Grammar and Punctuation',
        description: 'Complex sentences and the active and passive voice.',
        lessons: [
          { title: 'Complex sentences and subordination', objectives: 'Use subordinate clauses to add detail and vary sentence structure.' },
          { title: 'Active and passive voice', objectives: 'Identify active and passive voice and choose deliberately between them for effect.' },
        ],
      },
      {
        title: 'Poetry',
        description: 'Comparing two poems on a similar theme.',
        lessons: [
          { title: 'Comparing poems', objectives: 'Compare how two poems treat a similar theme, referring to language, form, and structure.' },
          { title: 'Poetic techniques', objectives: 'Identify simile, metaphor, and personification in a poem and explain their effect.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Formal debate and structured argument.',
        lessons: [
          { title: 'Taking part in a debate', objectives: 'Argue a given position in a structured debate, responding respectfully to counter-arguments.' },
          { title: 'A formal presentation with questions', objectives: 'Deliver a formal presentation and respond to questions from the audience.' },
        ],
      },
      {
        title: 'Persuasive and Discursive Writing',
        description: 'Building an argument and weighing up both sides.',
        lessons: [
          { title: 'Writing to persuade', objectives: 'Write a persuasive piece using rhetorical devices and a clear line of argument.' },
          { title: 'Writing a balanced discussion', objectives: 'Write a discursive piece that presents both sides of an argument before reaching a reasoned conclusion.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 8',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary English, Stage 9 (draft)',
    units: [
      {
        title: 'Reading Fiction',
        description: 'Reading a longer text with attention to context.',
        lessons: [
          { title: 'Reading in context', objectives: 'Explain how the historical or cultural context of a text shapes its meaning.' },
          { title: 'Tracking character development', objectives: 'Track how a character changes across a longer text and explain what causes the change.' },
        ],
      },
      {
        title: 'Reading Non-Fiction and Media',
        description: 'Analysing rhetoric closely and comparing two texts.',
        lessons: [
          { title: 'Analysing rhetoric', objectives: 'Analyse how a writer combines rhetorical devices to build a persuasive argument.' },
          { title: 'Comparing two non-fiction texts', objectives: 'Compare the viewpoint and techniques of two non-fiction texts on a related topic.' },
        ],
      },
      {
        title: 'Creative Writing',
        description: 'Extended narrative writing with a distinctive voice.',
        lessons: [
          { title: 'Developing a distinctive voice', objectives: 'Write in a distinctive narrative voice appropriate to a chosen character or narrator.' },
          { title: 'Planning an extended narrative', objectives: 'Plan a longer narrative with a clear structure across several stages.' },
        ],
      },
      {
        title: 'Grammar and Style',
        description: 'Deliberately varying sentence structure for effect.',
        lessons: [
          { title: 'Varying sentence structure for effect', objectives: 'Deliberately vary sentence length and structure to control pace and emphasis in writing.' },
          { title: 'Precise word choice', objectives: 'Select precise vocabulary to convey a specific tone or connotation.' },
        ],
      },
      {
        title: 'Poetry',
        description: 'Analysing an unseen poem independently.',
        lessons: [
          { title: 'Approaching an unseen poem', objectives: 'Apply a structured method to analyse an unseen poem’s meaning, form, and language.' },
          { title: 'Writing an analytical paragraph', objectives: 'Write a well-structured analytical paragraph about a poem, using embedded quotations.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Formal debate with prepared and improvised elements.',
        lessons: [
          { title: 'A formal debate', objectives: 'Take part in a formal debate, using evidence to support points and responding to opposing arguments.' },
          { title: 'Oral analysis of a text', objectives: 'Present a short oral analysis of a text’s key features to the class.' },
        ],
      },
      {
        title: 'Transactional Writing',
        description: 'Writing formal letters, reports, and speeches for real purposes.',
        lessons: [
          { title: 'Writing a formal report', objectives: 'Write a formal report with clear sections, headings, and an appropriate register.' },
          { title: 'Writing a speech', objectives: 'Write a speech designed to be delivered aloud, using techniques suited to a listening audience.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 9',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge IGCSE English, Year 1 (draft)',
    units: [
      {
        title: 'Reading: Extended Fiction Texts',
        description: 'Close analysis of extended prose extracts.',
        lessons: [
          { title: 'Close reading of an extract', objectives: 'Analyse a prose extract closely, commenting on language, structure, and effect on the reader.' },
          { title: 'Comparing characters across a text', objectives: 'Compare how two characters are presented across an extended text.' },
        ],
      },
      {
        title: 'Reading: Non-Fiction and Media Texts',
        description: 'Comparing viewpoint and technique across paired texts.',
        lessons: [
          { title: 'Comparing viewpoints', objectives: 'Compare the viewpoints presented in two non-fiction texts on a related topic.' },
          { title: 'Evaluating writers’ techniques', objectives: 'Evaluate how effectively a writer uses language and structure to achieve their purpose.' },
        ],
      },
      {
        title: 'Directed and Transactional Writing',
        description: 'Writing articles, speeches, and letters in exam-style directed tasks.',
        lessons: [
          { title: 'Writing an article from source material', objectives: 'Write an article that selects and adapts information from given source material for a new audience and purpose.' },
          { title: 'Writing a speech from source material', objectives: 'Write a speech that transforms given source material into a persuasive spoken form.' },
        ],
      },
      {
        title: 'Descriptive and Narrative Writing',
        description: 'Crafting original writing for effect, exam-style.',
        lessons: [
          { title: 'Descriptive writing from a stimulus', objectives: 'Write a descriptive piece inspired by a visual or written stimulus, using varied sentence structures and precise vocabulary.' },
          { title: 'Narrative writing under timed conditions', objectives: 'Plan and write a complete short narrative within a set time limit.' },
        ],
      },
      {
        title: 'Language Analysis',
        description: 'Analysing how writers use language to create effect.',
        lessons: [
          { title: 'Analysing word choice and imagery', objectives: 'Analyse a writer’s choice of words and imagery, explaining the effect created and supporting this with terminology.' },
          { title: 'Analysing sentence structure', objectives: 'Explain how a writer’s sentence structures contribute to tone and pace.' },
        ],
      },
      {
        title: 'Summary Writing',
        description: 'Selecting and synthesising information concisely.',
        lessons: [
          { title: 'Selecting relevant information', objectives: 'Identify the information relevant to a given summary task from a longer text.' },
          { title: 'Writing a concise summary', objectives: 'Write a concise summary in continuous prose, in the student’s own words, within a word limit.' },
        ],
      },
      {
        title: 'Speaking and Listening',
        description: 'Individual talk and structured discussion.',
        lessons: [
          { title: 'An individual talk', objectives: 'Prepare and deliver an individual talk on a chosen subject, structured for a listening audience.' },
          { title: 'Responding in discussion', objectives: 'Respond to questions and challenges during discussion with relevant, well-reasoned answers.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 10',
    subject: 'English',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge IGCSE English, Year 2 (draft)',
    units: [
      {
        title: 'Exam Reading Skills Review',
        description: 'Applying reading skills to unseen exam-style texts under time pressure.',
        lessons: [
          { title: 'Timed unseen fiction extract', objectives: 'Answer exam-style questions on an unseen fiction extract within a set time limit.' },
          { title: 'Timed unseen non-fiction extract', objectives: 'Answer exam-style questions on an unseen non-fiction extract within a set time limit.' },
        ],
      },
      {
        title: 'Exam Writing Skills Review',
        description: 'Directed writing tasks practised under timed, exam-realistic conditions.',
        lessons: [
          { title: 'Timed directed writing task', objectives: 'Complete a directed writing task from source material within a set time limit, addressing all bullet points.' },
          { title: 'Reviewing writing against a mark scheme', objectives: 'Review a piece of writing against an exam mark scheme and identify specific improvements.' },
        ],
      },
      {
        title: 'Comparing Non-Fiction Texts',
        description: 'Practising the cross-text comparison question found in exams.',
        lessons: [
          { title: 'Comparing tone and attitude across texts', objectives: 'Compare the tone and attitude of two non-fiction texts, using comparative language.' },
          { title: 'Structuring a comparison answer', objectives: 'Structure a written comparison of two texts clearly, integrating evidence from both.' },
        ],
      },
      {
        title: 'Descriptive and Narrative Writing Practice',
        description: 'Repeated, timed practice of original creative writing.',
        lessons: [
          { title: 'Timed descriptive writing practice', objectives: 'Produce a polished descriptive piece within exam time constraints.' },
          { title: 'Timed narrative writing practice', objectives: 'Produce a polished narrative piece within exam time constraints.' },
        ],
      },
      {
        title: 'Wider Reading and Independent Study',
        description: 'Building reading stamina and independent analytical skills.',
        lessons: [
          { title: 'Independent extended reading', objectives: 'Read an extended text independently and prepare notes on its key themes and techniques.' },
          { title: 'Presenting independent reading', objectives: 'Present findings from independent reading clearly to a small group.' },
        ],
      },
      {
        title: 'Speaking and Listening Assessment Preparation',
        description: 'Preparing for a formally assessed talk and discussion.',
        lessons: [
          { title: 'Preparing an assessed talk', objectives: 'Plan and rehearse a talk that meets the requirements of a formal speaking assessment.' },
          { title: 'Handling assessed discussion', objectives: 'Practise responding to follow-up questions clearly and confidently in an assessed discussion.' },
        ],
      },
      {
        title: 'Exam Preparation and Technique',
        description: 'Full past papers, timing, and command-word awareness.',
        lessons: [
          { title: 'A full timed past paper', objectives: 'Complete a full past exam paper within the official time allowance.' },
          { title: 'Command words and exam technique', objectives: 'Interpret exam command words correctly and allocate time appropriately across a paper.' },
        ],
      },
    ],
  },
];

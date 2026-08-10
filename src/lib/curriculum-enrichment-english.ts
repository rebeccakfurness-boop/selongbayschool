import type { EnrichmentLessonSeed } from './curriculum-enrichment-types';

/** Draft "Complete online" quiz content (equipment note + starter/exit quiz) for every lesson in
 * the Primary 1 and Primary 2 English programmes -- see curriculum-enrichment-mathematics.ts for
 * the full explanation of how this is structured, matched, and imported; every question here is
 * an original draft that needs a teacher's review before real use, same as the rest of the
 * Curriculum Plans content.
 */
export const ENGLISH_ENRICHMENT: EnrichmentLessonSeed[] = [
  // ===== Primary 1 English =====
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Phonics and Early Reading', lessonTitle: 'Letter sounds',
    equipmentNote: 'an alphabet chart or letter cards, if you have them',
    starterQuiz: [
      { question: 'What sound does the letter "s" usually make?', options: ['/s/', '/m/', '/t/'], correctOptionIndex: 0 },
      { question: 'What sound does the letter "m" usually make?', options: ['/s/', '/m/', '/a/'], correctOptionIndex: 1 },
      { question: 'How many letters are in the English alphabet?', options: ['20', '26', '30'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'What sound does the letter "t" usually make?', options: ['/t/', '/p/', '/n/'], correctOptionIndex: 0 },
      { question: 'Which letter makes the /a/ sound in "cat"?', options: ['a', 'c', 't'], correctOptionIndex: 0 },
      { question: 'What sound does the letter "p" usually make?', options: ['/b/', '/p/', '/d/'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Phonics and Early Reading', lessonTitle: 'Blending simple words',
    equipmentNote: 'letter cards or a whiteboard to build words',
    starterQuiz: [
      { question: 'What does "blending" mean when reading?', options: ['Joining sounds to read a word', 'Writing a word', 'Drawing a picture'], correctOptionIndex: 0 },
      { question: 'Blend these sounds: /c/ /a/ /t/. What word is it?', options: ['cat', 'cot', 'cut'], correctOptionIndex: 0 },
      { question: 'What is a CVC word?', options: ['Consonant-vowel-consonant', 'A long sentence', 'A silent word'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Blend these sounds: /d/ /o/ /g/. What word is it?', options: ['dig', 'dog', 'dug'], correctOptionIndex: 1 },
      { question: 'Blend these sounds: /s/ /u/ /n/. What word is it?', options: ['sun', 'sin', 'son'], correctOptionIndex: 0 },
      { question: 'Which of these is a CVC word?', options: ['pig', 'play', 'splash'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Phonics and Early Reading', lessonTitle: 'High-frequency words',
    equipmentNote: 'a list of common sight words, or the printed worksheet',
    starterQuiz: [
      { question: 'What is a "high-frequency word"?', options: ['A word used very often', 'A very long word', 'A made-up word'], correctOptionIndex: 0 },
      { question: 'Which of these is a common high-frequency word?', options: ['the', 'elephant', 'octopus'], correctOptionIndex: 0 },
      { question: 'Why do we learn high-frequency words by sight?', options: ['They appear often in reading', 'They are hard to say', 'They are never used'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which of these is a common high-frequency word?', options: ['said', 'crocodile', 'imagination'], correctOptionIndex: 0 },
      { question: 'Which of these is a common high-frequency word?', options: ['and', 'butterfly', 'wonderful'], correctOptionIndex: 0 },
      { question: 'Reading high-frequency words quickly helps you...', options: ['Read more smoothly', 'Read more slowly', 'Skip words'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Reading for Meaning', lessonTitle: 'Retelling a story in order',
    equipmentNote: 'a favourite storybook',
    starterQuiz: [
      { question: 'What does "retelling" a story mean?', options: ['Telling the story again in your own words', 'Writing a new story', 'Reading silently'], correctOptionIndex: 0 },
      { question: 'A story usually has a beginning, middle, and...', options: ['End', 'Colour', 'Title only'], correctOptionIndex: 0 },
      { question: 'What can help you remember a story’s order?', options: ['Picture prompts', 'Ignoring the pictures', 'Skipping pages'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'If you tell events out of order, is your retelling correct?', options: ['Yes', 'No', 'Sometimes'], correctOptionIndex: 1 },
      { question: 'What comes first when retelling a story?', options: ['The beginning', 'The end', 'The middle'], correctOptionIndex: 0 },
      { question: 'Why is it useful to retell a story in order?', options: ['It makes sense to the listener', 'It is faster', 'It is required to be silent'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Reading for Meaning', lessonTitle: 'Answering questions about a text',
    equipmentNote: 'a short story read aloud together',
    starterQuiz: [
      { question: 'A "who" question asks about...', options: ['A person or character', 'A place', 'A time'], correctOptionIndex: 0 },
      { question: 'A "where" question asks about...', options: ['A person', 'A place', 'An action'], correctOptionIndex: 1 },
      { question: 'A "what" question usually asks about...', options: ['An event or thing', 'A colour only', 'A number only'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'To answer a question about a story, you should...', options: ['Think about what happened', 'Guess randomly', 'Ignore the story'], correctOptionIndex: 0 },
      { question: '"Where did the fox go?" — this is what kind of question?', options: ['Who', 'Where', 'What'], correctOptionIndex: 1 },
      { question: '"Who found the treasure?" — this is what kind of question?', options: ['Who', 'Where', 'What'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Early Writing', lessonTitle: 'Forming letters correctly',
    equipmentNote: 'pencil and paper, or a whiteboard',
    starterQuiz: [
      { question: 'Where should most lower-case letters start?', options: ['At the top', 'At the bottom', 'In the middle'], correctOptionIndex: 0 },
      { question: 'Why is correct letter formation important?', options: ['It makes writing clear and neat', 'It is not important', 'It slows you down'], correctOptionIndex: 0 },
      { question: 'What are "lower-case" letters?', options: ['Small letters', 'Capital letters', 'Numbers'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A capital letter is used at the start of a...', options: ['Sentence', 'Number', 'Full stop'], correctOptionIndex: 0 },
      { question: 'What helps you form letters neatly?', options: ['Starting and finishing in the right place', 'Writing very fast', 'Skipping practice'], correctOptionIndex: 0 },
      { question: 'Which is a lower-case letter?', options: ['a', 'A', '1'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Early Writing', lessonTitle: 'Writing captions',
    equipmentNote: 'pencil and paper, and a picture to caption',
    starterQuiz: [
      { question: 'What is a caption?', options: ['A short sentence describing a picture', 'A whole story', 'A single letter'], correctOptionIndex: 0 },
      { question: 'A caption should start with a...', options: ['Capital letter', 'Number', 'Question mark'], correctOptionIndex: 0 },
      { question: 'A sentence should end with a...', options: ['Full stop', 'Comma', 'Nothing'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which is a correctly punctuated caption?', options: ['a cat sat', 'A cat sat.', 'a cat sat.'], correctOptionIndex: 1 },
      { question: 'What should a good caption do?', options: ['Describe the picture', 'Be unrelated to the picture', 'Have no words'], correctOptionIndex: 0 },
      { question: 'Which mark shows the end of a caption sentence?', options: ['Full stop', 'Comma', 'Colon'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Speaking and Listening', lessonTitle: 'Sharing ideas in a group',
    equipmentNote: 'none needed — practise with family members',
    starterQuiz: [
      { question: 'When sharing ideas in a group, you should...', options: ['Take turns speaking', 'Talk over everyone', 'Stay silent always'], correctOptionIndex: 0 },
      { question: 'What does it mean to "take turns"?', options: ['Everyone speaks one at a time', 'Only one person ever speaks', 'Nobody speaks'], correctOptionIndex: 0 },
      { question: 'Why is it important to listen to others in a group?', options: ['To understand their ideas', 'It is not important', 'To ignore them'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'If two people want to speak at once, what should happen?', options: ['One waits their turn', 'Both shout', 'Neither speaks ever'], correctOptionIndex: 0 },
      { question: 'A clear idea shared in a group should be...', options: ['Easy to understand', 'Very quiet', 'Confusing'], correctOptionIndex: 0 },
      { question: 'Good group listening means...', options: ['Paying attention to the speaker', 'Looking away', 'Talking at the same time'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Speaking and Listening', lessonTitle: 'Following instructions',
    equipmentNote: 'none needed — practise following simple instructions at home',
    starterQuiz: [
      { question: 'A two-step instruction has how many parts?', options: ['1', '2', '3'], correctOptionIndex: 1 },
      { question: '"Pick up the pencil and put it on the table" — how many steps?', options: ['1', '2', '3'], correctOptionIndex: 1 },
      { question: 'To follow an instruction well, you should...', options: ['Listen carefully first', 'Guess what to do', 'Ignore it'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: '"Stand up and clap your hands" — what is the first step?', options: ['Stand up', 'Clap your hands', 'Sit down'], correctOptionIndex: 0 },
      { question: 'If you are not sure what an instruction means, you should...', options: ['Ask for it to be repeated', 'Do nothing at all', 'Guess randomly'], correctOptionIndex: 0 },
      { question: '"Open your book and find page 3" — how many steps is this?', options: ['1', '2', '3'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Stories and Rhymes', lessonTitle: 'Joining in with rhymes',
    equipmentNote: 'a favourite nursery rhyme or repeated-refrain story',
    starterQuiz: [
      { question: 'What are "rhymes"?', options: ['Words that end with the same sound', 'Words that start with capitals', 'Silent words'], correctOptionIndex: 0 },
      { question: 'Which word rhymes with "cat"?', options: ['hat', 'dog', 'sun'], correctOptionIndex: 0 },
      { question: 'A "refrain" in a story is a part that...', options: ['Repeats', 'Only happens once', 'Is silent'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which word rhymes with "sun"?', options: ['fun', 'cat', 'top'], correctOptionIndex: 0 },
      { question: 'Which word rhymes with "star"?', options: ['car', 'sun', 'dog'], correctOptionIndex: 0 },
      { question: 'Why do stories often repeat a refrain?', options: ['So children can join in', 'To confuse the reader', 'It is a mistake'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Stories and Rhymes', lessonTitle: 'Predicting what happens next',
    equipmentNote: 'a storybook to pause partway through',
    starterQuiz: [
      { question: 'What does it mean to "predict"?', options: ['Make a sensible guess about what happens next', 'Read the last page first', 'Ignore the story'], correctOptionIndex: 0 },
      { question: 'A good prediction is based on...', options: ['Clues in the story so far', 'Nothing at all', 'A different story'], correctOptionIndex: 0 },
      { question: 'If a character is running from a dragon, what might happen next?', options: ['Something exciting or scary', 'Nothing changes', 'The story ends immediately'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Predicting what happens next helps you...', options: ['Think about the story more', 'Skip reading', 'Forget the story'], correctOptionIndex: 0 },
      { question: 'If your prediction is wrong, what should you do?', options: ['See what really happened and think why', 'Get upset and stop reading', 'Refuse to listen'], correctOptionIndex: 0 },
      { question: 'A sensible prediction uses...', options: ['Clues from the story', 'Random guessing only', 'The cover colour only'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Simple Sentences', lessonTitle: 'Writing a simple sentence',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'A simple sentence needs a subject and a...', options: ['Verb', 'Comma', 'Question mark'], correctOptionIndex: 0 },
      { question: 'Which of these is a complete sentence?', options: ['The dog', 'The dog runs.', 'runs the'], correctOptionIndex: 1 },
      { question: 'What is the "subject" of a sentence?', options: ['Who or what it is about', 'The last word', 'The punctuation'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'In "The cat sleeps.", what is the verb?', options: ['The', 'cat', 'sleeps'], correctOptionIndex: 2 },
      { question: 'Which sentence makes sense?', options: ['Jumps the.', 'The frog jumps.', 'frog the jumps'], correctOptionIndex: 1 },
      { question: 'A sentence should always end with...', options: ['A punctuation mark', 'Nothing', 'A number'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Simple Sentences', lessonTitle: 'Joining ideas with "and"',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'What does "and" do in a sentence?', options: ['Joins two ideas', 'Ends a sentence', 'Asks a question'], correctOptionIndex: 0 },
      { question: 'Which sentence correctly uses "and"?', options: ['I like cats and dogs.', 'I like cats. and dogs', 'and I like cats dogs'], correctOptionIndex: 0 },
      { question: '"I ran ___ jumped" — which word fits?', options: ['and', 'the', 'is'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Join these ideas: "I have a ball." + "I have a bat." Which is correct?', options: ['I have a ball and a bat.', 'I have a ball. and a bat', 'I and have a ball bat'], correctOptionIndex: 0 },
      { question: 'Which sentence uses "and" correctly?', options: ['She sang and danced.', 'She and sang danced', 'and she sang danced'], correctOptionIndex: 0 },
      { question: '"and" is used to join...', options: ['Two ideas or things', 'The end of a story', 'A question'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'English', unitTitle: 'Non-Fiction', lessonTitle: 'Using picture and label books',
    equipmentNote: 'a picture or label book about any topic (animals, vehicles, etc.)',
    starterQuiz: [
      { question: 'A label book uses words to...', options: ['Name parts of a picture', 'Tell a made-up story', 'Ask questions only'], correctOptionIndex: 0 },
      { question: 'Is a label book fiction or non-fiction?', options: ['Fiction', 'Non-fiction', 'Neither'], correctOptionIndex: 1 },
      { question: 'What can pictures in a non-fiction book help you do?', options: ['Understand the information', 'Make the book longer', 'Confuse the reader'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'If you want to learn animal names, what kind of book helps most?', options: ['A label book about animals', 'A made-up story', 'A poem book'], correctOptionIndex: 0 },
      { question: 'Non-fiction books are mainly used to...', options: ['Find real information', 'Tell made-up stories', 'Show random pictures'], correctOptionIndex: 0 },
      { question: 'A label pointing to a picture of a wheel probably says...', options: ['"wheel"', '"happy"', '"jump"'], correctOptionIndex: 0 },
    ],
  },

  // ===== Primary 2 English =====
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Phonics and Spelling', lessonTitle: 'Digraphs and trigraphs',
    equipmentNote: 'a list of words with sh/ch/igh, or the printed worksheet',
    starterQuiz: [
      { question: 'What is a "digraph"?', options: ['Two letters making one sound', 'A single letter', 'A whole sentence'], correctOptionIndex: 0 },
      { question: 'Which digraph is at the start of "ship"?', options: ['sh', 'ch', 'th'], correctOptionIndex: 0 },
      { question: 'Which trigraph is in the word "light"?', options: ['igh', 'sh', 'ch'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which digraph is at the start of "chip"?', options: ['sh', 'ch', 'th'], correctOptionIndex: 1 },
      { question: 'Which word contains the digraph "th"?', options: ['this', 'shop', 'chat'], correctOptionIndex: 0 },
      { question: 'A trigraph is made of how many letters making one sound?', options: ['2', '3', '4'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Phonics and Spelling', lessonTitle: 'Common exception words',
    equipmentNote: 'a list of common exception words, or the printed worksheet',
    starterQuiz: [
      { question: 'What is a "common exception word"?', options: ['A word that is not spelled the way it sounds', 'A word that is very rare', 'A made-up word'], correctOptionIndex: 0 },
      { question: 'Which of these is a common exception word?', options: ['said', 'cat', 'dog'], correctOptionIndex: 0 },
      { question: 'Why do we learn exception words separately?', options: ['They don’t follow normal spelling rules', 'They are the easiest words', 'They are never used'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which of these is a common exception word?', options: ['people', 'jump', 'red'], correctOptionIndex: 0 },
      { question: 'Which of these is a common exception word?', options: ['friend', 'sit', 'run'], correctOptionIndex: 0 },
      { question: 'Learning exception words by heart helps you...', options: ['Spell and read them correctly', 'Forget how to spell', 'Avoid reading'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Reading for Meaning', lessonTitle: 'Making simple inferences',
    equipmentNote: 'a short story with a picture showing a character’s expression',
    starterQuiz: [
      { question: 'What does "inference" mean?', options: ['Working out something not directly said', 'Copying the text exactly', 'Ignoring the pictures'], correctOptionIndex: 0 },
      { question: 'A character is smiling in a picture — how might they feel?', options: ['Happy', 'Angry', 'Bored'], correctOptionIndex: 0 },
      { question: 'To infer a feeling, you should look at...', options: ['Clues like actions and expressions', 'Only the title', 'Nothing at all'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A character is crying — what might you infer?', options: ['They are sad', 'They are excited', 'They are hungry'], correctOptionIndex: 0 },
      { question: 'If a character slams a door, what might this suggest?', options: ['They are angry', 'They are sleepy', 'They are calm'], correctOptionIndex: 0 },
      { question: 'Inferring means using clues to work out something...', options: ['Not directly stated', 'That is written in bold', 'That is on the cover'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Reading for Meaning', lessonTitle: 'Discussing favourite words and phrases',
    equipmentNote: 'a story with some interesting or descriptive language',
    starterQuiz: [
      { question: 'A "favourite phrase" in a story might be one that is...', options: ['Interesting or memorable', 'The shortest one', 'In a different language'], correctOptionIndex: 0 },
      { question: 'Why might a writer choose an unusual word?', options: ['To make the writing more interesting', 'By accident always', 'To confuse readers on purpose'], correctOptionIndex: 0 },
      { question: 'When discussing a favourite phrase, you should explain...', options: ['Why you like it', 'Nothing at all', 'Only the page number'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'If a phrase makes you picture something clearly, it is probably...', options: ['Descriptive', 'Boring', 'Meaningless'], correctOptionIndex: 0 },
      { question: 'Discussing favourite words with others helps you...', options: ['Share and compare ideas', 'Avoid thinking', 'Copy their answers exactly'], correctOptionIndex: 0 },
      { question: 'A word chosen carefully by a writer is often called...', options: ['A good word choice', 'A mistake', 'An accident'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Writing Sentences and Short Texts', lessonTitle: 'Writing a sequence of sentences',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'A short narrative needs a beginning, middle, and...', options: ['End', 'Title only', 'Nothing else'], correctOptionIndex: 0 },
      { question: 'What does "sequence" mean?', options: ['An order of events', 'A single event', 'A random mix'], correctOptionIndex: 0 },
      { question: 'Why should sentences be in the right order?', options: ['So the story makes sense', 'It does not matter', 'To confuse the reader'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which comes first in a narrative?', options: ['The beginning', 'The end', 'The middle'], correctOptionIndex: 0 },
      { question: 'A story missing an ending feels...', options: ['Incomplete', 'Perfectly finished', 'Too long'], correctOptionIndex: 0 },
      { question: 'What should the middle of a story usually contain?', options: ['The main events', 'Nothing important', 'Only the title'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Writing Sentences and Short Texts', lessonTitle: 'Using adjectives',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'What is an adjective?', options: ['A describing word', 'An action word', 'A punctuation mark'], correctOptionIndex: 0 },
      { question: 'Which word is an adjective in "the big dog"?', options: ['the', 'big', 'dog'], correctOptionIndex: 1 },
      { question: 'Adjectives help make writing...', options: ['More detailed and interesting', 'Shorter and boring', 'Impossible to read'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which word is an adjective in "the shiny red car"?', options: ['shiny', 'car', 'the'], correctOptionIndex: 0 },
      { question: 'Add an adjective to "the ___ cat sat down" — which word fits?', options: ['fluffy', 'ran', 'quickly'], correctOptionIndex: 0 },
      { question: 'Which sentence uses an adjective?', options: ['The tall tree swayed.', 'The tree swayed.', 'Tree swayed the.'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Grammar and Punctuation', lessonTitle: 'Sentence punctuation',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'Which punctuation mark ends a question?', options: ['Full stop', 'Question mark', 'Exclamation mark'], correctOptionIndex: 1 },
      { question: 'Which punctuation mark shows excitement?', options: ['Full stop', 'Question mark', 'Exclamation mark'], correctOptionIndex: 2 },
      { question: 'Every sentence needs a capital letter at the...', options: ['Start', 'End', 'Middle'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which is punctuated correctly? "what is your name"', options: ['What is your name?', 'What is your name.', 'what is your name?'], correctOptionIndex: 0 },
      { question: 'Which mark would you use for "Watch out"?', options: ['Full stop', 'Exclamation mark', 'Comma'], correctOptionIndex: 1 },
      { question: 'A statement usually ends with a...', options: ['Full stop', 'Question mark', 'Nothing'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Grammar and Punctuation', lessonTitle: 'Joining clauses',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'Which word shows a contrast between two ideas?', options: ['and', 'but', 'so'], correctOptionIndex: 1 },
      { question: 'Which word shows a result?', options: ['and', 'but', 'so'], correctOptionIndex: 2 },
      { question: '"I was tired ___ I went to bed" — which word fits?', options: ['and', 'but', 'so'], correctOptionIndex: 2 },
    ],
    exitQuiz: [
      { question: '"I like tea ___ I don’t like coffee" — which word fits?', options: ['and', 'but', 'so'], correctOptionIndex: 1 },
      { question: '"She ran ___ jumped" — which word fits?', options: ['and', 'but', 'so'], correctOptionIndex: 0 },
      { question: 'Which word joins two similar ideas together?', options: ['and', 'but', 'so'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Speaking and Listening', lessonTitle: 'Retelling a story with structure',
    equipmentNote: 'a favourite story to retell aloud',
    starterQuiz: [
      { question: 'A well-structured retelling has a beginning, middle, and...', options: ['End', 'Nothing else', 'Only a title'], correctOptionIndex: 0 },
      { question: 'What should you include at the start of a retelling?', options: ['How the story begins', 'The ending only', 'A random detail'], correctOptionIndex: 0 },
      { question: 'Why is structure important when retelling a story?', options: ['It helps the listener follow along', 'It is not important', 'It makes the story shorter always'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'If you skip the middle of a story, what happens?', options: ['The retelling is incomplete', 'Nothing changes', 'It becomes better'], correctOptionIndex: 0 },
      { question: 'A clear retelling should be told in the correct...', options: ['Order', 'Colour', 'Volume only'], correctOptionIndex: 0 },
      { question: 'What makes a retelling easy to follow?', options: ['Clear structure and order', 'Speaking very fast', 'Mixing up events'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Speaking and Listening', lessonTitle: 'Asking relevant questions',
    equipmentNote: 'a short story or news item to discuss',
    starterQuiz: [
      { question: 'A "relevant" question is one that...', options: ['Relates to what was said', 'Has nothing to do with the topic', 'Is always about lunch'], correctOptionIndex: 0 },
      { question: 'After hearing a story, a relevant question might ask about...', options: ['A character or event in it', 'Something unrelated', 'The weather outside'], correctOptionIndex: 0 },
      { question: 'Why ask questions after listening?', options: ['To understand more', 'To be rude', 'To interrupt'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'After a story about a lost dog, which question is relevant?', options: ['"Where did the dog go?"', '"What is your favourite colour?"', '"What time is it?"'], correctOptionIndex: 0 },
      { question: 'A good listener asks questions that...', options: ['Show they were paying attention', 'Ignore what was said', 'Change the subject completely'], correctOptionIndex: 0 },
      { question: 'What is an irrelevant question?', options: ['One unrelated to the topic', 'One about the topic', 'A polite question'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Poetry and Performance', lessonTitle: 'Reading poems with expression',
    equipmentNote: 'a short poem to read aloud',
    starterQuiz: [
      { question: 'What does "reading with expression" mean?', options: ['Using your voice to show feeling', 'Reading as fast as possible', 'Reading in a monotone'], correctOptionIndex: 0 },
      { question: 'A quiet, gentle poem might be read...', options: ['Softly', 'Very loudly', 'While shouting'], correctOptionIndex: 0 },
      { question: 'What can change how a poem sounds when read aloud?', options: ['Volume and pace', 'The colour of the page', 'Nothing at all'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'An exciting poem about a race might be read...', options: ['With energy and pace', 'Very slowly and flatly', 'Silently'], correctOptionIndex: 0 },
      { question: 'Reading with expression helps the audience...', options: ['Feel the poem’s mood', 'Fall asleep', 'Miss the meaning'], correctOptionIndex: 0 },
      { question: 'Which is a way to add expression when reading?', options: ['Changing your volume', 'Reading without looking up ever', 'Speaking as quietly as possible always'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Poetry and Performance', lessonTitle: 'Noticing rhyme and rhythm',
    equipmentNote: 'a short rhyming poem',
    starterQuiz: [
      { question: 'What is "rhythm" in a poem?', options: ['A regular beat or pattern', 'The title', 'The author’s name'], correctOptionIndex: 0 },
      { question: 'Which pair of words rhymes?', options: ['moon / spoon', 'moon / cat', 'moon / dog'], correctOptionIndex: 0 },
      { question: 'A poem with a steady beat has a clear...', options: ['Rhythm', 'Title', 'Cover'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which pair of words rhymes?', options: ['tree / bee', 'tree / dog', 'tree / cup'], correctOptionIndex: 0 },
      { question: 'Clapping along to a poem’s beat shows its...', options: ['Rhythm', 'Rhyme', 'Punctuation'], correctOptionIndex: 0 },
      { question: 'Rhyming words usually...', options: ['End with the same sound', 'Start with the same letter', 'Mean the same thing'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'English', unitTitle: 'Non-Fiction Writing', lessonTitle: 'Writing lists and labels',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'A list is useful for...', options: ['Organising several items clearly', 'Writing a whole story', 'Confusing the reader'], correctOptionIndex: 0 },
      { question: 'A label tells you...', options: ['What something is', 'A whole story', 'A joke'], correctOptionIndex: 0 },
      { question: 'Which is an example of a list?', options: ['Shopping items written one per line', 'A long paragraph', 'A poem'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Why might you write labels on a diagram?', options: ['To show what each part is', 'To make it colourful', 'To confuse the reader'], correctOptionIndex: 0 },
      { question: 'A good list should be...', options: ['Clear and easy to read', 'Written in one long sentence', 'Impossible to understand'], correctOptionIndex: 0 },
      { question: 'What is the purpose of writing lists and labels?', options: ['To organise information clearly', 'To tell a made-up story', 'To write a poem'], correctOptionIndex: 0 },
    ],
  },
];

import type { ClassCurriculumLessonPhase } from '@/lib/validation';

/** Port of DASHBOARDSPEC.md's plans.py -- everything derivable from the plan is derived rather
 * than invented: objectives come from the class's own curriculum map (Cambridge's wording),
 * prior/next learning are the neighbouring lessons in the same unit, vocabulary/materials come
 * from the unit. Activities come from RULES, a per-subject (regex on the lesson title, template)
 * list -- first match wins -- with PHASE_DEFAULTS as the fallback for practice/review/
 * assessment/project lessons and for any content lesson no rule matches. RULES/PHASE_DEFAULTS
 * below are ported verbatim from the spec; only the language (Python -> TypeScript) changed. */

export interface PlanTemplate {
  intro: string;
  main: string[];
  plenary: string;
  look_for: string;
  resources: string[];
}

/** The part of a title after the colon, else the whole title, lower-cased at the front -- direct
 * port of focus_of(). */
export function focusOf(title: string): string {
  const tail = title.includes(':') ? title.split(':').slice(1).join(':').trim() : title;
  if (!tail) return title;
  return tail[0].toLowerCase() + tail.slice(1);
}

function fill(template: string, focus: string): string {
  return template.replace(/\{focus\}/g, focus);
}

type Rule = [RegExp, PlanTemplate];

export const RULES: Record<string, Rule[]> = {
  english: [
    [
      /handling a book|parts of a book|cover|predict|contents page|favourite book|choosing and sharing|heading|labelled picture/,
      {
        intro: 'Hold up a book. Ask what we can tell about it before we open it.',
        main: [
          'Name the parts of the book together: cover, title, author, blurb, title page.',
          'Model predicting what the book is about from the cover and the pictures.',
          'Learners handle books in pairs and tell each other what they think it is about.',
          'Check the predictions by reading the blurb or the opening page.',
        ],
        plenary: 'Two learners show their book and say what they think happens in it.',
        look_for: 'Naming the parts of a book, and giving a reason for a prediction.',
        resources: ['a set of picture books', 'a big book'],
      },
    ],
    [
      /talking about|who is in|response|what i liked|favourite lines|settings we know|comparing|character|goodies|version|imaginary|real world/,
      {
        intro: 'Re-read the part of the text we are going to talk about.',
        main: [
          "Model saying what you think and giving a reason: 'I think... because...'.",
          'Learners talk in pairs, then feed back to the class.',
          "Collect the class's ideas on the board and group them.",
        ],
        plenary: "Each learner finishes the sentence 'My favourite part was... because...'.",
        look_for: 'Giving a reason, not just an opinion. Listening to the other person.',
        resources: ['the shared text', 'talk partners set up', 'whiteboard'],
      },
    ],
    [
      /signs and labels|instructions|order words|bossy verbs|time words|labelling|poster/,
      {
        intro: 'Look at real signs, labels or instructions from around the school.',
        main: [
          'Read the text together and work out what it is telling us to do.',
          'Draw out the features: the order words, the bossy verbs, the pictures.',
          'Learners follow a short set of instructions in pairs to see if they work.',
          'Learners write or label their own example.',
        ],
        plenary: 'One pair reads their instructions. Can the class follow them?',
        look_for: 'Using order words and starting an instruction with a verb.',
        resources: ['real signs and labels', 'instruction texts', 'materials for the activity'],
      },
    ],
    [
      /analogy|word famil|words that sound alike|sound patterns|rhyming string|consonant cluster|long vowel|phoneme/,
      {
        intro: 'Say a word. Learners call out words that rhyme with it.',
        main: [
          'Build a word family on the board: change the first sound, keep the ending.',
          'Learners build their own word families with letter cards.',
          'Learners read the words they built, then write two of them.',
        ],
        plenary: 'Show a new word. The class works out which family it belongs to.',
        look_for: 'Using a known word to read or spell an unknown one.',
        resources: ['letter cards', 'whiteboards', 'word family charts'],
      },
    ],
    [
      /facts and questions|sorting facts|spider diagram|report sentence|talking like a report|fact book/,
      {
        intro: 'Show a picture of the topic. What do we already know?',
        main: [
          'Read a short information text together and pull out the facts.',
          'Sort the facts into groups with the class.',
          "Model saying a fact as a full sentence: 'A tiger has...'.",
          'Learners record facts in a spider diagram or as sentences.',
        ],
        plenary: 'Each learner tells the class one fact in a full sentence.',
        look_for: 'Telling facts rather than a story, in complete sentences.',
        resources: ['information books', 'spider diagram templates', 'pictures of the topic'],
      },
    ],
    [
      /capital letter|full stop|finger space|joining sentences|checking our writing|editing|does every/,
      {
        intro: 'Show a sentence with the punctuation missing. What is wrong with it?',
        main: [
          'Model fixing the sentence together, saying the rule aloud.',
          'Learners check a short piece of writing in pairs and mark what needs fixing.',
          'Learners go back to their own writing and fix two things.',
        ],
        plenary: 'One learner shows a sentence they improved and says what they changed.',
        look_for: 'Spotting a missing capital letter or full stop without being told.',
        resources: ['sentences to correct', "learners' own writing", 'coloured pencils for editing'],
      },
    ],
    [
      /^phonics and spelling/,
      {
        intro: 'Quick-fire recap of the graphemes taught so far using sound cards.',
        main: [
          "Introduce today's focus: {focus}. Say the sound, show the grapheme, write it together.",
          'Model blending to read and segmenting to spell four example words.',
          'Learners write words on whiteboards as you say them; check each one together.',
          'Learners read the words back inside a short sentence.',
        ],
        plenary: "Dictate one sentence using today's focus. Learners write it, then check it against your model.",
        look_for: 'Who can hear every sound in a word, and who is still missing the middle or final sound.',
        resources: ['sound cards', 'whiteboards and pens', "word cards for today's focus"],
      },
    ],
    [
      /^guided reading/,
      {
        intro: "Book talk: look at the cover and pictures together and set today's reading focus.",
        main: [
          'Learners read their own book at their own pace.',
          'Listen to two or three readers individually, prompting on the focus: {focus}.',
          'Ask each reader a question about what they have just read.',
        ],
        plenary: 'Each learner tells the group one thing about their book.',
        look_for: 'Who reads on sight, who decodes, and who relies on the pictures.',
        resources: ['banded reading books', 'reading records'],
      },
    ],
    [
      /^handwriting/,
      {
        intro: "Finger warm-up, then air-write today's letters large before sitting down.",
        main: [
          'Model the formation on the board, saying the starting point and direction aloud.',
          'Learners practise the letters: in the air, then on whiteboards, then in their books.',
          'Circulate and check pencil grip, paper position and starting points.',
        ],
        plenary: 'Learners choose their own best letter and underline it.',
        look_for: 'Pencil grip, correct starting point, and letters sitting on the line.',
        resources: ['handwriting lines', 'whiteboards', 'pencils'],
      },
    ],
    [
      /shared reading|^what makes|^what is a/,
      {
        intro: 'Show the book. Predict from the cover, title and pictures.',
        main: [
          'Read the text aloud, pausing to think aloud about what is happening.',
          'Re-read a short section together, with the class joining in.',
          "Talk about what we noticed, then collect the class's ideas on the board.",
        ],
        plenary: 'Two learners each say one thing they noticed in the text.',
        look_for: 'Who joins in with the reading and who can answer questions about the text.',
        resources: ['big book or shared text', 'whiteboard'],
      },
    ],
    [
      /retell|story cards|story map|order|story opening|once upon|timeline|beginning, middle/,
      {
        intro: 'Re-read the story together, quickly.',
        main: [
          'Model retelling the story, using story cards or a story map.',
          'Learners sequence the cards in pairs and retell to each other.',
          'Draw out story language: once upon a time, then, at the end.',
        ],
        plenary: 'One pair retells to the class. The class adds anything they missed.',
        look_for: 'Whether the retelling keeps the right order and uses story language.',
        resources: ['story cards', 'the text'],
      },
    ],
    [
      /role play|puppet|hot-seat|acting/,
      {
        intro: 'Recap who is in the story and what happens to them.',
        main: [
          'Model being a character: voice, face, how they move.',
          "Learners work in small groups to act out their part of the story.",
          'Groups swap roles so everyone speaks.',
        ],
        plenary: 'One group performs. The class says what the character was feeling.',
        look_for: 'Who speaks audibly in role and who takes turns.',
        resources: ['puppets or simple props', 'space to act'],
      },
    ],
    [
      /^planning|^plan /,
      {
        intro: 'Remind the class of the texts we have read and what we liked about them.',
        main: [
          'Model planning: talk your own idea aloud while sketching a simple plan.',
          'Learners tell their idea to a partner before drawing or writing anything.',
          'Learners make their own plan, with pictures and a few words.',
        ],
        plenary: 'Three learners tell the class their idea in one sentence.',
        look_for: 'Who has a clear idea they can say out loud before writing.',
        resources: ['planning sheets', 'pencils'],
      },
    ],
    [
      /^writing|write /,
      {
        intro: "Re-read yesterday's writing and remind the class who it is for.",
        main: [
          'Model writing one or two sentences, thinking aloud about sounds, capital letters and full stops.',
          'Learners say their sentence aloud before they write it.',
          'Learners write independently. Support the group who need sounds rehearsing first.',
        ],
        plenary: 'Two learners read a sentence aloud. The class finds the capital letter and the full stop.',
        look_for: 'Sentences that make sense, spaces between words, and a capital letter and full stop.',
        resources: ['writing books', 'sound mats', 'high frequency word lists'],
      },
    ],
    [
      /reading .*aloud|read our|publish|class .*book|performance/,
      {
        intro: 'Remind the class how we listen to each other: looking, still, ready to say one good thing.',
        main: [
          'Learners read their work aloud to a partner.',
          'Partners say one thing they liked and ask one question.',
          "Learners make one improvement based on what their partner said.",
        ],
        plenary: 'Three learners read to the whole class.',
        look_for: 'Reading own writing back accurately, and listening well to others.',
        resources: ["learners' finished work"],
      },
    ],
    [
      /rhym|poem|recit|chant|beat|refrain|couplet/,
      {
        intro: 'Say a rhyme the class already knows, clapping the beat.',
        main: [
          'Read the new rhyme aloud twice; the class joins in on the second reading.',
          'Clap or tap the rhythm together, then find the rhyming words.',
          'Practise reciting it in pairs.',
        ],
        plenary: 'The whole class performs the rhyme together.',
        look_for: 'Who hears rhyme, and who joins in confidently.',
        resources: ['rhyme on the board or a poster', 'percussion for the beat'],
      },
    ],
    [
      /alphabet|dictionar/,
      {
        intro: 'Sing the alphabet song, pointing at the letters.',
        main: [
          'Order letter cards together as a class.',
          'Model finding a word by its first letter in a picture dictionary.',
          'Learners find three given words in pairs.',
        ],
        plenary: 'Ask for a word beginning with a letter you call out.',
        look_for: 'Who knows the alphabet order and who can use a first letter to search.',
        resources: ['letter cards', 'picture dictionaries'],
      },
    ],
  ],
  mathematics: [
    [
      /thinking and working mathematically|convincing|all possibilities/,
      {
        intro: 'Pose the problem and read it together. What is it asking?',
        main: [
          'Learners try the problem practically with equipment.',
          "Ask 'how do you know?' and model convincing a partner.",
          'Learners find more than one answer where there is more than one.',
          'Record the answers and look for what is the same about them.',
        ],
        plenary: "Two learners convince the class that their answer works.",
        look_for: 'Explaining and convincing, and being systematic rather than random.',
        resources: ['counters and cubes', 'problem cards', 'whiteboards'],
      },
    ],
    [
      /numeral|zero|order|compar|more, fewer|teen|estimat|correspond|recognising small|tens and ones|number pattern|two-digit/,
      {
        intro: 'Count together as a class, forwards and backwards.',
        main: [
          "Model today's focus, {focus}, with objects, number cards and a number line.",
          'Learners work practically in pairs with equipment.',
          'Learners record what they did in their books.',
          'Ask learners to explain how they know.',
        ],
        plenary: 'Hold up a numeral. The class shows that many fingers.',
        look_for: 'Matching the numeral to the quantity, and ordering confidently.',
        resources: ['number cards 0-20', 'counters', 'number lines', 'ten frames'],
      },
    ],
    [
      /position|direction|turn|left|right|forwards/,
      {
        intro: 'Play a quick direction game: everyone turn, step forwards, step back.',
        main: [
          'Model the position and direction words with objects and with children.',
          'Learners direct a partner around an obstacle using the words.',
          'Record the route with a drawing and labels.',
        ],
        plenary: 'Give a direction. The class follows it exactly.',
        look_for: 'Correct use of the position and direction words.',
        resources: ['space to move', 'objects to position', 'route mats'],
      },
    ],
    [
      /count|number names|number line|hundred square|odd and even|one more/,
      {
        intro: 'Count together as a class, forwards and backwards, out loud.',
        main: [
          "Model today's focus, {focus}, using counters, a number line and a number track.",
          'Learners work practically in pairs with equipment.',
          'Record what they did in their books.',
          'Challenge: ask learners to explain how they know.',
        ],
        plenary: 'Show a quantity. Learners hold up the matching number card.',
        look_for: 'One-to-one correspondence, and whether the last number said is given as the total.',
        resources: ['counters', 'number cards 0-20', 'number lines', 'hundred square'],
      },
    ],
    [
      /add|subtract|double|halv|number pairs|fact famil|missing number|combin|taking away|difference|total|counting on|counting back|bridging|near double/,
      {
        intro: 'Quick mental warm-up: number bonds the class already knows.',
        main: [
          "Model today's focus, {focus}, with objects first, then with a number sentence.",
          'Learners work practically, then record the matching number sentence.',
          'Learners make up their own example for a partner to solve.',
        ],
        plenary: 'Show a number sentence with a mistake. The class finds and fixes it.',
        look_for: 'Whether learners can move between objects, pictures and number sentences.',
        resources: ['counters and cubes', 'number sentence cards', 'ten frames'],
      },
    ],
    [
      /shape|faces|edges|vertices|roll|stack|symmet|circle|triangle|square|rectangle|sides|corner|cube|sphere|cylinder|cone|model/,
      {
        intro: 'Feely bag: describe a hidden shape by touch and guess it.',
        main: [
          'Name and sort shapes together, drawing out the properties.',
          'Learners sort a set of shapes and say the rule they used.',
          'Learners record their sorting with drawings or by sticking shapes down.',
        ],
        plenary: 'Hold up a shape. The class names it and says one property.',
        look_for: 'Use of the words sides, corners, faces and edges.',
        resources: ['2D and 3D shape sets', 'feely bag', 'sorting hoops'],
      },
    ],
    [
      /length|mass|capacity|measur|heav|full|empty|long|short|tall|non-standard/,
      {
        intro: 'Compare two objects by eye and agree which is longer, heavier or holds more.',
        main: [
          'Model comparing directly, then measuring with a non-standard unit.',
          'Learners measure three objects in pairs and order them.',
          'Record the order using the comparison words.',
        ],
        plenary: 'Order three objects together as a class and say why.',
        look_for: 'Fair comparison, lining objects up at the same starting point.',
        resources: ['cubes and paper clips', 'balance scales', 'containers and water or sand'],
      },
    ],
    [
      /time|clock|days of the week|months|o'clock|yesterday|before, after|how long/,
      {
        intro: 'Say the days of the week together, in order.',
        main: [
          "Model today's focus, {focus}, using a large clock face or a class timeline.",
          'Learners make the times or order the events in pairs.',
          'Record in their books.',
        ],
        plenary: 'Show a time or an event. The class says what comes next.',
        look_for: 'Whether learners can read the hour hand and use before and after.',
        resources: ['geared teaching clock', 'small clock faces', 'day and month cards'],
      },
    ],
    [
      /data|graph|pictogram|venn|carroll|sort|chance|asking a question|lists and simple tables|will it happen|block graph/,
      {
        intro: 'Ask the class question we are going to answer today.',
        main: [
          "Collect the class's answers together on the board.",
          "Model today's focus: {focus}.",
          'Learners make their own chart in pairs.',
          'Ask which group has most and which has least.',
        ],
        plenary: 'Answer the original question from the chart.',
        look_for: 'Reading the chart to answer a question, not just making it.',
        resources: ['squared paper', 'sticky notes', 'sorting hoops'],
      },
    ],
    [
      /fraction|half|equal parts|shar/,
      {
        intro: 'Share a set of objects between two children. Is it fair?',
        main: [
          'Model equal and unequal parts by folding and cutting shapes.',
          'Learners fold, cut and label halves.',
          'Learners find half of a small set of objects.',
        ],
        plenary: 'Show two parts. The class says whether they are halves and why.',
        look_for: 'Understanding that halves must be equal.',
        resources: ['paper shapes to fold', 'counters', 'scissors'],
      },
    ],
  ],
  science: [
    [
      /parts of|looking closely|what each part|senses|the human body|inside|what is everything/,
      {
        intro: 'Show the real thing or a large picture. What can we see?',
        main: [
          'Name the parts together and label them on a big diagram.',
          'Talk about what each part is for.',
          'Learners look closely at their own specimen with a hand lens.',
          'Learners draw and label what they can see.',
        ],
        plenary: 'Point to a part. The class names it and says what it does.',
        look_for: 'Careful looking, correct naming, and labels in the right places.',
        resources: ['real specimens', 'hand lenses', 'large labelled diagram', 'drawing paper'],
      },
    ],
    [
      /what is alive|living|animals|plants|grow|healthy|young|habitat|what .* need/,
      {
        intro: 'Show two things. Which is alive, and how do we know?',
        main: [
          'Build a class list of what living things need to stay alive.',
          'Look at examples together and check them against the list.',
          'Learners sort pictures or objects and explain their thinking.',
          'Record the sorting in books.',
        ],
        plenary: 'Show a tricky example. Where does it go, and why?',
        look_for: 'Reasons based on what living things need, not just on appearance.',
        resources: ['picture cards', 'real plants or specimens', 'sorting hoops'],
      },
    ],
    [
      /material|waterproof|bend|stretch|squash|right material|heat|reusing/,
      {
        intro: 'Pass round objects. What is each one made from?',
        main: [
          'Name the materials together: wood, metal, plastic, glass, fabric.',
          'Describe them using the property words.',
          'Learners test the objects in groups and record what they find.',
          'Talk about why each object is made from that material.',
        ],
        plenary: 'Show an object. The class names the material and one property.',
        look_for: 'Separating the object from the material it is made of.',
        resources: ['collection of everyday objects', 'water and trays', 'recording sheets'],
      },
    ],
    [
      /push|pull|movement|moving|faster|slower|direction|force|ramp|roll/,
      {
        intro: 'Push and pull something together. What happened to it?',
        main: [
          'Model the vocabulary: push, pull, start, stop, faster, slower, change direction.',
          'Learners explore with cars, balls and ramps in groups.',
          'Learners describe what made the object change.',
          'Record findings with drawings and arrows.',
        ],
        plenary: 'Demonstrate a movement. The class says whether it was a push or a pull.',
        look_for: 'Using push and pull correctly to explain what they see.',
        resources: ['toy cars and balls', 'ramps', 'space to move'],
      },
    ],
    [
      /sound|hear|loud|quiet|high|low|instrument|listening/,
      {
        intro: 'Close eyes for thirty seconds. What sounds can we hear?',
        main: [
          'Make sounds together and describe them: loud, quiet, high, low.',
          'Learners make sounds with everyday objects and instruments.',
          'Learners sort the sounds and explain their groups.',
          'Record what they found.',
        ],
        plenary: 'Make a sound behind a screen. The class describes it.',
        look_for: 'Using loud, quiet, high and low accurately.',
        resources: ['percussion instruments', 'everyday objects that make sound', 'screen'],
      },
    ],
    [
      /sky|day and night|sun|weather|earth|rocks|soil|space|shadow/,
      {
        intro: 'Look out of the window. What is the weather doing today?',
        main: [
          'Talk about what we can see in the sky by day and by night.',
          'Build a class chart of what we observe.',
          'Learners record their own observation with drawings and words.',
          'Talk about staying safe in the sun.',
        ],
        plenary: "Add today's observation to the class chart.",
        look_for: 'Regular, careful observation recorded honestly.',
        resources: ['class weather chart', 'pictures of day and night sky', 'recording sheets'],
      },
    ],
    [
      /planting|seeds|making|building/,
      {
        intro: 'Explain what we are making and why.',
        main: [
          'Demonstrate the steps carefully.',
          'Learners carry out the practical work in small groups.',
          'Remind them to handle the equipment and living things carefully.',
          'Set up how we will look after and observe it.',
        ],
        plenary: 'Agree who will check on it and when.',
        look_for: 'Following the steps in order and working safely.',
        resources: ['seeds, pots and compost', 'water', 'labels'],
      },
    ],
    [
      /plan.*test|which |does |investigat|enquir/,
      {
        intro: 'Remind the class of the question we want to answer.',
        main: [
          'Agree together what we will change and what we will keep the same.',
          'Learners predict what they think will happen and why.',
          'Set up the test in groups.',
          'Agree how we will record what we see.',
        ],
        plenary: 'Each group says their prediction and one reason.',
        look_for: 'Whether learners can make a prediction and give a reason for it.',
        resources: ['equipment for the test', 'recording sheets'],
      },
    ],
    [
      /record|observ|watch|result|what our/,
      {
        intro: 'Look back at what we predicted last time.',
        main: [
          'Learners carry out the observation or measurement in groups.',
          'Record results in a simple table, chart or drawing.',
          'Compare results between groups. Are they the same?',
        ],
        plenary: 'Talk about what the results tell us. Was our prediction right?',
        look_for: 'Careful observing and honest recording, even when it is unexpected.',
        resources: ['equipment from the last lesson', 'recording sheets', 'hand lenses'],
      },
    ],
    [
      /sort|group|compar/,
      {
        intro: 'Show two objects. How are they the same and how are they different?',
        main: [
          'Model sorting the collection and saying the rule aloud.',
          'Learners sort the collection their own way in groups.',
          'Each group explains the rule they chose.',
          'Re-sort using a different rule.',
        ],
        plenary: 'Show one object. Which group does it belong in, and why?',
        look_for: 'Whether learners can state the rule they sorted by.',
        resources: ['collection of objects to sort', 'sorting hoops', 'labels'],
      },
    ],
  ],
  'art-design': [
    [
      /comparing|what is a pattern|words for texture|what can i feel|primary colour|lines join|arranging shapes|pattern hunt|brief/,
      {
        intro: 'Quick warm-up in visual journals.',
        main: [
          'Introduce the idea and the vocabulary that goes with it.',
          'Learners explore it practically: looking, touching, arranging or mixing.',
          'Learners describe what they notice using the language of art.',
          'Record the ideas in visual journals.',
        ],
        plenary: 'Each learner shows their journal page and names one thing they found out.',
        look_for: "Use of the unit's vocabulary and willingness to experiment.",
        resources: ['visual journals', 'materials for the exploration', 'pencils and colour'],
      },
    ],
    [
      /texture tree|class .*tree|building a/,
      {
        intro: 'Show what the class is building together and where it will go.',
        main: ['Recap the technique the piece needs.', 'Learners make their part of the piece.', 'Assemble it together, deciding as a class where things go.'],
        plenary: 'Stand back and look at it. What works well?',
        look_for: 'Contributing to a shared outcome and making choices.',
        resources: ['large paper or board', "the unit's media", 'glue and scissors'],
      },
    ],
    [
      /look|artist|designer|ceramics|trick the eye|patterns from/,
      {
        intro: 'Warm-up drawing in visual journals to loosen up hands.',
        main: [
          'Show and discuss the images together, using the questions to prompt talk.',
          'Learners describe what they can see using the language of art.',
          'Learners sketch or note the ideas they like best in their visual journals.',
        ],
        plenary: 'Each learner shows the journal page and says which work inspired them.',
        look_for: 'Use of art vocabulary and willingness to say what they think.',
        resources: ['images to display', 'visual journals', 'pencils'],
      },
    ],
    [
      /experiment|making|paint|print|clay|weav|decoupage|rubbing|collage|cape|drawing|mixing/,
      {
        intro: 'Recap the technique and remind the class of safe, tidy working.',
        main: [
          'Demonstrate the technique step by step.',
          'Learners work on the piece, choosing their own media.',
          'Circulate, encourage experiment, and suggest alternatives.',
          'Learners store developmental work in their visual journals.',
        ],
        plenary: 'Learners look at each other\'s work and name one thing they might try next time.',
        look_for: 'Growing independence in choosing and handling media.',
        resources: ['media and tools for the technique', 'visual journals', 'covers for tables'],
      },
    ],
    [
      /exhibition|celebrat|display|performance|review/,
      {
        intro: 'Set up the work together so everyone can see it.',
        main: [
          'Learners walk round and look at all the work.',
          "Each learner says one positive thing about someone else's piece.",
          'Learners write or say one thing they did well and one to improve.',
        ],
        plenary: "Photograph the display for everyone's visual journal.",
        look_for: "Giving specific, kind feedback rather than just 'I like it'.",
        resources: ['display space', 'camera', 'visual journals'],
      },
    ],
  ],
  'global-perspectives': [
    [
      /source|finding out|books and pictures|choosing a source|most useful/,
      {
        intro: 'Show two sources about the issue. Which will help us more?',
        main: [
          'Look at the sources together and talk about what each one tells us.',
          'Learners choose the source they think helps most and say why.',
          'Learners find one piece of information in their chosen source.',
        ],
        plenary: 'Each learner says which source they chose and gives a reason.',
        look_for: 'Giving a reason for the choice, not just picking one.',
        resources: ['two or three simple sources', 'pictures and short texts'],
      },
    ],
    [
      /what happens when|how our actions|consequence|affect/,
      {
        intro: "Tell a short story about someone's choice and what happened next.",
        main: [
          'Talk about what happened because of that choice.',
          'Learners think of a choice they make and what happens because of it.',
          "Collect the class's ideas as a simple cause-and-effect display.",
        ],
        plenary: "Each learner finishes 'If I..., then...'.",
        look_for: 'Connecting an action to what follows from it.',
        resources: ['story or scenario cards', 'large sheet for the display'],
      },
    ],
    [
      /choosing an action|choosing a way|solution|reminder|what could we do/,
      {
        intro: 'Remind the class what we found out about the issue.',
        main: [
          'Offer three or four possible actions the class could take.',
          'Learners talk in pairs about which they would choose and why.',
          'Vote as a class and agree on one action.',
          'Plan how we will do it.',
        ],
        plenary: "Say the class's chosen action out loud together.",
        look_for: 'Choosing from the options given and giving a reason.',
        resources: ['action cards', 'voting chart'],
      },
    ],
    [
      /what do we know|what do we already/,
      {
        intro: 'Introduce the issue with a picture or a short story.',
        main: ['Learners say one thing they already know about it.', "Collect everything the class says on a big sheet.", 'Group the ideas together with the class.'],
        plenary: "Read back the class's list. What do we still want to find out?",
        look_for: 'Whether each learner can say something they know about the issue.',
        resources: ['stimulus picture or story', 'large sheet of paper'],
      },
    ],
    [
      /asking question|question/,
      {
        intro: 'Recap what we already know about the issue.',
        main: ['Model asking a question about the issue.', 'Learners think of their own question and say it to a partner.', 'Collect the questions and choose a few to investigate.'],
        plenary: "Read the class's questions back and choose the best ones together.",
        look_for: 'Asking a question, rather than making a statement.',
        resources: ['question prompt cards', 'large sheet of paper'],
      },
    ],
    [
      /survey|counting|investigat/,
      {
        intro: 'Agree what we are going to find out and how we will ask.',
        main: ['Practise asking the question politely, in pairs.', 'Carry out the survey around the class or the school.', 'Bring the answers back and put them together.'],
        plenary: 'How many answers did we collect? What did most people say?',
        look_for: 'Taking part and asking the question clearly.',
        resources: ['tally sheets', 'clipboards'],
      },
    ],
    [
      /record|pictogram|chart|graphic organiser/,
      {
        intro: 'Look at the information we collected.',
        main: ['Model recording it as a pictogram or graphic organiser.', 'Learners make their own with support.', 'Talk about what the record shows.'],
        plenary: 'What does our pictogram tell us about the issue?',
        look_for: 'Talking about the information, not just making the picture.',
        resources: ['pictogram templates', 'stickers or squares', 'glue'],
      },
    ],
    [
      /working together|team|model|poster|display|plan/,
      {
        intro: 'Agree what the team is making and who is doing what.',
        main: ['Learners work in their teams on the shared outcome.', 'Remind them to share the resources and take turns.', 'Check in with each team and help them solve problems.'],
        plenary: 'Each team shows what they have done so far.',
        look_for: 'Working positively with others and sharing resources.',
        resources: ['materials for the shared outcome', 'glue and scissors'],
      },
    ],
    [
      /telling|presenting|answering|listening/,
      {
        intro: 'Remind the class how we listen: looking, quiet, ready with a question.',
        main: ['Each group presents their work to the class.', 'The class asks one simple question after each presentation.', 'Groups answer using what they found out.'],
        plenary: 'What was the most interesting thing we heard today?',
        look_for: 'Answering with relevant information, and asking simple questions.',
        resources: ["the groups' finished work"],
      },
    ],
    [
      /what i did|what someone|looking back|opinion|my opinion/,
      {
        intro: 'Look back at the work the class has done in this challenge.',
        main: ['Learners say one thing they did to help the team.', 'Learners say one thing someone else did that helped.', 'Learners say what they liked best about the challenge.'],
        plenary: "Collect the class's reflections on a shared sheet.",
        look_for: "Naming a specific action rather than a general 'I helped'.",
        resources: ['reflection prompt cards'],
      },
    ],
  ],
  computing: [
    [
      /internet|equipment|looking after|same and .*different|adding a picture/,
      {
        intro: 'Ask what the class already knows about this.',
        main: ['Introduce the idea with a demonstration or a discussion.', 'Learners try it themselves, in pairs where devices are shared.', 'Draw out the rule or the skill together.'],
        plenary: 'Each pair says one thing they learned.',
        look_for: 'Confidence with the skill and care with the equipment.',
        resources: ['computers or tablets', 'discussion prompts'],
      },
    ],
    [
      /algorithm|instruction|steps|order|pattern|spotting|breaking/,
      {
        intro: 'Play a quick follow-my-instructions game as a class.',
        main: [
          'Model giving a clear set of instructions in the right order.',
          'Learners give instructions to a partner, who follows them exactly.',
          'Talk about what happens when an instruction is missing or in the wrong order.',
          'Learners record their instructions as pictures or words.',
        ],
        plenary: "Follow one pair's instructions exactly. Do they work?",
        look_for: 'Instructions that are clear, in order, and complete.',
        resources: ['instruction cards', 'floor mat or route', 'paper'],
      },
    ],
    [
      /robot|program|coding|move|turn|route/,
      {
        intro: 'Recap the commands we know and what each one does.',
        main: [
          'Model programming a short sequence and predicting what will happen.',
          'Learners plan their route on paper before pressing any buttons.',
          'Learners program, test and correct in pairs.',
          'Ask what they changed when it did not work.',
        ],
        plenary: "One pair demonstrates their program to the class.",
        look_for: 'Predicting before running, and debugging rather than starting over.',
        resources: ['floor robots or block-coding app', 'route mats', 'planning paper'],
      },
    ],
    [
      /safe|online|private|kind|screen/,
      {
        intro: 'Talk about the technology we use at home and at school.',
        main: [
          'Share a simple scenario and ask the class what they would do.',
          'Draw out who they could ask for help.',
          'Learners draw or write their own rule for staying safe.',
        ],
        plenary: 'Agree three class rules and put them on the wall.',
        look_for: 'Knowing what is private and who to tell if something worries them.',
        resources: ['scenario cards', 'paper for class rules'],
      },
    ],
    [
      /data|sort|collect|chart/,
      {
        intro: 'Ask the question the class is going to answer.',
        main: ['Sort the objects or answers together as a class.', 'Learners collect answers from each other.', 'Model making a simple chart on screen and learners have a turn.'],
        plenary: 'Read the chart together. Which group has most?',
        look_for: 'Sorting by a rule and reading the chart back.',
        resources: ['objects to sort', 'computers or tablets', 'charting software'],
      },
    ],
    [
      /computer|mouse|keyboard|paint|typing|saving|digital/,
      {
        intro: 'Name the parts of the computer together.',
        main: [
          'Demonstrate the skill on the big screen.',
          'Learners practise at their own device.',
          'Support learners who are new to the mouse or keyboard.',
          'Remind them how to save and find their work.',
        ],
        plenary: 'Learners show a partner what they made.',
        look_for: 'Confidence with the mouse or trackpad, and saving work.',
        resources: ['computers or tablets', 'headphones if needed'],
      },
    ],
  ],
};

export const PHASE_DEFAULTS: Record<ClassCurriculumLessonPhase, PlanTemplate> = {
  practice: {
    intro: 'Recap the key idea from the last lesson in this unit.',
    main: ['Work through two worked examples together.', 'Learners practise independently while you support a focus group.', 'Learners who finish early explain their method to a partner.'],
    plenary: 'Go over one question the class found hardest.',
    look_for: 'Who works independently and who still needs the equipment.',
    resources: ['practice sheets', "the unit's equipment"],
  },
  review: {
    intro: 'Ask the class what they remember from this unit.',
    main: [
      'Revisit the two ideas the class found hardest.',
      'Learners work through a mixed set of tasks from across the unit.',
      'Pair learners who are secure with those who are not.',
    ],
    plenary: 'Each learner says one thing they can now do that they could not at the start.',
    look_for: 'Which objectives still need revisiting before moving on.',
    resources: ['work from earlier in the unit', 'mixed task cards'],
  },
  assessment: {
    intro: 'Explain that today is a chance to show what everyone has learned.',
    main: [
      'Learners work through the end-of-unit tasks independently.',
      'Observe rather than help; note who is secure on each objective.',
      'Read questions aloud for learners who need it.',
    ],
    plenary: 'Mark together and celebrate what the class can now do.',
    look_for: 'Evidence against each objective in this unit, recorded for your records.',
    resources: ['end-of-unit tasks', 'class record sheet'],
  },
  project: {
    intro: 'Remind the class of what we are making and why.',
    main: ['Recap the technique or skill the project needs.', 'Learners work on their piece, making their own choices.', 'Circulate, encourage, and help teams solve problems.'],
    plenary: 'Look at the work so far and agree what comes next.',
    look_for: 'Independence, and working well with others.',
    resources: ['project materials', 'space to work'],
  },
  content: {
    intro: 'Recap what the class already knows about this.',
    main: ["Introduce today's focus, {focus}, modelling it clearly.", 'Learners try it with support, then on their own.', 'Draw out the key vocabulary as the class works.'],
    plenary: 'Ask the class what they have learned. Check the key idea together.',
    look_for: 'Who has grasped the new idea and who needs it again tomorrow.',
    resources: ["the unit's equipment"],
  },
};

export interface DerivedPlan {
  focus: string;
  intro: string;
  main: string[];
  plenary: string;
  look_for: string;
  resources: string[];
}

/** Direct port of plan_for()'s rule lookup + fill, returning just the derived teaching content
 * (the caller already has title/date/objectives/prior/next from the schedule and curriculum
 * map). subjectSlug should be the class-curriculum file's `short` field, lower-cased and
 * hyphenated to match RULES' keys (e.g. "Art & Design" -> "art-design"; see slugifySubject). */
export function planFor(title: string, phase: ClassCurriculumLessonPhase, subjectSlug: string): DerivedPlan {
  const low = title.toLowerCase();
  let tpl: PlanTemplate | undefined;
  for (const [pattern, t] of RULES[subjectSlug] ?? []) {
    if (pattern.test(low)) {
      tpl = t;
      break;
    }
  }
  if (!tpl) tpl = PHASE_DEFAULTS[phase] ?? PHASE_DEFAULTS.content;

  const focus = focusOf(title);
  return {
    focus,
    intro: fill(tpl.intro, focus),
    main: tpl.main.map((m) => fill(m, focus)),
    plenary: fill(tpl.plenary, focus),
    look_for: tpl.look_for,
    resources: tpl.resources,
  };
}

/** "Art & Design" -> "art-design", "Global Perspectives" -> "global-perspectives" -- matches
 * RULES' keys, which are exactly the six Primary 1 subject slugs. */
export function slugifySubject(short: string): string {
  return short
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

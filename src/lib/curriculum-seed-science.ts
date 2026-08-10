import type { SampleTermSeed } from './curriculum-seed-types';

/** Draft first-term Science content for Primary 1–6, organised around the Cambridge Primary
 * Science curriculum framework's stage-by-stage progression through Biology, Chemistry, Physics,
 * and Earth & Space, alongside Scientific Enquiry skills at every stage. Original lesson-plan
 * writing informed by the publicly known structure of that framework, not a reproduction of
 * Cambridge's own copyrighted materials — see curriculum-seed.ts for the full explanation of why
 * every one of these is explicitly a draft.
 */
export const SCIENCE_TERMS: SampleTermSeed[] = [
  {
    className: 'Primary 1',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 1 (draft)',
    units: [
      {
        title: 'Ourselves and Other Animals',
        description: 'A first look at the human body and the animal world.',
        lessons: [
          { title: 'Naming body parts', objectives: 'Name the external parts of the human body.' },
          { title: 'Naming common animals', objectives: 'Identify and name common animals, including pets and farm animals.' },
          { title: 'Grouping animals', objectives: 'Sort animals into simple groups based on an observable feature, such as number of legs.' },
        ],
      },
      {
        title: 'Plants Around Us',
        description: 'Observing plants in the school garden and beyond.',
        lessons: [
          { title: 'Naming parts of a plant', objectives: 'Name the main parts of a flowering plant: roots, stem, leaves, and flower.' },
          { title: 'How plants grow and change', objectives: 'Observe and describe how a plant grows and changes over time.' },
        ],
      },
      {
        title: 'Everyday Materials',
        description: 'Naming and sorting the materials things are made from.',
        lessons: [
          { title: 'Naming common materials', objectives: 'Identify and name everyday materials: wood, plastic, metal, glass, and fabric.' },
          { title: 'Sorting materials by properties', objectives: 'Sort materials by a simple property, such as hard/soft or shiny/dull.' },
        ],
      },
      {
        title: 'Light and Dark',
        description: 'Noticing where light comes from.',
        lessons: [
          { title: 'Where light comes from', objectives: 'Recognise that light comes from sources such as the sun, lamps, and torches.' },
          { title: 'Light and dark places', objectives: 'Identify light and dark places and explain why some places are darker than others.' },
        ],
      },
      {
        title: 'Forces',
        description: 'A first, hands-on introduction to pushes and pulls.',
        lessons: [
          { title: 'Pushing and pulling', objectives: 'Explore how pushing and pulling can make an object start moving, stop, speed up, or change direction.' },
        ],
      },
      {
        title: 'The Weather and Seasons',
        description: 'Noticing and describing change in the world outside.',
        lessons: [
          { title: 'Observing daily weather', objectives: 'Observe and describe the daily weather using simple scientific vocabulary.' },
          { title: 'The four seasons', objectives: 'Name the four seasons and describe how the weather changes between them.' },
        ],
      },
      {
        title: 'Exploring and Investigating',
        description: 'Building the habits of a young scientist.',
        lessons: [
          { title: 'Asking questions and observing', objectives: 'Ask simple scientific questions and make careful observations to help answer them.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 2',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 2 (draft)',
    units: [
      {
        title: 'Growing Up',
        description: 'How humans grow and stay healthy.',
        lessons: [
          { title: 'Human life stages', objectives: 'Describe the basic stages of human life: baby, child, and adult.' },
          { title: 'Keeping healthy', objectives: 'Explain how food, exercise, and hygiene help keep the human body healthy.' },
        ],
      },
      {
        title: 'Habitats',
        description: 'Matching living things to the places they live.',
        lessons: [
          { title: 'Features of habitats', objectives: 'Identify the features of a habitat, such as a pond, garden, or forest.' },
          { title: 'Matching living things to habitats', objectives: 'Match living things to the habitat that best suits their needs.' },
        ],
      },
      {
        title: 'Material Properties',
        description: 'Comparing and changing everyday materials.',
        lessons: [
          { title: 'Comparing materials by properties', objectives: 'Compare materials using properties such as hard/soft, rough/smooth, and waterproof/absorbent.' },
          { title: 'Changing the shape of materials', objectives: 'Explore how some materials can be squashed, bent, twisted, or stretched.' },
        ],
      },
      {
        title: 'Pushes and Pulls',
        description: 'Extending force ideas from Stage 1.',
        lessons: [
          { title: 'How forces change motion', objectives: 'Explore how forces make objects start, stop, speed up, slow down, or change direction.' },
        ],
      },
      {
        title: 'Light and Shadow',
        description: 'How shadows are made and how they change.',
        lessons: [
          { title: 'How shadows are formed', objectives: 'Explain that a shadow forms when an object blocks light.' },
          { title: 'How shadows change', objectives: 'Observe how the size and position of a shadow changes during the day.' },
        ],
      },
      {
        title: 'Introducing Earth and Space',
        description: 'A first look upward.',
        lessons: [
          { title: 'The sun, moon and stars', objectives: 'Describe simple observations of the sun, moon, and stars.' },
          { title: 'Day and night', objectives: 'Explain, in simple terms, why we have day and night.' },
        ],
      },
      {
        title: 'Scientific Enquiry',
        description: 'Recording results for the first time.',
        lessons: [
          { title: 'Predicting and recording', objectives: 'Make a simple prediction and record results in a table.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 3',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 3 (draft)',
    units: [
      {
        title: 'Humans and Animals',
        description: 'Looking inside the body and at what animals eat.',
        lessons: [
          { title: 'The human skeleton and muscles', objectives: 'Describe the basic role of the human skeleton and muscles in support and movement.' },
          { title: 'Food chains', objectives: 'Construct a simple food chain showing what different animals eat.' },
        ],
      },
      {
        title: 'Plants and Their Environment',
        description: 'How plants function and reproduce.',
        lessons: [
          { title: 'Functions of plant parts', objectives: 'Explain the function of roots, stem, leaves, and flowers in a plant.' },
          { title: 'How plants make and use food', objectives: 'Describe, in simple terms, how plants use light to make their own food.' },
          { title: 'Life cycles of flowering plants', objectives: 'Describe the life cycle of a flowering plant from seed to seed.' },
        ],
      },
      {
        title: 'Rocks and Soils',
        description: 'What the ground beneath us is made of.',
        lessons: [
          { title: 'Grouping rocks and soils', objectives: 'Describe and group different rocks and soils by their observable properties.' },
          { title: 'How fossils form', objectives: 'Describe, in simple terms, how a fossil can form.' },
        ],
      },
      {
        title: 'States of Matter',
        description: 'Solids, liquids and gases, and how heat changes them.',
        lessons: [
          { title: 'Solids, liquids and gases', objectives: 'Group materials as solids, liquids, or gases based on their properties.' },
          { title: 'Changes caused by heating and cooling', objectives: 'Describe how heating and cooling can change a material from one state to another.' },
        ],
      },
      {
        title: 'Forces and Magnets',
        description: 'A first look at magnetism.',
        lessons: [
          { title: 'Magnetic and non-magnetic materials', objectives: 'Sort materials into magnetic and non-magnetic through testing.' },
          { title: 'How magnets attract and repel', objectives: 'Describe how two magnets can attract or repel each other.' },
        ],
      },
      {
        title: 'Light',
        description: 'How we see, and how light bounces.',
        lessons: [
          { title: 'How light travels and how we see', objectives: 'Explain, in simple terms, that we see objects because light travels from them to our eyes.' },
          { title: 'Reflective surfaces', objectives: 'Identify surfaces that reflect light well and explore how this is useful.' },
        ],
      },
      {
        title: 'Scientific Enquiry',
        description: 'Planning and concluding a fair test.',
        lessons: [
          { title: 'Planning a fair test', objectives: 'Plan a simple fair test, identifying what to change and what to keep the same.' },
          { title: 'Drawing conclusions', objectives: 'Draw a simple conclusion from the results of an investigation.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 4',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 4 (draft)',
    units: [
      {
        title: 'Living Things and Their Habitats',
        description: 'Classifying living things and understanding environmental change.',
        lessons: [
          { title: 'Classifying living things', objectives: 'Group living things using simple classification keys.' },
          { title: 'How environments change', objectives: 'Describe how a change in a habitat can affect the living things within it.' },
        ],
      },
      {
        title: 'Digestion and Teeth',
        description: 'What happens to food inside the body.',
        lessons: [
          { title: 'The human digestive system', objectives: 'Describe the simple journey of food through the human digestive system.' },
          { title: 'Types and functions of teeth', objectives: 'Identify the different types of human teeth and describe their function.' },
        ],
      },
      {
        title: 'States of Matter and the Water Cycle',
        description: 'Linking states of matter to a familiar natural cycle.',
        lessons: [
          { title: 'Evaporation and condensation', objectives: 'Describe evaporation and condensation using everyday examples.' },
          { title: 'The water cycle', objectives: 'Describe the water cycle using the terms evaporation, condensation, and precipitation.' },
        ],
      },
      {
        title: 'Electricity',
        description: 'Building simple working circuits.',
        lessons: [
          { title: 'Simple circuits', objectives: 'Construct a simple series circuit that lights a bulb or turns a buzzer on.' },
          { title: 'Conductors and insulators', objectives: 'Investigate which materials are electrical conductors and which are insulators.' },
        ],
      },
      {
        title: 'Sound',
        description: 'How sound is made, travels, and changes.',
        lessons: [
          { title: 'How sound is made and travels', objectives: 'Describe how sounds are made by vibrations and travel to our ears.' },
          { title: 'Pitch and volume', objectives: 'Investigate how the pitch and volume of a sound can be changed.' },
        ],
      },
      {
        title: 'Earth, Sun and Moon',
        description: 'A first explanation of day, night, and the seasons.',
        lessons: [
          { title: 'Movement of the Earth and Moon', objectives: 'Describe the movement of the Earth around the Sun and the Moon around the Earth.' },
          { title: 'Explaining day, night and seasons', objectives: "Use the Earth's movement to explain day and night and the changing seasons." },
        ],
      },
      {
        title: 'Scientific Enquiry',
        description: 'Communicating findings clearly.',
        lessons: [
          { title: 'Using scientific vocabulary', objectives: 'Use accurate scientific vocabulary to explain observations and results.' },
          { title: 'Presenting data in bar charts', objectives: 'Present the results of an investigation in a labelled bar chart.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 5',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 5 (draft)',
    units: [
      {
        title: 'Human Body Systems',
        description: 'The circulatory system and the effects of exercise.',
        lessons: [
          { title: 'The circulatory system', objectives: 'Describe the basic structure and function of the heart, blood, and blood vessels.' },
          { title: 'Effects of exercise on the body', objectives: 'Describe how exercise affects heart rate and breathing rate, and explain why.' },
        ],
      },
      {
        title: 'Life Cycles and Reproduction',
        description: 'Comparing life cycles across different living things.',
        lessons: [
          { title: 'Human, animal and plant life cycles', objectives: 'Compare the life cycles of a human, an animal, and a flowering plant.' },
          { title: 'Reproduction in flowering plants', objectives: 'Describe pollination, fertilisation, and seed dispersal in flowering plants.' },
        ],
      },
      {
        title: 'Properties and Changes of Materials',
        description: 'Distinguishing reversible from irreversible change.',
        lessons: [
          { title: 'Reversible and irreversible changes', objectives: 'Give examples of reversible and irreversible changes to materials, and explain the difference.' },
          { title: 'Dissolving and separating mixtures', objectives: 'Investigate dissolving, and describe simple ways to separate mixtures.' },
        ],
      },
      {
        title: 'Forces',
        description: 'A wider set of everyday forces.',
        lessons: [
          { title: 'Gravity', objectives: 'Explain, in simple terms, that gravity pulls objects toward the Earth.' },
          { title: 'Air resistance, water resistance and friction', objectives: 'Investigate how air resistance, water resistance, and friction affect moving objects.' },
        ],
      },
      {
        title: 'Earth and Space',
        description: 'Our place in the solar system.',
        lessons: [
          { title: 'The solar system', objectives: 'Name and order the planets of the solar system in relation to the Sun.' },
          { title: 'Movement of the planets', objectives: 'Describe, in simple terms, how planets move around the Sun.' },
        ],
      },
      {
        title: 'Living Things and Classification',
        description: 'Using keys, and a first look at micro-organisms.',
        lessons: [
          { title: 'Classifying with a key', objectives: 'Use a classification key to identify and group living things.' },
          { title: 'Micro-organisms', objectives: 'Describe, in simple terms, that micro-organisms are living things too small to see with the naked eye.' },
        ],
      },
      {
        title: 'Scientific Enquiry',
        description: 'Thinking critically about an investigation.',
        lessons: [
          { title: 'Identifying variables', objectives: 'Identify the variable being changed, measured, and kept the same in an investigation.' },
          { title: 'Evaluating reliability', objectives: 'Discuss how reliable the results of an investigation are, and how it could be improved.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 6',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Science, Stage 6 (draft)',
    units: [
      {
        title: 'Human Body Systems',
        description: 'How body systems work together, and healthy choices.',
        lessons: [
          { title: 'Circulatory and respiratory systems together', objectives: 'Describe how the circulatory and respiratory systems work together to supply the body with oxygen.' },
          { title: 'Healthy lifestyle choices', objectives: 'Explain how diet, exercise, and lifestyle choices affect long-term health.' },
        ],
      },
      {
        title: 'Evolution and Inheritance',
        description: 'How living things change over generations.',
        lessons: [
          { title: 'How living things have changed over time', objectives: 'Describe, in simple terms, how living things have changed over long periods of time.' },
          { title: 'Inherited characteristics', objectives: 'Give examples of characteristics that are inherited from parents to offspring.' },
        ],
      },
      {
        title: 'Chemical and Physical Changes',
        description: 'Reactions, mixtures, and a first look at acids and alkalis.',
        lessons: [
          { title: 'Chemical reactions', objectives: 'Recognise signs that a chemical reaction has taken place, such as gas production or a colour change.' },
          { title: 'Mixtures and solutions', objectives: 'Distinguish between a mixture and a solution, and describe how to separate each.' },
          { title: 'Acids and alkalis', objectives: 'Use an indicator to test whether everyday substances are acidic or alkaline.' },
        ],
      },
      {
        title: 'Electricity',
        description: 'Extending circuits to series and parallel.',
        lessons: [
          { title: 'Series and parallel circuits', objectives: 'Compare how bulbs behave in a series circuit and a parallel circuit.' },
          { title: 'Changing the brightness of bulbs', objectives: 'Investigate how the number and arrangement of components changes the brightness of bulbs in a circuit.' },
        ],
      },
      {
        title: 'Light',
        description: 'Light travel and shadow size, revisited in more depth.',
        lessons: [
          { title: 'Light travels in straight lines', objectives: 'Use the idea that light travels in straight lines to explain how shadows form.' },
          { title: 'How shadows change size', objectives: 'Investigate how moving a light source changes the size and sharpness of a shadow.' },
        ],
      },
      {
        title: 'Earth and Space',
        description: 'Beyond the solar system, and shadow length across the year.',
        lessons: [
          { title: 'The solar system and beyond', objectives: 'Describe the solar system in the context of the wider universe of stars and galaxies.' },
          { title: 'Day length and shadows across the year', objectives: "Explain how day length and shadow length change across the year due to the Earth's tilt." },
        ],
      },
      {
        title: 'Scientific Enquiry',
        description: 'A full, independent investigation before moving to secondary school.',
        lessons: [
          { title: 'Designing a full investigation', objectives: 'Design a scientific investigation from a question, including method and equipment.' },
          { title: 'Concluding and asking further questions', objectives: 'Draw a conclusion from an investigation and suggest a further question it raises.' },
        ],
      },
    ],
  },
];

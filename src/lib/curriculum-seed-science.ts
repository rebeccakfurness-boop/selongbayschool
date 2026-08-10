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

  // Secondary 6–10: see the equivalent note in curriculum-seed-mathematics.ts for the assumed
  // Secondary-number-to-Cambridge-stage mapping this continues. Kept as a single combined "Science"
  // subject through Secondary 8, then organised as IGCSE Combined/Coordinated Science strands for
  // Secondary 9–10, matching how the primary and lower-secondary strands were already structured.
  {
    className: 'Secondary 6',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary Science, Stage 7 (draft)',
    units: [
      {
        title: 'Biology: Cells and Organisation',
        description: 'The building blocks of living things, from cell to organism.',
        lessons: [
          { title: 'Animal and plant cells', objectives: 'Identify and label the main structures of animal and plant cells and state their functions.' },
          { title: 'Cells, tissues, organs and systems', objectives: 'Explain how cells are organised into tissues, organs, and organ systems.' },
        ],
      },
      {
        title: 'Biology: Reproduction in Plants',
        description: 'Flower structure and how plants reproduce.',
        lessons: [
          { title: 'Flower structure', objectives: 'Label the parts of a flower and describe the function of each.' },
          { title: 'Pollination and seed dispersal', objectives: 'Describe the process of pollination and explain methods of seed dispersal.' },
        ],
      },
      {
        title: 'Chemistry: States of Matter and the Particle Model',
        description: 'Using the particle model to explain everyday observations.',
        lessons: [
          { title: 'The particle model', objectives: 'Use the particle model to explain the properties of solids, liquids, and gases.' },
          { title: 'Changes of state', objectives: 'Explain melting, freezing, evaporation, and condensation in terms of particle behaviour and energy.' },
        ],
      },
      {
        title: 'Chemistry: Elements, Compounds and Mixtures',
        description: 'Distinguishing pure substances from mixtures.',
        lessons: [
          { title: 'Elements and the periodic table', objectives: 'Explain what an element is and describe the basic layout of the periodic table.' },
          { title: 'Compounds and mixtures', objectives: 'Distinguish compounds from mixtures and describe simple methods for separating mixtures.' },
        ],
      },
      {
        title: 'Physics: Forces and Motion',
        description: 'Describing and measuring forces.',
        lessons: [
          { title: 'Identifying forces', objectives: 'Identify the forces acting in a given situation and represent them with force arrows.' },
          { title: 'Balanced and unbalanced forces', objectives: 'Explain the effect of balanced and unbalanced forces on the motion of an object.' },
        ],
      },
      {
        title: 'Physics: Energy',
        description: 'Energy stores and transfers in everyday situations.',
        lessons: [
          { title: 'Energy stores and transfers', objectives: 'Identify the energy stores involved in a given situation and describe how energy is transferred between them.' },
          { title: 'Energy resources', objectives: 'Classify energy resources as renewable or non-renewable and evaluate their advantages and disadvantages.' },
        ],
      },
      {
        title: 'Scientific Enquiry and Investigation Skills',
        description: 'Planning and carrying out a fair test with confidence.',
        lessons: [
          { title: 'Planning a fair test', objectives: 'Identify variables to control, change, and measure when planning a fair test.' },
          { title: 'Presenting and evaluating results', objectives: 'Present results in an appropriate table and graph, and evaluate the reliability of an investigation.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 7',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary Science, Stage 8 (draft)',
    units: [
      {
        title: 'Biology: Nutrition and Digestion',
        description: 'How the body obtains and processes nutrients.',
        lessons: [
          { title: 'Nutrients and a balanced diet', objectives: 'Name the main nutrient groups and explain what makes a diet balanced.' },
          { title: 'The digestive system', objectives: 'Describe the journey of food through the digestive system and the role of each main organ.' },
        ],
      },
      {
        title: 'Biology: Respiration and Gas Exchange',
        description: 'Breathing, gas exchange, and respiration distinguished.',
        lessons: [
          { title: 'The breathing system', objectives: 'Describe the structure of the breathing system and the mechanism of breathing in and out.' },
          { title: 'Aerobic respiration', objectives: 'Write a word equation for aerobic respiration and explain why organisms need it.' },
        ],
      },
      {
        title: 'Chemistry: Atoms, Elements and the Periodic Table',
        description: 'A first formal look at atomic structure.',
        lessons: [
          { title: 'Atomic structure', objectives: 'Describe the basic structure of an atom, including protons, neutrons, and electrons.' },
          { title: 'Groups and periods', objectives: 'Explain how elements are arranged into groups and periods in the periodic table and what this shows about their properties.' },
        ],
      },
      {
        title: 'Chemistry: Chemical Reactions',
        description: 'Recognising and representing chemical change.',
        lessons: [
          { title: 'Signs of a chemical reaction', objectives: 'Identify the signs that a chemical reaction has taken place, such as gas production or a temperature change.' },
          { title: 'Word equations', objectives: 'Write word equations for simple chemical reactions, including combustion.' },
        ],
      },
      {
        title: 'Physics: Electricity and Magnetism',
        description: 'Circuits, current, and magnetic fields.',
        lessons: [
          { title: 'Series and parallel circuits', objectives: 'Draw and construct series and parallel circuits using standard circuit symbols.' },
          { title: 'Magnets and magnetic fields', objectives: 'Describe the pattern of a magnetic field around a bar magnet and predict how two magnets will interact.' },
        ],
      },
      {
        title: 'Physics: Waves — Sound and Light',
        description: 'How sound and light travel and behave.',
        lessons: [
          { title: 'How sound travels', objectives: 'Explain how sound travels as a vibration through a medium and relate pitch and volume to wave properties.' },
          { title: 'Reflection and refraction of light', objectives: 'Describe and explain the reflection and refraction of light using ray diagrams.' },
        ],
      },
      {
        title: 'Scientific Enquiry and Investigation Skills',
        description: 'Using and evaluating a wider range of investigative methods.',
        lessons: [
          { title: 'Choosing appropriate equipment', objectives: 'Select and justify the equipment needed to measure a given variable accurately.' },
          { title: 'Identifying anomalous results', objectives: 'Identify an anomalous result in a data set and suggest a reason for it.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 8',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Lower Secondary Science, Stage 9 (draft)',
    units: [
      {
        title: 'Biology: Human Reproduction and Puberty',
        description: 'Human development from puberty onward, taught sensitively.',
        lessons: [
          { title: 'Changes during puberty', objectives: 'Describe the physical and emotional changes that occur during puberty.' },
          { title: 'The human reproductive system', objectives: 'Describe the structure and function of the human male and female reproductive systems.' },
        ],
      },
      {
        title: 'Biology: Ecosystems and Interdependence',
        description: 'How organisms depend on each other and their environment.',
        lessons: [
          { title: 'Food chains and food webs', objectives: 'Construct a food web from given information and identify producers, consumers, and predators.' },
          { title: 'Interdependence in an ecosystem', objectives: 'Explain how a change to one part of an ecosystem can affect other organisms within it.' },
        ],
      },
      {
        title: 'Chemistry: Acids, Bases and Chemical Reactions',
        description: 'The pH scale and neutralisation.',
        lessons: [
          { title: 'Acids, bases and the pH scale', objectives: 'Use the pH scale and an indicator to classify substances as acidic, neutral, or alkaline.' },
          { title: 'Neutralisation reactions', objectives: 'Describe a neutralisation reaction between an acid and a base and give everyday examples of its use.' },
        ],
      },
      {
        title: 'Chemistry: Metals and Reactivity',
        description: 'Comparing how different metals react.',
        lessons: [
          { title: 'Reactions of metals', objectives: 'Describe the reactions of common metals with water and dilute acid.' },
          { title: 'The reactivity series', objectives: 'Use the results of reactions to place metals in order of reactivity.' },
        ],
      },
      {
        title: 'Physics: Energy Resources and Transfers',
        description: 'A closer look at efficiency and energy resources.',
        lessons: [
          { title: 'Efficiency of energy transfers', objectives: 'Explain why no energy transfer is perfectly efficient and identify where energy is wasted in a system.' },
          { title: 'Comparing energy resources', objectives: 'Compare renewable and non-renewable energy resources in terms of cost, reliability, and environmental impact.' },
        ],
      },
      {
        title: 'Physics: Forces, Pressure and Density',
        description: 'Quantifying forces spread over an area or through a volume.',
        lessons: [
          { title: 'Calculating pressure', objectives: 'Calculate pressure from force and area, and explain everyday applications of increasing or decreasing pressure.' },
          { title: 'Calculating density', objectives: 'Calculate the density of an object from its mass and volume, and use density to explain floating and sinking.' },
        ],
      },
      {
        title: 'Scientific Enquiry and Investigation Skills',
        description: 'Independent investigation with a focus on evaluation.',
        lessons: [
          { title: 'Planning an independent investigation', objectives: 'Plan a full investigation independently, including a prediction and a method that controls relevant variables.' },
          { title: 'Evaluating an investigation', objectives: 'Evaluate the method and results of an investigation and suggest specific improvements.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 9',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge IGCSE Combined Science, Year 1 (draft)',
    units: [
      {
        title: 'Biology: Cell Biology and Movement of Substances',
        description: 'Cell structure in depth, and how substances move into and out of cells.',
        lessons: [
          { title: 'Specialised cells', objectives: 'Describe how the structure of specialised cells, such as red blood cells and root hair cells, relates to their function.' },
          { title: 'Diffusion and osmosis', objectives: 'Explain diffusion and osmosis and describe their importance in living organisms.' },
        ],
      },
      {
        title: 'Biology: Human Biology — Nutrition, Circulation',
        description: 'The digestive and circulatory systems in more depth.',
        lessons: [
          { title: 'Enzymes in digestion', objectives: 'Explain the role of enzymes in digestion, including the effect of temperature and pH on enzyme activity.' },
          { title: 'The circulatory system', objectives: 'Describe the structure of the heart and blood vessels and explain the path of blood through the double circulatory system.' },
        ],
      },
      {
        title: 'Chemistry: The Particulate Nature of Matter and Atomic Structure',
        description: 'Atomic structure and bonding, building toward IGCSE depth.',
        lessons: [
          { title: 'Atomic structure and isotopes', objectives: 'Describe atomic structure in terms of subatomic particles and explain what an isotope is.' },
          { title: 'Ionic and covalent bonding', objectives: 'Describe the formation of ionic and covalent bonds and relate bonding type to a substance’s properties.' },
        ],
      },
      {
        title: 'Chemistry: Stoichiometry and Chemical Formulae',
        description: 'Chemical formulae, equations, and simple calculations.',
        lessons: [
          { title: 'Chemical formulae and equations', objectives: 'Write and balance chemical equations for given reactions.' },
          { title: 'Introducing moles', objectives: 'Use the concept of the mole to carry out simple quantitative calculations involving mass.' },
        ],
      },
      {
        title: 'Physics: Motion, Forces and Energy',
        description: 'Quantitative motion and force calculations.',
        lessons: [
          { title: 'Speed, distance and time calculations', objectives: 'Calculate speed, distance, and time, and interpret distance-time and speed-time graphs.' },
          { title: "Newton's laws of motion", objectives: "Apply Newton's laws of motion to explain the effect of resultant forces on moving objects." },
        ],
      },
      {
        title: 'Physics: Thermal Physics',
        description: 'Heat transfer and its practical consequences.',
        lessons: [
          { title: 'Conduction, convection and radiation', objectives: 'Explain heat transfer by conduction, convection, and radiation, with everyday examples of each.' },
          { title: 'Specific heat capacity', objectives: 'Explain what specific heat capacity means and use it to compare how substances heat up.' },
        ],
      },
      {
        title: 'Practical and Investigative Skills',
        description: 'Building the practical skills assessed at IGCSE.',
        lessons: [
          { title: 'Recording and processing data', objectives: 'Record data to an appropriate precision and process it, including calculating averages and identifying trends.' },
          { title: 'Evaluating experimental method', objectives: 'Identify sources of error in an experimental method and suggest how to improve accuracy.' },
        ],
      },
    ],
  },
  {
    className: 'Secondary 10',
    subject: 'Science',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge IGCSE Combined Science, Year 2 (draft)',
    units: [
      {
        title: 'Biology: Coordination and Response, Reproduction',
        description: 'The nervous and endocrine systems, and human reproduction in depth.',
        lessons: [
          { title: 'The nervous system and reflexes', objectives: 'Describe the structure of a reflex arc and explain why reflex actions are important.' },
          { title: 'Hormones and the endocrine system', objectives: 'Describe the role of key hormones in regulating processes in the human body.' },
        ],
      },
      {
        title: 'Biology: Ecology and Human Influences on Ecosystems',
        description: 'Human impact on the environment, at IGCSE depth.',
        lessons: [
          { title: 'Energy flow and nutrient cycles', objectives: 'Describe energy flow through a food chain and explain the carbon cycle.' },
          { title: 'Human impact on ecosystems', objectives: 'Evaluate the impact of human activity, such as deforestation and pollution, on ecosystems.' },
        ],
      },
      {
        title: 'Chemistry: Electricity and Chemistry (Electrolysis), Chemical Energetics',
        description: 'Electrolysis and energy changes in reactions.',
        lessons: [
          { title: 'Electrolysis', objectives: 'Explain the process of electrolysis and predict the products formed at each electrode for a given electrolyte.' },
          { title: 'Exothermic and endothermic reactions', objectives: 'Distinguish exothermic from endothermic reactions and sketch a simple energy profile diagram for each.' },
        ],
      },
      {
        title: 'Chemistry: Organic Chemistry Fundamentals',
        description: 'An introduction to carbon-based compounds.',
        lessons: [
          { title: 'Alkanes and alkenes', objectives: 'Describe the structure of simple alkanes and alkenes and explain the key difference between them.' },
          { title: 'Simple reactions of organic compounds', objectives: 'Describe combustion of alkanes and the addition reaction of alkenes with bromine water.' },
        ],
      },
      {
        title: 'Physics: Electricity and Magnetism (Advanced)',
        description: 'Quantitative circuit calculations and electromagnetic induction.',
        lessons: [
          { title: 'Current, voltage and resistance', objectives: 'Use the relationship between current, voltage, and resistance to solve circuit problems.' },
          { title: 'Electromagnetic induction', objectives: 'Describe how a changing magnetic field can induce a current, and give an everyday application.' },
        ],
      },
      {
        title: 'Physics: Radioactivity and Earth Physics',
        description: 'Nuclear physics and the structure of the Earth.',
        lessons: [
          { title: 'Radioactive decay', objectives: 'Describe alpha, beta, and gamma radiation and explain the concept of half-life.' },
          { title: 'The structure of the Earth', objectives: "Describe the structure of the Earth's crust, mantle, and core, and outline the theory of plate tectonics." },
        ],
      },
      {
        title: 'Exam Preparation and Practical Technique',
        description: 'Consolidating two years of practical and theory skills for the exam.',
        lessons: [
          { title: 'Practical technique review', objectives: 'Demonstrate correct use of common laboratory equipment and techniques assessed in practical exams.' },
          { title: 'Timed exam-style questions', objectives: 'Answer a set of timed, exam-style questions drawing on biology, chemistry, and physics content together.' },
        ],
      },
    ],
  },
];

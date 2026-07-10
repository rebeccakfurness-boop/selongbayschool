export const siteConfig = {
  name: 'Selong Bay School',
  tagline: 'A different kind of school',
  mission: 'To provide world leading education for a sustainable future, whilst giving families time to explore.',
  url: 'https://www.selongbayschool.com',
  contact: {
    address: 'Dusun Serangan, Selong Belanak, Kec. Praya Bar., Kabupaten Lombok Tengah, Nusa Tenggara Bar. 83572',
    phone: '+62 813-5974-095',
    phoneHref: 'tel:+628135974095',
    email: 'hello@selongbayschool.com',
    instagram: 'https://www.instagram.com/selongbayschool/',
    facebook: 'https://www.facebook.com/people/Selong-Bay-School/61584318951968/',
    whatsappHref: 'tel:+628135974095',
    mapQuery: 'Selong Belanak, Praya Barat, Lombok Tengah, Nusa Tenggara Barat',
  },
};

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  {
    href: '/admissions',
    label: 'Admissions',
    children: [
      { href: '/admissions/preschool', label: 'Preschool' },
      { href: '/admissions/primary', label: 'Primary' },
      { href: '/admissions/secondary-school', label: 'Secondary School' },
    ],
  },
  { href: '/activities', label: 'Activities and Camps' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Log In' },
];

export const highSchoolAnnouncement = {
  headline: 'Secondary School is now Open!',
  body: 'Selong Bay School now offers secondary school options for students aged 13 - 18 years old. Contact us for more information.',
  mailSubject: 'Send me info on secondary school please',
};

export const testimonials = [
  {
    quote:
      "What made the biggest difference for our family wasn't the classroom. It was the community: other world-schooling parents who understood exactly what we were looking for, and kids who became fast friends.",
    name: 'Will & Brynn Noel',
    detail: 'World Schooling Family, California',
    image: { src: '/images/testimonial-will-brynn.jpg', alt: 'Will and Brynn Noel' },
  },
  {
    quote: 'We had the best time at Selong Bay School!',
    name: 'Vicente & Margaux Luzuriaga',
    detail: 'Spain',
    image: { src: '/images/home-hero-sunset.jpg', alt: 'Sunset over the beach at Selong Belanak, Lombok' },
  },
  {
    quote:
      "What I really like about the school is the flexibility and personal approach. The one-on-one sessions with teachers make a big difference and with only six hours of classes each week, it's easy to balance with other things. The teachers also work at your pace, which makes learning feel much more comfortable and effective.",
    name: 'Dylan Martin',
    detail: 'Grade 9 Student',
    image: { src: '/images/testimonial-dylan.jpg', alt: 'Dylan Martin' },
  },
];

export const foundingFamilies = [
  {
    name: 'Mark & Liz Berryman',
    detail: 'New Zealand, 2 years in Lombok with sons Elijah & Caleb',
    image: { src: '/images/berryman-family.jpg', alt: 'The Berryman family' },
    blurb:
      'New Zealand family living in Lombok for 2 years, with two boys, Elijah and Caleb. Liz is a medical doctor, university lecturer, and researcher in medical and business schools in Dubai and New Zealand. She is the CEO of a corporate mental health startup and is passionate about science and the future of education. Mark is a serial entrepreneur from the construction industry and holds an MBA, but his current focus is honing his surfing skills.',
  },
  {
    name: 'Jael & Levi Wunderli',
    detail: 'Switzerland, 4 years in Lombok with sons Jonah, Ari & Rio',
    image: { src: '/images/wunderli-family.jpg', alt: 'The Wunderli family' },
    blurb:
      'Swiss family living in Lombok for 4 years, with three boys, Jonah, Ari, and Rio. Jael is an experienced Swiss-trained elementary school teacher with experience leading education in Cambodia and social impact projects. Levi is a dedicated surfer and purpose-driven builder with a passion for community development; after founding a wakepark project for an NGO in Cambodia, he brings strong experience in youth empowerment and building supportive environments.',
  },
];

export const charitableWork = {
  heading: 'Charitable Work',
  body: 'As part of our not-for-profit, charitable commitment to the community of South Lombok, Selong Bay School runs the Serangan English School, a free programme where our team teaches English to the local Serangan village every Sunday morning. This is one of the ways we reinvest in the community that welcomes us.',
};

export const values = [
  {
    name: 'Humility',
    tagline: 'We stay teachable.',
    description:
      "Humility means we know we don't have all the answers. We welcome feedback because it helps us grow. We celebrate the success of others, treat everyone with equal respect, and never believe we are more important than someone else.",
    bullets: [
      'Welcome feedback as a gift.',
      'Learn from our mistakes.',
      'Speak respectfully to everyone.',
      'Celebrate others without comparing ourselves.',
      'Build others up instead of putting them down.',
      'Stay curious and open to learning every day.',
    ],
    quote: 'Growth begins when we remain teachable.',
  },
  {
    name: 'Kindness',
    tagline: 'We choose kindness in every interaction.',
    description:
      'Kindness is more than being nice, it is an attitude that guides our words and actions. It means showing empathy, helping others, having courageous conversations with compassion, and contributing to our community without expecting anything in return.',
    bullets: [
      'Show empathy and compassion.',
      'Include and encourage others.',
      'Listen with understanding.',
      'Have honest conversations with respect.',
      'Volunteer and serve our community.',
      'Choose kindness, even when it is difficult.',
    ],
    quote: 'Kindness is shown through action.',
  },
  {
    name: 'Integrity',
    tagline: 'We do the right thing, even when no one is watching.',
    description:
      'Integrity means our actions match our values. We are honest, dependable, and trustworthy. We take responsibility for our choices and stand by what is right, even when it is difficult.',
    bullets: [
      'Keep our promises.',
      'Tell the truth.',
      'Take responsibility for our actions.',
      'Admit our mistakes and make them right.',
      'Stay true to our values in every situation.',
    ],
    quote: 'Character is revealed through consistent actions.',
  },
  {
    name: 'Agency',
    tagline: 'We take ownership of our learning and our future.',
    description:
      'Agency means believing that our choices matter. We think independently, make informed decisions, solve problems, and take responsibility for ourselves, our relationships, and the world around us.',
    bullets: [
      'Make thoughtful decisions.',
      'Take responsibility for our learning and behaviour.',
      'Set goals and work towards them.',
      'Respect ourselves, others, and the Earth.',
      'Show initiative and perseverance.',
      'Believe we can make a positive difference.',
    ],
    quote: 'Our choices shape our future.',
  },
];

export const ourCommitment = [
  'At Selong Bay School, we strive to develop young people who are humble enough to learn, kind enough to care, honest enough to stand for what is right, and courageous enough to take responsibility for their lives and their community.',
  'These values shape every classroom, every relationship, and every opportunity to learn. We believe academic excellence is strengthened by strong character, preparing students not only for university and careers, but to become thoughtful leaders who make a positive impact wherever they go.',
];

export const teachers = [
  {
    name: 'Marwan Desky',
    role: 'Secondary School (age 13–18), Maths, Science & Music',
    bio: 'Marwan Desky is an experienced high school teacher and private tutor from Sumbawa with over 10 years of teaching experience across mathematics, science, and music education. He specialises in advanced statistical modelling and biostatistics, bringing strong analytical and problem-solving skills into the classroom. Pak Desky has extensive experience supporting students in Cambridge IGCSE exam preparation through personalised tutoring, structured revision strategies, and targeted academic support. Alongside his academic teaching, he is also a passionate music teacher who encourages creativity, discipline, and confidence in students through engaging and supportive learning experiences.',
    image: { src: '/images/teacher-marwan.jpg', alt: 'Marwan Desky, Secondary School teacher at Selong Bay School' },
  },
  {
    name: 'Nadine Natali Hanslik (Ms. Nati)',
    role: 'Secondary School Supervisor',
    bio: "Nati has a Masters Degree in Education majoring in Chemistry and Physical Education from the University of Education Schwäbisch Gmünd, Germany. She also completed education training at Griffith University in Australia, so she's up to date with the Australian and Cambridge curriculums. Nati is a keen surfer and loves getting kids into outdoor education. She's also a qualified gym instructor with Les Mills and loves to explore and adventure in Lombok. With Nati's Chemistry degree, she's able to support the practical side of subjects for the secondary school that can't be done online. As well as supervising the online programme, she'll lead projects and activities.",
    image: { src: '/images/teacher-nati.jpg', alt: 'Nadine Natali Hanslik, Secondary School Supervisor at Selong Bay School' },
  },
  {
    name: 'Roxana Maurer',
    role: 'Secondary School (age 13–18), Languages & Humanities',
    bio: 'Roxana Maurer is an experienced secondary school teacher from Switzerland with a strong background in language, humanities, and student-centred learning. She previously taught at Sekundarschule Zentrum Küsnacht from 2022 to 2025, where she taught German, English, Economics, Geography, Work & Household (WAH), and Religions, Cultures & Ethics (RKE) to secondary students across Levels A and B. Roxana also served as a class teacher for a combined secondary class over two school years, supporting students academically and personally through a collaborative and engaging learning environment. Fluent in French, German, and English, she brings a multicultural and supportive approach.',
    image: { src: '/images/teacher-roxana.jpg', alt: 'Roxana Maurer, Secondary School teacher at Selong Bay School' },
  },
];

/** Combined fee snapshot shown on the How It Works page; each subpage's own Pricing section has the full breakdown. */
export const feesSummary = [
  { level: 'Preschool', ages: '2–5 years', perTermFrom: 10_000_000 },
  { level: 'Primary', ages: '6–12 years', perTermFrom: 23_750_000 },
  { level: 'Secondary School', ages: '13–18 years', perTermFrom: 27_000_000 },
];

export const admissionsSteps = [
  { title: 'Complete the enrolment form', detail: 'Submit the online enquiry form on this page with your child and family details.' },
  { title: 'Visit the school', detail: 'Come see the campus in person, or join a virtual tour if you’re not yet in Lombok.' },
  { title: 'Parent & student interview', detail: 'A relaxed conversation, online or in person, to make sure Selong Bay is the right fit.' },
  { title: 'Letter of offer', detail: 'We send a formal offer of a place once the interview is complete.' },
  { title: 'Confirm student details', detail: 'Share your child’s information and passport details to finalise enrolment.' },
  { title: 'Student starts', detail: 'Welcome to Selong Bay: on campus, online, or both.' },
];

export const dailySchedule = [
  { time: '08:30', activity: 'Welcome and Character Studies' },
  { time: '08:45', activity: 'Focus Block: Maths, English, Science' },
  { time: '10:45', activity: 'Morning Tea' },
  { time: '11:15', activity: 'Project Time' },
  { time: '11:45', activity: 'Art, Bahasa Indonesia, Music' },
  { time: '12:15', activity: 'Lunch (supplied by Segara Resort)' },
  { time: '13:30', activity: 'Activities' },
  { time: '15:30', activity: 'School finishes' },
];

export const afternoonClubs = [
  'Gardening Club', 'Surf Club', 'Padel Club', 'Adventure Junkie', 'Marine Science',
  'Football Academy', 'Music', 'Skate Club', 'Sasak Culture', 'Master Chef',
  'Dance Squad', 'Drama and Acting', 'Woodwork', 'Science & STEM',
  'Business & Entrepreneurship', 'Coding and Robotics', 'Craftwork (Weaving)', 'Nature Seekers',
];

export const campusFacts = [
  'Padel court and football field on site',
  'Two classrooms (finishing January)',
  'Beach within walking distance',
  'Beginner, intermediate, and advanced surf spots within a 10-minute drive',
  'Shuttle bus available from Kuta on request',
];

/** Bookable activities. Content is locked; do not paraphrase or restructure. */
export type Activity = {
  slug: string;
  name: string;
  day: string;
  duration: string | null;
  priceIDR: number | null;
  priceNote?: string;
  description: string;
  ageGroup: string;
};

export const activities: Activity[] = [
  {
    slug: 'hip-hop-dance-ninja-warrior',
    name: 'Hip Hop Dance and Ninja Warrior',
    day: 'Monday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'High-energy dance moves paired with an obstacle-course challenge, building rhythm, confidence, and coordination.',
    ageGroup: 'All ages',
  },
  {
    slug: 'gymnastics-free-swim',
    name: 'Gymnastics for Kids & Free Swim',
    day: 'Tuesday',
    duration: null,
    priceIDR: 300_000,
    description: 'Foundational gymnastics skills followed by free swim time to cool off.',
    ageGroup: 'All ages',
  },
  {
    slug: 'surfing-selong-belanak',
    name: 'Surfing Selong Belanak Beach',
    day: 'Wednesday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'Beginner-friendly surf lessons at Selong Belanak Beach, right on our doorstep.',
    ageGroup: 'All ages',
  },
  {
    slug: 'art-music-bahasa',
    name: 'Art, Music and Bahasa Indonesia',
    day: 'Thursday',
    duration: null,
    priceIDR: 300_000,
    description: 'A creative afternoon blending art and music with hands-on Bahasa Indonesia language learning.',
    ageGroup: 'All ages',
  },
  {
    slug: 'scouts-survival-challenge',
    name: 'Scouts and Survival Challenge',
    day: 'Friday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'Outdoor scouting skills and a friendly survival challenge in and around the campus.',
    ageGroup: 'All ages',
  },
  {
    slug: 'school-tour',
    name: 'School Tour',
    day: 'By request',
    duration: '1 hr',
    priceIDR: null,
    priceNote: 'Free',
    description: 'A guided walk through our campus, classrooms, and grounds: a great first step for prospective families.',
    ageGroup: 'All ages',
  },
  {
    slug: 'adventure-camp-2026-per-day',
    name: 'Adventure Camp 2026 (Per Day)',
    day: 'Mon–Fri',
    duration: '6 hr',
    priceIDR: 450_000,
    priceNote: 'Confirm pricing',
    description: 'A full day of adventure activities: surf, scouting, sport, and campus exploration, bookable one day at a time.',
    ageGroup: 'All ages',
  },
  {
    slug: 'adventure-camp-2026-full-week',
    name: 'Adventure Camp 2026 (Full Week)',
    day: 'Mon–Fri',
    duration: '6 hr',
    priceIDR: null,
    priceNote: 'Contact us for pricing',
    description: 'The full Adventure Camp week: surf, scouting, sport, and campus exploration every day.',
    ageGroup: 'All ages',
  },
];

export const principalWelcome = {
  name: 'Ms Indhira',
  role: 'Principal',
  paragraphs: [
    'Selong Bay School is a full-time international school offering a complete educational journey from Pre-school through to university entrance. Whether your family calls Lombok home or is spending an extended season here, students become part of a vibrant learning community where academic excellence, character development, and real-world experiences go hand in hand.',
    'Our students follow internationally recognised academic pathways that prepare them for universities and future careers around the world. In the early years and primary school, learning is inquiry-based, engaging, and designed to build strong foundations in literacy, numeracy, creativity, and wellbeing. As students progress into secondary school, they undertake a rigorous academic programme leading to internationally recognised qualifications for university entrance.',
    "Learning extends far beyond the classroom. Surrounded by the natural beauty of South Lombok, students regularly engage in outdoor education, environmental stewardship, entrepreneurship, community service, and project-based learning. We believe some of life's greatest lessons are learned by exploring, creating, serving, and solving real problems.",
    'Small class sizes allow teachers to know every student personally, tailoring learning to individual strengths, interests, and goals while providing the support and challenge each child needs to thrive.',
    'At Selong Bay School, education is about more than academic success. We intentionally develop young people of character who lead with humility, kindness, integrity, responsibility, and hope. Our graduates leave with the confidence to think critically, the curiosity to keep learning, the resilience to embrace challenges, and the compassion to make a positive difference wherever life takes them.',
    "From a child's very first day of school through to university preparation, Selong Bay School provides a connected, inspiring pathway that equips students with the knowledge, skills, and character to flourish in a changing world.",
  ],
};

export const policyLinks = [
  { label: 'School Policies', href: '#' },
  { label: 'Parent Handbook', href: '#' },
];

export const freeShuttle = {
  body: 'Selong Bay School offers a free shuttle service from Kuta for enrolled students, making it easy for families based further afield to travel to and from campus. Contact us to check shuttle times and pick-up points for your family.',
};

export const academicCalendarPdf = '/files/academic-calendar-placeholder.pdf';

export const ourApproach = {
  heading: 'A curriculum built for both worlds',
  paragraphs: [
    "Selong Bay School operates under Yayasan Selong Bay Sekolah, a registered foundation. We are not for profit. We are for the children and the community of South Lombok. All funds are reinvested into the school's development, including scholarships, community programmes such as the Serangan English School, and training opportunities for local teachers and staff.",
    'Our curriculum blends Cambridge International Education with the Australian National Curriculum and our own Selong Bay approach: play-based in the Early Years, inquiry-based through Primary. More about our approach under "How It Works."',
  ],
};

export type AdmissionsGroup = {
  slug: string;
  label: string;
  ages: string;
  heroImage: { src: string; alt: string };
  overview: string;
  curriculum: string;
  pricing: { programme: string; perTermFrom: number }[];
};

export const admissionsGroups: AdmissionsGroup[] = [
  {
    slug: 'preschool',
    label: 'Preschool',
    ages: '2–5 years',
    heroImage: { src: '/images/unused-toddler-play.jpg', alt: 'Toddlers exploring a sensory play book together at Selong Bay School' },
    overview:
      'Our Preschool programme welcomes children aged 2 to 5 into a warm, play-based learning environment. Days are full of exploration, creativity, and social connection, building the foundations for a lifelong love of learning while giving little ones plenty of time to play, explore Lombok, and grow alongside a caring community of teachers and friends.',
    curriculum:
      'Preschool at Selong Bay is entirely play-based, drawing on Early Years best practice alongside the Cambridge and Australian National Curriculum frameworks. Children develop language, number sense, motor skills, and social-emotional confidence through hands-on activities, stories, movement, and outdoor exploration, both on campus and along the beach at Selong Belanak.',
    pricing: [
      { programme: 'Junior Preschool (Half Day)', perTermFrom: 10_000_000 },
      { programme: 'Junior Preschool (Full Time)', perTermFrom: 15_450_000 },
      { programme: 'Senior Preschool (Full Time)', perTermFrom: 18_450_000 },
    ],
  },
  {
    slug: 'primary',
    label: 'Primary',
    ages: '6–12 years',
    heroImage: { src: '/images/highschool-classroom-teaching.jpg', alt: 'A teacher and teaching assistant helping students at Selong Bay School' },
    overview:
      "Primary students aged 6 to 12 follow a hybrid model that blends structured online learning with hands-on, on-campus connection. Small class sizes mean every child is known personally, with learning tailored to their strengths, interests, and pace, all set against the backdrop of South Lombok's beaches, jungle, and community.",
    curriculum:
      'Our Primary curriculum blends Cambridge International Education with the Australian National Curriculum and the Selong Bay approach: inquiry-based learning that builds deep understanding of Maths, English, and Science, alongside Bahasa Indonesia, the Arts, and project-based learning that connects classroom concepts to the real world.',
    pricing: [
      { programme: 'Junior, age 6–8', perTermFrom: 23_750_000 },
      { programme: 'Intermediate, age 9–10', perTermFrom: 24_750_000 },
      { programme: 'Senior, age 11–12', perTermFrom: 25_750_000 },
    ],
  },
  {
    slug: 'secondary-school',
    label: 'Secondary School',
    ages: '13–18 years',
    heroImage: { src: '/images/highschool-hero-algebra.jpg', alt: 'A secondary school student solving algebra at the whiteboard with a teacher' },
    overview:
      'Secondary School students aged 13 to 18 continue with the same hybrid model that makes our Primary years work so well: structured online study paired with on-campus connection, project work, and hands-on learning, preparing students for university entrance and future careers.',
    curriculum:
      "Secondary School students follow Cambridge International Education and the Australian National Curriculum, working towards internationally recognised qualifications for university entrance. Alongside core academic subjects, students take part in project-based learning, community service, and outdoor education that build the character and real-world skills they'll need beyond the classroom.",
    pricing: [
      { programme: 'Junior Secondary', perTermFrom: 27_000_000 },
      { programme: 'Senior Secondary', perTermFrom: 30_000_000 },
    ],
  },
];

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

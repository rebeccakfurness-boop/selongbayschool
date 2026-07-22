export const siteConfig = {
  name: 'Selong Bay School',
  tagline: 'A different kind of school',
  mission: 'A school in Lombok, built for families who want an exceptional education and time to explore.',
  url: 'https://www.selongbayschool.com',
  contact: {
    address: 'Dusun Serangan, Selong Belanak, Kec. Praya Bar., Kabupaten Lombok Tengah, Nusa Tenggara Bar. 83572',
    phone: '+62 813-5974-095',
    phoneHref: 'tel:+628135974095',
    email: 'hello@selongbayschool.com',
    instagram: 'https://www.instagram.com/selongbay_school/',
    facebook: 'https://www.facebook.com/people/Selong-Bay-School/61584318951968/',
    whatsappHref: 'tel:+628135974095',
    mapQuery: 'Dusun Serangan, Selong Belanak, Kec. Praya Bar., Kabupaten Lombok Tengah, Nusa Tenggara Bar. 83572',
  },
};

export const bankTransferDetails = {
  bank: 'Mandiri',
  accountNumber: '1610016965134',
  accountName: 'Elizabeth Berryman',
  wiseUrl: 'https://wise.com/pay/me/elizabethb3419',
};

/** Fixed pack price/size — not admin-configurable, defined once so the client display and the
 * server-side charge can never drift out of sync. */
export const activityPass = {
  priceIDR: 3_000_000,
  totalSessions: 10,
  validityLabel: '1 month',
};

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/foundation-and-charity', label: 'Foundation & Charity' },
  {
    href: '/admissions',
    label: 'Admissions',
    children: [
      { href: '/admissions/preschool', label: 'Preschool' },
      { href: '/admissions/primary', label: 'Primary' },
      { href: '/admissions/secondary-school', label: 'Secondary School' },
    ],
  },
  { href: '/activities', label: 'Activities and WorldSchooling' },
  { href: '/online-library', label: 'Library' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Log In' },
];

// Separate from navItems (used by the footer) so the header nav can have its
// own order and labels without affecting the footer's Explore links.
export const headerNavItems = [
  { href: '/', label: 'Home' },
  {
    href: '/about',
    label: 'About',
    children: [{ href: '/foundation-and-charity', label: 'Our Foundation' }],
  },
  { href: '/how-it-works', label: 'Our Approach' },
  {
    href: '/admissions',
    label: 'Admissions',
    children: [
      { href: '/admissions/preschool', label: 'Preschool' },
      { href: '/admissions/primary', label: 'Primary' },
      { href: '/admissions/secondary-school', label: 'Secondary School' },
    ],
  },
  { href: '/activities', label: 'Activities and WorldSchooling' },
  { href: '/online-library', label: 'Library' },
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
    quote:
      "At Selong Bay School our children learned through adventure, nature, and hands-on activities, with opportunities to surf, skateboard, play padel, explore local villages, and experience the culture of Lombok. The school's unique approach made learning feel natural, engaging, and fun. What made it truly special was the warm, close-knit community that welcomed us from day one. We left with unforgettable memories and can't wait to come back.",
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
    name: 'Hope',
    tagline: 'Hope shapes our mindset.',
    description: "See the good and believe in what's possible.",
  },
  {
    name: 'Humility',
    tagline: 'Humility shapes how we learn.',
    description: 'Stay teachable.',
  },
  {
    name: 'Kindness',
    tagline: 'Kindness shapes how we treat others.',
    description: 'Put people first.',
  },
  {
    name: 'Integrity',
    tagline: 'Integrity shapes our character.',
    description: 'Do what is right.',
  },
  {
    name: 'Responsibility',
    tagline: 'Responsibility shapes our actions.',
    description: 'Own your choices and care for people and the planet.',
  },
];

export const ourCommitment = [
  'At Selong Bay School, we strive to develop young people who are humble enough to learn, kind enough to care, honest enough to stand for what is right, and courageous enough to take responsibility for their lives and their community.',
  'These values shape every classroom, every relationship, and every opportunity to learn. We believe academic excellence is strengthened by strong character, preparing students not only for university and careers, but to become thoughtful leaders who make a positive impact wherever they go.',
];

export const teachers = [
  {
    name: 'Amorita Christella Anggamsari (Ms Ella)',
    role: 'Early Years & Preschool Teacher',
    shortIntro: 'An experienced Early Years and Preschool teacher with a background in psychology and child development.',
    bio: "Amorita Christella Anggamsari holds a Bachelor's degree in Psychology from Airlangga University and has over three years of experience in early childhood education, child development, and mental health support. She most recently worked as a Kindergarten 2 Teacher at Apple Tree Preschool Lombok (2023 to 2025), where she taught a class of 16 students, delivered lessons across key learning areas, monitored student progress, and built strong partnerships with families. She also led school initiatives, including the Read to Me Event 2025, the school newsletter, and teacher training. Alongside her teaching, Amorita has worked as a counselor and facilitator, providing individual and group support to promote emotional wellbeing and personal development. Bilingual in English and Bahasa Indonesia, she is skilled in communication, public speaking, educational content creation, and has presented at both national and international conferences.",
    image: { src: '/images/msellapicture2.png', alt: 'Amorita Christella Anggamsari (Ms Ella), Early Years & Preschool teacher at Selong Bay School' },
  },
  {
    name: 'Dewi Mustika N. (Ms Dewi)',
    role: 'Assistant Teacher, Early Years & Preschool',
    shortIntro: 'An Assistant Teacher for Early Years and Preschool with a background in English education and early childhood teaching.',
    bio: 'Dewi Mustika N. is an English Education graduate from the University of Mataram with experience in early childhood education, tutoring, and school administration. She has worked as an English Teacher at Al Hikmah Kindergarten, as well as an English and multi-subject tutor, developing strong classroom management, communication, and student support skills. Alongside her teaching experience, Dewi has held administrative roles, strengthening her organisational abilities and supporting the day-to-day operations of schools. She is also skilled in design, photography, videography, social media content creation, and visual communication, enabling her to create engaging educational resources and document school activities. Fluent in Bahasa Indonesia with strong English communication skills, Dewi is known for her creativity, adaptability, teamwork, and her ability to build positive relationships with children, families, and colleagues.',
    image: { src: '/images/teacher-dewi.jpg', alt: 'Dewi Mustika N. (Ms Dewi), Assistant Teacher for Early Years & Preschool at Selong Bay School' },
  },
  {
    name: 'Ripki Pratama (Pak Ripki)',
    role: 'Primary Teacher (Ages 7+)',
    shortIntro: 'An experienced Primary and Secondary teacher specialising in Cambridge and Australian Curriculum education.',
    bio: 'Ripki Pratama is an experienced educator with a strong background in the Cambridge and Australian (ACARA) curricula, having taught primary and secondary students in international school settings. He currently serves as a Home Teacher and Secondary Mathematics Teacher at Anak Alam Intercultural School, where he teaches English and Mathematics, monitors student progress, and works closely with families to create a positive, engaging learning environment. Previously, he taught at Mandalika Intercultural School, designing inquiry-based lessons for students from diverse cultural backgrounds. Beyond the classroom, Ripki has led student safety initiatives, coordinated school events, and contributed to community outreach programs promoting environmental sustainability and English learning. He holds a Bachelor of Education from the University of Mataram, has completed professional training in CPR and Fire Safety, and is proficient in educational technology including Google Classroom, Seesaw, and Canva. With a TOEFL score of 520, he demonstrates strong English communication skills.',
    image: { src: '/images/teacher-ripki.jpg', alt: 'Ripki Pratama (Pak Ripki), Primary teacher at Selong Bay School' },
  },
  {
    name: 'Marwan Desky',
    role: 'Primary Mathematics Specialist Teacher (Ages 7+)',
    shortIntro: 'A Primary Mathematics Specialist with a strong academic background in Pure Mathematics.',
    bio: "Marwan Desky Ismansyah holds a Bachelor's degree in Pure Mathematics from Maulana Malik Ibrahim State Islamic University of Malang. He recently worked as a Teacher Assistant at Mandalika Intercultural School, supporting classroom learning and gaining experience in an international school environment. Prior to this, Marwan held roles in educational consulting, human resources, and corporate training, developing strong skills in communication, mentoring, leadership, and professional development. His background in mathematics includes research in statistical analysis, mathematical modelling, and applied mathematics, with published work on topics including the Golden Ratio, ARIMA modelling, and numerical solutions for brain tumour models. Proficient in analytical software such as SPSS, Minitab, and Maple, Marwan combines strong technical expertise with excellent problem-solving skills. Fluent in Bahasa Indonesia with strong English communication skills, he is well equipped to support bilingual learning environments.",
    image: { src: '/images/teacher-marwan.jpg', alt: 'Marwan Desky, Primary Mathematics Specialist teacher at Selong Bay School' },
  },
  {
    name: 'Nadine Natali Hanslik (Ms Nati)',
    role: 'High School Teacher',
    shortIntro: 'A High School teacher specialising in Chemistry and Physical Education, currently completing her Master of Education.',
    bio: 'Nadine Natali Hanslik is currently completing her Master of Education in Germany, building on her Bachelor of Arts in Education with specialisations in Chemistry and Physical Education. She also completed an exchange semester at Griffith University in Australia, expanding her international teaching perspective. Nadine is multilingual, speaking German, English, and Polish, making her well suited to an international school environment. She is a certified Online Tutor with experience supporting students in both classroom and digital learning settings. Throughout her studies, Nadine has held leadership roles within faculty and student councils, demonstrating strong communication, collaboration, and organisational skills. Her diverse academic and professional experiences have developed her adaptability, professionalism, and ability to work effectively with students and colleagues from a wide range of cultural backgrounds.',
    image: { src: '/images/teacher-nati.jpg', alt: 'Nadine Natali Hanslik (Ms Nati), High School teacher at Selong Bay School' },
  },
  {
    name: 'Rebecca Furness',
    role: 'Specialist High School Tutor',
    shortIntro: 'A Specialist High School Tutor with a strong background in business, leadership, and economics.',
    bio: "Rebecca Furness is an experienced online tutor and workshop facilitator with a background in business, leadership, organisational psychology, and microeconomics. She brings real-world industry experience into her teaching, helping students understand economic concepts through practical examples and engaging discussions. Rebecca's teaching approach focuses on developing critical thinking, analytical skills, and confidence across areas including markets, global economies, business decision-making, and exam preparation. She supports students in connecting Economics to real-world applications and future career pathways. Rebecca is also experienced in scholarship applications and has been awarded several scholarships, including the New Zealand Prime Minister's Scholarship, enabling her to travel and study internationally.",
    image: { src: '/images/teacher-rebecca.jpg', alt: 'Rebecca Furness, Specialist High School Tutor at Selong Bay School' },
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
  { time: '12:15', activity: 'Lunch' },
  { time: '13:30', activity: 'Activities' },
  { time: '15:30', activity: 'School finishes' },
];

export const afternoonClubs = [
  'Gardening Club', 'Surf Club', 'Padel Club', 'Adventure Junkie', 'Marine Science',
  'Football Academy', 'Music', 'Skate Club', 'Sasak Culture', 'Master Chef',
  'Dance Squad', 'Drama and Acting', 'Woodwork', 'Science & STEM',
  'Business & Entrepreneurship', 'Coding and Robotics', 'Craftwork (Weaving)', 'Nature Seekers',
];

export const activitiesGallery = [
  {
    src: '/images/activities-gallery-beach-swim.jpg',
    alt: "Students swimming in the shallows at Selong Belanak Beach while a parent watches from the shore, with traditional fishing boats anchored beyond",
  },
  {
    src: '/images/activities-gallery-art-gallery-trip.jpg',
    alt: 'Selong Bay School students and staff on a community outing to Nyaman Art Gallery, holding a Yayasan Selong Bay Sekolah banner',
  },
  {
    src: '/images/activities-gallery-craft-weaving-1.jpg',
    alt: 'Students working together on a recycled plastic craft activity in the school garden',
  },
  {
    src: '/images/activities-gallery-craft-weaving-2.jpg',
    alt: 'Students and staff weaving colourful recycled materials together during a craft session',
  },
];

export const communityPartners = [
  {
    name: 'Endri Foundation',
    logo: '/images/partner-logo-endri-foundation.png',
    instagramHandle: '@lombok_forgotton_children',
    instagramUrl: 'https://www.instagram.com/lombok_forgotton_children/',
    websiteUrl: 'http://www.endri.org/',
  },
  {
    name: 'Honest Made',
    logo: '/images/partner-logo-honest-island-recycling.png',
    instagramHandle: '@honestmade_',
    instagramUrl: 'https://www.instagram.com/honestmade_/',
    websiteUrl: 'https://honest-made.co/',
  },
  {
    name: 'Buffalo Pond',
    subtitle: 'Water Safety',
    logo: '/images/partner-logo-buffalo-pond-swim-school.png',
    instagramHandle: '@buffalo.pond',
    instagramUrl: 'https://www.instagram.com/buffalo.pond/',
    websiteUrl: 'https://www.buffalopond.org/',
  },
];

export const campusFacts = [
  'Padel court and football field on site',
  'Three air-conditioned classrooms',
  'Beach within walking distance',
  'Beginner, intermediate, and advanced surf spots',
  'Shuttle bus available from Kuta on request',
  'Staying connected with Starlink Wifi on campus',
];

/**
 * Bookable activities. Now database-backed (see the `activities` table in
 * src/lib/db.ts and scripts/seed-activities.ts for the seed data) rather
 * than a static list; this type is the shared shape used when rendering
 * rows queried from that table.
 */
export type Activity = {
  slug: string;
  name: string;
  day: string;
  duration: string | null;
  priceIDR: number | null;
  priceNote?: string;
  description: string;
  ageGroup: string;
  photoUrl?: string | null;
  /** 'available': has an upcoming session with spots left. 'full': has upcoming sessions but all full. 'none': no upcoming sessions scheduled. */
  availability?: 'available' | 'full' | 'none';
};

export const principalWelcome = {
  name: 'Ms Indhira',
  fullName: 'Ms Indhira (Indhira Shinta Dewi, M. Pd)',
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

export const hybridApproach = {
  heading: 'A Hybrid Learning Model That Works',
  paragraphs: [
    'At Selong Bay School, learning is designed to move with your family. Whether students are learning on campus in Lombok or joining lessons online from anywhere in the world, they remain connected to the same teachers, classmates, and learning journey.',
    'Our hybrid model gives families the flexibility to travel without compromising educational continuity. Students can transition seamlessly between on-site and online learning, ensuring they stay engaged academically, maintain meaningful friendships, and continue to feel part of one connected school community.',
    'Through our partnership with HighScope Indonesia Group (HSPG), with campuses in Jakarta and Bali, students benefit from a broader network of experienced educators, collaborative learning opportunities, and internationally recognised teaching practices. This partnership strengthens the quality and consistency of learning across every stage of their education.',
    'Learning extends beyond the classroom through our 24/7 digital library, powered by Libby. Every student has access to thousands of ebooks, audiobooks, and educational resources from any device, making it easy to read, research, and discover wherever they are in the world.',
    'Whether studying on the shores of Selong Bay or from another country, every student receives the same personalised support, high-quality education, and strong sense of belonging that defines the Selong Bay School experience.',
  ],
};

export const temporaryEnrolments = {
  teaser: {
    heading: 'Temporary Enrolments',
    body: "Visiting Lombok, worldschooling, homeschooling, or looking for a flexible learning option? Selong Bay School offers temporary enrolments from one week to one month, designed to fit around your family's schedule.",
  },
  paragraphs: [
    "Whether you're visiting Lombok for a short stay, worldschooling, homeschooling, or simply looking for a flexible learning option, Selong Bay School welcomes temporary enrolments to suit your family's needs.",
    'Our flexible programme is designed around your schedule. Children can join us for as little as one week or up to one month, with attendance options including one day per week through to five days per week, as well as half-day or full-day enrolments.',
    'For homeschooling and worldschooling families, students are welcome to bring their own curriculum and learning materials. They can work independently in a supportive school environment while being supervised and encouraged by our experienced staff. This provides the benefits of routine, social connection, and access to a safe, engaging learning space, while allowing families to continue following their own educational programme.',
    'Students joining our regular classes will be welcomed into age-appropriate learning groups, participating in engaging lessons, outdoor education, creative activities, and our vibrant school community.',
    "As every family's needs are different, fees vary depending on the length of enrolment, attendance schedule, and level of support required. Please contact us to discuss your child's needs, and we'll create a flexible enrolment package that's right for your family.",
    "Whether you're in Lombok for a holiday, an extended stay, or part of your worldschooling journey, we'd love to welcome your family to Selong Bay School.",
  ],
};

export const onlineLibrary = {
  href: 'https://www.libib.com/',
  paragraphs: [
    "Every Selong Bay student and family has access to our school library collection through an online booking system called Libib. Explore everything available on campus, including books, educational resources, toys, games, sports equipment, helmets, and other learning materials, and collect from the school campus.",
    "Search what's on our shelves, check availability, place items on hold, and keep track of what you are borrowing. From picture books and chapter books to curriculum resources, creative play materials, sports equipment, toys and practical equipment for everyday learning and exploration.",
    "Community library coming soon for a monthly membership fee. Anyone who calls Selong Bay home can sign up for access to the school library. A wider range of books will be added for all reading levels, with fiction and non-fiction books available for lending.",
  ],
};

export const googleClassroom = {
  heading: 'Google Classroom',
  body: 'We use Google Classroom to support both online and in person learning through a structured, flexible, and accessible learning environment. Google Classroom allows students to access lesson materials, assignments, recorded sessions, revision resources, and practice examinations in one central location, encouraging self-directed learning and independent study habits. Teachers can track student progress, provide feedback, monitor assignment completion, and support exam preparation effectively. The platform also enables parental oversight by allowing families to stay informed about student learning, deadlines, progress, and communication, helping create a collaborative partnership between students, teachers, and parents.',
};

export const parentHandbookPdf = '/files/parent-handbook.pdf';

export const policyLinks = [
  { label: 'School Policies', href: '#' },
  { label: 'Parent Handbook', href: parentHandbookPdf },
];

export const freeShuttle = {
  body: 'Selong Bay School offers a free shuttle service from Kuta for enrolled students, making it easy for families based further afield to travel to and from campus. Contact us to check shuttle times and pick-up points for your family.',
};

export const academicCalendarPdf = '/files/academic-calendar.pdf';

export const ourApproach = {
  heading: 'A curriculum built for both worlds',
  paragraphs: [
    "Selong Bay School operates under Yayasan Selong Bay Sekolah, a registered foundation. We are not for profit. We are for the children and the community of South Lombok. All funds are reinvested into the school's development, including scholarships, community programmes such as the Serangan English School, and training opportunities for local teachers and staff.",
    'Our curriculum blends Cambridge International Education with the Australian National Curriculum and our own Selong Bay approach: play-based in the Early Years, inquiry-based through Primary.',
  ],
};

export type AdmissionsGroup = {
  slug: string;
  label: string;
  ages: string;
  heroImage: { src: string; alt: string };
  overview: string;
  curriculum: string;
  pricing: { programme: string; ageRange?: string; perTermFrom: number }[];
  featuredTeachers: string[];
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
      { programme: 'Junior Preschool (Half Day)', ageRange: '2–4', perTermFrom: 10_000_000 },
      { programme: 'Junior Preschool (Full Time)', ageRange: '2–4', perTermFrom: 15_450_000 },
      { programme: 'Senior Preschool (Full Time)', ageRange: '4–6', perTermFrom: 18_450_000 },
    ],
    featuredTeachers: ['Amorita Christella Anggamsari (Ms Ella)', 'Dewi Mustika N. (Ms Dewi)'],
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
    featuredTeachers: ['Marwan Desky', 'Ripki Pratama (Pak Ripki)'],
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
      { programme: 'Junior Secondary', ageRange: '13–14', perTermFrom: 27_000_000 },
      { programme: 'Senior Secondary', ageRange: '15–17', perTermFrom: 30_000_000 },
    ],
    featuredTeachers: ['Nadine Natali Hanslik (Ms Nati)', 'Marwan Desky', 'Rebecca Furness'],
  },
];

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

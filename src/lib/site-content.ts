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
    mapQuery: 'Selong Belanak, Praya Barat, Lombok Tengah, Nusa Tenggara Barat',
  },
};

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/high-school', label: 'High School' },
  { href: '/activities', label: 'Activities & Camps' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const highSchoolAnnouncement = {
  headline: 'High School is now Open!',
  body: 'Selong Bay School now offers high school options for students aged 13 - 18 years old. Contact us for more information.',
  mailSubject: 'Send me info on the high school please',
};

export const testimonials = [
  {
    quote:
      "What made the biggest difference for our family wasn't the classroom. It was the community: other world-schooling parents who understood exactly what we were looking for, and kids who became fast friends.",
    name: 'Will & Brynn Noel',
    detail: 'World Schooling Family, California',
  },
  {
    quote: 'We had the best time at Selong Bay School!',
    name: 'Vicente & Margaux Luzuriaga',
    detail: 'Spain',
  },
];

export const foundingFamilies = [
  {
    name: 'Mark & Liz Berryman',
    detail: 'New Zealand, 2 years in Lombok with sons Elijah & Caleb',
  },
  {
    name: 'Jael & Levi Wunderli',
    detail: 'Switzerland, 4 years in Lombok with sons Jonah, Ari & Rio',
  },
];

export const teachers = [
  {
    name: 'Chantelle "Shani" Mullins',
    role: 'Pre-School Years (age 3–5)',
    bio: '10+ years teaching in South Africa, Hong Kong, and online. Bachelor of Education, TEFL certified, with a Reggio Emilia background and experience across Cambridge, Trinity, phonics, and autism support.',
  },
  {
    name: 'Kevin Scheunemann',
    role: 'Elementary Years (age 6–11), PE & Sport',
    bio: 'Professional footballer for Indonesia and Bachelor of Education graduate (California). Fluent in German, English, and Indonesian.',
  },
  {
    name: 'Marwan Desky Ismansyah',
    role: 'Elementary Years (age 6–11), Maths & Music',
    bio: 'Maths degree with published research on brain tumour statistics, and a multi-instrumentalist across piano, drums, guitar, woodwind, and ukulele.',
  },
];

export const ageGroups = [
  { name: 'Early Years', ages: '2–3 years' },
  { name: 'Pre-School', ages: '4–5 years' },
  { name: 'Primary', ages: '6–12 years' },
  { name: 'High School', ages: '13–18 years' },
];

export const pricing2026 = [
  { level: 'Early Years (Half Day)', annual: 40_000_000, perTerm: 10_000_000 },
  { level: 'Early Years (Full Time)', annual: 61_750_000, perTerm: 15_450_000 },
  { level: 'Pre-School (Full Time)', annual: 73_750_000, perTerm: 18_450_000 },
  { level: 'Primary Grades 1–6', annual: 95_000_000, perTerm: 23_750_000 },
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
  { time: '08:30', activity: 'Welcome / Religious Studies (optional)' },
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

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

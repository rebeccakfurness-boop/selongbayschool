/** The school's full set of year levels, in teaching order -- the landing tiles for the Lesson
 * Planning & Preparation section (src/app/admin/(dashboard)/teaching/lesson-planning/). class_name
 * is free text everywhere else in this app (see current-staff.ts/curriculum.ts), so this list is
 * a fixed reference for that browsing UI, not a DB-enforced enum -- a class_name that doesn't
 * exactly match one of these still works everywhere else, it just won't get a tile here. */
export const YEAR_LEVELS = [
  'Kindergarten 2-3',
  'Kindergarten 4-5',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'Secondary 7',
  'Secondary 8',
  'Secondary 9',
  'Secondary 10 (IGCSE)',
  'Secondary 11 (A levels)',
] as const;

export function isPrimaryYearLevel(className: string): boolean {
  return /^Primary [1-6]$/.test(className);
}

/** The six subjects every Primary year level is expected to have a programme for, matching the
 * real curriculum-imports/primary-1/*.json subject fields already authored this term. Shown as a
 * reference on a Primary year level's subject grid alongside whatever programmes actually exist,
 * so a still-empty subject reads as "not started yet" rather than simply not appearing. Secondary
 * year levels have no equivalent fixed list (IGCSE/A-level subject choice varies too much to
 * assume), so their subject grid only ever shows real existing programmes. */
export const PRIMARY_SUBJECTS = ['Mathematics', 'English', 'Science', 'Art & Design', 'Global Perspectives', 'Computing'] as const;

export function isKindergartenYearLevel(className: string): boolean {
  return className === 'Kindergarten 2-3' || className === 'Kindergarten 4-5';
}

/** Cambridge International Early Years' six areas of learning -- plays the same "not started yet"
 * placeholder role PRIMARY_SUBJECTS plays for Primary. Genuinely Cambridge for Kindergarten 4-5
 * (maps onto Cambridge's own EY2 stage, age 4-5); Cambridge has no published stage below age 3,
 * so for Kindergarten 2-3 these same six areas are used as a "Cambridge-inspired" toddler-scaled
 * reference rather than an official Cambridge offering -- see each programme's own
 * framework_label, which spells that distinction out rather than leaving it implicit here. */
export const KINDERGARTEN_AREAS_OF_LEARNING = [
  'Communication, Language & Literacy',
  'Mathematics',
  'Creative Expression',
  'Personal, Social & Emotional Development',
  'Physical Development',
  'Understanding the World',
] as const;

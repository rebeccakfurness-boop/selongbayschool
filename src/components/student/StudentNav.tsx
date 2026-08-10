import Link from 'next/link';
import StudentLogoutButton from '@/components/student/LogoutButton';

const LINKS = [
  { href: '/student', label: 'Schedule' },
  { href: '/student/curriculum', label: 'Curriculum' },
  { href: '/student/learning', label: 'Work & Resources' },
];

/** On login, students land directly on their schedule (/student) per the spec -- but Work
 * Samples, Resources, and Classroom assignments stay reachable from here rather than being
 * removed, so this nav is the "simple navigation" that keeps them one click away. */
export default function StudentNav({ active }: { active: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-sand-line pb-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-semibold hover:underline ${active === l.href ? 'text-teal-deep' : 'text-ink-soft'}`}
        >
          {l.label}
        </Link>
      ))}
      <div className="ml-auto">
        <StudentLogoutButton />
      </div>
    </div>
  );
}

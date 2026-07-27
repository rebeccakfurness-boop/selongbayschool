import type { ClassroomSubmissionRow } from '@/lib/lms-data';

const STATE_LABELS: Record<string, string> = {
  TURNED_IN: 'Turned in',
  RETURNED: 'Returned',
  CREATED: 'Not started',
  NEW: 'Not started',
  RECLAIMED_BY_STUDENT: 'Reclaimed',
};

export default function ClassroomSection({
  classroomStudentEmail,
  submissions,
}: {
  classroomStudentEmail: string | null;
  submissions: ClassroomSubmissionRow[];
}) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h3 className="font-display text-base font-semibold text-ink">Google Classroom</h3>
      {!classroomStudentEmail ? (
        <p className="mt-2 text-sm text-ink-soft">
          No Classroom email set for this child yet — set one below (Edit) to match their submissions once synced.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-soft">Matched via {classroomStudentEmail}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">{s.assignment_title}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-teal-deep">{STATE_LABELS[s.state] || s.state}</span>
                  {s.alternate_link && (
                    <a href={s.alternate_link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal-deep underline">
                      Open
                    </a>
                  )}
                </span>
              </li>
            ))}
            {submissions.length === 0 && <li className="text-sm text-ink-soft">No synced submissions yet.</li>}
          </ul>
        </>
      )}
    </div>
  );
}

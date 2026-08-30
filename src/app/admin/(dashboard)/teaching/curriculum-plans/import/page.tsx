import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import CurriculumImportForm from '@/components/admin/CurriculumImportForm';

export const dynamic = 'force-dynamic';

export default async function ImportCoursePage() {
  await ensureSchema();
  await getCurrentStaff();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Import a pre-written course</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Free -- no Anthropic API call. Paste or upload a JSON file with a fully pre-authored course (topics,
            paced lessons, objectives, worksheet content, interactive content, teaching script, quiz questions,
            flashcards -- everything already written out) and it runs through the exact same pipeline the AI
            Course Builder uses: pacing against this class&apos;s real timetable and academic calendar, DB
            insertion, &quot;Needs review&quot; gating, and real .docx/PDF worksheet generation. Nothing is
            generated on the fly and nothing costs anything to run.
          </p>
        </div>
        <Link href="/admin/teaching/curriculum-plans" className="text-sm font-semibold text-teal-deep hover:underline">
          ← Back to Curriculum Plans
        </Link>
      </div>
      <div className="mt-6">
        <CurriculumImportForm />
      </div>
    </section>
  );
}

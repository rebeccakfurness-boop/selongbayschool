import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import LogoutButton from '@/components/student/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());

  const [child] = (await sql`
    SELECT child_full_name, child_nickname, class_name FROM children WHERE id = ${session.childId}
  `) as unknown as { child_full_name: string; child_nickname: string | null; class_name: string | null }[];

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-script text-3xl text-orange-deep">Hi {child?.child_nickname || child?.child_full_name || 'there'}!</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              {child?.class_name ? `${child.class_name} · ` : ''}My Learning
            </h1>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-8 rounded-md border border-sand-line bg-paper p-8 text-center shadow-soft">
          <p className="text-[15px] text-ink-soft">
            Your upcoming lessons, resources, and work samples are coming soon here.
          </p>
        </div>
      </div>
    </div>
  );
}

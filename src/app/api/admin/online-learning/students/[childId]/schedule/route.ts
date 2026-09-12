import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import {
  addChildOnlineScheduleSlot,
  getChildForOnlineLearningAccessCheck,
  getChildOnlineProgrammeTerms,
  getChildOnlineScheduleWithNextLessons,
} from '@/lib/online-learning';
import { addOnlineScheduleSlotSchema, firstIssueMessage } from '@/lib/validation';

/** Refetches the full schedule (with each slot's resolved "current lesson") after a mutation --
 * the manager UI patches most state locally, but a newly resolved next-lesson needs the same
 * lookup this backs, so it's simpler to just ask the server again than duplicate that logic
 * client-side. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const staff = await getCurrentStaff();
  const { childId: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    const slots = await getChildOnlineScheduleWithNextLessons(childId);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/schedule] failed to load', err);
    return NextResponse.json({ error: 'Could not load this schedule.' }, { status: 500 });
  }
}

/** Adds one weekly recurring slot to a student's online timetable. The term must already be part
 * of that student's assigned programme (see the programme route) -- a slot for a term nobody
 * assigned would resolve to a lesson the student was never actually given, so this is checked here
 * rather than left to the UI to enforce. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const staff = await getCurrentStaff();
  const { childId: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = addOnlineScheduleSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid slot.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const programme = await getChildOnlineProgrammeTerms(childId);
    // String(...) on both sides: curriculum_terms.id is a Postgres BIGSERIAL, which this driver
    // returns as a string despite CurriculumTerm's `id: number` type -- d.curriculumTermId, coerced
    // to a real JS number by the zod schema, would otherwise never strictly-equal it.
    if (!programme.some((t) => String(t.id) === String(d.curriculumTermId))) {
      return NextResponse.json({ error: "That programme isn't assigned to this student yet." }, { status: 400 });
    }

    const id = await addChildOnlineScheduleSlot(childId, {
      curriculumTermId: d.curriculumTermId,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      label: d.label ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/schedule] failed to add', err);
    return NextResponse.json({ error: 'Could not add that slot.' }, { status: 500 });
  }
}

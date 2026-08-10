import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { updateQuizQuestionSchema } from '@/lib/validation';

interface QuizQuestionLookupRow {
  class_name: string;
  question: string;
  options: string[];
  correct_option_index: number;
  hint: string | null;
}

async function loadQuestion(id: number): Promise<QuizQuestionLookupRow | null> {
  const rows = (await sql`
    SELECT ct.class_name, q.question, q.options, q.correct_option_index, q.hint
    FROM curriculum_lesson_quiz_questions q
    JOIN curriculum_unit_lessons l ON l.id = q.lesson_id
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms ct ON ct.id = u.term_id
    WHERE q.id = ${id}
  `) as unknown as QuizQuestionLookupRow[];
  return rows[0] ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid question id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateQuizQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const existing = await loadQuestion(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const merged = {
      question: d.question ?? existing.question,
      options: d.options ?? existing.options,
      correctOptionIndex: d.correctOptionIndex ?? existing.correct_option_index,
      hint: d.hint !== undefined ? d.hint : existing.hint,
    };
    if (merged.correctOptionIndex >= merged.options.length) {
      return NextResponse.json({ error: 'correctOptionIndex must point at one of the options.' }, { status: 400 });
    }

    await sql`
      UPDATE curriculum_lesson_quiz_questions SET
        question = ${merged.question}, options = ${merged.options},
        correct_option_index = ${merged.correctOptionIndex}, hint = ${merged.hint}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/quiz/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update question.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid question id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await loadQuestion(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await sql`DELETE FROM curriculum_lesson_quiz_questions WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/quiz/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete question.' }, { status: 500 });
  }
}

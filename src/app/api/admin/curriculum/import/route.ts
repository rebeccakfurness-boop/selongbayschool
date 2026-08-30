import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { importCourseRequestSchema } from '@/lib/validation';
import { generateCurriculumTerm, StaticContentGenerationProvider, type GenerateCurriculumTermInput } from '@/lib/curriculum-generation';

/** Same generous ceiling as the AI Course Builder's /step route -- no LLM latency here, but a
 * large course still means dozens of sequential docx/PDF-generation + Blob-upload round trips
 * inside generateCurriculumTerm's per-lesson insert (see insertGeneratedUnit in generate.ts). */
export const maxDuration = 300;

/** The free, no-LLM path onto exactly the same pipeline the AI Course Builder uses: parses/
 * validates a fully pre-authored course JSON (see importCourseRequestSchema -- the same shape
 * AnthropicContentGenerationProvider produces internally) and hands it to
 * StaticContentGenerationProvider, which generateCurriculumTerm() then runs through real pacing,
 * DB insertion, needs_review gating, and worksheet-file generation exactly as it would for a live
 * Anthropic-backed run -- the only difference is nothing here ever calls the Anthropic API. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = importCourseRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid course JSON.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await canAccessClass(staff, d.course.input.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();

    const generateInput: GenerateCurriculumTermInput = {
      className: d.course.input.className,
      subject: d.course.input.subject,
      termLabel: d.course.input.termLabel,
      frameworkLabel: d.course.input.frameworkLabel || undefined,
      // Never read by StaticContentGenerationProvider (it returns content.parsedSyllabus as-is,
      // ignoring this field entirely) -- kept only because GenerateCurriculumTermInput requires
      // it, matching every other StaticContentGenerationProvider caller (see the content modules
      // under ./content/, which likewise pass a syllabusText nothing actually reads).
      syllabusText: '',
      requestedByAdminUserId: staff.adminUserId,
      allowUpdatingExistingTerm: d.allowUpdatingExistingTerm === true,
    };

    const provider = new StaticContentGenerationProvider(d.course.content);
    const result = await generateCurriculumTerm(generateInput, provider);
    return NextResponse.json({ result });
  } catch (err) {
    console.error('[api/admin/curriculum/import] failed', err);
    const message = err instanceof Error ? err.message : 'Could not import course.';
    const status = message.startsWith('A term already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

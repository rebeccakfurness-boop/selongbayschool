import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { getClassroomProvider } from '@/lib/classroom/provider';

export async function GET() {
  await requireAdmin();

  const provider = await getClassroomProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: 'Google Classroom is not connected.' }, { status: 400 });
  }

  try {
    const courses = await provider.listCourses();
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('[api/admin/classroom/courses] failed to list', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not list courses.' }, { status: 502 });
  }
}

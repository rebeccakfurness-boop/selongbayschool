import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';

export async function POST() {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}

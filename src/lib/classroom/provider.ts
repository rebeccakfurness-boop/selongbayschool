import { sql } from '@/lib/db';
import { StubClassroomProvider } from './stub-provider';
import { GoogleClassroomProvider } from './google-provider';
import type { ClassroomProvider } from './types';

export async function getClassroomProvider(): Promise<ClassroomProvider> {
  const rows = await sql`
    SELECT access_token, access_token_expires_at, refresh_token FROM classroom_connection WHERE id = 1
  `;
  if (rows.length === 0) {
    return new StubClassroomProvider();
  }
  return new GoogleClassroomProvider(
    rows[0] as { access_token: string; access_token_expires_at: string; refresh_token: string }
  );
}

export async function isClassroomConnected(): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM classroom_connection WHERE id = 1`;
  return rows.length > 0;
}

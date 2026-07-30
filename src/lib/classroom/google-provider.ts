import { sql } from '@/lib/db';
import type {
  ClassroomProvider,
  ClassroomCourse,
  ClassroomStudent,
  ClassroomCoursework,
  ClassroomSubmission,
} from './types';

const CLASSROOM_API = 'https://classroom.googleapis.com/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ConnectionRow {
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string;
}

/** Plain fetch against Google's REST APIs rather than the `googleapis` npm package — that
 * package pulls in a large dependency tree for what's ultimately about a dozen simple, stable,
 * well-documented REST calls. */
export class GoogleClassroomProvider implements ClassroomProvider {
  private connection: ConnectionRow;

  constructor(connection: ConnectionRow) {
    this.connection = connection;
  }

  isConfigured(): boolean {
    return true;
  }

  private async getAccessToken(): Promise<string> {
    const expiresAt = new Date(this.connection.access_token_expires_at).getTime();
    if (expiresAt > Date.now() + 60_000) {
      return this.connection.access_token;
    }

    const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLASSROOM_CLIENT_ID/SECRET not set.');
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to refresh Google Classroom access token: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    await sql`
      UPDATE classroom_connection SET access_token = ${data.access_token}, access_token_expires_at = ${newExpiresAt}::timestamptz
      WHERE id = 1
    `;
    this.connection = { ...this.connection, access_token: data.access_token, access_token_expires_at: newExpiresAt };
    return data.access_token;
  }

  private async apiGet<T>(path: string): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${CLASSROOM_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Google Classroom API error on ${path}: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async listCourses(): Promise<ClassroomCourse[]> {
    const courses: ClassroomCourse[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.apiGet<{
        courses?: { id: string; name: string; section?: string }[];
        nextPageToken?: string;
      }>(`/courses?courseStates=ACTIVE&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`);
      for (const c of data.courses ?? []) {
        courses.push({ id: c.id, name: c.name, section: c.section ?? null });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return courses;
  }

  async listStudents(courseId: string): Promise<ClassroomStudent[]> {
    const students: ClassroomStudent[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.apiGet<{
        students?: { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }[];
        nextPageToken?: string;
      }>(`/courses/${courseId}/students?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`);
      for (const s of data.students ?? []) {
        students.push({
          userId: s.userId,
          name: s.profile?.name?.fullName ?? 'Unknown',
          email: s.profile?.emailAddress ?? null,
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return students;
  }

  async listCoursework(courseId: string): Promise<ClassroomCoursework[]> {
    const coursework: ClassroomCoursework[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.apiGet<{
        courseWork?: {
          id: string;
          title: string;
          description?: string;
          alternateLink?: string;
          dueDate?: { year: number; month: number; day: number };
        }[];
        nextPageToken?: string;
      }>(`/courses/${courseId}/courseWork?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`);
      for (const w of data.courseWork ?? []) {
        const due = w.dueDate
          ? `${w.dueDate.year}-${String(w.dueDate.month).padStart(2, '0')}-${String(w.dueDate.day).padStart(2, '0')}`
          : null;
        coursework.push({
          id: w.id,
          title: w.title,
          description: w.description ?? null,
          dueDate: due,
          alternateLink: w.alternateLink ?? null,
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return coursework;
  }

  async listSubmissions(courseId: string, courseworkId: string): Promise<ClassroomSubmission[]> {
    const submissions: ClassroomSubmission[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.apiGet<{
        studentSubmissions?: { id: string; courseWorkId: string; userId: string; state: string; alternateLink?: string }[];
        nextPageToken?: string;
      }>(`/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`);
      for (const s of data.studentSubmissions ?? []) {
        submissions.push({
          id: s.id,
          courseWorkId: s.courseWorkId,
          userId: s.userId,
          state: s.state,
          alternateLink: s.alternateLink ?? null,
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return submissions;
  }
}

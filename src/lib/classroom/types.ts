/**
 * Clean interface the rest of the app codes against, so nothing else depends on Google
 * credentials actually being configured. `getClassroomProvider()` in provider.ts returns a
 * StubClassroomProvider (isConfigured() === false, empty results) until a real OAuth connection
 * exists, and a GoogleClassroomProvider once one does.
 */
export interface ClassroomCourse {
  id: string;
  name: string;
  section: string | null;
}

export interface ClassroomStudent {
  userId: string;
  name: string;
  email: string | null;
}

export interface ClassroomCoursework {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  alternateLink: string | null;
}

export interface ClassroomSubmission {
  id: string;
  courseWorkId: string;
  userId: string;
  state: string;
  alternateLink: string | null;
}

export interface ClassroomProvider {
  isConfigured(): boolean;
  listCourses(): Promise<ClassroomCourse[]>;
  listStudents(courseId: string): Promise<ClassroomStudent[]>;
  listCoursework(courseId: string): Promise<ClassroomCoursework[]>;
  listSubmissions(courseId: string, courseworkId: string): Promise<ClassroomSubmission[]>;
}

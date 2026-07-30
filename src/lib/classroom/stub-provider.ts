import type {
  ClassroomProvider,
  ClassroomCourse,
  ClassroomStudent,
  ClassroomCoursework,
  ClassroomSubmission,
} from './types';

/** Used whenever there's no Google Classroom connection yet — every call returns an empty
 * result rather than throwing, so pages can render normally with a "not connected" message
 * instead of needing try/catch everywhere they touch Classroom data. */
export class StubClassroomProvider implements ClassroomProvider {
  isConfigured(): boolean {
    return false;
  }
  async listCourses(): Promise<ClassroomCourse[]> {
    return [];
  }
  async listStudents(): Promise<ClassroomStudent[]> {
    return [];
  }
  async listCoursework(): Promise<ClassroomCoursework[]> {
    return [];
  }
  async listSubmissions(): Promise<ClassroomSubmission[]> {
    return [];
  }
}

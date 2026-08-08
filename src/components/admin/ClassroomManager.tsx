'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

interface Course {
  id: string;
  name: string;
  section: string | null;
}

interface Mapping {
  google_course_id: string;
  google_course_name: string;
  class_name: string;
}

export default function ClassroomManager({
  connectionEmail,
  lastSyncedAt,
  initialMappings,
  classOptions,
}: {
  connectionEmail: string;
  lastSyncedAt: string | null;
  initialMappings: Mapping[];
  classOptions: string[];
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>(
    Object.fromEntries(initialMappings.map((m) => [m.google_course_id, m.class_name]))
  );
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

  async function loadCourses() {
    setLoadingCourses(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/classroom/courses');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load courses');
      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  }

  async function saveMapping(course: Course) {
    const className = mappings[course.id];
    if (!className) return;
    setSavingCourseId(course.id);
    setMappingError(null);
    try {
      const res = await fetch('/api/admin/classroom/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleCourseId: course.id, googleCourseName: course.name, className }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save mapping');
      router.refresh();
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : 'Failed to save mapping');
    } finally {
      setSavingCourseId(null);
    }
  }

  async function sync() {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/classroom/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(
        `Synced ${data.assignmentsSynced} assignments and ${data.submissionsSynced} submissions (${data.submissionsMatched} matched to a child).${
          data.errors.length ? ` Errors for: ${data.errors.join(', ')}` : ''
        }`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Classroom? Synced assignments/submissions already saved will stay, but nothing new will sync until reconnected.')) return;
    await fetch('/api/admin/classroom/disconnect', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">
              Connected as <span className="font-semibold text-ink">{connectionEmail}</span>
            </p>
            <p className="text-xs text-ink-soft">
              {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString('en-AU', { timeZone: 'Asia/Makassar' })}` : 'Never synced yet'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="primary" onClick={sync} disabled={syncing || Object.keys(mappings).length === 0}>
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Button>
            <Button type="button" variant="ghost" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
        {syncResult && <p className="mt-3 text-sm font-semibold text-teal-deep">{syncResult}</p>}
        {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Course mapping</h2>
          <Button type="button" variant="ghost" onClick={loadCourses} disabled={loadingCourses}>
            {loadingCourses ? 'Loading…' : 'Load courses from Google'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          A course only syncs once it&apos;s mapped to one of the school&apos;s class names — course names in Google
          Classroom won&apos;t reliably match automatically.
        </p>
        {classOptions.length === 0 && (
          <p className="mt-2 text-xs font-semibold text-orange-deep">
            No class names found yet — set a Class on at least one Child Card first, so there&apos;s something to map
            a course to.
          </p>
        )}
        {mappingError && <p className="mt-2 text-xs font-semibold text-orange-deep">{mappingError}</p>}

        {courses && (
          <div className="mt-4 flex flex-col gap-3">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between gap-3 rounded-sm border border-sand-line px-3 py-2">
                <span className="text-sm font-semibold text-ink">
                  {course.name}
                  {course.section && <span className="ml-2 text-xs font-normal text-ink-soft">{course.section}</span>}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={mappings[course.id] ?? ''}
                    onChange={(e) => setMappings((prev) => ({ ...prev, [course.id]: e.target.value }))}
                    className="rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
                  >
                    <option value="">Not mapped</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => saveMapping(course)}
                    disabled={!mappings[course.id] || savingCourseId === course.id}
                    className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-40"
                  >
                    {savingCourseId === course.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="text-sm text-ink-soft">No active courses found in this Google account.</p>}
          </div>
        )}

        {!courses && initialMappings.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {initialMappings.map((m) => (
              <li key={m.google_course_id} className="text-sm text-ink-soft">
                {m.google_course_name} → <span className="font-semibold text-ink">{m.class_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

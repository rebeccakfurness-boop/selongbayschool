'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import InteractiveLessonStepper from '@/components/curriculum/interactive/InteractiveLessonStepper';
import type { CurriculumTerm, CurriculumTermTree, CurriculumUnit, CurriculumLesson, LessonProgressStatus, CurriculumQuizQuestion, QuizType } from '@/lib/curriculum';

export type ClassRoster = { id: number; label: string }[];

const STATUS_OPTIONS: { value: LessonProgressStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

async function apiCall(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function CurriculumPlanManager({
  initialTerms,
  classOptions,
  childrenByClass,
  isAdmin,
}: {
  initialTerms: CurriculumTerm[];
  classOptions: string[];
  childrenByClass: Record<string, ClassRoster>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [terms, setTerms] = useState(initialTerms);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termTree, setTermTree] = useState<CurriculumTermTree | null>(null);
  const [progressByChild, setProgressByChild] = useState<Map<number, Map<number, LessonProgressStatus>>>(new Map());
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [className, setClassName] = useState(classOptions[0] ?? '');
  const [subject, setSubject] = useState('');
  const [termLabel, setTermLabel] = useState('');
  const [frameworkLabel, setFrameworkLabel] = useState('');
  const [creatingTerm, setCreatingTerm] = useState(false);

  async function selectTerm(termId: number) {
    setSelectedTermId(termId);
    setLoadingTerm(true);
    setError(null);
    try {
      const { ok, data } = await apiCall(`/api/admin/curriculum/terms/${termId}`, 'GET');
      if (!ok) throw new Error((data.error as string) || 'Failed to load programme');
      setTermTree(data.term as CurriculumTermTree);
      const entries = (data.progress as [number, [number, LessonProgressStatus][]][]) ?? [];
      setProgressByChild(new Map(entries.map(([childId, m]) => [childId, new Map(m)])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programme');
    } finally {
      setLoadingTerm(false);
    }
  }

  async function createTerm() {
    setCreatingTerm(true);
    setError(null);
    try {
      const { ok, data } = await apiCall('/api/admin/curriculum/terms', 'POST', {
        className,
        subject,
        termLabel,
        frameworkLabel: frameworkLabel || null,
      });
      if (!ok) throw new Error((data.error as string) || 'Failed to create programme');
      const newTerm: CurriculumTerm = {
        id: data.id as number,
        class_name: className,
        subject,
        term_label: termLabel,
        framework_label: frameworkLabel || null,
        exam_board: null,
        exam_series: null,
        syllabus_pdf_url: null,
        workbook_pdf_url: null,
      };
      setTerms((prev) => [...prev, newTerm]);
      setSubject('');
      setTermLabel('');
      setFrameworkLabel('');
      router.refresh();
      selectTerm(newTerm.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create programme');
    } finally {
      setCreatingTerm(false);
    }
  }

  async function deleteTerm(termId: number) {
    setTerms((prev) => prev.filter((t) => t.id !== termId));
    if (selectedTermId === termId) {
      setSelectedTermId(null);
      setTermTree(null);
    }
    await apiCall(`/api/admin/curriculum/terms/${termId}`, 'DELETE');
    router.refresh();
  }

  function refreshTermTree() {
    if (selectedTermId) selectTerm(selectedTermId);
  }

  async function updateTermMeta(
    termId: number,
    meta: { className: string; subject: string; termLabel: string; frameworkLabel: string | null }
  ): Promise<string | null> {
    const { ok, data } = await apiCall(`/api/admin/curriculum/terms/${termId}`, 'PATCH', meta);
    if (!ok) return (data.error as string) || 'Failed to update programme';
    setTerms((prev) =>
      prev.map((t) =>
        t.id === termId
          ? { ...t, class_name: meta.className, subject: meta.subject, term_label: meta.termLabel, framework_label: meta.frameworkLabel }
          : t
      )
    );
    setTermTree((prev) =>
      prev && prev.id === termId
        ? { ...prev, class_name: meta.className, subject: meta.subject, term_label: meta.termLabel, framework_label: meta.frameworkLabel }
        : prev
    );
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="font-semibold text-orange-deep">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/admin/teaching/curriculum-plans/import"
          className="rounded-full border-2 border-teal-deep px-4 py-1.5 text-xs font-bold text-teal-deep hover:bg-teal-deep hover:text-white"
        >
          📥 Import a pre-written course (free)
        </Link>
        <Link
          href="/admin/teaching/curriculum-plans/new"
          title="Uses the Anthropic API -- incurs a real cost per generation"
          className="rounded-full bg-orange px-4 py-1.5 text-xs font-bold text-ink hover:bg-orange-deep hover:text-white"
        >
          ✨ Generate a new course (AI, ⚠️ paid)
        </Link>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">New programme</h2>
        <p className="mt-1 text-xs text-ink-soft">
          One class, one subject, one term (e.g. &quot;Primary 1 · Mathematics · Term 1 2026/27&quot;).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Class" htmlFor="term-class" required>
            <TextInput id="term-class" list="term-class-options" required value={className} onChange={(e) => setClassName(e.target.value)} />
            <datalist id="term-class-options">
              {classOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Subject" htmlFor="term-subject" required>
            <TextInput id="term-subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
          </Field>
          <Field label="Term" htmlFor="term-label" required>
            <TextInput id="term-label" required value={termLabel} onChange={(e) => setTermLabel(e.target.value)} placeholder="e.g. Term 1 2026/27" />
          </Field>
          <Field label="Curriculum framework" htmlFor="term-framework">
            <TextInput id="term-framework" value={frameworkLabel} onChange={(e) => setFrameworkLabel(e.target.value)} placeholder="e.g. Cambridge Primary" />
          </Field>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            onClick={createTerm}
            disabled={creatingTerm || !className.trim() || !subject.trim() || !termLabel.trim()}
          >
            {creatingTerm ? 'Creating…' : 'Create programme'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {terms.map((t) => {
          const unmatched = isAdmin && !classOptions.includes(t.class_name);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTerm(t.id)}
              title={unmatched ? "This class doesn't match any class name in use on a Child Card yet" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                selectedTermId === t.id ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
              } ${unmatched ? 'border-orange text-orange-deep' : ''}`}
            >
              {unmatched && '⚠ '}
              {t.class_name} · {t.subject} · {t.term_label}
            </button>
          );
        })}
        {terms.length === 0 && <p className="text-sm text-ink-soft">No programmes yet. Create one above.</p>}
      </div>

      {loadingTerm && <p className="text-sm text-ink-soft">Loading…</p>}

      {!loadingTerm && termTree && (
        <TermEditor
          term={termTree}
          roster={childrenByClass[termTree.class_name] ?? []}
          progressByChild={progressByChild}
          isAdmin={isAdmin}
          classOptions={classOptions}
          onDeleteTerm={() => deleteTerm(termTree.id)}
          onRefresh={refreshTermTree}
          onUpdateMeta={(meta) => updateTermMeta(termTree.id, meta)}
        />
      )}
    </div>
  );
}

function TermEditor({
  term,
  roster,
  progressByChild,
  isAdmin,
  classOptions,
  onDeleteTerm,
  onRefresh,
  onUpdateMeta,
}: {
  term: CurriculumTermTree;
  roster: ClassRoster;
  progressByChild: Map<number, Map<number, LessonProgressStatus>>;
  isAdmin: boolean;
  classOptions: string[];
  onDeleteTerm: () => void;
  onRefresh: () => void;
  onUpdateMeta: (meta: { className: string; subject: string; termLabel: string; frameworkLabel: string | null }) => Promise<string | null>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaClassName, setMetaClassName] = useState(term.class_name);
  const [metaSubject, setMetaSubject] = useState(term.subject);
  const [metaTermLabel, setMetaTermLabel] = useState(term.term_label);
  const [metaFrameworkLabel, setMetaFrameworkLabel] = useState(term.framework_label ?? '');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const unmatchedClass = isAdmin && !classOptions.includes(term.class_name);

  function startEditingMeta() {
    setMetaClassName(term.class_name);
    setMetaSubject(term.subject);
    setMetaTermLabel(term.term_label);
    setMetaFrameworkLabel(term.framework_label ?? '');
    setMetaError(null);
    setEditingMeta(true);
  }

  async function saveMeta() {
    setSavingMeta(true);
    setMetaError(null);
    const err = await onUpdateMeta({
      className: metaClassName,
      subject: metaSubject,
      termLabel: metaTermLabel,
      frameworkLabel: metaFrameworkLabel || null,
    });
    setSavingMeta(false);
    if (err) {
      setMetaError(err);
    } else {
      setEditingMeta(false);
    }
  }

  async function addUnit() {
    setAddingUnit(true);
    await apiCall('/api/admin/curriculum/units', 'POST', { termId: term.id, title: newUnitTitle, description: newUnitDescription || null });
    setNewUnitTitle('');
    setNewUnitDescription('');
    setAddingUnit(false);
    onRefresh();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-teal-deep">
            {term.class_name} · {term.subject} · {term.term_label}
          </h2>
          {term.framework_label && <p className="text-xs text-ink-soft">{term.framework_label}</p>}
          {unmatchedClass && !editingMeta && (
            <p className="mt-1 text-xs font-semibold text-orange-deep">
              ⚠ &quot;{term.class_name}&quot; doesn&apos;t match any class name in use on a Child Card, so no teacher
              is scoped to see this yet. Edit the class below to fix it.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/teaching/curriculum-plans/${term.id}`}
            className="rounded-full border-2 border-teal-deep px-4 py-1.5 text-xs font-bold text-teal-deep hover:bg-teal-deep hover:text-white"
          >
            Planning Dashboard →
          </Link>
          {isAdmin && (
            <button type="button" onClick={() => (editingMeta ? setEditingMeta(false) : startEditingMeta())} className="text-xs font-semibold text-teal-deep hover:underline">
              {editingMeta ? 'Cancel' : 'Edit class/subject/term'}
            </button>
          )}
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-deep">Delete this whole programme?</span>
              <Button type="button" variant="primary" onClick={onDeleteTerm}>Yes, delete</Button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs font-semibold text-ink-soft hover:underline">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold text-orange-deep hover:underline">
              Delete programme
            </button>
          )}
        </div>
      </div>

      {editingMeta && (
        <div className="mt-4 rounded-md border border-dashed border-teal/40 bg-teal/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Class" htmlFor="meta-class" required>
              <TextInput id="meta-class" list="meta-class-options" required value={metaClassName} onChange={(e) => setMetaClassName(e.target.value)} />
              <datalist id="meta-class-options">
                {classOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Subject" htmlFor="meta-subject" required>
              <TextInput id="meta-subject" required value={metaSubject} onChange={(e) => setMetaSubject(e.target.value)} />
            </Field>
            <Field label="Term" htmlFor="meta-term" required>
              <TextInput id="meta-term" required value={metaTermLabel} onChange={(e) => setMetaTermLabel(e.target.value)} />
            </Field>
            <Field label="Curriculum framework" htmlFor="meta-framework">
              <TextInput id="meta-framework" value={metaFrameworkLabel} onChange={(e) => setMetaFrameworkLabel(e.target.value)} />
            </Field>
          </div>
          {metaError && <p className="mt-2 text-xs font-semibold text-orange-deep">{metaError}</p>}
          <div className="mt-3">
            <Button
              type="button"
              variant="primary"
              onClick={saveMeta}
              disabled={savingMeta || !metaClassName.trim() || !metaSubject.trim() || !metaTermLabel.trim()}
            >
              {savingMeta ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {term.units.map((unit, i) => (
          <UnitBlock
            key={unit.id}
            unit={unit}
            index={i}
            isFirst={i === 0}
            isLast={i === term.units.length - 1}
            roster={roster}
            progressByChild={progressByChild}
            onRefresh={onRefresh}
          />
        ))}
        {term.units.length === 0 && <p className="text-sm text-ink-soft">No units yet. Add the first one below.</p>}
      </div>

      <div className="mt-4 rounded-md border border-dashed border-sand-line p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Add unit</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field label="Title" htmlFor="new-unit-title" required>
            <TextInput id="new-unit-title" value={newUnitTitle} onChange={(e) => setNewUnitTitle(e.target.value)} placeholder="e.g. Unit 1: Numbers to 10" />
          </Field>
          <Field label="Description" htmlFor="new-unit-description">
            <TextInput id="new-unit-description" value={newUnitDescription} onChange={(e) => setNewUnitDescription(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3">
          <Button type="button" variant="primary" onClick={addUnit} disabled={addingUnit || !newUnitTitle.trim()}>
            {addingUnit ? 'Adding…' : 'Add unit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnitBlock({
  unit,
  index,
  isFirst,
  isLast,
  roster,
  progressByChild,
  onRefresh,
}: {
  unit: CurriculumUnit;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  roster: ClassRoster;
  progressByChild: Map<number, Map<number, LessonProgressStatus>>;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(unit.title);
  const [description, setDescription] = useState(unit.description ?? '');
  const [saving, setSaving] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);

  async function saveUnit() {
    setSaving(true);
    await apiCall(`/api/admin/curriculum/units/${unit.id}`, 'PATCH', { title, description: description || null });
    setSaving(false);
    setEditing(false);
    onRefresh();
  }

  async function deleteUnit() {
    await apiCall(`/api/admin/curriculum/units/${unit.id}`, 'DELETE');
    onRefresh();
  }

  async function reorder(direction: 'up' | 'down') {
    await apiCall(`/api/admin/curriculum/units/${unit.id}/reorder`, 'POST', { direction });
    onRefresh();
  }

  async function addLesson() {
    setAddingLesson(true);
    await apiCall('/api/admin/curriculum/lessons', 'POST', { unitId: unit.id, title: newLessonTitle });
    setNewLessonTitle('');
    setAddingLesson(false);
    setExpanded(true);
    onRefresh();
  }

  return (
    <div className="rounded-md border border-sand-line">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-1 text-left">
          <span className="font-display text-base font-semibold text-ink">Unit {index + 1}: {unit.title}</span>
          <span className="ml-2 text-xs text-ink-soft">{unit.lessons.length} lesson{unit.lessons.length === 1 ? '' : 's'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => reorder('up')} disabled={isFirst} className="text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-30">↑</button>
          <button type="button" onClick={() => reorder('down')} disabled={isLast} className="text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-30">↓</button>
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-semibold text-teal-deep hover:underline">{editing ? 'Cancel' : 'Edit'}</button>
          <button type="button" onClick={deleteUnit} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
        </div>
      </div>

      {editing && (
        <div className="grid gap-3 border-t border-sand-line/60 px-4 py-3 sm:grid-cols-2">
          <Field label="Title" htmlFor={`unit-title-${unit.id}`} required>
            <TextInput id={`unit-title-${unit.id}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor={`unit-desc-${unit.id}`}>
            <TextInput id={`unit-desc-${unit.id}`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="button" variant="primary" onClick={saveUnit} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save unit'}
            </Button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-sand-line">
          {unit.lessons.map((lesson, i) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={i}
              isFirst={i === 0}
              isLast={i === unit.lessons.length - 1}
              roster={roster}
              progressByChild={progressByChild}
              onRefresh={onRefresh}
            />
          ))}
          <div className="flex items-center gap-2 border-t border-sand-line/60 px-4 py-3">
            <TextInput
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="e.g. Lesson 1: Counting to 10"
              className="max-w-sm"
            />
            <Button type="button" variant="primary" onClick={addLesson} disabled={addingLesson || !newLessonTitle.trim()}>
              {addingLesson ? 'Adding…' : 'Add lesson'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  isFirst,
  isLast,
  roster,
  progressByChild,
  onRefresh,
}: {
  lesson: CurriculumLesson;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  roster: ClassRoster;
  progressByChild: Map<number, Map<number, LessonProgressStatus>>;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [objectives, setObjectives] = useState(lesson.objectives ?? '');
  const [worksheetUrl, setWorksheetUrl] = useState(lesson.worksheet_url);
  const [worksheetTitle, setWorksheetTitle] = useState(lesson.worksheet_title ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '');
  const [videoTitle, setVideoTitle] = useState(lesson.video_title ?? '');
  const [equipmentNote, setEquipmentNote] = useState(lesson.equipment_note ?? '');
  const [saving, setSaving] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [addingResource, setAddingResource] = useState(false);

  async function saveLesson() {
    setSaving(true);
    await apiCall(`/api/admin/curriculum/lessons/${lesson.id}`, 'PATCH', {
      title,
      objectives: objectives || null,
      worksheetUrl: worksheetUrl || null,
      worksheetTitle: worksheetTitle || null,
      videoUrl: videoUrl || null,
      videoTitle: videoTitle || null,
      equipmentNote: equipmentNote || null,
    });
    setSaving(false);
    onRefresh();
  }

  async function deleteLesson() {
    await apiCall(`/api/admin/curriculum/lessons/${lesson.id}`, 'DELETE');
    onRefresh();
  }

  async function reorder(direction: 'up' | 'down') {
    await apiCall(`/api/admin/curriculum/lessons/${lesson.id}/reorder`, 'POST', { direction });
    onRefresh();
  }

  async function addResource() {
    setAddingResource(true);
    await apiCall(`/api/admin/curriculum/lessons/${lesson.id}/resources`, 'POST', { title: newResourceTitle, url: newResourceUrl });
    setNewResourceTitle('');
    setNewResourceUrl('');
    setAddingResource(false);
    onRefresh();
  }

  async function deleteResource(id: number) {
    await apiCall(`/api/admin/curriculum/resources/${id}`, 'DELETE');
    onRefresh();
  }

  async function setChildProgress(childId: number, status: LessonProgressStatus) {
    await apiCall('/api/admin/curriculum/progress', 'PATCH', { childId, lessonId: lesson.id, status });
    onRefresh();
  }

  const [publishing, setPublishing] = useState(false);
  async function publish() {
    setPublishing(true);
    await apiCall(`/api/admin/curriculum/lessons/${lesson.id}`, 'PATCH', { reviewStatus: 'published' });
    setPublishing(false);
    onRefresh();
  }

  const [previewing, setPreviewing] = useState(false);

  return (
    <div className="border-t border-sand-line/60 px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          Lesson {index + 1}: {lesson.title}
          {lesson.review_status === 'needs_review' && (
            <span className="rounded-full bg-orange/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-deep">
              Needs review
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {lesson.review_status === 'needs_review' && (
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="rounded-full bg-teal px-3 py-1 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
          {lesson.interactive_content && (
            <button
              type="button"
              onClick={() => setPreviewing((v) => !v)}
              className="rounded-full border-2 border-orange-deep px-3 py-1 text-xs font-bold text-orange-deep hover:bg-orange/10"
            >
              {previewing ? 'Close preview' : 'Preview'}
            </button>
          )}
          <button type="button" onClick={() => reorder('up')} disabled={isFirst} className="text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-30">↑</button>
          <button type="button" onClick={() => reorder('down')} disabled={isLast} className="text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-30">↓</button>
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-semibold text-teal-deep hover:underline">{editing ? 'Close' : 'Edit'}</button>
          <button type="button" onClick={deleteLesson} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
        </div>
      </div>

      {previewing && lesson.interactive_content && (
        <div className="mt-3 overflow-hidden rounded-md border-2 border-orange-deep/30">
          <p className="bg-orange/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-orange-deep">
            Preview -- read-only, nothing here is saved
          </p>
          <InteractiveLessonStepper
            lesson={lesson}
            content={lesson.interactive_content}
            onExit={() => setPreviewing(false)}
            onComplete={() => setPreviewing(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mt-3 flex flex-col gap-3 border-t border-sand-line/60 pt-3">
          <Field label="Title" htmlFor={`lesson-title-${lesson.id}`} required>
            <TextInput id={`lesson-title-${lesson.id}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Objectives / overview" htmlFor={`lesson-objectives-${lesson.id}`}>
            <TextArea id={`lesson-objectives-${lesson.id}`} rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </Field>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Worksheet</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <DocumentUploadField
                currentUrl={worksheetUrl}
                pathPrefix="curriculum-worksheets"
                label="worksheet"
                onUploaded={(url) => setWorksheetUrl(url)}
                uploadEndpoint="/api/admin/lms/upload"
              />
              <TextInput
                value={worksheetTitle}
                onChange={(e) => setWorksheetTitle(e.target.value)}
                placeholder="Worksheet name shown to parents, e.g. Counting to 10 worksheet"
                className="max-w-xs"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Complete online: equipment &amp; video</p>
            <p className="mt-1 text-xs text-ink-soft">
              Shown on the &quot;Introduction&quot; step of the self-directed online lesson. Video is optional;
              the step still appears without one, just with a &quot;no video yet&quot; placeholder.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <TextArea
                value={equipmentNote}
                onChange={(e) => setEquipmentNote(e.target.value)}
                rows={2}
                placeholder="e.g. pencil, the printed worksheet, and something to count with"
              />
              <div className="flex flex-wrap items-center gap-2">
                <TextInput value={videoUrl ?? ''} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (YouTube, Drive, etc.)" className="max-w-sm" />
                <TextInput value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title shown to students" className="max-w-xs" />
              </div>
            </div>
          </div>

          <QuizEditor lessonId={lesson.id} quizType="starter" label="Starter quiz" questions={lesson.starter_quiz} onRefresh={onRefresh} />
          <QuizEditor lessonId={lesson.id} quizType="exit" label="Exit quiz" questions={lesson.exit_quiz} onRefresh={onRefresh} />

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Resources</p>
            <ul className="mt-1 flex flex-col gap-1">
              {lesson.resources.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">{r.title}</a>
                  <button type="button" onClick={() => deleteResource(r.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TextInput value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} placeholder="Resource title" className="max-w-[160px]" />
              <TextInput value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} placeholder="https://..." className="max-w-xs" />
              <button
                type="button"
                onClick={addResource}
                disabled={addingResource || !newResourceTitle.trim() || !newResourceUrl.trim()}
                className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-40"
              >
                Add resource
              </button>
            </div>
          </div>

          <div>
            <Button type="button" variant="primary" onClick={saveLesson} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save lesson'}
            </Button>
          </div>

          {roster.length > 0 && (
            <div className="border-t border-sand-line/60 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Class progress</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {roster.map((child) => {
                  const status = progressByChild.get(child.id)?.get(lesson.id) ?? 'not_started';
                  return (
                    <label key={child.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-ink">{child.label}</span>
                      <select
                        value={status}
                        onChange={(e) => setChildProgress(child.id, e.target.value as LessonProgressStatus)}
                        className="rounded-sm border border-sand-line bg-white px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuizEditor({
  lessonId,
  quizType,
  label,
  questions,
  onRefresh,
}: {
  lessonId: number;
  quizType: QuizType;
  label: string;
  questions: CurriculumQuizQuestion[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newHint, setNewHint] = useState('');
  const [saving, setSaving] = useState(false);

  function updateOption(i: number, value: string) {
    setNewOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOptionField() {
    setNewOptions((prev) => (prev.length >= 6 ? prev : [...prev, '']));
  }

  function removeOptionField(i: number) {
    setNewOptions((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, idx) => idx !== i);
      if (newCorrectIndex >= next.length) setNewCorrectIndex(0);
      return next;
    });
  }

  async function addQuestion() {
    const options = newOptions.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    setSaving(true);
    await apiCall(`/api/admin/curriculum/lessons/${lessonId}/quiz`, 'POST', {
      quizType,
      question: newQuestion,
      options,
      correctOptionIndex: Math.min(newCorrectIndex, options.length - 1),
      hint: newHint || null,
    });
    setNewQuestion('');
    setNewOptions(['', '']);
    setNewCorrectIndex(0);
    setNewHint('');
    setSaving(false);
    setAdding(false);
    onRefresh();
  }

  async function deleteQuestion(id: number) {
    await apiCall(`/api/admin/curriculum/quiz/${id}`, 'DELETE');
    onRefresh();
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label} <span className="font-normal normal-case text-ink-soft/70">({questions.length} question{questions.length === 1 ? '' : 's'})</span>
      </p>
      <ul className="mt-1 flex flex-col gap-1.5">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-sm border border-sand-line p-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-ink">{i + 1}. {q.question}</span>
              <button type="button" onClick={() => deleteQuestion(q.id)} className="whitespace-nowrap text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </div>
            <ul className="mt-1 flex flex-col gap-0.5">
              {q.options.map((o, oi) => (
                <li key={oi} className={`text-xs ${oi === q.correct_option_index ? 'font-bold text-teal-deep' : 'text-ink-soft'}`}>
                  {oi === q.correct_option_index ? '✓ ' : '· '}
                  {o}
                </li>
              ))}
            </ul>
            {q.hint && <p className="mt-1 text-xs italic text-ink-soft">Hint: {q.hint}</p>}
          </li>
        ))}
        {questions.length === 0 && <li className="text-xs text-ink-soft">No questions yet.</li>}
      </ul>

      {adding ? (
        <div className="mt-2 rounded-sm border border-dashed border-sand-line p-3">
          <TextInput value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Question text" className="w-full" />
          <div className="mt-2 flex flex-col gap-1.5">
            {newOptions.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${lessonId}-${quizType}`}
                  checked={newCorrectIndex === i}
                  onChange={() => setNewCorrectIndex(i)}
                  aria-label={`Option ${i + 1} is correct`}
                />
                <TextInput value={o} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1" />
                {newOptions.length > 2 && (
                  <button type="button" onClick={() => removeOptionField(i)} className="text-xs font-semibold text-orange-deep hover:underline">✕</button>
                )}
              </div>
            ))}
            {newOptions.length < 6 && (
              <button type="button" onClick={addOptionField} className="self-start text-xs font-semibold text-teal-deep hover:underline">
                + Add another option
              </button>
            )}
          </div>
          <TextInput value={newHint} onChange={(e) => setNewHint(e.target.value)} placeholder="Hint (optional)" className="mt-2 w-full" />
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={addQuestion}
              disabled={saving || !newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2}
            >
              {saving ? 'Adding…' : 'Add question'}
            </Button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-ink-soft hover:underline">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-1 text-xs font-semibold text-teal-deep hover:underline">
          + Add question
        </button>
      )}
    </div>
  );
}

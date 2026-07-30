'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { ACHIEVEMENT_SCALE, EFFORT_SCALE, SOCIAL_CRITERIA, SOCIAL_RATING_LABELS, type SocialRating } from '@/lib/family-data';

interface SubjectFormRow {
  subjectArea: string;
  subSubject: string;
  achievement: string;
  effort: string;
  teacherComment: string;
}

const DEFAULT_SUBJECTS: SubjectFormRow[] = [
  { subjectArea: 'English', subSubject: '', achievement: '', effort: '', teacherComment: '' },
  { subjectArea: 'Mathematics', subSubject: '', achievement: '', effort: '', teacherComment: '' },
  { subjectArea: 'Science and Technology', subSubject: '', achievement: '', effort: '', teacherComment: '' },
  { subjectArea: 'Human Society and its Environment', subSubject: '', achievement: '', effort: '', teacherComment: '' },
  { subjectArea: 'Personal Development, Health and PE', subSubject: '', achievement: '', effort: '', teacherComment: '' },
  { subjectArea: 'Creative Arts', subSubject: '', achievement: '', effort: '', teacherComment: '' },
];

export interface LearningProfileFormData {
  id?: number;
  termLabel: string;
  gradeLabel: string;
  generalComment: string;
  wholeDaysAbsent: string;
  partialDaysAbsent: string;
  extraActivities: string;
  positiveAttitude: SocialRating | '';
  respectsRightsOfOthers: SocialRating | '';
  respectsClassSchoolRules: SocialRating | '';
  worksWellIndependently: SocialRating | '';
  showsInitiativeEnthusiasm: SocialRating | '';
  helpsEncouragesOthers: SocialRating | '';
  subjects: SubjectFormRow[];
}

export const emptyLearningProfileForm: LearningProfileFormData = {
  termLabel: '',
  gradeLabel: '',
  generalComment: '',
  wholeDaysAbsent: '',
  partialDaysAbsent: '',
  extraActivities: '',
  positiveAttitude: '',
  respectsRightsOfOthers: '',
  respectsClassSchoolRules: '',
  worksWellIndependently: '',
  showsInitiativeEnthusiasm: '',
  helpsEncouragesOthers: '',
  subjects: DEFAULT_SUBJECTS,
};

const socialFields = [
  'positiveAttitude',
  'respectsRightsOfOthers',
  'respectsClassSchoolRules',
  'worksWellIndependently',
  'showsInitiativeEnthusiasm',
  'helpsEncouragesOthers',
] as const;

export default function LearningProfileForm({
  childId,
  initial,
}: {
  childId: number;
  initial: LearningProfileFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LearningProfileFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LearningProfileFormData>(key: K, value: LearningProfileFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSubject(index: number, key: keyof SubjectFormRow, value: string) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }));
  }

  function addSubject() {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subjectArea: '', subSubject: '', achievement: '', effort: '', teacherComment: '' }],
    }));
  }

  function removeSubject(index: number) {
    setForm((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      termLabel: form.termLabel,
      gradeLabel: form.gradeLabel || null,
      generalComment: form.generalComment || null,
      wholeDaysAbsent: form.wholeDaysAbsent || null,
      partialDaysAbsent: form.partialDaysAbsent || null,
      extraActivities: form.extraActivities || null,
      positiveAttitude: form.positiveAttitude || null,
      respectsRightsOfOthers: form.respectsRightsOfOthers || null,
      respectsClassSchoolRules: form.respectsClassSchoolRules || null,
      worksWellIndependently: form.worksWellIndependently || null,
      showsInitiativeEnthusiasm: form.showsInitiativeEnthusiasm || null,
      helpsEncouragesOthers: form.helpsEncouragesOthers || null,
      subjects: form.subjects
        .filter((s) => s.subjectArea.trim())
        .map((s) => ({
          subjectArea: s.subjectArea,
          subSubject: s.subSubject || null,
          achievement: s.achievement || null,
          effort: s.effort || null,
          teacherComment: s.teacherComment || null,
        })),
    };

    try {
      const url = form.id ? `/api/admin/learning-profiles/${form.id}` : `/api/admin/learning-profiles?childId=${childId}`;
      const res = await fetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push(`/admin/families/${childId}/learning-profile`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Report details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Term" htmlFor="lp-term" required>
            <TextInput id="lp-term" required value={form.termLabel} onChange={(e) => set('termLabel', e.target.value)} placeholder="e.g. Term 1 2026" />
          </Field>
          <Field label="Grade" htmlFor="lp-grade">
            <TextInput id="lp-grade" value={form.gradeLabel} onChange={(e) => set('gradeLabel', e.target.value)} placeholder="e.g. Grade 5 – Year 5" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="General comment" htmlFor="lp-comment">
            <TextArea id="lp-comment" rows={4} value={form.generalComment} onChange={(e) => set('generalComment', e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Whole days absent" htmlFor="lp-whole-absent">
            <TextInput id="lp-whole-absent" value={form.wholeDaysAbsent} onChange={(e) => set('wholeDaysAbsent', e.target.value)} />
          </Field>
          <Field label="Partial days absent" htmlFor="lp-partial-absent">
            <TextInput id="lp-partial-absent" value={form.partialDaysAbsent} onChange={(e) => set('partialDaysAbsent', e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Extra activities" htmlFor="lp-activities">
            <TextInput id="lp-activities" value={form.extraActivities} onChange={(e) => set('extraActivities', e.target.value)} placeholder="e.g. Cooking, Football, Surfing" />
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Social development & commitment to learning</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SOCIAL_CRITERIA.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-sm border border-sand-line px-3 py-2">
              <span className="text-sm font-semibold text-ink">{item.label}</span>
              <select
                value={form[item.key as (typeof socialFields)[number]]}
                onChange={(e) => set(item.key as (typeof socialFields)[number], e.target.value as SocialRating | '')}
                className="rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
              >
                <option value="">—</option>
                {(['C', 'U', 'S'] as const).map((r) => (
                  <option key={r} value={r}>{SOCIAL_RATING_LABELS[r]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Subjects</h2>
          <Button type="button" variant="ghost" onClick={addSubject}>+ Add subject</Button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {form.subjects.map((subject, i) => (
            <div key={i} className="rounded-md border border-sand-line p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Learning area" htmlFor={`subj-area-${i}`}>
                  <TextInput id={`subj-area-${i}`} value={subject.subjectArea} onChange={(e) => setSubject(i, 'subjectArea', e.target.value)} />
                </Field>
                <Field label="Sub-subject (optional)" htmlFor={`subj-sub-${i}`}>
                  <TextInput id={`subj-sub-${i}`} value={subject.subSubject} onChange={(e) => setSubject(i, 'subSubject', e.target.value)} placeholder="e.g. Bahasa Indonesia" />
                </Field>
                <Field label="Achievement" htmlFor={`subj-ach-${i}`}>
                  <select
                    id={`subj-ach-${i}`}
                    value={subject.achievement}
                    onChange={(e) => setSubject(i, 'achievement', e.target.value)}
                    className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
                  >
                    <option value="">—</option>
                    {ACHIEVEMENT_SCALE.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Effort" htmlFor={`subj-eff-${i}`}>
                  <select
                    id={`subj-eff-${i}`}
                    value={subject.effort}
                    onChange={(e) => setSubject(i, 'effort', e.target.value)}
                    className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
                  >
                    <option value="">—</option>
                    {EFFORT_SCALE.map((ef) => (
                      <option key={ef.value} value={ef.value}>{ef.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Teacher comment" htmlFor={`subj-comment-${i}`}>
                  <TextArea id={`subj-comment-${i}`} rows={2} value={subject.teacherComment} onChange={(e) => setSubject(i, 'teacherComment', e.target.value)} />
                </Field>
              </div>
              <button type="button" onClick={() => removeSubject(i)} className="mt-2 text-xs font-semibold text-orange-deep hover:underline">
                Remove subject
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={saving || !form.termLabel.trim()}>
          {saving ? 'Saving…' : 'Save report'}
        </Button>
        <Button href={`/admin/families/${childId}/learning-profile`} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}

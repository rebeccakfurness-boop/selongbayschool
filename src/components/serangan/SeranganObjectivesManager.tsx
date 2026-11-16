'use client';

import { useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

const OBJECTIVES_ENDPOINT = '/api/serangan/objectives';
const GOALS_ENDPOINT = '/api/serangan/goals';
const MAX_OBJECTIVES = 5;

export type GoalStatus = 'not_started' | 'in_progress' | 'achieved';

export interface SeranganGoalItem {
  id: number;
  objective_id: number;
  title: string;
  status: GoalStatus;
  target_date: string | null;
  notes: string | null;
}

export interface SeranganObjectiveItem {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  goals: SeranganGoalItem[];
}

const STATUS_LABEL: Record<GoalStatus, string> = { not_started: 'Not started', in_progress: 'In progress', achieved: 'Achieved' };
const STATUS_BADGE: Record<GoalStatus, string> = {
  not_started: 'bg-ink/10 text-ink-soft',
  in_progress: 'bg-orange/20 text-orange-deep',
  achieved: 'bg-teal/15 text-teal-deep',
};

const emptyObjectiveForm = { title: '', description: '' };
const emptyGoalForm = { title: '', status: 'not_started' as GoalStatus, targetDate: '', notes: '' };

/** Up to 5 main objectives (MAX_OBJECTIVES, mirroring MAX_SERANGAN_OBJECTIVES server-side),
 * each with its own list of concrete goals to track progress toward it. */
export default function SeranganObjectivesManager({ initial }: { initial: SeranganObjectiveItem[] }) {
  const [objectives, setObjectives] = useState(initial);
  const [objectiveForm, setObjectiveForm] = useState(emptyObjectiveForm);
  const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(null);
  const [savingObjective, setSavingObjective] = useState(false);
  const [objectiveError, setObjectiveError] = useState<string | null>(null);

  const [goalFormFor, setGoalFormFor] = useState<number | null>(null);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(OBJECTIVES_ENDPOINT);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setObjectives(data.objectives);
  }

  function startEditObjective(o: SeranganObjectiveItem) {
    setEditingObjectiveId(o.id);
    setObjectiveForm({ title: o.title, description: o.description ?? '' });
  }
  function cancelEditObjective() {
    setEditingObjectiveId(null);
    setObjectiveForm(emptyObjectiveForm);
    setObjectiveError(null);
  }

  const canAddObjective = objectives.length < MAX_OBJECTIVES || editingObjectiveId !== null;
  const canSaveObjective = objectiveForm.title.trim() && canAddObjective;

  async function saveObjective() {
    if (!canSaveObjective) return;
    setSavingObjective(true);
    setObjectiveError(null);
    try {
      const res = await fetch(editingObjectiveId ? `${OBJECTIVES_ENDPOINT}/${editingObjectiveId}` : OBJECTIVES_ENDPOINT, {
        method: editingObjectiveId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectiveForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that objective.');
      cancelEditObjective();
      await load();
    } catch (err) {
      setObjectiveError(err instanceof Error ? err.message : 'Could not save that objective.');
    } finally {
      setSavingObjective(false);
    }
  }

  async function removeObjective(id: number) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    await fetch(`${OBJECTIVES_ENDPOINT}/${id}`, { method: 'DELETE' });
  }

  function startAddGoal(objectiveId: number) {
    setGoalFormFor(objectiveId);
    setEditingGoalId(null);
    setGoalForm(emptyGoalForm);
    setGoalError(null);
  }
  function startEditGoal(objectiveId: number, g: SeranganGoalItem) {
    setGoalFormFor(objectiveId);
    setEditingGoalId(g.id);
    setGoalForm({ title: g.title, status: g.status, targetDate: g.target_date ?? '', notes: g.notes ?? '' });
    setGoalError(null);
  }
  function cancelGoalForm() {
    setGoalFormFor(null);
    setEditingGoalId(null);
    setGoalForm(emptyGoalForm);
    setGoalError(null);
  }

  const canSaveGoal = goalForm.title.trim().length > 0;

  async function saveGoal(objectiveId: number) {
    if (!canSaveGoal) return;
    setSavingGoal(true);
    setGoalError(null);
    try {
      const res = await fetch(editingGoalId ? `${GOALS_ENDPOINT}/${editingGoalId}` : GOALS_ENDPOINT, {
        method: editingGoalId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goalForm, objectiveId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that goal.');
      cancelGoalForm();
      await load();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Could not save that goal.');
    } finally {
      setSavingGoal(false);
    }
  }

  async function removeGoal(id: number) {
    setObjectives((prev) => prev.map((o) => ({ ...o, goals: o.goals.filter((g) => g.id !== id) })));
    await fetch(`${GOALS_ENDPOINT}/${id}`, { method: 'DELETE' });
  }

  async function quickSetGoalStatus(g: SeranganGoalItem, status: GoalStatus) {
    setObjectives((prev) => prev.map((o) => ({ ...o, goals: o.goals.map((x) => (x.id === g.id ? { ...x, status } : x)) })));
    await fetch(`${GOALS_ENDPOINT}/${g.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectiveId: g.objective_id, title: g.title, status, targetDate: g.target_date ?? '', notes: g.notes ?? '' }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{editingObjectiveId ? 'Edit objective' : 'New main objective'}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Up to {MAX_OBJECTIVES} main objectives for the school ({objectives.length}/{MAX_OBJECTIVES} set).
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Objective" htmlFor="obj-title" required>
            <TextInput id="obj-title" value={objectiveForm.title} onChange={(e) => setObjectiveForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Improve English reading levels" />
          </Field>
          <Field label="Description (optional)" htmlFor="obj-desc">
            <TextArea id="obj-desc" rows={2} value={objectiveForm.description} onChange={(e) => setObjectiveForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={saveObjective} disabled={!canSaveObjective || savingObjective}>
            {savingObjective ? 'Saving…' : editingObjectiveId ? 'Save changes' : 'Add objective'}
          </Button>
          {editingObjectiveId && (
            <button type="button" onClick={cancelEditObjective} className="text-xs font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          )}
        </div>
        {!canAddObjective && !editingObjectiveId && (
          <p className="mt-2 text-xs font-semibold text-orange-deep">All {MAX_OBJECTIVES} objective slots are in use -- remove one below to add a different one.</p>
        )}
        {objectiveError && <p className="mt-2 text-xs font-semibold text-orange-deep">{objectiveError}</p>}
      </div>

      <div className="flex flex-col gap-4">
        {objectives.map((o) => (
          <div key={o.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{o.title}</h3>
                {o.description && <p className="mt-1 text-sm text-ink-soft">{o.description}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button type="button" onClick={() => startEditObjective(o)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
                <button type="button" onClick={() => removeObjective(o.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-sand-line pt-3">
              {o.goals.map((g) => (
                <div key={g.id} className="flex items-start justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">
                      {g.title} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[g.status]}`}>{STATUS_LABEL[g.status]}</span>
                    </p>
                    {g.target_date && <p className="mt-1 text-xs text-ink-soft">Target: {formatDate(g.target_date)}</p>}
                    {g.notes && <p className="mt-1 text-xs text-ink-soft">{g.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <select
                      value={g.status}
                      onChange={(e) => quickSetGoalStatus(g, e.target.value as GoalStatus)}
                      className="rounded-sm border border-sand-line bg-white px-1.5 py-1 text-xs"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="achieved">Achieved</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditGoal(o.id, g)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
                      <button type="button" onClick={() => removeGoal(g.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {o.goals.length === 0 && goalFormFor !== o.id && <p className="text-xs text-ink-soft">No goals set yet for this objective.</p>}

              {goalFormFor === o.id ? (
                <div className="mt-2 rounded-sm border border-sand-line bg-cream/50 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Goal" htmlFor={`goal-title-${o.id}`} required>
                      <TextInput id={`goal-title-${o.id}`} value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Run a reading assessment each term" />
                    </Field>
                    <Field label="Status" htmlFor={`goal-status-${o.id}`}>
                      <select
                        id={`goal-status-${o.id}`}
                        value={goalForm.status}
                        onChange={(e) => setGoalForm((f) => ({ ...f, status: e.target.value as GoalStatus }))}
                        className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="achieved">Achieved</option>
                      </select>
                    </Field>
                    <Field label="Target date (optional)" htmlFor={`goal-date-${o.id}`}>
                      <TextInput id={`goal-date-${o.id}`} type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm((f) => ({ ...f, targetDate: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="mt-2">
                    <Field label="Notes (optional)" htmlFor={`goal-notes-${o.id}`}>
                      <TextArea id={`goal-notes-${o.id}`} rows={2} value={goalForm.notes} onChange={(e) => setGoalForm((f) => ({ ...f, notes: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Button type="button" variant="primary" onClick={() => saveGoal(o.id)} disabled={!canSaveGoal || savingGoal}>
                      {savingGoal ? 'Saving…' : editingGoalId ? 'Save changes' : 'Add goal'}
                    </Button>
                    <button type="button" onClick={cancelGoalForm} className="text-xs font-semibold text-ink-soft hover:underline">
                      Cancel
                    </button>
                  </div>
                  {goalError && <p className="mt-2 text-xs font-semibold text-orange-deep">{goalError}</p>}
                </div>
              ) : (
                <button type="button" onClick={() => startAddGoal(o.id)} className="mt-1 self-start text-xs font-semibold text-teal-deep hover:underline">
                  + Add a goal
                </button>
              )}
            </div>
          </div>
        ))}
        {objectives.length === 0 && <p className="text-sm text-ink-soft">No main objectives set yet.</p>}
      </div>
    </div>
  );
}

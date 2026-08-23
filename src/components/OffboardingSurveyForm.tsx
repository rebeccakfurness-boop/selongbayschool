'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { TextInput, TextArea } from '@/components/forms/FormField';

const STAR_LABELS = ['Poor', 'Below average', 'Good', 'Very good', 'Excellent'];

export default function OffboardingSurveyForm({ token }: { token: string }) {
  const [name, setName] = useState('');
  const [experienceRating, setExperienceRating] = useState<number | null>(null);
  const [recommendScore, setRecommendScore] = useState<number | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && experienceRating !== null && recommendScore !== null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/offboarding/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedByName: name,
          experienceRating,
          recommendScore,
          marketingConsent,
          feedbackText: feedbackText.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record your answers.');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your answers.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-teal/30 bg-teal/10 p-6 text-center">
        <p className="font-display text-lg font-semibold text-teal-deep">Thank you!</p>
        <p className="mt-2 text-sm text-ink-soft">
          We really appreciate you taking the time to share your feedback, and we hope to see your family again
          someday.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6">
      <h3 className="font-display text-base font-semibold text-ink">A few quick questions</h3>
      <p className="mt-1 text-xs text-ink-soft">Takes about two minutes. Every answer helps.</p>

      <div className="mt-5">
        <span className="text-sm font-bold text-ink">Your name</span>
        <div className="mt-1.5">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="!w-full" />
        </div>
      </div>

      <div className="mt-5">
        <span className="text-sm font-bold text-ink">Overall, how would you rate your family&apos;s experience at Selong Bay School?</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setExperienceRating(value)}
              aria-pressed={experienceRating === value}
              className={`flex flex-col items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                experienceRating === value
                  ? 'border-teal bg-teal text-white'
                  : 'border-sand-line bg-white text-ink-soft hover:border-teal'
              }`}
            >
              <span className="text-lg leading-none">{value <= (experienceRating ?? 0) ? '★' : '☆'}</span>
              {STAR_LABELS[value - 1]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <span className="text-sm font-bold text-ink">How likely are you to recommend Selong Bay School to other families?</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRecommendScore(value)}
              aria-pressed={recommendScore === value}
              className={`h-9 w-9 rounded-sm border text-sm font-bold transition-colors ${
                recommendScore === value
                  ? 'border-teal bg-teal text-white'
                  : 'border-sand-line bg-white text-ink-soft hover:border-teal'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
          <span>Not at all likely</span>
          <span>Extremely likely</span>
        </div>
      </div>

      <div className="mt-5">
        <span className="text-sm font-bold text-ink">Is there anything we could have done better?</span>
        <div className="mt-1.5">
          <TextArea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            placeholder="Optional: any feedback for improvement is welcome"
            className="!w-full"
          />
        </div>
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        I&apos;m happy for Selong Bay School to use my feedback (e.g. as a quote or testimonial) in its marketing
        material, such as the website or social media.
      </label>

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

      <div className="mt-5">
        <Button type="button" variant="primary" onClick={submit} disabled={submitting || !canSubmit}>
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'sbs_admin_last_visit';
const BRAND_COLORS = ['#007c83', '#045157', '#fea74a', '#d97f1f', '#aafdfa'];

const ENCOURAGEMENTS = [
  "Great work, keep it up!",
  'Selong Bay is growing!',
  'The word is spreading!',
  'Nice one, team!',
  'Momentum is building!',
];

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} new ${count === 1 ? singular : plural}`;
}

function buildMessage(newBookings: number, newEnquiries: number): string {
  const parts: string[] = [];
  if (newBookings > 0) parts.push(countLabel(newBookings, 'booking', 'bookings'));
  if (newEnquiries > 0) parts.push(countLabel(newEnquiries, 'enquiry', 'enquiries'));
  const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  return `${parts.join(' and ')} since you were last here. ${encouragement}`;
}

function fireConfetti() {
  const end = Date.now() + 2200;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, startVelocity: 45, origin: { x: 0, y: 0.7 }, colors: BRAND_COLORS });
    confetti({ particleCount: 4, angle: 120, spread: 60, startVelocity: 45, origin: { x: 1, y: 0.7 }, colors: BRAND_COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 90, spread: 100, startVelocity: 40, origin: { y: 0.6 }, colors: BRAND_COLORS });
}

export default function NewActivityCelebration() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const lastVisit = window.localStorage.getItem(STORAGE_KEY);
    const now = new Date().toISOString();

    if (!lastVisit) {
      window.localStorage.setItem(STORAGE_KEY, now);
      return;
    }

    let cancelled = false;
    fetch(`/api/admin/new-activity?since=${encodeURIComponent(lastVisit)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { newBookings: number; newEnquiries: number } | null) => {
        if (cancelled || !data) return;
        const total = data.newBookings + data.newEnquiries;
        if (total > 0) {
          setMessage(buildMessage(data.newBookings, data.newEnquiries));
          fireConfetti();
        }
      })
      .finally(() => {
        window.localStorage.setItem(STORAGE_KEY, now);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 rounded-md border border-orange/40 bg-orange/10 px-5 py-4 text-[15px] font-semibold text-orange-deep"
    >
      <span className="text-xl" aria-hidden="true">
        🎉
      </span>
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setMessage(null)}
        aria-label="Dismiss"
        className="ml-auto text-orange-deep/60 hover:text-orange-deep"
      >
        ✕
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export interface TrustedDevice {
  id: number;
  device_label: string | null;
  ip_address: string | null;
  first_seen_at: string;
  last_used_at: string;
  expires_at: string;
  is_current: boolean;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export default function TrustedDevicesManager({ devices }: { devices: TrustedDevice[] }) {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [loggingOutEverywhere, setLoggingOutEverywhere] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke(device: TrustedDevice) {
    setRevokingId(device.id);
    setError(null);
    try {
      const res = await fetch(`/api/account/devices/${device.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCurrentDevice: device.is_current }),
      });
      if (!res.ok) throw new Error('Could not revoke that device.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke that device.');
    } finally {
      setRevokingId(null);
    }
  }

  async function logOutEverywhere() {
    if (!confirm("This signs you out on every device, including this one: you'll need to log in again. Continue?")) return;
    setLoggingOutEverywhere(true);
    setError(null);
    try {
      const res = await fetch('/api/account/devices/revoke-all', { method: 'POST' });
      if (!res.ok) throw new Error('Could not log out everywhere.');
      router.push('/account/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log out everywhere.');
      setLoggingOutEverywhere(false);
    }
  }

  return (
    <div>
      <p className="mt-1 text-sm text-ink-soft">
        Devices where you&apos;ve stayed signed in without needing a new login link each time. Not sure what one of
        these is? Remove it; you&apos;ll just need a login link next time on that device.
      </p>

      {devices.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No devices are currently remembered.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {devices.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
              <div>
                <div className="font-semibold text-ink">
                  {d.device_label || 'Unknown device'}
                  {d.is_current && <span className="ml-2 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">This device</span>}
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  First used {formatRelative(d.first_seen_at)} · last used {formatRelative(d.last_used_at)}
                  {d.ip_address && ` · ${d.ip_address}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke(d)}
                disabled={revokingId === d.id}
                className="text-sm font-semibold text-orange-deep hover:underline disabled:opacity-40"
              >
                {revokingId === d.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

      <div className="mt-5">
        <Button type="button" variant="ghost" onClick={logOutEverywhere} disabled={loggingOutEverywhere}>
          {loggingOutEverywhere ? 'Logging out…' : 'Log out everywhere'}
        </Button>
      </div>
    </div>
  );
}

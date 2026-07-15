'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/account/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
    >
      Log out
    </button>
  );
}

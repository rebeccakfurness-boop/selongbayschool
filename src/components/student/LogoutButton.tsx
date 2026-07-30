'use client';

import { useRouter } from 'next/navigation';

export default function StudentLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/student/logout', { method: 'POST' });
    router.push('/student/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-teal/30 px-4 py-1.5 text-sm font-semibold text-teal-deep hover:bg-teal/10"
    >
      Log out
    </button>
  );
}

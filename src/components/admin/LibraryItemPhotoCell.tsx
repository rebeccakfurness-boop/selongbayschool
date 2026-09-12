'use client';

import { useRouter } from 'next/navigation';
import LibraryItemPhotoUpload from '@/components/admin/LibraryItemPhotoUpload';

export default function LibraryItemPhotoCell({ itemId, photoUrl }: { itemId: number; photoUrl: string | null }) {
  const router = useRouter();

  async function save(url: string) {
    await fetch(`/api/admin/library/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: url }),
    });
    router.refresh();
  }

  return <LibraryItemPhotoUpload currentUrl={photoUrl} pathPrefix={`library-items/${itemId}`} onUploaded={save} />;
}

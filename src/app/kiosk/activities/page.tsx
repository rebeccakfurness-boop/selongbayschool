import { ensureSchema } from '@/lib/db';
import { getActivityKioskRoster, getActiveActivityOptions } from '@/lib/attendance';
import KioskActivityBoard from '@/components/kiosk/KioskActivityBoard';

export const dynamic = 'force-dynamic';

export default async function KioskActivitiesPage() {
  await ensureSchema();
  const [roster, activities] = await Promise.all([getActivityKioskRoster(), getActiveActivityOptions()]);
  return <KioskActivityBoard roster={roster} activities={activities} />;
}

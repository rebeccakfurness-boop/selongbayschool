import { ensureSchema } from '@/lib/db';
import { getDailyKioskRoster, schoolLocalIsMorning } from '@/lib/attendance';
import KioskDailyBoard from '@/components/kiosk/KioskDailyBoard';

export const dynamic = 'force-dynamic';

export default async function KioskPage() {
  await ensureSchema();
  const roster = await getDailyKioskRoster();
  return <KioskDailyBoard roster={roster} defaultCheckIn={schoolLocalIsMorning()} />;
}

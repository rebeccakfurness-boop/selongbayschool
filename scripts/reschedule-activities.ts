import { runRescheduleActivities } from '../src/lib/reschedule-activities';

/**
 * One-off schedule change: see src/lib/reschedule-activities.ts for what this does.
 * Run with: npm run db:reschedule-activities
 */
async function main() {
  const result = await runRescheduleActivities();
  console.log(`Created ${result.created} new session(s) for the ${result.termWeeks}-week term starting ${result.termStart}.`);
  if (result.deleted === 0 && result.cancelled === 0) {
    console.log('No stale sessions to remove.');
  } else {
    console.log(
      `Removed ${result.deleted} empty session(s); cancelled ${result.cancelled} session(s) that had bookings ` +
      `(${result.emailed} cancellation email(s) sent).`
    );
  }
  console.log('Reschedule complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

import { neon, types, type NeonQueryFunction } from '@neondatabase/serverless';

// The driver's default DATE parser returns a JS Date object, not the "YYYY-MM-DD" string every
// DATE column's TypeScript type (and every Zod schema validating a date field, e.g. updateChildSchema
// in validation.ts) assumes. That mismatch is invisible on read (formatDate() etc. just re-wrap it in
// `new Date(...)`, which accepts a Date fine) but breaks on write: a form seeded from such a value and
// JSON.stringify'd back to an API route serializes as a full ISO timestamp, failing the date-only regex
// with Zod's literal "Invalid" — this is what broke every Child Card edit once any date field was set.
// Overriding the parser to pass the raw string through fixes it at the source for the whole app,
// rather than special-casing each place a DATE column round-trips through a form.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

/** Must stay in sync with the `activityImages` fallback map in src/app/activities/page.tsx. */
const ACTIVITY_PHOTO_BACKFILL: Record<string, string> = {
  'surfing-selong-belanak': '/images/activity-surfing-selong-belanak.jpg',
  'gymnastics-free-swim': '/images/activity-gymnastics-v3.jpg',
  'hip-hop-dance-ninja-warrior': '/images/activity-ninja-hiphop.jpg',
  'art-music-bahasa': '/images/activity-art-music.jpg',
  'scouts-survival-challenge': '/images/activity-scouts.jpg',
  'gardening-and-padel': '/images/activity-padel.jpg',
  'school-tour': '/images/activity-school-tour-v2.jpg',
  'adventure-camp-2026-per-day': '/images/activity-adventure-camp.jpg',
  'adventure-camp-2026-full-week': '/images/home-story-beach-tree.jpg',
};

function connectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error(
      'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in your environment.'
    );
  }
  return url;
}

// Created lazily (on first real query) rather than at module load, so that
// merely importing this file, e.g. during the Next.js build's page-data
// collection step, doesn't require a database connection string to exist.
let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    client = neon(connectionString());
  }
  return client;
}

export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getClient()(strings, ...values)) as NeonQueryFunction<false, false>;

let schemaReady: Promise<void> | null = null;

/** Bump this whenever a statement is added to (or changed in) the migration body below —
 * otherwise an already-current database skips the version check and the new statement never
 * runs. This is the one manual step the fast-path below requires; there's no automatic diffing. */
const SCHEMA_VERSION = 20;

/** Returns the stored schema version, or null if schema_meta doesn't exist yet (first-ever run
 * on this database) or the read otherwise fails — either way, callers fall back to running the
 * full migration, which is always safe since every statement in it is idempotent. */
async function getSchemaVersion(): Promise<number | null> {
  try {
    const rows = (await sql`SELECT value FROM schema_meta WHERE key = 'schema_version'`) as unknown as { value: string }[];
    return rows[0] ? Number(rows[0].value) : null;
  } catch {
    return null;
  }
}

async function setSchemaVersion(version: number): Promise<void> {
  await sql`
    INSERT INTO schema_meta (key, value) VALUES ('schema_version', ${String(version)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

/** Idempotently creates tables if they don't exist. Safe to call on every request.
 *
 * Fast path: on a database already at SCHEMA_VERSION, this is a single round-trip (the version
 * check) instead of the ~100 sequential CREATE/ALTER statements below — those only actually run
 * once per schema change, not once per cold serverless start. See SCHEMA_VERSION above: this
 * only works if it's bumped whenever the migration body changes. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const currentVersion = await getSchemaVersion();
      if (currentVersion === SCHEMA_VERSION) return;

      await sql`CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;

      await sql`
        CREATE TABLE IF NOT EXISTS enquiries (
          id BIGSERIAL PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('contact', 'admissions', 'high_school')),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT,
          child_name TEXT,
          child_age TEXT,
          interest TEXT,
          notify_email_status TEXT NOT NULL DEFAULT 'pending',
          reply_email_status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false`;
      // Superseded by activities + sessions below. No longer created for new
      // databases; left untouched (not dropped) on any database where it
      // already exists, since booking_slots may still hold historical rows.

      await sql`
        CREATE TABLE IF NOT EXISTS activities (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          day TEXT,
          duration TEXT,
          price_idr BIGINT,
          price_note TEXT,
          description TEXT NOT NULL,
          age_group TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
      await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS default_time TEXT`;
      await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS default_capacity INTEGER NOT NULL DEFAULT 10`;
      await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS photo_url TEXT`;
      // Activities created before per-activity photo uploads existed have photo_url = NULL, so the
      // admin dashboard shows "No photo" even though the public /activities page already displays
      // an image for them via the code-level fallback in src/app/activities/page.tsx. Backfill
      // photo_url to that same fallback image so the dashboard matches what's actually live.
      // Only fills NULLs, so uploading a real photo in the dashboard still overrides it going forward.
      for (const [slug, photoUrl] of Object.entries(ACTIVITY_PHOTO_BACKFILL)) {
        await sql`UPDATE activities SET photo_url = ${photoUrl} WHERE slug = ${slug} AND photo_url IS NULL`;
      }
      // One-time photo swap for Surfing Selong Belanak: only touches rows still holding the old
      // fallback image (i.e. never manually re-uploaded via the dashboard), so a real custom photo
      // set by an admin is left untouched.
      await sql`
        UPDATE activities SET photo_url = '/images/activity-surfing-selong-belanak.jpg'
        WHERE slug = 'surfing-selong-belanak' AND photo_url = '/images/home-beach-walk.jpg'
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id BIGSERIAL PRIMARY KEY,
          activity_id BIGINT NOT NULL REFERENCES activities(id),
          session_date DATE NOT NULL,
          session_time TEXT NOT NULL,
          capacity INTEGER NOT NULL CHECK (capacity > 0),
          spots_remaining INTEGER NOT NULL CHECK (spots_remaining >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled'))
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_sessions_activity_date
        ON sessions (activity_id, session_date)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id BIGSERIAL PRIMARY KEY,
          slot_id BIGINT NOT NULL REFERENCES sessions(id),
          activity_slug TEXT NOT NULL,
          activity_name TEXT NOT NULL,
          child_name TEXT NOT NULL,
          child_age TEXT NOT NULL,
          parent_name TEXT NOT NULL,
          parent_email TEXT NOT NULL,
          parent_phone TEXT NOT NULL,
          emergency_contact TEXT NOT NULL,
          notify_email_status TEXT NOT NULL DEFAULT 'pending',
          reply_email_status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // On any database where `bookings` already existed before the activities/sessions
      // migration, CREATE TABLE IF NOT EXISTS above is a no-op, so slot_id's foreign key is
      // still silently pointing at the old, unused `booking_slots` table instead of `sessions`
      // — every booking insert fails with a foreign key violation until this runs.
      await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey`;
      await sql`ALTER TABLE bookings ADD CONSTRAINT bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES sessions(id)`;
      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pay_at_session'`;
      // Drop the old (confirmed/cancelled) constraint before touching any row values below,
      // otherwise the UPDATE would itself violate the constraint it's trying to migrate away from.
      await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check`;
      // Older rows predate payment methods and were saved as 'confirmed' under that previous
      // two-value status set; reclassified to 'paid' since those bookings were free registrations
      // with nothing outstanding, the closest fit among the new values.
      await sql`UPDATE bookings SET status = 'paid' WHERE status = 'confirmed'`;
      await sql`
        ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('pending_payment', 'pay_at_session', 'paid', 'cancelled'))
      `;
      await sql`
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT
        CHECK (payment_method IN ('pay_online', 'pay_at_session'))
      `;
      // Reserved for a future real payment gateway integration; not written to yet.
      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_session_id TEXT`;

      // Replaces the old single `emergency_contact` free-text column with separate name/phone
      // fields. That old column is left in place (not dropped) so historic bookings keep their
      // original value visible; new bookings only ever write to the two columns below.
      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT`;
      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT`;
      // Backfill existing rows from the legacy combined field so old bookings aren't left blank,
      // then require the column going forward now that every row has a value.
      await sql`UPDATE bookings SET emergency_contact_name = emergency_contact WHERE emergency_contact_name IS NULL`;
      await sql`ALTER TABLE bookings ALTER COLUMN emergency_contact_name SET NOT NULL`;
      // No reliable way to split a phone number back out of that old freeform text, so this one
      // stays nullable for historic rows; every new booking always provides it via the required
      // form field, enforced at the application layer (matching payment_method above, also added
      // long after bookings already existed).
      // The old column was NOT NULL and new bookings no longer write to it (see above), so it
      // must be relaxed here or every new booking insert fails that constraint.
      await sql`ALTER TABLE bookings ALTER COLUMN emergency_contact DROP NOT NULL`;

      await sql`
        CREATE TABLE IF NOT EXISTS customers (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          name TEXT,
          phone TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // Customer auth is magic-link only (see src/app/api/account/*); password_hash stays
      // unused for every row, kept only in case password login gets added later.
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS magic_link_token TEXT`;
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS magic_link_token_expires_at TIMESTAMPTZ`;
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`;
      // Populated the first time a logged-in customer books an activity (or edits it directly at
      // /account/settings), then pre-filled on every booking after that so they don't have to
      // re-enter it. Nullable: a brand new account has neither until then.
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT`;
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT`;
      // If email-change (for customers) or account suspension (for either table) is ever added,
      // call revokeAllDeviceTokensForAccount() from src/lib/device-trust.ts at that point — a
      // "remember this device" token should never outlive the identity it was issued for.

      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id)`;
      // Existing rows all predate customer accounts, so they default to true (guest bookings).
      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT true`;

      await sql`
        CREATE TABLE IF NOT EXISTS passes (
          id BIGSERIAL PRIMARY KEY,
          customer_id BIGINT NOT NULL REFERENCES customers(id),
          child_name TEXT NOT NULL,
          total_sessions INTEGER NOT NULL DEFAULT 10,
          sessions_used INTEGER NOT NULL DEFAULT 0,
          price_paid_idr BIGINT,
          purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
          payment_method TEXT CHECK (payment_method IN ('pay_online', 'pay_at_session')),
          status TEXT NOT NULL DEFAULT 'pay_at_session'
            CHECK (status IN ('pending_payment', 'pay_at_session', 'paid', 'expired', 'cancelled'))
        )
      `;
      // Tracked so the daily /api/cron/passes job (see that route) sends each of these emails
      // at most once per pass, rather than re-sending on every run until the pass is no longer
      // eligible.
      await sql`ALTER TABLE passes ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN NOT NULL DEFAULT false`;
      await sql`ALTER TABLE passes ADD COLUMN IF NOT EXISTS completion_email_sent BOOLEAN NOT NULL DEFAULT false`;
      // Whether a pass can currently be used for booking is always computed live as
      // status = 'paid' AND expires_at > now() AND sessions_used < total_sessions,
      // wherever that matters (see /api/passes/active and the pack-session booking path).
      // The daily cron job above is only responsible for the status = 'expired' transition
      // itself (so it stops showing up in admin/customer lists as active) and for the two
      // one-time emails, not for gating whether a pass can be spent.

      await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pass_id BIGINT REFERENCES passes(id)`;
      // A pack-paid booking needs a third payment_method value alongside the original two.
      await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check`;
      await sql`
        ALTER TABLE bookings ADD CONSTRAINT bookings_payment_method_check
        CHECK (payment_method IN ('pay_online', 'pay_at_session', 'pack_session'))
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS crm_enquiries (
          id BIGSERIAL PRIMARY KEY,
          source TEXT NOT NULL CHECK (source IN ('contact_form', 'email')),
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS email_threads (
          id BIGSERIAL PRIMARY KEY,
          enquiry_id BIGINT REFERENCES crm_enquiries(id),
          gmail_thread_id TEXT NOT NULL UNIQUE,
          subject TEXT,
          participant_email TEXT NOT NULL,
          last_message_at TIMESTAMPTZ
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS email_messages (
          id BIGSERIAL PRIMARY KEY,
          thread_id BIGINT NOT NULL REFERENCES email_threads(id),
          direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          sender TEXT NOT NULL,
          body TEXT,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          gmail_message_id TEXT UNIQUE
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS change_requests (
          id BIGSERIAL PRIMARY KEY,
          requested_by TEXT NOT NULL,
          request_text TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'pr_open', 'approved', 'merged', 'rejected')),
          github_pr_url TEXT,
          github_pr_number INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // --- Operations dashboard (families, enquiries, forecast, roles) ---
      // admin_users doubles as the staff table: 'admin' has full access, 'teacher' is scoped to
      // their assigned classes (see teacher_assignments) at the application layer.
      await sql`
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin', 'teacher'))
      `;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT`;

      // Mirrors the "Family Tracker" spreadsheet tab, which is the canonical schema (its own rows
      // are mostly empty; real current students come from "Sheet1" instead, mapped onto these
      // columns by scripts/import-family-tracker.ts). One row per child; siblings share a family_id.
      await sql`
        CREATE TABLE IF NOT EXISTS children (
          id BIGSERIAL PRIMARY KEY,
          family_id TEXT,
          status TEXT NOT NULL DEFAULT 'full_time'
            CHECK (status IN ('enquiry', 'booking_waitlist', 'full_time', 'temporary', 'worldschooler', 'hybrid')),
          is_active BOOLEAN NOT NULL DEFAULT true,
          programme TEXT,
          class_band TEXT CHECK (class_band IN ('early_years', 'kindergarten', 'primary', 'secondary')),
          class_name TEXT,
          child_full_name TEXT NOT NULL,
          child_nickname TEXT,
          dob DATE,
          gender TEXT,
          nationality TEXT,
          enrolment_date DATE,
          exit_date DATE,
          parent1_name TEXT,
          parent1_relationship TEXT,
          parent1_nationality TEXT,
          parent2_name TEXT,
          parent2_relationship TEXT,
          parent2_nationality TEXT,
          siblings_at_school TEXT,
          sibling_discount_tier TEXT,
          tuition_plan TEXT,
          payment_status TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          allergies_medical_notes TEXT,
          dietary_requirements TEXT,
          religion TEXT,
          home_language TEXT,
          nisn_request_signed BOOLEAN NOT NULL DEFAULT false,
          nisn_request_date DATE,
          nisn_number TEXT,
          liability_form_signed BOOLEAN NOT NULL DEFAULT false,
          liability_form_date DATE,
          photography_signed BOOLEAN NOT NULL DEFAULT false,
          photography_consent TEXT,
          photography_form_date DATE,
          pickup_authorization_signed BOOLEAN NOT NULL DEFAULT false,
          authorized_pickup_persons TEXT,
          pickup_form_date DATE,
          behavioral_form_signed BOOLEAN NOT NULL DEFAULT false,
          behavioral_form_date DATE,
          financial_agreement_signed BOOLEAN NOT NULL DEFAULT false,
          financial_agreement_date DATE,
          parent_protection_addendum_signed BOOLEAN NOT NULL DEFAULT false,
          data_consent_signed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // Not part of the Family Tracker column set, but needed to actually reach a family (Family
      // Tracker has no parent email/phone columns at all) and, later, to link a guardian's
      // `customers` portal login to their child(ren) via guardian_children below.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS primary_contact_email TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT`;
      // Free-text carried over from Sheet1's "Duration of Stay" column; not auto-classified into
      // status (temporary/worldschooler) since that would be a guess — left for admin review.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS duration_of_stay_note TEXT`;
      // Immigration documents — admin-only visibility (see ChildCard), not shown to teachers even
      // though they can see the rest of the compliance/health fields above.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS passport_copy_url TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS visa_status TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS kitas_copy_url TEXT`;
      // Same "similar ID document" class as passport/KITAS above — visible to admin and the
      // child's own parent (via guardian_children), never to teachers. Not one of the 7 Forms &
      // Compliance checklist items (COMPLIANCE_ITEMS): those are signed consent forms, a different
      // concern from identity documents, so uploading one here never touches compliance state.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT`;
      // Free-text, carried the same way duration_of_stay_note is: not on the original Family
      // Tracker sheet, added so the parent-facing profile card (and admin) has somewhere to record
      // it. previous_school parallels enrolment_submissions.previous_school (a different table, the
      // public enrolment form's own submission record) but the two are never auto-synced.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS previous_school TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS lunch_option TEXT`;
      // Profile photo shown as a circular avatar wherever a child's name appears (board tile, Child
      // Card, teacher view, parent portal). photo_updated_by_label/photo_updated_at are set
      // server-side whenever photo_url changes (never taken from client input) — an accountability
      // trail given this is a children's-safety-adjacent feature, not a field either admin or
      // parent edits directly.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_url TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_updated_by_label TEXT`;
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_updated_at TIMESTAMPTZ`;
      // Free-text landing spot for whatever an admissions_enquiries lead carried that doesn't map
      // onto a real children column (child_age is a free-text guess, not a dob; plan_to_stay,
      // follow_up_notes, source, and the lead's contact dates) — written once by the "Convert to
      // Family" action (src/lib/child-lifecycle.ts) so none of it needs retyping, then it's just a
      // normal admin-editable note from then on.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS admissions_notes TEXT`;
      await sql`CREATE INDEX IF NOT EXISTS idx_children_status ON children (status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_children_class_name ON children (class_name)`;

      // Unified admissions pipeline: the "School Tours" / "Inquiries from WA" / "Old Inquiries" /
      // "Other islanders" / "Visitors only" spreadsheet tabs, tagged by source. Distinct from the
      // existing `enquiries` table above, which is the public site's contact/admissions/high-school
      // form submissions, not the admissions team's own lead tracker.
      await sql`
        CREATE TABLE IF NOT EXISTS admissions_enquiries (
          id BIGSERIAL PRIMARY KEY,
          source TEXT NOT NULL CHECK (source IN ('school_tour', 'visitor', 'whatsapp', 'old_inquiry', 'other_islander')),
          parent_name TEXT,
          child_name TEXT,
          child_age TEXT,
          contact_phone TEXT,
          contact_email TEXT,
          plan_to_stay TEXT,
          first_message_date DATE,
          visit_date DATE,
          booking_date DATE,
          booking_time TEXT,
          follow_up_notes TEXT,
          converted_child_id BIGINT REFERENCES children(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // Mirrors the "Student Count" tab: named students per class band per forecast month.
      // Entries are frequently forward-looking placeholders (not yet real enrolled children), so
      // linked_child_id is nullable and only set once a name is matched to a real `children` row.
      await sql`
        CREATE TABLE IF NOT EXISTS class_forecast_entries (
          id BIGSERIAL PRIMARY KEY,
          forecast_month TEXT NOT NULL,
          class_band TEXT NOT NULL CHECK (class_band IN ('early_years', 'kindergarten', 'primary', 'secondary')),
          child_display_name TEXT NOT NULL,
          age_or_grade_label TEXT,
          status_tag TEXT,
          linked_child_id BIGINT REFERENCES children(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_class_forecast_month_band
        ON class_forecast_entries (forecast_month, class_band)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS teacher_assignments (
          id BIGSERIAL PRIMARY KEY,
          admin_user_id BIGINT NOT NULL REFERENCES admin_users(id),
          class_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (admin_user_id, class_name)
        )
      `;

      // Links a parent's existing `customers` portal account (magic-link login, same as activity
      // booking) to the child(ren) they're guardian of, so the parent LMS portal can scope to
      // "my children" without a second, separate parent-auth system.
      await sql`
        CREATE TABLE IF NOT EXISTS guardian_children (
          id BIGSERIAL PRIMARY KEY,
          customer_id BIGINT NOT NULL REFERENCES customers(id),
          child_id BIGINT NOT NULL REFERENCES children(id),
          relationship TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (customer_id, child_id)
        )
      `;

      // Simple, separate login for the Student role (magic-link email isn't practical for young
      // children) — one account per child, credentials set by an admin/teacher.
      await sql`
        CREATE TABLE IF NOT EXISTS student_accounts (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL UNIQUE REFERENCES children(id),
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_login_at TIMESTAMPTZ
        )
      `;

      // --- Phase 3: Learning Profile + LMS (lesson plans, work samples, photo feed, resources) ---

      // One row per child per term. Achievement/effort scales and the 6 social-development
      // criteria match the real "Noah Term 1 Report" PDF sample; letter grades (A-E) shown on
      // that PDF are a pure display mapping over `outstanding..limited`, not stored separately.
      await sql`
        CREATE TABLE IF NOT EXISTS learning_profiles (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id),
          term_label TEXT NOT NULL,
          grade_label TEXT,
          general_comment TEXT,
          whole_days_absent TEXT,
          partial_days_absent TEXT,
          extra_activities TEXT,
          positive_attitude TEXT CHECK (positive_attitude IN ('C', 'U', 'S')),
          respects_rights_of_others TEXT CHECK (respects_rights_of_others IN ('C', 'U', 'S')),
          respects_class_school_rules TEXT CHECK (respects_class_school_rules IN ('C', 'U', 'S')),
          works_well_independently TEXT CHECK (works_well_independently IN ('C', 'U', 'S')),
          shows_initiative_enthusiasm TEXT CHECK (shows_initiative_enthusiasm IN ('C', 'U', 'S')),
          helps_encourages_others TEXT CHECK (helps_encourages_others IN ('C', 'U', 'S')),
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (child_id, term_label)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS learning_profile_subjects (
          id BIGSERIAL PRIMARY KEY,
          learning_profile_id BIGINT NOT NULL REFERENCES learning_profiles(id) ON DELETE CASCADE,
          subject_area TEXT NOT NULL,
          sub_subject TEXT,
          achievement TEXT CHECK (achievement IN ('outstanding', 'high', 'expected', 'basic', 'limited')),
          effort TEXT CHECK (effort IN ('high', 'satisfactory', 'low')),
          teacher_comment TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_learning_profile_subjects_profile
        ON learning_profile_subjects (learning_profile_id)
      `;

      // Tied to class_name (not class_band) since that's the actual teaching unit — a teacher's
      // assignment in teacher_assignments is also by class_name.
      await sql`
        CREATE TABLE IF NOT EXISTS lesson_plans (
          id BIGSERIAL PRIMARY KEY,
          class_name TEXT NOT NULL,
          week_label TEXT NOT NULL,
          subject TEXT,
          title TEXT NOT NULL,
          description TEXT,
          teacher_id BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans (class_name)`;

      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_units (
          id BIGSERIAL PRIMARY KEY,
          class_name TEXT NOT NULL,
          term_label TEXT NOT NULL,
          unit_title TEXT NOT NULL,
          description TEXT,
          is_current BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_units_class ON curriculum_units (class_name)`;

      await sql`
        CREATE TABLE IF NOT EXISTS work_samples (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id),
          teacher_id BIGINT REFERENCES admin_users(id),
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_work_samples_child ON work_samples (child_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS photo_feed_items (
          id BIGSERIAL PRIMARY KEY,
          uploaded_by BIGINT REFERENCES admin_users(id),
          file_url TEXT NOT NULL,
          caption TEXT,
          class_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS photo_feed_tags (
          id BIGSERIAL PRIMARY KEY,
          photo_id BIGINT NOT NULL REFERENCES photo_feed_items(id) ON DELETE CASCADE,
          child_id BIGINT NOT NULL REFERENCES children(id),
          UNIQUE (photo_id, child_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_photo_feed_tags_child ON photo_feed_tags (child_id)`;

      // Downloadable resources — especially important for hybrid/worldschooling parents doing
      // off-campus homeschooling days. class_band NULL means visible to every family.
      await sql`
        CREATE TABLE IF NOT EXISTS resources (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          file_url TEXT NOT NULL,
          class_band TEXT CHECK (class_band IN ('early_years', 'kindergarten', 'primary', 'secondary')),
          uploaded_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // Links a parent's customers/`/account` login to the child(ren) they're guardian of — no
      // admin UI existed to populate this until Phase 3's child card update; without it the
      // parent portal has no way to know which children belong to which logged-in parent.
      await sql`CREATE INDEX IF NOT EXISTS idx_guardian_children_customer ON guardian_children (customer_id)`;

      // --- Phase 4: invoicing ---

      // Singleton (id always 1) so bank/payable-to details can be corrected in future without a
      // code change — never hardcoded in the invoice PDF template itself. Seeded below with the
      // canonical values confirmed against the real Term 1 invoice.
      await sql`
        CREATE TABLE IF NOT EXISTS school_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          payable_to TEXT NOT NULL,
          bank_name TEXT NOT NULL,
          account_number TEXT NOT NULL,
          account_name TEXT NOT NULL,
          swift_code TEXT NOT NULL,
          bank_address TEXT,
          bank_code TEXT,
          branch_code TEXT,
          clearing_code TEXT,
          currency TEXT NOT NULL DEFAULT 'IDR',
          invoice_due_days INTEGER NOT NULL DEFAULT 5,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CHECK (id = 1)
        )
      `;
      await sql`
        INSERT INTO school_settings (id, payable_to, bank_name, account_number, account_name, swift_code, bank_address, bank_code, branch_code, clearing_code)
        VALUES (
          1, 'Yayasan Selong Bay Sekolah', 'PT BANK MANDIRI (PERSERO)', '1610017501474', 'Yayasan Selong Bay Sekolah',
          'BMRIIDJA', 'Dusun Serangan RT 000 RW 000, Praya Barat, Kode Pos 83571', '008', '16161', '0083894'
        )
        ON CONFLICT (id) DO NOTHING
      `;

      // Continues the school's existing manual invoice numbering (samples seen were #040/#050 in
      // early July 2026); confirmed with the school to start the software's sequence at 51 so it
      // can't collide with an invoice already issued outside this system.
      await sql`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 51`;

      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id BIGSERIAL PRIMARY KEY,
          invoice_number INTEGER NOT NULL UNIQUE,
          invoice_type TEXT NOT NULL CHECK (invoice_type IN ('tuition', 'activity')),
          billed_to_name TEXT NOT NULL,
          issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
          due_date DATE NOT NULL,
          currency TEXT NOT NULL DEFAULT 'IDR',
          subtotal_amount BIGINT NOT NULL DEFAULT 0,
          sibling_discount_amount BIGINT NOT NULL DEFAULT 0,
          total_amount BIGINT NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid', 'cancelled')),
          paid_at TIMESTAMPTZ,
          notes TEXT,
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // A child appears here whenever they're billed on an invoice, whether alone or with
      // siblings — sort_order (the order they were added when the invoice was created) is what
      // the 5%/10% sibling discount rule keys off (see /api/admin/invoices).
      await sql`
        CREATE TABLE IF NOT EXISTS invoice_children (
          id BIGSERIAL PRIMARY KEY,
          invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          child_id BIGINT NOT NULL REFERENCES children(id),
          discount_percent NUMERIC NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          UNIQUE (invoice_id, child_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_invoice_children_child ON invoice_children (child_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS invoice_line_items (
          id BIGSERIAL PRIMARY KEY,
          invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          child_id BIGINT REFERENCES children(id),
          description TEXT NOT NULL,
          quantity NUMERIC NOT NULL DEFAULT 1,
          unit_price BIGINT NOT NULL,
          line_total BIGINT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items (invoice_id)`;

      // --- Phase 5: Google Classroom integration ---

      // Used to match a Google Classroom roster entry to a local child — many young students use
      // a parent's Google account for Classroom, so this is checked in addition to (not instead
      // of) primary_contact_email when matching synced rosters (see sync-course.ts).
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS classroom_student_email TEXT`;

      // Singleton (id always 1) — one Google account authorizes access for the whole school,
      // same pattern as school_settings. No connection row means Classroom isn't connected yet
      // and getClassroomProvider() returns the stub.
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_connection (
          id INTEGER PRIMARY KEY DEFAULT 1,
          google_account_email TEXT NOT NULL,
          access_token TEXT NOT NULL,
          access_token_expires_at TIMESTAMPTZ NOT NULL,
          refresh_token TEXT NOT NULL,
          connected_by BIGINT REFERENCES admin_users(id),
          connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_synced_at TIMESTAMPTZ,
          CHECK (id = 1)
        )
      `;

      // A Google Classroom "course" only starts feeding data into the app once an admin maps it
      // to one of the school's own class_name values — courses aren't synced automatically on
      // connect, since course names in Classroom won't reliably match class_name strings.
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_course_mappings (
          id BIGSERIAL PRIMARY KEY,
          google_course_id TEXT NOT NULL UNIQUE,
          google_course_name TEXT NOT NULL,
          class_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS classroom_assignments (
          id BIGSERIAL PRIMARY KEY,
          google_coursework_id TEXT NOT NULL UNIQUE,
          class_name TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          due_date DATE,
          alternate_link TEXT,
          synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_classroom_assignments_class ON classroom_assignments (class_name)`;

      // child_id is nullable: a submission only links to a local child once their Classroom
      // roster email matches children.classroom_student_email or primary_contact_email — an
      // unmatched submission is still stored (visible to admin as "unmatched") rather than
      // silently dropped.
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_submissions (
          id BIGSERIAL PRIMARY KEY,
          google_submission_id TEXT NOT NULL UNIQUE,
          classroom_assignment_id BIGINT NOT NULL REFERENCES classroom_assignments(id) ON DELETE CASCADE,
          child_id BIGINT REFERENCES children(id),
          google_student_email TEXT,
          state TEXT NOT NULL,
          alternate_link TEXT,
          synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_classroom_submissions_child ON classroom_submissions (child_id)`;

      // One signature per (child, form) — signing again overwrites rather than accumulating a
      // history, since these are point-in-time consent forms, not documents that get amended.
      // signature_data_url is the raw data: URL a <canvas> produces (image/png;base64,...),
      // embedded directly into the generated PDF — no separate file storage needed.
      await sql`
        CREATE TABLE IF NOT EXISTS compliance_signatures (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          form_key TEXT NOT NULL,
          signed_by_name TEXT NOT NULL,
          signature_data_url TEXT NOT NULL,
          signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (child_id, form_key)
        )
      `;

      // accept_token is generated at creation time (not just once sent) so the row never has to
      // branch on "does a token exist yet" — every letter, draft or not, has a stable accept URL.
      // Acceptance is by token, not a customer login, since a family at Letter of Offer stage
      // (enquiry/booking_waitlist) usually doesn't have a parent portal account yet.
      await sql`
        CREATE TABLE IF NOT EXISTS letters_of_offer (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted')),
          start_date DATE NOT NULL,
          programme TEXT,
          class_name TEXT,
          tuition_plan TEXT,
          fees_note TEXT,
          additional_terms TEXT,
          accept_token TEXT NOT NULL UNIQUE,
          sent_at TIMESTAMPTZ,
          accepted_at TIMESTAMPTZ,
          accepted_by_name TEXT,
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_letters_of_offer_child ON letters_of_offer (child_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS enrolment_submissions (
          id BIGSERIAL PRIMARY KEY,
          student_name TEXT NOT NULL,
          student_dob DATE NOT NULL,
          previous_school TEXT,
          previous_grade TEXT,
          siblings_attending TEXT,
          start_date DATE NOT NULL,
          enrolment_length TEXT NOT NULL,
          enrolment_length_other TEXT,
          kitas_status TEXT NOT NULL,
          kitas_notes TEXT,
          passport_number TEXT,
          passport_nationality TEXT,
          passport_expiry DATE,
          photography_consent BOOLEAN NOT NULL,
          medical_conditions TEXT,
          allergies TEXT,
          lunch_option TEXT NOT NULL,
          lunch_other_notes TEXT,
          shuttle_service BOOLEAN NOT NULL DEFAULT false,
          emergency_contact_name TEXT NOT NULL,
          emergency_contact_phone TEXT NOT NULL,
          authorized_pickup TEXT,
          parent_name TEXT NOT NULL,
          parent_email TEXT NOT NULL,
          parent_whatsapp TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          notify_email_status TEXT NOT NULL DEFAULT 'pending',
          reply_email_status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE enrolment_submissions ADD COLUMN IF NOT EXISTS shuttle_service BOOLEAN NOT NULL DEFAULT false`;

      // One family card (children row) can accumulate several of these over time — a March enquiry
      // and a June enrolment form aren't the same event, so this is an append-only log rather than a
      // status column on `children`; see findOrCreateFamilyForContact/logFamilyActivity in
      // family-matching.ts, called from submitEnquiry()/submitEnrolment().
      await sql`
        CREATE TABLE IF NOT EXISTS family_activity_log (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          tag TEXT NOT NULL CHECK (tag IN ('current_enrolment_enquiry', 'new_student_enrolment_form')),
          source_table TEXT NOT NULL CHECK (source_table IN ('enquiries', 'enrolment_submissions')),
          source_id BIGINT NOT NULL,
          summary TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_family_activity_log_child ON family_activity_log (child_id)`;

      // One Google account (the school's) authorizes meeting-scheduling for the whole school — same
      // singleton pattern as classroom_connection, but a separate row/scope: the Classroom
      // connection is read-only (courses/rosters/coursework) and this one needs calendar read
      // (freebusy) + write (creating events with a Google Meet link), so they're kept as
      // independent OAuth grants rather than trying to widen the Classroom one.
      await sql`
        CREATE TABLE IF NOT EXISTS calendar_connection (
          id INTEGER PRIMARY KEY DEFAULT 1,
          google_account_email TEXT NOT NULL,
          calendar_id TEXT NOT NULL,
          access_token TEXT NOT NULL,
          access_token_expires_at TIMESTAMPTZ NOT NULL,
          refresh_token TEXT NOT NULL,
          connected_by BIGINT REFERENCES admin_users(id),
          connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CHECK (id = 1)
        )
      `;

      // One row per "send a meeting-scheduling email" action — either a manual click on
      // ScheduleMeetingButton (Letter of Offer section, letter_of_offer_id set) or the automatic
      // send from submitEnrolment() right after a new Student Enrolment Form comes in
      // (letter_of_offer_id null, since there's no letter yet at that point). Availability is
      // computed live from the connected calendar's free/busy data at booking time rather than
      // stored here — this table only records the outcome (still awaiting a pick, or booked with
      // what/when/how).
      await sql`
        CREATE TABLE IF NOT EXISTS meeting_invites (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          letter_of_offer_id BIGINT REFERENCES letters_of_offer(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          parent_email TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'booked', 'cancelled')),
          meeting_format TEXT CHECK (meeting_format IN ('in_person', 'video')),
          booked_start TIMESTAMPTZ,
          booked_end TIMESTAMPTZ,
          booked_by_name TEXT,
          google_event_id TEXT,
          meet_link TEXT,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          booked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // Covers any database where meeting_invites already existed with the old NOT NULL
      // constraint (CREATE TABLE IF NOT EXISTS above is then a no-op) — safe to run unconditionally,
      // DROP NOT NULL on an already-nullable column is a no-op too.
      await sql`ALTER TABLE meeting_invites ALTER COLUMN letter_of_offer_id DROP NOT NULL`;
      await sql`CREATE INDEX IF NOT EXISTS idx_meeting_invites_letter ON meeting_invites (letter_of_offer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_meeting_invites_child ON meeting_invites (child_id)`;

      // --- Lunch booking ---

      // Same singleton shape as school_settings, but deliberately NOT seeded with real values —
      // there's no actual lunch supplier bank/pricing info to seed it with. Starts at
      // normal_price_idr/large_price_idr = 0 and empty bank fields; the parent-facing order route
      // refuses to create an order until an admin fills these in at /admin/settings (see
      // src/pages/api/account/lunch-orders/create.ts).
      await sql`
        CREATE TABLE IF NOT EXISTS lunch_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          supplier_name TEXT NOT NULL DEFAULT '',
          supplier_email TEXT,
          payable_to TEXT NOT NULL DEFAULT '',
          bank_name TEXT NOT NULL DEFAULT '',
          account_number TEXT NOT NULL DEFAULT '',
          account_name TEXT NOT NULL DEFAULT '',
          swift_code TEXT NOT NULL DEFAULT '',
          bank_address TEXT,
          bank_code TEXT,
          branch_code TEXT,
          clearing_code TEXT,
          currency TEXT NOT NULL DEFAULT 'IDR',
          invoice_due_days INTEGER NOT NULL DEFAULT 7,
          normal_price_idr BIGINT NOT NULL DEFAULT 0,
          large_price_idr BIGINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CHECK (id = 1)
        )
      `;
      // Covers the already-deployed lunch_settings table (CREATE TABLE IF NOT EXISTS above is then
      // a no-op) — when set, a copy of each priced order's details (dates, days, size, food
      // preference, allergies — the prep-relevant fields, not the invoice/pricing) is emailed here
      // automatically. Left null by default: no real supplier email to seed it with.
      await sql`ALTER TABLE lunch_settings ADD COLUMN IF NOT EXISTS supplier_email TEXT`;
      await sql`INSERT INTO lunch_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

      // Lunch invoices reuse the same invoices/invoice_children/invoice_line_items tables as
      // tuition/activity — one more line-item-priced invoice type, not a parallel billing system.
      await sql`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check`;
      await sql`ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check CHECK (invoice_type IN ('tuition', 'activity', 'lunch'))`;

      // One row per parent-facing lunch order action — either a real order (own_lunch = false,
      // billed via the linked invoice) or a "bringing lunch from home" acknowledgement (own_lunch =
      // true, no invoice, dates/weekdays/size unused). lunch_count is stored rather than
      // recomputed on read so a later price change never silently reprices a past order.
      await sql`
        CREATE TABLE IF NOT EXISTS lunch_orders (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          customer_id BIGINT NOT NULL REFERENCES customers(id),
          own_lunch BOOLEAN NOT NULL DEFAULT false,
          start_date DATE,
          end_date DATE,
          monday BOOLEAN NOT NULL DEFAULT false,
          tuesday BOOLEAN NOT NULL DEFAULT false,
          wednesday BOOLEAN NOT NULL DEFAULT false,
          thursday BOOLEAN NOT NULL DEFAULT false,
          friday BOOLEAN NOT NULL DEFAULT false,
          lunch_size TEXT CHECK (lunch_size IN ('normal', 'large')),
          food_preference TEXT,
          allergies_notes TEXT,
          lunch_count INTEGER,
          invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_lunch_orders_child ON lunch_orders (child_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_lunch_orders_customer ON lunch_orders (customer_id)`;

      // --- Attendance check-in/check-out ---

      // Most students attend every school day and are checked in/out at the gate; a smaller group
      // only ever attends specific after-school/weekend activities and is never part of the daily
      // gate roster. The kiosk and parent portal both branch their roster/flow on this flag.
      await sql`
        ALTER TABLE children ADD COLUMN IF NOT EXISTS enrollment_type TEXT NOT NULL DEFAULT 'regular'
        CHECK (enrollment_type IN ('regular', 'activities_only'))
      `;

      // A parent linked by admin (Family Board / Child Card) is trusted immediately — the admin is
      // the one vouching for the relationship. A parent who links themselves via the self-service
      // /account/link-child flow is 'pending' until an admin approves it, since an open self-link
      // would otherwise let anyone claim someone else's child and check them in or out. Existing
      // rows (all admin-created, pre-dating this column) default to 'approved' so nothing already
      // linked is retroactively locked out.
      await sql`
        ALTER TABLE guardian_children ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
        CHECK (status IN ('pending', 'approved', 'rejected'))
      `;
      await sql`ALTER TABLE guardian_children ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
      await sql`ALTER TABLE guardian_children ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES admin_users(id)`;
      await sql`ALTER TABLE guardian_children ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`;

      // The gate kiosk used to unlock with its own shared PIN (kiosk_settings singleton, pin_hash).
      // It's now gated by a normal staff login instead (see src/proxy.ts) so an admin-recorded
      // check-in at the gate can be attributed to a real person — the PIN table is dropped rather
      // than left behind unused.
      await sql`DROP TABLE IF EXISTS kiosk_settings`;

      // One row per check-in or check-out action, from either entry point. `session_type` splits
      // the daily gate roster ('daily', activity_id always null) from activity-specific check-ins
      // ('activity', activity_id required) — the two are kept in the same table (rather than a
      // parallel one) since both need to show up together on a student's attendance history and in
      // school-wide reporting. `performed_by_customer_id`/`performed_by_admin_id` are both nullable
      // and mutually exclusive in practice: a kiosk action has neither (no login, just whoever's
      // standing at the tablet), a portal action has the logged-in parent, and an admin correction
      // has the acting staff member.
      await sql`
        CREATE TABLE IF NOT EXISTS attendance_events (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL CHECK (event_type IN ('check_in', 'check_out')),
          session_type TEXT NOT NULL DEFAULT 'daily' CHECK (session_type IN ('daily', 'activity')),
          activity_id BIGINT REFERENCES activities(id),
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          source TEXT NOT NULL CHECK (source IN ('kiosk', 'parent_portal', 'admin')),
          performed_by_customer_id BIGINT REFERENCES customers(id),
          performed_by_admin_id BIGINT REFERENCES admin_users(id),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CHECK (session_type = 'activity' OR activity_id IS NULL)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_attendance_events_child_time ON attendance_events (child_id, occurred_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_attendance_events_occurred_at ON attendance_events (occurred_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_attendance_events_activity ON attendance_events (activity_id) WHERE activity_id IS NOT NULL`;

      // A kiosk or parent-portal check-in/out must be signed for (drawn signature + the signer's
      // name) — enforced by attendanceCheckSchema in src/lib/validation.ts, not a DB constraint
      // here, since a hard CHECK would also have to account for the small number of rows already
      // written before this column existed. An admin correction (source = 'admin') is the explicit
      // override this requirement exists to have — it's never signed, by design.
      await sql`ALTER TABLE attendance_events ADD COLUMN IF NOT EXISTS signature_data_url TEXT`;
      await sql`ALTER TABLE attendance_events ADD COLUMN IF NOT EXISTS signed_by_name TEXT`;

      // One per child, sent from the "Off-boarding Letter" action on the Child Card once a family
      // leaves — a thank-you note plus a short, tokenized exit survey (same public-token trust model
      // as letters_of_offer.accept_token: the survey_token itself is the credential, emailed only to
      // the parent). Survey answers live on the same row rather than a separate table since it's a
      // strict one-to-one, always answered together in a single submission.
      await sql`
        CREATE TABLE IF NOT EXISTS offboarding_letters (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'completed')),
          survey_token TEXT NOT NULL UNIQUE,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          completed_at TIMESTAMPTZ,
          experience_rating INTEGER CHECK (experience_rating BETWEEN 1 AND 5),
          recommend_score INTEGER CHECK (recommend_score BETWEEN 0 AND 10),
          marketing_consent BOOLEAN,
          feedback_text TEXT,
          completed_by_name TEXT,
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_offboarding_letters_child ON offboarding_letters (child_id)`;

      // One per child, sent automatically by the welcome-letters cron 3 days before enrolment_date
      // (or manually, from the "Welcome Letter" action on the Child Card next to Letter of Offer).
      // UNIQUE on child_id makes the cron's "who's due" query naturally idempotent: a child already
      // has a row here means it's already been sent, so a re-run of the cron on the same day (or a
      // manual send afterwards) can't double-send. sent_by distinguishes an automatic cron send from
      // an admin's manual override, for display on the Child Card only.
      await sql`
        CREATE TABLE IF NOT EXISTS welcome_letters (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          sent_by TEXT NOT NULL DEFAULT 'auto' CHECK (sent_by IN ('auto', 'admin')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // The weekly timetable feeding the parent/student portal's "This week" schedule — separate
      // from lesson_plans (which is per-week content, not a recurring time slot) and from
      // classroom_assignments (Google Classroom coursework, no time-of-day). One row per recurring
      // weekly slot; day_of_week as TEXT (not an int) so raw rows read clearly without a lookup
      // table, ordered in queries via a CASE expression — see getWeeklyScheduleForClass.
      await sql`
        CREATE TABLE IF NOT EXISTS class_schedule (
          id BIGSERIAL PRIMARY KEY,
          class_name TEXT NOT NULL,
          subject TEXT NOT NULL,
          teacher_id BIGINT REFERENCES admin_users(id),
          day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          format TEXT NOT NULL DEFAULT 'in_person' CHECK (format IN ('online', 'in_person')),
          location_or_link TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_class_schedule_class ON class_schedule (class_name)`;

      // --- Budget Tracker (Principal + admin only, gated separately — see budgetUnlocked on the
      // admin session in src/lib/auth.ts) ---

      await sql`
        CREATE TABLE IF NOT EXISTS budget_categories (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          monthly_budget_idr BIGINT NOT NULL DEFAULT 0,
          is_archived BOOLEAN NOT NULL DEFAULT false,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // One row per manual budget change — old/new value and who/when — so an edited figure
      // reads as a deliberate, attributed decision rather than a number that silently drifted.
      await sql`
        CREATE TABLE IF NOT EXISTS budget_category_history (
          id BIGSERIAL PRIMARY KEY,
          category_id BIGINT NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
          changed_by BIGINT REFERENCES admin_users(id),
          old_value_idr BIGINT NOT NULL,
          new_value_idr BIGINT NOT NULL,
          changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_budget_category_history_category ON budget_category_history (category_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS budget_revenue (
          id BIGSERIAL PRIMARY KEY,
          entry_date DATE NOT NULL,
          amount_idr BIGINT NOT NULL,
          payer_source TEXT NOT NULL,
          description TEXT,
          payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash')),
          receipt_url TEXT,
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_budget_revenue_date ON budget_revenue (entry_date)`;

      await sql`
        CREATE TABLE IF NOT EXISTS budget_expenses (
          id BIGSERIAL PRIMARY KEY,
          entry_date DATE NOT NULL,
          amount_idr BIGINT NOT NULL,
          category_id BIGINT NOT NULL REFERENCES budget_categories(id),
          vendor_description TEXT NOT NULL,
          authorized_by TEXT NOT NULL,
          receipt_url TEXT,
          created_by BIGINT REFERENCES admin_users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses (entry_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_budget_expenses_category ON budget_expenses (category_id)`;

      // Starting categories/figures confirmed with the school (2026-08-08): pulled from the real
      // "Monthly P&L" tab of the accounting workbook the school provided (recent-month actuals,
      // Management Fee excluded per the school's own note that it was a one-off pre-Yayasan-account
      // reimbursement, not a recurring category), plus Events and Teacher Hires as new categories
      // with no history yet (start at 0). ON CONFLICT DO NOTHING so this never overwrites a figure
      // the school has since edited themselves.
      await sql`
        INSERT INTO budget_categories (name, monthly_budget_idr, sort_order) VALUES
          ('Staff Salaries & Wages', 69000000, 1),
          ('School Supplies & Equipment', 5600000, 2),
          ('Food, Catering & Staff Welfare', 6600000, 3),
          ('Facilities, Fit-out & Term Setup Costs', 2700000, 4),
          ('Marketing, Software & Subscriptions', 3300000, 5),
          ('Transport', 600000, 6),
          ('Bank Fees & Charges', 100000, 7),
          ('Events', 0, 8),
          ('Teacher Hires', 0, 9)
        ON CONFLICT (name) DO NOTHING
      `;

      // Singleton (id always 1). term_start/end_date and opening_cash give the dashboard's "current
      // term" and "cash on hand" figures something real to compute against rather than guessing at
      // term boundaries — both editable from Budget Setup. Seeded from the accounting workbook's own
      // "Cash Flow Forecast" tab (labelled "Aug to Dec 2026 (Next Term)") and "Cash Position" tab
      // (total known school cash as of Jul-26: Rp 125,496,169.94, rounded down to the nearest rupiah).
      await sql`
        CREATE TABLE IF NOT EXISTS budget_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          term_label TEXT NOT NULL DEFAULT 'Term 3, 2026',
          term_start_date DATE NOT NULL DEFAULT '2026-08-01',
          term_end_date DATE NOT NULL DEFAULT '2026-12-31',
          opening_cash_idr BIGINT NOT NULL DEFAULT 125496169,
          opening_cash_as_of DATE NOT NULL DEFAULT '2026-07-31',
          CONSTRAINT budget_settings_singleton CHECK (id = 1)
        )
      `;
      await sql`INSERT INTO budget_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

      // --- "Remember this device" (see src/lib/device-trust.ts) ---

      // Polymorphic across the two passwordless-adjacent login types (parent magic-link,
      // student username/password) rather than two near-identical tables — account_id means
      // customers.id when account_type='customer', student_accounts.id when 'student'. No FK
      // constraint is possible across two target tables, so device-trust.ts is the only code
      // path allowed to write here; it always re-verifies the referenced account still exists
      // on every read, which is also what makes a suspended/deleted account immediately stop
      // a device token from working, not just a future flag we don't have yet.
      // token_hash stores SHA-256(raw token) only — the raw token lives solely in the user's
      // httpOnly cookie, never at rest here, so a database leak can't be replayed as a login.
      await sql`
        CREATE TABLE IF NOT EXISTS device_tokens (
          id BIGSERIAL PRIMARY KEY,
          account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'student')),
          account_id BIGINT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          device_label TEXT,
          ip_address TEXT,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_device_tokens_account ON device_tokens (account_type, account_id)`;

      // Generic sliding-window counter reused across every auth endpoint that needs throttling
      // (device-token verification, magic-link requests, student password login — see
      // checkRateLimit in device-trust.ts). One row per (scope, identifier); identifier is
      // usually an IP address, sometimes IP+email for endpoints where enumeration matters too.
      await sql`
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
          scope TEXT NOT NULL,
          identifier TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 1,
          window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (scope, identifier)
        )
      `;

      // --- Per-student Weekly Schedule (calendar-aware) — extends the class_schedule feature
      // above (Teaching → Weekly Schedule) rather than replacing it. class_schedule stays the
      // recurring weekly *pattern* per class; the tables below add calendar-real occurrence
      // dates, per-schedule-type applicability, and everything parents/students/teachers/admins
      // need on top of it. See src/lib/academic-calendar.ts and src/lib/schedule.ts.

      // Which schedule type a student is on (separate from `status`, which tracks their
      // enrolment lifecycle — a full_time student can still be on_site, hybrid, or
      // home_schooling; those answer different questions). Nullable: existing children have none
      // set yet and the UI treats that as "needs setup," same pattern as unset lunch pricing.
      await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS schedule_type TEXT CHECK (schedule_type IN ('on_site', 'hybrid', 'home_schooling'))`;

      // Admin-managed, kept current by hand — there is no reliable machine-readable source for
      // this (the school's own Academic Calendar PDF is a color-coded grid with no per-date
      // holiday names in its text layer). Terms are seeded empty on purpose: reconstructing exact
      // term boundaries from a compressed calendar image risked encoding wrong dates with false
      // confidence. Add them from /admin/teaching/schedule once confirmed.
      await sql`
        CREATE TABLE IF NOT EXISTS academic_terms (
          id BIGSERIAL PRIMARY KEY,
          label TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS academic_calendar_exceptions (
          id BIGSERIAL PRIMARY KEY,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          label TEXT NOT NULL,
          exception_type TEXT NOT NULL CHECK (exception_type IN ('public_holiday', 'school_holiday')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_academic_calendar_exceptions_dates ON academic_calendar_exceptions (start_date, end_date)`;

      // Provisional first pass at the 2026/27 calendar's colour-coded exceptions, read directly
      // off the school's PDF — explicitly NOT confirmed. The 17 August public holiday is
      // Indonesian Independence Day (confirmed by the calendar's own highlighting, correcting
      // the 14 August originally mentioned when this was scoped); the rest are unlabelled
      // coloured cells given a best-guess reason. Review and correct every row before relying on
      // this for real scheduling — ON CONFLICT DO NOTHING so re-running this migration never
      // overwrites corrections already made.
      await sql`
        INSERT INTO academic_calendar_exceptions (start_date, end_date, label, exception_type) VALUES
          ('2026-07-01', '2026-07-05', 'Start-of-year break (unconfirmed)', 'school_holiday'),
          ('2026-08-17', '2026-08-17', 'Indonesian Independence Day', 'public_holiday'),
          ('2026-08-24', '2026-08-31', 'Term break (unconfirmed)', 'school_holiday'),
          ('2026-08-25', '2026-08-25', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2026-10-05', '2026-10-11', 'Public holiday period (unconfirmed — verify dates/name)', 'public_holiday'),
          ('2026-11-14', '2026-11-30', 'Term break (unconfirmed)', 'school_holiday'),
          ('2026-12-14', '2027-01-10', 'End-of-year break (unconfirmed)', 'school_holiday'),
          ('2027-03-08', '2027-03-21', 'Term break (unconfirmed)', 'school_holiday'),
          ('2027-03-26', '2027-03-26', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2027-05-01', '2027-05-01', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2027-05-06', '2027-05-06', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2027-06-01', '2027-06-01', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2027-06-06', '2027-06-06', 'Public holiday (unconfirmed — verify date/name)', 'public_holiday'),
          ('2027-06-21', '2027-06-30', 'End-of-year break (unconfirmed)', 'school_holiday')
        ON CONFLICT DO NOTHING
      `;

      // Per-session per-schedule-type applicability — absence of a row here means "applies,
      // using the session's own base format" for that schedule type, so a normal session with no
      // special handling needs zero rows. Only sessions that differ per schedule type (a Hybrid
      // student joins online what an On-Site student attends in person; a Home Schooling student
      // skips it entirely) need an explicit override row.
      await sql`
        CREATE TABLE IF NOT EXISTS class_schedule_type_overrides (
          id BIGSERIAL PRIMARY KEY,
          class_schedule_id BIGINT NOT NULL REFERENCES class_schedule(id) ON DELETE CASCADE,
          schedule_type TEXT NOT NULL CHECK (schedule_type IN ('on_site', 'hybrid', 'home_schooling')),
          applies BOOLEAN NOT NULL DEFAULT true,
          format_override TEXT CHECK (format_override IN ('online', 'in_person')),
          UNIQUE (class_schedule_id, schedule_type)
        )
      `;

      // meet_link is separate from the pre-existing location_or_link (which already covers room
      // names for in-person sessions) — pre-fillable from the mapped Google Classroom course,
      // but always editable per session since not every class has one mapped yet. lesson_plan_id
      // links a session straight to its canonical platform-authored lesson plan, so a parent or
      // student clicking a session never has to guess which lesson_plans row matches.
      await sql`ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS meet_link TEXT`;
      await sql`ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS lesson_plan_id BIGINT REFERENCES lesson_plans(id) ON DELETE SET NULL`;

      // The calendar-real occurrences a class_schedule row's weekly pattern expands into —
      // generated by src/lib/academic-calendar.ts against academic_terms/academic_calendar_exceptions,
      // never blindly "every Monday forever." starts_at/ends_at are real TIMESTAMPTZ (the pattern's
      // start_time/end_time interpreted in the school's Asia/Makassar timezone), which is what
      // makes correct timezone display for a travelling parent or student possible at all — a
      // plain TIME column has no timezone to convert from. manually_edited marks an occurrence an
      // admin has hand-adjusted (moved, retimed, cancelled), so regenerating the term never
      // silently overwrites it.
      await sql`
        CREATE TABLE IF NOT EXISTS schedule_session_occurrences (
          id BIGSERIAL PRIMARY KEY,
          class_schedule_id BIGINT NOT NULL REFERENCES class_schedule(id) ON DELETE CASCADE,
          occurrence_date DATE NOT NULL,
          starts_at TIMESTAMPTZ NOT NULL,
          ends_at TIMESTAMPTZ NOT NULL,
          is_cancelled BOOLEAN NOT NULL DEFAULT false,
          cancellation_reason TEXT,
          manually_edited BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (class_schedule_id, occurrence_date)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_class ON schedule_session_occurrences (class_schedule_id, occurrence_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_starts ON schedule_session_occurrences (starts_at)`;

      // Reminder opt-in — defaults to nobody getting reminders until a parent explicitly turns
      // them on for a child, rather than opt-out (spec: "respect this preference exactly, no
      // re-enabling silently" is easiest to guarantee when off is the one true default).
      // class_schedule_id NULL = this child's global default; a specific id overrides it for just
      // that session.
      await sql`
        CREATE TABLE IF NOT EXISTS schedule_notification_prefs (
          id BIGSERIAL PRIMARY KEY,
          customer_id BIGINT NOT NULL REFERENCES customers(id),
          child_id BIGINT NOT NULL REFERENCES children(id),
          class_schedule_id BIGINT REFERENCES class_schedule(id) ON DELETE CASCADE,
          enabled BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_global
        ON schedule_notification_prefs (customer_id, child_id) WHERE class_schedule_id IS NULL
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_per_session
        ON schedule_notification_prefs (customer_id, child_id, class_schedule_id) WHERE class_schedule_id IS NOT NULL
      `;

      // Stops the reminder cron emailing the same session twice — one row per (occurrence,
      // customer) once a reminder for it has actually been sent.
      await sql`
        CREATE TABLE IF NOT EXISTS schedule_reminders_sent (
          occurrence_id BIGINT NOT NULL REFERENCES schedule_session_occurrences(id) ON DELETE CASCADE,
          customer_id BIGINT NOT NULL REFERENCES customers(id),
          sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (occurrence_id, customer_id)
        )
      `;

      // Audit trail for schedule edits — same shape as budget_category_history (old/new value,
      // who, when), the one existing precedent for this in the app. JSONB rather than many
      // nullable columns since "what changed" varies a lot by change_type (reschedule vs teacher
      // change vs cancellation vs a brand-new session).
      await sql`
        CREATE TABLE IF NOT EXISTS schedule_session_history (
          id BIGSERIAL PRIMARY KEY,
          class_schedule_id BIGINT REFERENCES class_schedule(id) ON DELETE SET NULL,
          occurrence_id BIGINT REFERENCES schedule_session_occurrences(id) ON DELETE SET NULL,
          changed_by BIGINT REFERENCES admin_users(id),
          change_type TEXT NOT NULL,
          old_value JSONB,
          new_value JSONB,
          changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_schedule_history_class ON schedule_session_history (class_schedule_id)`;

      // Lets a departed teacher (or admin) be deactivated rather than deleted: blocks their login
      // and drops them from teacher-assignment pickers, but their name stays intact on every
      // session, lesson plan, and audit history row they're linked to.
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;

      // --- Curriculum Plans (Oak National Academy-style term browser) — a separate, richer
      // hierarchy from the existing curriculum_units "current unit" flag and the flat lesson_plans
      // table above: a term/programme (class + subject + term) holds an ordered list of units,
      // each holding an ordered list of lessons, each with its own worksheet and extra resources.
      // Kept additive rather than reshaping curriculum_units/lesson_plans, so the existing "Current
      // Curriculum Unit" and "Upcoming Lessons" widgets on the parent/student dashboards keep
      // working unchanged.
      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_terms (
          id BIGSERIAL PRIMARY KEY,
          class_name TEXT NOT NULL,
          subject TEXT NOT NULL,
          term_label TEXT NOT NULL,
          framework_label TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (class_name, subject, term_label)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_terms_class ON curriculum_terms (class_name)`;

      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_term_units (
          id BIGSERIAL PRIMARY KEY,
          term_id BIGINT NOT NULL REFERENCES curriculum_terms(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          title TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_term_units_term ON curriculum_term_units (term_id, sort_order)`;

      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_unit_lessons (
          id BIGSERIAL PRIMARY KEY,
          unit_id BIGINT NOT NULL REFERENCES curriculum_term_units(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          title TEXT NOT NULL,
          objectives TEXT,
          worksheet_url TEXT,
          worksheet_title TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_unit_lessons_unit ON curriculum_unit_lessons (unit_id, sort_order)`;

      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_lesson_resources (
          id BIGSERIAL PRIMARY KEY,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_lesson_resources_lesson ON curriculum_lesson_resources (lesson_id)`;

      // Two nullable "updated by" columns rather than one polymorphic pair — a parent or a staff
      // member can each mark their own child's progress (per the spec: both roles can update this,
      // unlike the rest of the parent-facing app which is read-only), and a plain FK can't point at
      // two different tables.
      await sql`
        CREATE TABLE IF NOT EXISTS child_lesson_progress (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
          updated_by_admin_user_id BIGINT REFERENCES admin_users(id),
          updated_by_customer_id BIGINT REFERENCES customers(id),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (child_id, lesson_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_child_lesson_progress_child ON child_lesson_progress (child_id)`;

      // Self-directed "Complete online" flow (Oak National Academy-style: Introduction -> Starter
      // quiz -> Lesson video -> Exit quiz), on top of the existing worksheet/resources a lesson
      // already has. video_url stays nullable/empty until a teacher adds one -- there's no video
      // content yet, but the step still needs to exist in the flow.
      await sql`ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS video_url TEXT`;
      await sql`ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS video_title TEXT`;
      await sql`ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS equipment_note TEXT`;

      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_lesson_quiz_questions (
          id BIGSERIAL PRIMARY KEY,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          quiz_type TEXT NOT NULL CHECK (quiz_type IN ('starter', 'exit')),
          sort_order INTEGER NOT NULL DEFAULT 0,
          question TEXT NOT NULL,
          options TEXT[] NOT NULL,
          correct_option_index INTEGER NOT NULL,
          hint TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_curriculum_lesson_quiz_questions_lesson
        ON curriculum_lesson_quiz_questions (lesson_id, quiz_type, sort_order)
      `;

      // A student completing the online flow themselves is a third, distinct "who touched this"
      // actor alongside the existing admin/customer pair -- earned through actually answering the
      // exit quiz, not the free-form status picker parents/teachers get (students still don't get
      // that; see child_lesson_progress's own comment above).
      await sql`ALTER TABLE child_lesson_progress ADD COLUMN IF NOT EXISTS updated_by_student_account_id BIGINT REFERENCES student_accounts(id)`;

      // Fine-grained step-by-step state for the online flow -- separate from child_lesson_progress
      // (which stays the single coarse not_started/in_progress/completed status shown everywhere
      // else) so a child can resume exactly where they left off, and so the hub screen can show
      // each step's own state the way Oak's does.
      await sql`
        CREATE TABLE IF NOT EXISTS child_lesson_online_progress (
          id BIGSERIAL PRIMARY KEY,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          intro_done BOOLEAN NOT NULL DEFAULT false,
          starter_quiz_score INTEGER,
          starter_quiz_total INTEGER,
          video_done BOOLEAN NOT NULL DEFAULT false,
          exit_quiz_score INTEGER,
          exit_quiz_total INTEGER,
          completed_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (child_id, lesson_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_child_lesson_online_progress_child ON child_lesson_online_progress (child_id)`;

      // Per-occurrence Google Meet/Calendar sync state. One event per dated session (not one shared
      // event for the whole weekly pattern) -- deliberately chosen even though it means far more
      // Calendar API calls, so a rescheduled or teacher-swapped single session gets its own updated
      // event rather than sharing state with every other week. meet_link is only ever populated for
      // an 'online' (or format_override 'online') occurrence; in-person ones still get a calendar
      // event (so it's on the teacher's calendar) but no video link. Sync happens out of band (see
      // /api/cron/sync-session-meetings) rather than inline during regenerateScheduleOccurrences --
      // calling Google's API once per occurrence synchronously there, across a whole term's worth of
      // rows, would reproduce the exact timeout bug that function's own unnest() batching was built
      // to avoid in the first place. 'pending' is the default for both brand-new occurrences and ones
      // regenerateScheduleOccurrences just updated (see that function's ON CONFLICT clause) -- the
      // cron picks up anything not yet 'synced' and creates or updates the Calendar event accordingly.
      await sql`ALTER TABLE schedule_session_occurrences ADD COLUMN IF NOT EXISTS meet_link TEXT`;
      await sql`ALTER TABLE schedule_session_occurrences ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT`;
      await sql`
        ALTER TABLE schedule_session_occurrences ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT
        NOT NULL DEFAULT 'pending' CHECK (calendar_sync_status IN ('pending', 'synced', 'failed'))
      `;
      await sql`ALTER TABLE schedule_session_occurrences ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT`;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_sync_status
        ON schedule_session_occurrences (calendar_sync_status) WHERE calendar_sync_status != 'synced'
      `;

      // --- Post-lesson worksheet upload, marking, and gradebook ---
      // One submission per (occurrence, child) -- who uploaded it is one of three nullable "actor"
      // columns, same shape as child_lesson_progress's updated_by_* trio, since a plain FK can't
      // point at three different tables and exactly one of these is set depending on whether a
      // teacher, parent, or the student themselves uploaded it.
      await sql`
        CREATE TABLE IF NOT EXISTS session_worksheet_submissions (
          id BIGSERIAL PRIMARY KEY,
          occurrence_id BIGINT NOT NULL REFERENCES schedule_session_occurrences(id) ON DELETE CASCADE,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          uploaded_by_admin_user_id BIGINT REFERENCES admin_users(id),
          uploaded_by_customer_id BIGINT REFERENCES customers(id),
          uploaded_by_student_account_id BIGINT REFERENCES student_accounts(id),
          uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (occurrence_id, child_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_worksheet_submissions_child ON session_worksheet_submissions (child_id)`;

      // One mark per submission (UNIQUE), numeric score always required, rubric ratings optional and
      // layered on top via a separate table -- "both" per the agreed scope, not an either/or.
      await sql`
        CREATE TABLE IF NOT EXISTS worksheet_marks (
          id BIGSERIAL PRIMARY KEY,
          submission_id BIGINT NOT NULL UNIQUE REFERENCES session_worksheet_submissions(id) ON DELETE CASCADE,
          score NUMERIC NOT NULL,
          max_score NUMERIC NOT NULL DEFAULT 10,
          comments TEXT,
          marked_by BIGINT REFERENCES admin_users(id),
          marked_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // A small, fixed, reusable set of rubric criteria (e.g. "Effort", "Understanding") an admin
      // defines once and every teacher rates against, rather than a bespoke rubric per lesson --
      // matches the "small fixed rubric" scope agreed, not a full rubric-builder. label is UNIQUE
      // so the starter set below can be seeded idempotently and an admin can still add more later
      // (see /api/admin/worksheet-rubric-criteria) without ever duplicating one.
      await sql`
        CREATE TABLE IF NOT EXISTS worksheet_rubric_criteria (
          id BIGSERIAL PRIMARY KEY,
          label TEXT NOT NULL UNIQUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        INSERT INTO worksheet_rubric_criteria (label, sort_order) VALUES
          ('Effort', 1), ('Understanding', 2), ('Presentation', 3)
        ON CONFLICT (label) DO NOTHING
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS worksheet_rubric_scores (
          id BIGSERIAL PRIMARY KEY,
          mark_id BIGINT NOT NULL REFERENCES worksheet_marks(id) ON DELETE CASCADE,
          criterion_id BIGINT NOT NULL REFERENCES worksheet_rubric_criteria(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          UNIQUE (mark_id, criterion_id)
        )
      `;

      // --- Interactive lesson content (generation-engine output) ---
      // interactive_content is the step-by-step experience InteractiveLessonStepper renders in
      // place of the plain objectives/worksheet/video view -- see src/lib/interactive-content-types.ts
      // for its shape. teaching_script is separate, teacher-facing generation output (talking
      // points/timing/misconceptions per step) -- never shown to a student. video_source labels
      // where video_url's content came from so the player knows how to embed it; null (every
      // existing lesson) keeps today's YouTube-only embed behaviour unchanged.
      await sql`ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS interactive_content JSONB`;
      await sql`ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS teaching_script JSONB`;
      await sql`
        ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS video_source TEXT
        CHECK (video_source IN ('notebooklm', 'uploaded', 'youtube'))
      `;

      // Generated content lands here and is invisible to parents/students (see curriculum.ts's
      // review_status filtering) until a teacher explicitly publishes it -- defaults to
      // 'published' so every lesson that already exists today keeps rendering exactly as before.
      await sql`
        ALTER TABLE curriculum_unit_lessons ADD COLUMN IF NOT EXISTS review_status TEXT
        NOT NULL DEFAULT 'published' CHECK (review_status IN ('needs_review', 'published'))
      `;

      // A lesson's vocabulary deck -- shown together at the closing recap step alongside the
      // homework checklist, not scattered as separate flip-card moments (those come from an
      // inline 'flip_card' step in interactive_content instead; see that type's own comment).
      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_lesson_flashcards (
          id BIGSERIAL PRIMARY KEY,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          term TEXT NOT NULL,
          definition TEXT NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_lesson_flashcards_lesson ON curriculum_lesson_flashcards (lesson_id, sort_order)`;

      // A per-child override of a lesson's interactive_content -- when a row exists here for the
      // child currently taking the lesson, InteractiveLessonStepper renders personalized_content
      // instead of the lesson's own base interactive_content. UNIQUE (lesson_id, child_id) since
      // there's at most one active personalization per child per lesson; regenerating one is an
      // upsert, not a new row.
      await sql`
        CREATE TABLE IF NOT EXISTS curriculum_unit_lesson_personalizations (
          id BIGSERIAL PRIMARY KEY,
          lesson_id BIGINT NOT NULL REFERENCES curriculum_unit_lessons(id) ON DELETE CASCADE,
          child_id BIGINT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          personalized_content JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (lesson_id, child_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_curriculum_personalizations_child ON curriculum_unit_lesson_personalizations (child_id)`;

      // Short, teacher-set list of interests/local references the generation engine can draw on
      // for examples -- generation input only, never shown to students directly. Null/empty means
      // the engine falls back to solid generic examples (see the generation engine's own comment).
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS context_pack JSONB`;

      await setSchemaVersion(SCHEMA_VERSION);
    })();
  }
  return schemaReady;
}

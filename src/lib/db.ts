import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

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

/** Idempotently creates tables if they don't exist. Safe to call on every request. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
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
    })();
  }
  return schemaReady;
}

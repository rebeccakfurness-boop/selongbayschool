import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

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
      // No scheduled job flips status to 'expired' automatically (no background-worker
      // infrastructure in this app) — "active" is instead always computed live as
      // status = 'paid' AND expires_at > now() AND sessions_used < total_sessions,
      // wherever that matters (see /api/passes/active and the pack-session booking path).

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
    })();
  }
  return schemaReady;
}

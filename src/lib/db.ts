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
// merely importing this file — e.g. during the Next.js build's page-data
// collection step — doesn't require a database connection string to exist.
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
      await sql`
        CREATE TABLE IF NOT EXISTS booking_slots (
          id BIGSERIAL PRIMARY KEY,
          activity_slug TEXT NOT NULL,
          activity_name TEXT NOT NULL,
          slot_date DATE NOT NULL,
          slot_time TEXT NOT NULL,
          capacity INTEGER NOT NULL CHECK (capacity > 0),
          spots_remaining INTEGER NOT NULL CHECK (spots_remaining >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_booking_slots_activity_date
        ON booking_slots (activity_slug, slot_date)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id BIGSERIAL PRIMARY KEY,
          slot_id BIGINT NOT NULL REFERENCES booking_slots(id),
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
    })();
  }
  return schemaReady;
}

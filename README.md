# Selong Bay School

The Selong Bay School website: Next.js 14+ (App Router), TypeScript, and Tailwind CSS,
deployed on Vercel with Postgres (Neon) for form/booking storage and Resend for
transactional email.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Postgres via Neon** (`@neondatabase/serverless`): enquiries, activity bookings, availability slots
- **Resend**: every form submission emails `hello@selongbayschool.com` plus an auto-reply to the submitter
- **Cookie-based admin auth**: a single shared password protects `/admin`
- Deployed on **Vercel**, connected to this GitHub repo; every push to `main` triggers a new deployment

## Environment variables

Set these in Vercel (Project Settings → Environment Variables) and in a local `.env.local` for development:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. When you add the Vercel Postgres (Neon) integration, Vercel sets `POSTGRES_URL` automatically; either name works, `DATABASE_URL` is checked first. |
| `RESEND_API_KEY` | Yes | API key from [resend.com](https://resend.com). Without it, forms still save to the database but emails will fail (and the UI tells the user so). |
| `RESEND_FROM_EMAIL` | No | Sender address, e.g. `Selong Bay School <hello@selongbayschool.com>`. Defaults to Resend's sandbox address `onboarding@resend.dev`, which only works for testing. Verify your domain in Resend and set this before going live. |
| `ADMIN_SESSION_SECRET` | Yes | Secret used to encrypt the admin session cookie (via iron-session). Set a long random value; any length works, it's hashed internally to fit iron-session's minimum. |
| `NEXT_PUBLIC_SNAPWIDGET_ID` | No | Widget ID from [snapwidget.com](https://snapwidget.com) for the homepage's live Instagram grid. Until set, the site shows a "follow us" fallback card instead. |

## Local development

```bash
npm install
npm run dev
```

You'll need a Postgres database reachable from your machine (a Neon branch, or any Postgres) and
the env vars above in `.env.local`. Tables are created automatically on first use, so no manual
migration step is required, but you can also run:

```bash
npm run db:init        # create tables if they don't exist
npm run db:seed        # seed the activities table and a few weeks of bookable sessions
npm run db:seed-admin  # create the first admin_users row (prints a one-time temporary password)
```

## How the forms work

Every submission (contact, admissions, high school, activity booking) follows the same order:

1. Validate input **server-side** (Zod schemas in `src/lib/validation.ts`)
2. Write to Postgres **first**, so nothing is lost even if email sending fails
3. Email `hello@selongbayschool.com` via Resend with the full submission
4. Send an auto-reply confirmation to whoever submitted the form
5. Return a clear success/failure message to the UI: a form never just spins or fails silently
6. Log any email failure server-side (`console.error`) so it can be followed up manually; the
   submission itself is still saved and visible at `/admin`

## Booking system

- `activities` holds each bookable activity; `sessions` holds per-activity date/time/capacity
  (seed both with `npm run db:seed`); `bookings` references a session via `slot_id`.
- Booking creation uses a single atomic SQL statement (an `UPDATE ... RETURNING` feeding an
  `INSERT ... SELECT`) so two people can never book the last spot at the same time: the second
  request simply gets a "that slot just filled up" response.
- Manage sessions at `/admin/availability` (add/edit capacity/remove). Sessions with existing
  bookings can't be deleted; set capacity to match spots taken instead, to stop new bookings
  without losing booking history.

## Admin area

- `/admin/login`: email + password, checked against the `admin_users` table (bcrypt-hashed
  passwords). Seed the first account with `npm run db:seed-admin` (prints a one-time temporary
  password to the console - not stored anywhere in the repo).
- `/admin/forgot-password`: emails a 1-hour reset link via Resend to the address in `admin_users`,
  if it exists (the response is identical either way, so this can't be used to enumerate admin
  emails).
- `/admin/reset-password?token=...`: sets a new password from that link.
- Every `/admin/*` page and `/api/admin/*` route requires a valid session (enforced in
  `src/proxy.ts`); unauthenticated page requests redirect to `/admin/login`, API requests get
  a 401.
- `/admin`: every enquiry and booking, with email delivery status
- `/admin/availability`: manage bookable sessions per activity

## Content & photos

Written content (curriculum, pricing, admissions steps, activities, staff bios, contact details)
lives in `src/lib/site-content.ts`, a single source of truth pulled from the previous site.

Photos have not been added yet. Every photo banner and card falls back to a teal/sand gradient
placeholder labelled with the expected filename (e.g. "Photo needed: hero-campus-kids.jpg").
Drop real photos into `public/images/` and replace the corresponding `placeholderName`/`image`
prop in the page file; no other changes are needed.

Two content items on the old site were broken/ambiguous and were **not guessed**:
- Adventure Camp 2026 (Full Week) pricing: shown as "Contact us for pricing"
- Phone number: two different numbers appeared on the old site; the WhatsApp/contact number
  (`+62 813-5974-095`) is used site-wide. Confirm and update `src/lib/site-content.ts` if wrong.

## Deployment

1. Import this repository into Vercel (New Project → this GitHub repo).
2. Add the environment variables above in Vercel's project settings.
3. Add the Vercel Postgres (Neon) integration, or connect your own Neon database and set
   `DATABASE_URL`.
4. Deploy: every push to `main` redeploys automatically.
5. Before considering forms "live," submit a real test through each of the four forms
   (Contact, Admissions, High School, Activity booking) and confirm the email arrives at
   `hello@selongbayschool.com`.

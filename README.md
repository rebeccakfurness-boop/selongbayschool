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
| `ADMIN_PASSWORD` | Yes | The single shared password for `/admin`. |
| `ADMIN_SESSION_SECRET` | No | Secret used to sign the admin session cookie. Defaults to `ADMIN_PASSWORD` if unset; set a separate long random value in production. |
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

- `booking_slots` holds per-activity date/time/capacity; `bookings` references a slot.
- Booking creation uses a single atomic SQL statement (an `UPDATE ... RETURNING` feeding an
  `INSERT ... SELECT`) so two people can never book the last spot at the same time: the second
  request simply gets a "that slot just filled up" response.
- Manage slots at `/admin/availability` (add/edit capacity/remove). Slots with existing bookings
  can't be deleted; set capacity to match spots taken instead, to stop new bookings without
  losing booking history.

## Admin area

- `/admin/login`: password from `ADMIN_PASSWORD`
- `/admin`: every enquiry and booking, with email delivery status
- `/admin/availability`: manage bookable slots per activity

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

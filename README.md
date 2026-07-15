# Selong Bay School

The Selong Bay School website: Next.js 14+ (App Router), TypeScript, and Tailwind CSS,
deployed on Vercel with Postgres (Neon) for form/booking storage and Gmail SMTP (via
nodemailer) for transactional email.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Postgres via Neon** (`@neondatabase/serverless`): enquiries, activity bookings, availability slots
- **Gmail SMTP via nodemailer**: every form submission emails `hello@selongbayschool.com` plus an
  auto-reply to the submitter, cc'd to `hello@selongbayschool.com` as well, so there's always a
  copy in the school inbox even if something is wrong with the customer's address
- **Cookie-based admin auth**: a single shared password protects `/admin`
- Deployed on **Vercel**, connected to this GitHub repo; every push to `main` triggers a new deployment

## Environment variables

Set these in Vercel (Project Settings → Environment Variables) and in a local `.env.local` for development:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. When you add the Vercel Postgres (Neon) integration, Vercel sets `POSTGRES_URL` automatically; either name works, `DATABASE_URL` is checked first. |
| `GMAIL_USER` | Yes | The Gmail address emails are sent from, e.g. `hello@selongbayschool.com` (must be a Gmail or Google Workspace address). Without it (or `GMAIL_APP_PASSWORD`), forms still save to the database but emails will fail (and the UI tells the user so). |
| `GMAIL_APP_PASSWORD` | Yes | A 16-character [Google App Password](https://myaccount.google.com/apppasswords) for that account (requires 2-Step Verification enabled). This is not the account's normal login password. |
| `ADMIN_SESSION_SECRET` | Yes | Secret used to encrypt the admin session cookie (via iron-session). Set a long random value; any length works, it's hashed internally to fit iron-session's minimum. |
| `BLOB_READ_WRITE_TOKEN` | For activity photo uploads | Set automatically when you add the Vercel Blob integration to this project (Storage tab → Create Database → Blob). Without it, activity photo uploads in `/admin/activities` will fail; everything else still works. |
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
3. Email `hello@selongbayschool.com` via Gmail SMTP with the full submission
4. Send an auto-reply confirmation to whoever submitted the form, cc'd to `hello@selongbayschool.com`
5. Return a clear success/failure message to the UI: a form never just spins or fails silently
6. Log any email failure server-side (`console.error`) so it can be followed up manually; the
   submission itself is still saved and visible at `/admin`

The contact form additionally writes a second row into `crm_enquiries` (`source = 'contact_form'`),
the newer CRM table from an earlier schema round that nothing else writes to yet — nothing about
the existing `/admin/enquiries` flow (the `enquiries` table, still the one that view reads from)
changed. Admissions and high-school submissions only ever go to `enquiries`, since `'contact_form'`
is the only `crm_enquiries.source` value that applies to them.

## Booking system

- `activities` holds each bookable activity (name, day, default time/capacity, price in
  `price_idr` as a whole IDR amount with no decimals, and an `is_active` flag); `sessions` holds
  per-activity dated instances with their own capacity; `bookings` references a session via
  `slot_id`.
- Booking creation uses a single atomic SQL statement (an `UPDATE ... RETURNING` feeding an
  `INSERT ... SELECT`) so two people can never book the last spot at the same time: the second
  request simply gets a "that slot just filled up" response.
- Manage activities and sessions at `/admin/activities`: an inline-editable activities table (name,
  day, time, duration, description, price, capacity, active/inactive), an "Add Activity" form, and
  an upcoming sessions list. Inactive activities are hidden from the public `/activities` page.
- Picking a session on the public `/activities` page shows a real month calendar
  (`src/components/BookingCalendar.tsx`), not a flat list: available days are highlighted, clicking
  one reveals that day's time slots below it. It's a plain function of a `slots` array with no
  network calls of its own, which is what let this get verified with mock data (no live database
  needed) before shipping.
- "Cancel this session" marks the session and its bookings cancelled (freeing its spots from every
  capacity count and public listing — cancelled sessions are excluded from `/api/bookings/slots`
  and from the "sessions today"/booking-count stats), and emails every booked customer a
  cancellation notice via Gmail SMTP (cc'd to `hello@selongbayschool.com`). If their
  `payment_method` was `pay_online`, the email also asks
  them to get in touch if they'd already sent payment so a manual refund can be arranged (there's
  no automated refund path). It does not touch any external calendar (no Google Calendar
  integration exists in this app). Sessions with zero bookings can still be hard-deleted via
  "Remove"; sessions with bookings can only be cancelled, to preserve booking history.
- The public `/activities` page always shows every `is_active` activity, even with no upcoming
  sessions or none with spots left. The Book Now button is replaced with a "Fully booked" message
  (has sessions, all full) or a "Contact us for availability" link to `/contact` (no sessions
  scheduled at all).
- Prices are formatted with `formatIDR()` (thousand separators, e.g. `Rp 150.000`) everywhere
  they're shown, including the public activity card next to its Book Now button.
- Each activity can have a photo (`photo_url`), uploaded from the activities table or the Add
  Activity form via Vercel Blob (`@vercel/blob`, requires `BLOB_READ_WRITE_TOKEN`). Uploads go
  straight from the browser to Blob storage using a short-lived client token issued by
  `/api/admin/activities/upload`; the returned URL is then saved onto the activity. The public
  `/activities` page shows this photo on the activity's card if set, falling back to the site's
  existing curated photos, then to a placeholder gradient.
- After picking a session and entering their details, a visitor chooses **Pay Online** or **Pay at
  the Session**. Either way the booking is created immediately and counts toward capacity right
  away (`sessions.spots_remaining` decrements the same way for both) — both are treated as a real
  commitment, not just an intent to pay. Pay Online shows the bank transfer details (Bank Mandiri,
  account number, name) and a Wise link — defined once in `bankTransferDetails` in
  `src/lib/site-content.ts` and reused by both the booking form and the emails, so they can't drift
  out of sync — and sets `bookings.status` to `pending_payment`; Pay at the Session sets it to
  `pay_at_session`. Both send the same two emails as before (customer confirmation + notification
  to `hello@selongbayschool.com`), now including the amount due and chosen payment method, plus the
  bank/Wise details when paying online.
- `bookings.status` is one of `pending_payment`, `pay_at_session`, `paid`, or `cancelled`.
  `pending_payment` bookings get a "Mark as Paid" action in `/admin/bookings` once the transfer is
  confirmed manually — there's no payment gateway wired up yet, so nothing sets this automatically.
  `bookings.payment_method` (`pay_online`/`pay_at_session`) and `bookings.stripe_session_id` are
  also stored; `stripe_session_id` is reserved for a future real payment gateway and isn't written
  to anywhere yet.

## Customer accounts

Entirely separate from the admin login above — a different cookie, a different table (`customers`,
not `admin_users`), and a different auth mechanism.

- Auth is **magic link only** (no passwords): `/account/signup` (email, name, phone) and
  `/account/login` (email) both email a one-time link via Gmail SMTP, valid for 30 minutes, that
  logs the visitor in when clicked. This one is deliberately **not** cc'd to `hello@selongbayschool.com`
  since it's a live login link, not a form submission. `customers.password_hash` exists in the schema but stays unused by
  every row — kept in case password login gets added later, not because guests need it (guests
  never get a `customers` row at all).
- When booking, a visitor who isn't logged in sees "Continue as guest" or "Log in / Sign up" after
  picking a session; a logged-in customer skips straight to the details form, pre-filled from their
  account. Either way the same details form and the Pay Online / Pay at the Session choice follow.
  `bookings.customer_id` and `bookings.is_guest` are set purely from the visitor's own session
  cookie at submit time — never from anything the client sends — so nobody can attach a booking to
  someone else's account.
- `/account/bookings` shows a logged-in customer's own upcoming and past bookings. It's protected
  two ways: `src/proxy.ts` redirects anyone without a customer session to `/account/login`, and the
  query itself is always scoped to `WHERE customer_id = <their session's id>`, so even if the
  redirect were somehow bypassed the query still couldn't return anyone else's bookings.
- Signing up checks for existing guest bookings (`is_guest = true`, no `customer_id`) matching the
  new account's email and links them, so booking history isn't empty on day one. This only runs on
  signup, not on every login.
- The admin and customer sessions share the `ADMIN_SESSION_SECRET` env var as their root secret
  (no new required env var to configure) but are cryptographically domain-separated — each is
  hashed with a different salt in `src/lib/auth.ts` — so an admin session cookie and a customer
  session cookie can never be confused for each other.

### Activity packs

- `/account/buy-pack` (logged-in customers only) sells a fixed pack — `activityPass` in
  `src/lib/site-content.ts` (currently 10 sessions, Rp 3.000.000, valid 1 month from purchase) is
  the single source of truth the buy-pack page, `/api/passes`, and the confirmation emails all
  read from, so the price/size can't drift between what's shown and what's charged. Buying a pack
  goes through the same Pay Online / Pay at the Session choice as a booking and sends the same two
  emails (customer confirmation + `hello@selongbayschool.com` notification).
- A pass is "active" for booking purposes when `status = 'paid'`, `expires_at > now()`, and
  `sessions_used < total_sessions` — computed live everywhere it matters (`/api/passes/active`, the
  pack-session booking path), not by a stored flag. Nothing in this app flips a pass to `'expired'`
  automatically — there's no background-job infrastructure here — so that status value exists for
  the schema's completeness but isn't set by anything yet.
- When booking, if a logged-in customer has an active pass for the exact child name they're
  booking for, "Use a session from your pack" **replaces** the Pay Online / Pay at Session choice
  entirely (not offered alongside it). Picking it creates the booking with `status = 'paid'` and
  `payment_method = 'pack_session'` immediately — no separate payment or admin confirmation needed
  — and atomically increments `passes.sessions_used` in the same statement that decrements the
  session's `spots_remaining`, so both a double-booking race and a double-spend of the same pack
  session are impossible. The pack check is always re-verified server-side at submit time, never
  trusted from the client's earlier "you have an active pack" check.
- `bookings.pass_id` (not explicitly requested, added because otherwise there'd be no way to trace
  a pack-paid booking back to the pass it drew from) records which pass paid for a booking. Known
  gap: cancelling a session doesn't currently refund the pack session it consumed — nothing
  decrements `sessions_used` back down on cancellation.
- `/admin/bookings/passes` (a "Passes" tab next to "Bookings") lists every pass — customer, child,
  sessions remaining, expiry, amount, payment method, status — with the same "Mark as Paid" action
  as regular bookings (`MarkPaidButton` now takes a `kind` prop so it can PATCH either
  `/api/admin/bookings/:id` or `/api/admin/passes/:id`).

## Admin area

- `/admin/login`: email + password, checked against the `admin_users` table (bcrypt-hashed
  passwords). Seed the first account with `npm run db:seed-admin` (prints a one-time temporary
  password to the console - not stored anywhere in the repo).
- `/admin/forgot-password`: emails a 1-hour reset link via Gmail SMTP to the address in
  `admin_users`, if it exists (the response is identical either way, so this can't be used to
  enumerate admin emails). Also not cc'd to `hello@selongbayschool.com`, same reasoning as the
  customer magic link above.
- `/admin/reset-password?token=...`: sets a new password from that link.
- Every `/admin/*` page and `/api/admin/*` route requires a valid session (enforced in
  `src/proxy.ts`); unauthenticated page requests redirect to `/admin/login`, API requests get
  a 401.
- `/admin`: dashboard shell with a sidebar (Overview, Activities & Calendar, Bookings, Enquiries,
  Website Updates, Settings)
- `/admin` (Overview): quick stats — bookings this week, unread enquiries, sessions today
- `/admin/activities`: manage activities and their bookable sessions (see "Booking system" above)
- `/admin/bookings`: searchable/filterable table of every activity booking (by customer, activity,
  status), showing amount due, payment method, and email delivery status. A "Mark as Paid" action
  appears on `pending_payment` rows — this is the only way a booking becomes `paid`; there's no
  payment gateway wired up to do it automatically yet (see "Booking system" above).
- `/admin/enquiries`: every contact/admissions/high-school enquiry, with a read/unread toggle
- `/admin/website-updates`: status of requested website changes (`change_requests` table)
- `/admin/settings`: change your admin password

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

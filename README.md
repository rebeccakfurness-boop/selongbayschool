# Selong Bay School

The Selong Bay School website: Next.js 14+ (App Router), TypeScript, and Tailwind CSS,
deployed on Vercel with Postgres (Neon) for form/booking storage and Brevo for
transactional email.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Postgres via Neon** (`@neondatabase/serverless`): enquiries, activity bookings, availability slots
- **Brevo** (`@getbrevo/brevo`, sending from `hello@selongbayschool.com`): every form submission
  emails `hello@selongbayschool.com` plus an auto-reply to the submitter, cc'd to
  `hello@selongbayschool.com` as well, so there's always a copy in the school inbox even if
  something is wrong with the customer's address
- **Cookie-based admin auth**: a single shared password protects `/admin`
- Deployed on **Vercel**, connected to this GitHub repo; every push to `main` triggers a new deployment

## Environment variables

Set these in Vercel (Project Settings → Environment Variables) and in a local `.env.local` for development:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. When you add the Vercel Postgres (Neon) integration, Vercel sets `POSTGRES_URL` automatically; either name works, `DATABASE_URL` is checked first. |
| `BREVO_API_KEY` | Yes | API key from [Brevo](https://app.brevo.com/settings/keys/api). Without it, forms still save to the database but emails will fail (and the UI tells the user so). The sending address (`hello@selongbayschool.com`) is hardcoded in `src/lib/email.ts`, not an env var; verify that address as a sender in Brevo's dashboard before going live. |
| `ADMIN_SESSION_SECRET` | Yes | Secret used to encrypt the admin session cookie (via iron-session). Set a long random value; any length works, it's hashed internally to fit iron-session's minimum. |
| `BLOB_READ_WRITE_TOKEN` | For photo uploads | Set automatically when you add the Vercel Blob integration to this project (Storage tab → Create Database → Blob). Without it, activity photo uploads in `/admin/activities` and receipt photo uploads in the Budget Tracker will fail; everything else still works. |
| `NEXT_PUBLIC_SNAPWIDGET_ID` | No | Widget ID from [snapwidget.com](https://snapwidget.com) for the homepage's live Instagram grid. Until set, the site shows a "follow us" fallback card instead. |
| `CRON_SECRET` | Yes (for the daily cron jobs) | Any long random string. Vercel automatically sends it as `Authorization: Bearer <value>` when it triggers `/api/cron/passes` and `/api/cron/welcome-letters` (see `vercel.json`); each route rejects any request whose header doesn't match, so without this set neither cron job can run instead of running unauthenticated. |
| `BUDGET_TRACKER_PASSWORD` | Yes (for the Budget Tracker) | A separate shared password gating `/admin/budget` on top of the normal admin login — meant for the Principal specifically, not every admin account. Without it set, `/admin/budget` shows "not configured yet" instead of a working unlock screen. |

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
3. Email `hello@selongbayschool.com` via Brevo with the full submission
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
  cancellation notice via Brevo (cc'd to `hello@selongbayschool.com`). If their
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
  `/account/login` (email) both email a one-time link via Brevo, valid for 30 minutes, that
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
  pack-session booking path), not by the `status` column alone. The daily cron job below does flip
  `status` to `'expired'`, but only as a once-a-day cleanup for admin/customer lists (see below);
  a pass whose `expires_at` has already passed is correctly excluded from booking even before that
  job runs, since it's re-checked live every time.
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
- `/account/bookings` has a "My Packs" section showing a customer's own passes (child, sessions
  remaining, expiry, status), alongside their upcoming/past bookings.
- `/api/cron/passes` (see `vercel.json`, scheduled daily at 00:00 UTC / 08:00 Lombok time; requires
  `CRON_SECRET`, see Environment variables above) does three things to every `status = 'paid'` pass:
  1. Fully used (`sessions_used >= total_sessions`) and `completion_email_sent = false`: sends a
     "your pack is complete" email with a link to buy another, then sets that flag so it only ever
     sends once.
  2. Expiring within 7 days, not already fully used (that's covered by #1 instead, a pack is never
     sent both emails), and `expiry_reminder_sent = false`: sends a reminder with sessions remaining
     and the expiry date, then sets that flag so it only ever sends once.
  3. Past `expires_at` and not fully used: sets `status = 'expired'` (no email, this is purely a
     once-a-day tidy-up of the status column for admin/customer lists, not what gates whether a
     pass can actually be spent, see above).
  If an email send fails, its "sent" flag deliberately stays `false` so the next day's run retries
  it, rather than silently giving up after one failed attempt.

## Admin area

- `/admin/login`: email + password, checked against the `admin_users` table (bcrypt-hashed
  passwords). Seed the first account with `npm run db:seed-admin` (prints a one-time temporary
  password to the console - not stored anywhere in the repo).
- `/admin/forgot-password`: emails a 1-hour reset link via Brevo to the address in
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

## Operations dashboard (families, teachers, students)

Foundation for the admissions/enrolment/teaching ops system described separately.

### Child card lifecycle: Enquiry → Booking → Active → Inactive

Wires the Family Board's `status`/`is_active` fields into an actual lifecycle with one rule
throughout: **dragging a card is the only way status or active/inactive change.** Everything else
that used to touch either field directly — the Status and Active dropdowns in the Child Card's
edit form — is gone; `updateChildSchema` (the general edit-form save) no longer declares either
field, so even a malformed request can't sneak a status change through that route. The one other
place either field is set is creation (`createChildSchema`, still has both, for a new record's
starting status) and the new dedicated drag endpoint below.

- **`PATCH /api/admin/children/[id]/status`** (`src/app/api/admin/children/[id]/status/route.ts`)
  — the only thing `FamilyBoard.tsx`'s drag handler calls. Enforces the lifecycle's one guard rail:
  entering an active status (Full-Time/Temporary/Worldschooler/Hybrid) is blocked with `422` +
  "Set start date and programme type first" unless `enrolment_date` and `programme` are already on
  file (`checkActiveStatusGuardRail` in `src/lib/child-lifecycle.ts`). The board also runs the same
  check client-side before the optimistic move even starts, using data it already has, so the
  admin sees the inline message immediately rather than watching the card bounce back — but the
  route is the actual boundary, not the client check.
- **A 7th "Inactive" column**, not a 7th `ChildStatus` value. Withdrawal reuses the `is_active`
  flag that already existed and that the live calendar (`WHERE is_active = true`) and dashboard
  roster counts already filter on — so dragging a card there removes it from both with no changes
  to either subsystem. `status` itself is left untouched on withdrawal (not overwritten to
  something like `'inactive'`), so re-activating by dragging back restores the same
  Full-Time/Temporary/etc. status rather than losing it.
- **System-computed badges, not columns.** Compliance (unsigned / signed / out of date) and invoice
  status (not yet generated / outstanding / paid / N days overdue) render as colored pills on the
  board tile and Child Card header — nothing about them looks draggable or clickable-to-change,
  and there's no column for either. "Out of date" is a specific assumption worth flagging: a signed
  form older than `COMPLIANCE_STALE_AFTER_DAYS` (365, one place to change in
  `src/lib/child-lifecycle-shared.ts`) counts as stale. That threshold wasn't specified anywhere —
  it's a reasonable default for annual consent forms, not a confirmed school policy.
- **Invoice status is derived, not auto-created.** "Status + dates confirmed → auto-generate
  invoice" ran into the same wall the Letter-of-Offer flow already hit: there's no fee-schedule
  table, so `total_amount` can't be computed automatically (`tuition_plan` is free text, not a
  price). Silently creating a real, parent-visible invoice with a guessed or zero amount seemed
  worse than not creating one, so this **nudges instead of auto-generating** — the exact same
  pattern already in place for Letter-of-Offer acceptance (`sendChildActivatedInvoicePrompt` in
  `src/lib/email.ts`, sent once per child the first time it crosses into an active status with no
  non-cancelled tuition invoice yet, linking straight to the existing "+ New Invoice" form). The
  "not yet generated → outstanding → paid → N days overdue" badge itself is just read from
  whatever invoice rows actually exist — daily overdue-day recalculation needed no cron: it was
  already computed live at query time (`GREATEST(0, CURRENT_DATE - due_date)`), both here and
  wherever invoices were already shown.
- **"Enquiry → Family record"**: a new "Convert to Family" action on the Admissions Pipeline table
  (`src/components/admin/ConvertEnquiryButton.tsx`) turns one `admissions_enquiries` lead into a
  real `children` row, pre-filling the same form used for "+ New Family"
  (`src/components/admin/NewChildForm.tsx`, now reused with a `prefill`/`admissionsEnquiryId` prop
  rather than duplicated) so nothing the admissions team already typed needs retyping. The lead's
  `converted_child_id` (which already existed on `admissions_enquiries`, just had no writer before
  this) is set rather than the row being deleted, so the funnel source stays traceable. A new
  record always starts at `status = 'enquiry'` regardless of what the modal's now-disabled Status
  field would have shown — converting is "stop retyping what's on file," not "decide this is a
  firm booking"; that's still a separate, explicit drag to Booking, same as any other card. Two
  fields from the lead have nowhere to go on `children` (`child_age` is a free-text guess, not a
  dob; `plan_to_stay`, `follow_up_notes`, `source`, and the contact-history dates have no column at
  all) — all of it lands in one new free-text `children.admissions_notes` column
  (`admissionsNotesFromEnquiry` in `src/lib/child-lifecycle.ts`) rather than being dropped.

Deliberately untouched: compliance-signing internals (the checklist, the PDF/signature flow, the
7-item list itself), invoicing internals (creation, sending, marking paid), and the Family Tracker
CSV importer (`src/lib/family-import.ts` still inserts directly via raw SQL, unaffected by the
validation-schema changes above). This phase only wired the transition/status logic connecting
them — `src/lib/child-lifecycle.ts` (server-only) and `src/lib/child-lifecycle-shared.ts` (pure,
split out so the client-side board component could import the badge/guard-rail helpers without
pulling `@neondatabase/serverless` into the browser bundle) are the two new files that logic lives
in.

### Parent-editable profiles, profile photo, and the parent student-card view

Three policy questions were asked before this phase (direct-edit vs. approval-queue for parent
edits; whether medical/dietary edits should auto-notify anyone; how identity documents should be
stored) and went unanswered, so it shipped with the recommended default from each — flagged here
rather than silently assumed:

- **Direct edit, not an approval queue.** A parent's edit to their own child's contact/dietary/
  medical/language/previous-school fields saves immediately — there's no pending/approval state
  anywhere in this app today, and building one (a review queue, an admin approve/reject UI, a
  "pending" badge on the card) would have been a much bigger, separate piece of work. If stale
  medical data slipping straight to "live" without a human gate turns out to be too risky in
  practice, the fields to gate are `allergies_medical_notes`, `dietary_requirements`, and
  `lunch_option` specifically — those are the ones with real safety weight.
- **Auto-notify on medical/dietary/lunch edits: admin inbox + the child's assigned teacher(s).**
  `sendChildProfileEditNotification()` (`src/lib/email.ts`) fires whenever a parent edit changes
  `allergies_medical_notes`, `dietary_requirements`, or `lunch_option`, listing old → new values.
  This doesn't expose anything a teacher couldn't already see — those fields are already visible,
  ungated, on the admin/teacher Child Card — it just makes sure the person actually with the child
  day-to-day notices the change instead of finding out next time they happen to open the card.
- **Identity documents: extended the existing 2 fields, added a 3rd**, rather than building a new
  general-purpose documents table. `children.passport_copy_url` and `.kitas_copy_url` already
  existed (admin-only); this phase makes both parent-writable too (their own child only) and adds
  `birth_certificate_url` alongside them. This was the smaller build of the two options — it can't
  grow to arbitrary future document types without another migration each time, which is the
  tradeoff for not building the more open-ended table now.

**Compliance forms — explicitly not touched or linked.** None of the 3 identity-document fields
above (passport/KITAS/birth certificate) are wired to any of the 7 Forms & Compliance checklist
items (`COMPLIANCE_ITEMS` in `src/lib/family-data.ts`). Those 7 are signed consent forms (liability,
photography, pickup authorization, etc.); identity documents are a categorically different thing
that already lived in its own "Immigration Documents" section before this phase. Uploading a
passport does not mark anything as signed — flagging this since it was explicitly asked about,
not assumed either way.

What shipped:

- **`children.photo_url`** (+ `photo_updated_by_label`, `photo_updated_at`, set server-side on
  every change, never from client input) — a circular avatar (`src/components/ChildAvatar.tsx`)
  now appears next to the child's name on the Family Board tile, the Child Card header
  (admin+teacher — same component, so both views got it in one change), and the parent portal.
  Both admin and the child's own parent can upload/replace it
  (`src/components/AvatarUploadField.tsx`, images only, 5MB cap) — matching the "who last updated
  it" accountability the photo specifically needed, given it's a children's-safety-adjacent field.
- **`children.previous_school`, `.lunch_option`** — two new free-text columns; `lunch_option`
  replaces the Child Card's old "Lunch selection is coming in a later phase" placeholder.
- **Parent profile card** (`src/components/account/ParentChildProfileCard.tsx`, on the existing
  `/account/learning` page — the parent's per-child dashboard already existed from the LMS phase,
  this extends it rather than building a new page tree) shows the same core info as the admin
  Child Card (contact, medical/allergies, dietary/lunch, previous school, nationality, class,
  status) and lets a parent edit the fields decided above, plus upload/replace the 3 identity
  documents and the profile photo — all gated server-side by a `guardian_children` ownership check
  (`guardianOwnsChild()` in `src/lib/lms-data.ts`), not just hidden client-side.
- **Term report download and upcoming lessons were already built** (Learning Profile PDF download,
  `getUpcomingLessonPlans` filtered by class) — the existing `/account/learning` page already had
  both, reusing the identical `lesson_plans` table/query the teacher portal (`/admin/teaching`)
  itself uses. No new code needed for either.
- **Photo feed: left as-is, not narrowed.** The existing Photo Feed section on `/account/learning`
  shows photos tagged to the child *or* untagged class-wide broadcasts
  (`getPhotoFeedForChild()` in `src/lib/lms-data.ts`) — broader than "only photos tagged with this
  specific child." Narrowing it (or adding a second, stricter section next to it) would either
  change existing behavior other things depend on, or duplicate a very similar gallery twice on
  the same page for a subtle distinction — flagging the discrepancy here rather than guessing which
  one was actually wanted.

Parent-facing upload route (`/api/account/children/[childId]/upload`) mirrors the existing admin
one but checks `guardianOwnsChild` before issuing a token *and* re-checks the requested blob
pathname inside `onBeforeGenerateToken` against `children/{childId}/` — defense in depth against a
client that passes the ownership check for its own child but tries to point the actual upload at a
different child's folder.

### Letter of Offer: editable PDF, send to parent, parent-facing acceptance

A new "Letter of Offer" section on the Child Card, above Invoices, works like a lighter-weight
sibling of the invoicing system:

- **Create/edit** (`+ New letter of offer`, admin-only) — a simple form (start date, programme,
  class, tuition plan, fees note, free-text additional terms) prefilled from the child's existing
  record. Generates a PDF on the fly (`src/lib/pdf/LetterOfOfferDocument.tsx`, same
  `@react-pdf/renderer` pattern as invoices). Editing is blocked once a letter is accepted — the
  parent agreed to specific terms, so a real change should be a new letter, not a silent edit of
  the one they saw.
- **Send to parent** — emails the PDF plus a link to a public, unauthenticated acceptance page at
  `/letter-of-offer/[token]`. The token (`letters_of_offer.accept_token`, a 32-byte random value
  generated at creation) is the credential, the same trust model as this app's password-reset and
  customer magic-link flows — deliberate, since a family at Letter-of-Offer stage
  (enquiry/booking_waitlist) usually has no parent portal account yet, so gating acceptance behind
  a login would block the exact people it's for.
- **Parent acceptance** — the public page shows the offer's details and a "View/download PDF" link
  (the token also authorizes the PDF route itself), then a name field + confirmation checkbox.
  Accepting POSTs to `/api/letters-of-offer/accept/[token]` (no session required), which sets
  `status = 'accepted'`, `accepted_at`, `accepted_by_name`.
- **Prompting admin to send the invoice** — acceptance triggers two things: an email to the school
  inbox with a direct link to `/admin/families/[id]/invoices/new?type=tuition`, and a persistent
  orange banner on the Child Card ("Offer accepted by X — send the tuition invoice") that stays up
  until the child actually has an invoice (`invoices.length > 0`, reusing the same query the
  Invoices section already runs) — no separate "dismissed" flag needed, the banner's condition is
  just "has this been acted on yet."

The PDF-rendering routes (`/api/letters-of-offer/[id]/pdf`, `/api/admin/letters-of-offer/[id]/send`)
live under the Pages Router, same reasoning as the invoice PDF/send routes below. The PDF route
itself isn't under `/api/admin/` — same reasoning as `/api/invoices/[id]/pdf` allowing a guardian
session through: a parent following the accept-page link needs to view the PDF too, authorized by
the token query param rather than a staff session.

One route-naming gotcha worth knowing: the PDF route's dynamic segment is `[id]` (numeric) and the
accept route's is `[token]` (the random string) — Next.js requires the *same* slug name for a
dynamic segment shared between the Pages and App routers at the same URL depth, so the accept route
lives at `/api/letters-of-offer/accept/[token]` (token nested one level deeper under a static
`accept` segment) rather than `/api/letters-of-offer/[token]/accept`, to keep the two `[id]`/`[token]`
segments at different depths instead of colliding.

### Budget Tracker: real-time revenue/expense tracking against category budgets

`/admin/budget` (Principal only — see the password gate below) — logs revenue and expenses in
real time and shows exactly how much is left to spend per category, replacing the school's manual
accounting spreadsheet rather than just mirroring it (every figure is editable).

- **Categories & starting budgets** were confirmed with the school (2026-08-08) from the real
  "Monthly P&L" tab of the accounting workbook they provided — recent-month actuals, rounded to
  sensible monthly figures. "Management Fee (Owner Payment)" from the workbook was deliberately
  left out per the school's own note that it was a one-off pre-Yayasan-account reimbursement, not
  a recurring category. Events and Teacher Hires are new categories with no history, seeded at
  Rp 0 — nothing here is invented. See the `budget_categories` seed insert in `src/lib/db.ts` for
  the exact sourced figures and reasoning per category.
- **Password gate** (`BUDGET_TRACKER_PASSWORD`, see Environment variables above): a second,
  separate password on top of the normal admin login, gating every `/admin/budget/*` page
  (`src/app/admin/(dashboard)/budget/layout.tsx`) *and* every budget API route
  (`requireBudgetUnlocked()` in `src/lib/current-staff.ts`) — the school asked for this to be
  Principal-only, not visible to every admin account, and enforcing it only at the page layout
  would leave the underlying API routes reachable by any admin who knew the URLs. Sets
  `budgetUnlocked` on the normal admin session (same 12-hour TTL); a "Lock" button clears just
  that flag without ending the whole admin session.
- **Dashboard**: one card per category (budgeted / spent this month / remaining, with a progress
  bar — teal under 80%, amber 80–100%, red over budget), plus top-line revenue/expenses/net for
  the current calendar month and the current term, and a cash-on-hand figure. "Current term" and
  "cash on hand" both come from `budget_settings` (a singleton row, editable in Budget Setup) —
  seeded from the workbook's own "Aug to Dec 2026 (Next Term)" framing and its real Jul-26 closing
  cash balance, rather than a guessed date range. Cash on hand = that opening balance plus every
  revenue/expense logged in the tracker since.
- **Log Revenue / Log Expense**: date, amount, payer or category+vendor, payment method (revenue
  only — bank transfer vs. cash) or who authorized it (expenses only), and a receipt/proof-of-payment
  photo via `ReceiptUploadField` (shows a local thumbnail immediately from the picked file, before
  the upload even finishes) uploaded to Vercel Blob — a failed photo upload never blocks saving the
  entry itself, it just saves without one.
- **Budget Setup**: inline-editable category budgets — every change is logged to
  `budget_category_history` (old value, new value, who, when) before applying, so an adjusted
  figure always reads as a deliberate, attributed decision rather than silent drift. Also where
  new categories are added and old ones archived (soft-deleted, so historical expense entries keep
  their category name intact).
- **Transaction Log**: combined revenue + expenses, live search and type filter, receipt photos in
  a lightbox — for reconciling against bank statements.

### "Remember this device" — parent and student login without the email/password round-trip

Applies to both parent login (`/account/login`, magic-link — no password) and student login
(`/student/login`, username/password — no email involved at all, since young children can't
reliably check email). Automatic, not opt-in: every successful login trusts the browser it
happened in, so the next visit can skip straight past the email link or password re-entry.

- **How it works**: on login, a random 32-byte token is issued, its SHA-256 hash stored in
  `device_tokens` (never the raw token), and the raw token set as a long-lived httpOnly + Secure +
  SameSite=Lax cookie (`sbs_customer_device` / `sbs_student_device`) — 45 days, **rotated on every
  use**, so an actively-used device effectively never expires while an abandoned one lapses 45
  days after its last login. All of this logic lives in `src/lib/device-trust.ts`.
- **Return visit**: `/account/login` and `/student/login` are Server Components that check for the
  device cookie before rendering anything. If it's valid, instead of the normal form they show a
  "Continue as [name]?" card (`src/components/account/ContinueAsCard.tsx`) — deliberately a
  one-click confirmation, not a fully silent redirect. That's not a shortcut I took lightly: a
  Server Component can't set cookies (only Route Handlers can), so the actual rotate-token/create-
  session work always had to happen in a route the page links to either way — and showing *whose*
  login it would continue as is what stops a shared family or classroom computer from silently
  signing in as whoever last used it, when a different child or parent sits down next. "Not you?"
  revokes the token outright and shows the normal form. Missing, expired, or revoked tokens fall
  back to the normal form the same way, with no error shown — indistinguishable from a first-time
  visit.
- **Logging out forgets the device**: `/api/account/logout` and `/api/student/logout` both revoke
  the device token and clear its cookie, not just end the session — so a shared or school computer
  isn't left silently trusted after someone logs out.
- **Managing trusted devices**: parents can see every remembered device (label, IP, first-seen,
  last-used) and revoke individually, or "log out everywhere" (revokes all of them and ends the
  current session too) from **Account Settings → Trusted Devices**
  (`src/components/account/TrustedDevicesManager.tsx`). There's no equivalent student-facing page
  today — if a parent reports a shared/school device they want forgotten for their child, the
  fastest path right now is `UPDATE device_tokens SET revoked_at = now() WHERE account_type =
  'student' AND account_id = <student_accounts.id> AND revoked_at IS NULL;`. The underlying
  functions (`listDeviceTokens`, `revokeAllDeviceTokensForAccount`) already support a proper admin
  UI for this — it just isn't wired up yet, since there's no existing admin surface for student
  accounts at all to attach it to.
- **What immediately invalidates a device token**: the referenced `customers` / `student_accounts`
  row no longer existing (checked on every use — the closest thing this app has to "suspended,"
  since neither table has a status flag today), explicit logout, "log out everywhere," or revoking
  it individually. If email-change or account suspension are ever added, call
  `revokeAllDeviceTokensForAccount()` at that point too — flagged with a comment next to the
  `customers` table in `db.ts`.
- **Rate limiting**: this also added the first rate limiting anywhere in the app — none existed
  before, on any auth endpoint. `checkRateLimit()` in `device-trust.ts` is a generic sliding-window
  counter (`auth_rate_limits` table) now applied to device-token redemption, the magic-link request
  endpoint, and student password login. Every other admin/customer auth endpoint remains
  unthrottled; expanding that is a separate follow-up if wanted.
- **Audit trail**: `console.log('[device-trust] ...')` lines for `new_device_trusted`,
  `device_login`, and `device_forgotten`, greppable in Vercel's logs if a parent reports
  unexpected access.

### Welcome Letter: auto-sent 3 days before a child's first day

A "Welcome Letter" section on the Child Card, between Letter of Offer and Off-boarding Letter —
one PDF per child (`welcome_letters` table, `child_id` UNIQUE) covering what to bring on the first
day (hat, sunblock, drink bottle, own stationery, shoes, swimming clothes for water-based-activity
days, morning/afternoon tea snacks), the daily schedule (drop-off 8:30am, lunch 12:00–1:30pm,
pick-up 3:30pm), and key contacts (the school WhatsApp number for both Ms Indhira and Mariya) —
plus reminders to confirm the lunch selection and to use the parent portal for daily check-in/out.
Edit the times/contacts/what-to-bring list directly in `src/lib/pdf/WelcomeLetterDocument.tsx` if
they ever change.

- **Automatic send**: `/api/cron/welcome-letters` (Pages Router — renders a PDF, same reasoning as
  the Letter of Offer PDF routes below — scheduled daily at 01:00 UTC in `vercel.json`, reuses
  `CRON_SECRET`) finds every active child whose `enrolment_date` is exactly 3 days away
  (`WELCOME_LETTER_DAYS_BEFORE` in `src/lib/welcome-letters.ts`) with no welcome letter sent yet,
  emails the PDF, and records the send.
- **Manual override**: "Send now" on the Child Card (`/api/admin/welcome-letters/send`,
  admin-only) sends immediately regardless of the enrolment date — useful for a late enrolment
  inside the 3-day window, or to re-send. `child_id` being UNIQUE means a manual send after the
  cron already ran just updates the existing record rather than erroring.

### Enquiries feed the same meeting-scheduling + Family Board pipeline as the Enrolment Form

- **Contact and High School enquiry forms** now have an optional "Child's name" field (Admissions
  already had a required one). Whenever an enquiry names a child, it's linked to a Family Board
  card exactly like an admissions/enrolment submission (`findOrCreateFamilyForContact`) — a general
  enquiry naming no child still isn't tracked as a family, unchanged from before.
- **Automatic "Schedule a meeting" email**: any enquiry (not just enrolment) that ends up linked to
  a child now also triggers the same automatic meeting invite the Enrolment Form has sent since
  Phase 6 — same `meeting_invites`/Google Calendar flow, silently skipped if Google Calendar isn't
  connected. In effect, the "book a meeting" link is now available from every enquiry channel that
  names a specific child, not just the dedicated Enrolment Form.
- **Enrolment Form fully populates the Child Card**: `populateChildFromEnrolment()`
  (`src/lib/child-lifecycle.ts`) now writes every field the Student Enrolment Form collects that
  has a home on the `children` record (DOB, start date, emergency contact, lunch option, KITAS/visa
  status, allergies, parent contact details, etc.) onto the newly linked or matched card
  immediately, so nobody has to re-type what a parent just submitted. Fields with no direct column
  (passport number/expiry, shuttle service, planned length of enrolment) are rolled into
  `admissions_notes` instead, the same pattern already used for admissions-pipeline leads.

### Forms & Compliance: clickable documents, e-signature, send to parent

Each of the 7 Child Card compliance items (Liability Form, Photography/Social Media, Pickup
Authorization, Behavioral/Code of Conduct, Financial Agreement, Parent Protection Addendum,
Personal Data Consent) is now clickable, opening a modal with:

- **View / download PDF** — generated on the fly (same `@react-pdf/renderer` pattern as invoices)
  from placeholder legal text in `src/lib/compliance-forms.ts`. **The text is a placeholder and
  needs the school's real wording swapped in** before these are used for anything binding — each
  form's `paragraphs` array is clearly marked.
- **Sign** — a plain `<canvas>` signature pad (`SignaturePad.tsx`, pointer events, no external
  library) plus a "signed by" name field. Saving embeds the drawn signature (a PNG data URL) into
  a new `compliance_signatures` table (one row per child+form, overwritten on re-sign) and flips
  the existing `children.{form}_signed` / `{form}_date` columns so the rest of the app (the
  compliance checklist itself, the Overview dashboard's "Forms Outstanding" tile) keeps working
  unchanged. The next PDF generated for that form embeds the stored signature image and signed-by
  name/date — nothing is pre-rendered or stored as a static file.
- **Send to parent** — emails the generated PDF (signed or not) to an address defaulting to the
  child's contact email, same Brevo attachment pattern as invoices (`sendComplianceFormEmail` in
  `src/lib/email.ts`).

This is a real but informal e-signature (a drawn mark embedded in the PDF, not a
cryptographically-verified signature) — appropriate for internal consent-form tracking, not a
legal e-signature product. Admin can also still remove a saved signature (reverting the item to
"Not signed") if it was captured in error.

The three new routes that call `renderToBuffer` (`/api/admin/compliance/[childId]/[formKey]/pdf`,
`/sign`, `/send`) live under the Pages Router for the same reason as the invoice PDF/send routes —
see the round-2 fixes below. `src/proxy.ts`'s existing `/api/admin/:path*` matcher already
requires a logged-in staff member for all three regardless of router; signing/sending additionally
check for the admin role directly (teachers can view compliance PDFs for their own assigned
classes, matching how learning profile PDFs are scoped, but can't sign or send).

### Post-launch fixes, round 2: date fields, and PDF rendering moved to the Pages Router

Two further bugs surfaced once real invoices were being edited/sent/downloaded in production,
both only reachable after the round-1 fixes below let PDF rendering actually get further than it
used to:

- **`issue_date`/`due_date` came back as JS `Date` objects, not strings**, from any query that did
  a bare `SELECT * FROM invoices` — Postgres `date` columns get parsed into `Date` objects unless
  explicitly cast. `InvoiceDocument`'s `formatDateLabel()` calls `.split('-')` on the date (crashing
  with `e.split is not a function`), and the edit page called `.slice(0, 10)` on it directly
  (crashing with a generic "Something went wrong"). Fixed by adding `::text` casts to `issue_date`/
  `due_date` in every query feeding these code paths — the invoices list page already did this;
  the PDF route, send route, edit page, and `GET /api/admin/invoices/[id]` didn't.
- **PDF rendering crashed with `Minified React error #31` ("Objects are not valid as a React
  child") whenever it was actually reached from a route handler** — reproducible with a minimal
  hardcoded invoice, and confirmed (via a temporary test route, removed afterward) to happen only
  from *App Router* route handlers; the exact same `InvoiceDocument`/`renderToBuffer` call renders
  correctly from a plain Node/`tsx` script, and from a *Pages Router* API route, with the same
  package versions and the same bundler (Turbopack or webpack — both were tried; neither mattered).
  This is a real, currently-unresolved upstream incompatibility between `@react-pdf/renderer`'s own
  bundled React reconciler and how Next.js's App Router bundles/aliases React for route handlers
  (matches several open, unresolved issues on the react-pdf repo for Next 15/16). Downgrading
  `@react-pdf/renderer` to v3 didn't help — the same crash reproduced there too, ruling out a
  v4-specific regression. The fix: the three routes that call `renderToBuffer` now live under the
  **Pages Router** instead (`src/pages/api/invoices/[id]/pdf.ts`, `src/pages/api/learning-profiles/
  [id]/pdf.ts`, `src/pages/api/admin/invoices/[id]/send.ts`), coexisting with the rest of the app's
  App Router pages — Next.js fully supports both routers in one project. Session auth in these
  three routes reads cookies via iron-session's `getIronSession(req, res, options)` (the Pages
  Router signature) instead of `getIronSession(await cookies(), options)` (App Router-only), and
  role checks that used to redirect via `requireAdmin()` now just return a 403 JSON body directly,
  since `next/navigation`'s `redirect()` doesn't work outside the App Router.
  - Side effect: adding a `src/pages` directory changed Next's typing for `useSearchParams()`/
    `usePathname()` from non-null to `| null` app-wide (a real hybrid-router compatibility case,
    not a false positive), which failed the production build at 7 call sites that assumed a
    non-null value. All seven now null-check (`searchParams?.get(...)`, `pathname ?? ''`).

### Post-launch fixes: PDF generation, invoice editing, invoice emailing

Three issues reported after real invoices were being created in production:

- **PDF generation was failing in production** (`{"error":"Could not generate PDF."}`) while
  working fine locally. Root cause: `InvoiceDocument`/`LearningProfileDocument` read the logo and
  brand fonts off disk at request time via `path.join(process.cwd(), 'public/...')`. Vercel's
  serverless bundler (Node File Trace) doesn't reliably include files only referenced through a
  dynamically-built path like that, so the function couldn't find them once deployed. Fixed by
  embedding the logo and fonts as base64 constants directly in `src/lib/pdf/assets.ts`, decoded at
  module load — no filesystem access at all in the PDF-rendering path. One subtlety:
  `@react-pdf/renderer`'s `Font.register` only accepts a `src` that's a string (file path, URL, or
  `data:` URL) — a raw `Buffer` throws inside `@react-pdf/font`. So fonts are exported as
  `data:font/woff;base64,...` string constants, while the logo (which `Image`'s `src` accepts as a
  raw `Buffer`) stays a `Buffer` export. Both PDF API routes now also return the real error message
  in their JSON response instead of a generic one — safe here since these are admin-only internal
  routes, and it makes any future failure immediately diagnosable from the browser instead of
  requiring a log dig.
- **No way to edit an invoice after creation** — only the paid/outstanding status could be changed.
  Added a `PUT /api/admin/invoices/[id]` handler that revalidates the full invoice content
  (billed-to name, issue date, per-child line items), recomputes totals and the sibling discount,
  and replaces the invoice's line items and children wholesale (leaving `invoice_number` and
  `status` untouched). The totals/discount math was pulled out of the create route into
  `src/lib/invoice-calc.ts` (`computeInvoiceTotals`) so create and edit can never calculate
  differently. `InvoiceForm` now takes an optional `invoiceId` prop and switches between POST
  (create) and PUT (edit) — a new `/admin/invoices/[id]/edit` page reuses it, and "Edit" links were
  added next to every invoice on both the Child Card and the master `/admin/invoices` list.
- **No way to email an invoice to a parent** — the only distribution method was a parent finding
  the PDF link themselves inside the parent portal. Added attachment support to the Brevo `send()`
  helper (`src/lib/email.ts`) and a `sendInvoiceEmail()` function that renders the invoice PDF
  server-side and attaches it as base64. A new `POST /api/admin/invoices/[id]/send` route (email
  address validated, defaults to the child's `primary_contact_email`) and a `SendInvoiceButton`
  component (inline expand-to-confirm-address UI) are wired into both the Child Card and the master
  `/admin/invoices` list, next to the existing Edit/Mark as Paid actions. Like the school's other
  transactional emails, it cc's the school's own inbox.

### Phase 6: Admin master dashboard

The admin Overview page (`/admin`) now aggregates the whole system in one place (teachers still
get the simpler "go to your Family Board" view from Phase 1 — none of this is relevant to their
scoped role):

- **By Class** and **By Programme** breakdowns — the Dashboard sheet's own grouping, not
  reproduced in earlier phases. By Class groups by the real (freeform) `class_name` rather than
  inventing a rigid "Grade 1-9" enum the sheet used, since school class names don't always follow
  that pattern (e.g. "Stars", "Nebulas"). By Programme reuses the app's own 4-band `class_band`
  taxonomy (Early Years/Kindergarten/Primary/Secondary) rather than the sheet's slightly different
  3-way Kindergarten/Primary/Lower Secondary split, since `class_band` is what the rest of the app
  (Family Board, Calendar, Forecast) already keys off.
- **Forms Outstanding** — counts of active children missing each of the 7 compliance signatures,
  matching the Dashboard sheet's own "FORMS - OUTSTANDING" tile (same 7 items as the Child Card
  checklist from Phase 2).
- **Admissions leads**, **On site today** (live calendar occupancy, same on-site logic as the
  Family Calendar), and **Outstanding invoices** (with overdue count) as linked stat tiles.
- **Class Forecast** summary table (month × programme band), linking to the full forecast page.
- **Teacher Activity** — recent lesson plans and work sample uploads, by teacher/class.
- **Recent Photos** — latest photo feed uploads school-wide.
- A new **`/admin/invoices`** page (admin only) — the master invoice list across every child, with
  status filters and Mark as Paid, since until now invoices were only viewable per-child on the
  Child Card. Linked from both the Overview tile and the sidebar.

### Phase 5: Google Classroom integration

- **`ClassroomProvider`** (`src/lib/classroom/types.ts`) is the clean interface the rest of the
  app codes against — `getClassroomProvider()` returns a `StubClassroomProvider` (empty results,
  `isConfigured() === false`) until a Google account is connected, and a real
  `GoogleClassroomProvider` once one is. Nothing else in the app depends on Classroom being live.
  `GoogleClassroomProvider` calls the Classroom REST API directly via `fetch` rather than pulling
  in the `googleapis` package, since it's ultimately about a dozen stable, well-documented GET
  endpoints.
- **Required environment variables** (set in Vercel, and locally in `.env.local`):
  | Variable | Description |
  |---|---|
  | `GOOGLE_CLASSROOM_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console. |
  | `GOOGLE_CLASSROOM_CLIENT_SECRET` | The matching client secret. **Treat as a real secret** — never commit it or paste it in chat/issues. |
  | `GOOGLE_CLASSROOM_REDIRECT_URI` | Must exactly match an "Authorized redirect URI" on that OAuth client in Google Cloud Console, e.g. `https://www.selongbayschool.com/api/admin/classroom/callback`. A mismatch here is the most common connection failure (`redirect_uri_mismatch` from Google, surfaced on `/admin/classroom` as "Google rejected the connection request"). |
  - The Classroom API and the "Google Identity" (for `userinfo.email`) API must be enabled on
    that Google Cloud project, and the OAuth consent screen needs the four Classroom scopes used
    in `src/app/api/admin/classroom/connect/route.ts` added (readonly: courses, rosters,
    coursework.students, student-submissions.students). While the consent screen is in "Testing"
    mode (the default, no Google verification review needed), only Google accounts added as test
    users in Cloud Console can complete the connect flow — add the school's Google account there
    first.
  - **This OAuth flow could not be tested end-to-end from within this sandboxed build
    environment** (no real domain to receive the callback). Please test "Connect Google Classroom"
    at `/admin/classroom` once the env vars and Cloud Console config above are in place, and report
    back anything that errors so it can be fixed.
- **Connect flow**: `/admin/classroom` → "Connect Google Classroom" → Google consent screen →
  `/api/admin/classroom/callback` exchanges the code for tokens and stores them in the
  `classroom_connection` singleton table (one Google account authorizes the whole school, same
  pattern as `school_settings`). `prompt=consent` is always sent so Google reliably returns a
  refresh token (without it, the connection can't renew itself after the ~1 hour access token
  expires) — if Google still doesn't return one, disconnect any prior authorization for this app
  under the Google Account's own security settings first, then reconnect.
- **Course mapping**: a Google Classroom course only starts feeding data in once an admin maps it
  to one of the school's own `class_name` values (`classroom_course_mappings`) — course names in
  Classroom won't reliably match `class_name` strings automatically.
- **Sync** (`/api/admin/classroom/sync`, manual "Sync Now" button, no automatic schedule yet):
  pulls coursework into `classroom_assignments` and student submissions into
  `classroom_submissions` for every mapped course. A submission is matched to a local `children`
  row by email — checked against both `children.classroom_student_email` (a new field, editable
  on the Child Card, for when a student has their own Google account) and
  `children.primary_contact_email` (since younger students often use a parent's Google account for
  Classroom) — an unmatched submission is still stored, just with `child_id = NULL`, rather than
  silently dropped.
- Synced assignments show up alongside manually-entered lesson plans (as a separate "Google
  Classroom" block, not merged into the same list) on the parent portal, student portal, and — via
  matched submissions — the Child Card.

### Phase 6: Meeting scheduling (Google Calendar + Meet)

- **"Schedule a meeting"** on the Letter of Offer section of the Child Card sends the parent a link
  to pick a time to discuss the offer — in person on campus or over a video call — from the
  school's actual open times. This is a **separate Google connection from Google Classroom**: that
  one is read-only (courses/rosters/coursework) and this one needs calendar read (free/busy) +
  write (creating events with a Google Meet link), so they're independent OAuth grants against
  independent scopes rather than trying to widen the Classroom one — connect them separately, and
  they can even be different Google accounts if that ever makes sense.
- **Required environment variables** (set in Vercel, and locally in `.env.local`):
  | Variable | Description |
  |---|---|
  | `GOOGLE_CALENDAR_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console. Can be the *same* Client ID as `GOOGLE_CLASSROOM_CLIENT_ID` if you'd rather manage one OAuth client for both — just add this feature's redirect URI and the calendar scope to it in Cloud Console — or a separate client if you'd rather keep them fully independent. |
  | `GOOGLE_CALENDAR_CLIENT_SECRET` | The matching client secret. **Treat as a real secret.** |
  | `GOOGLE_CALENDAR_REDIRECT_URI` | Must exactly match an "Authorized redirect URI" on that OAuth client in Google Cloud Console, e.g. `https://www.selongbayschool.com/api/admin/calendar/callback`. |
  - The Google Calendar API must be enabled on that Cloud project, and the OAuth consent screen
    needs the `https://www.googleapis.com/auth/calendar` scope (used in
    `src/app/api/admin/calendar/connect/route.ts`) added. While the consent screen is in "Testing"
    mode, only Google accounts added as test users in Cloud Console can complete the connect flow —
    add the school's Google account there first (same account whose calendar you want meetings
    booked on).
  - **This OAuth flow, and the actual live free/busy lookup + Meet-link creation, could not be
    tested end-to-end from within this sandboxed build environment** (no real domain to receive
    the callback, no real Google account to authorize). Please test "Connect Google Calendar" at
    `/admin/calendar` once the env vars and Cloud Console config above are in place — then send a
    test meeting invite from a Letter of Offer and actually book a slot — and report back anything
    that errors so it can be fixed.
- **Connect flow**: `/admin/calendar` → "Connect Google Calendar" → Google consent screen →
  `/api/admin/calendar/callback` exchanges the code for tokens, stored in the `calendar_connection`
  singleton table. The connected account's own primary calendar (its email address) is used
  directly — there's no separate calendar picker, since "the school's Gmail calendar" is exactly
  what was asked for. Same `prompt=consent` / refresh-token handling as the Classroom connection.
- **Availability** is computed live at booking-page load time — no admin-managed slot list. Current
  defaults (all in `src/lib/meeting-scheduling.ts`, easy to tune, not something the school
  specifically requested): 30-minute slots, 08:00–15:00 weekdays only, next 14 calendar days, and a
  24-hour minimum lead time before the earliest bookable slot. Anything already on the connected
  calendar (via Google's `freeBusy` API) is excluded.
- **Booking flow**: `/schedule-meeting/[token]` (public, token-based, same pattern as
  `/letter-of-offer/[token]`) — parent picks in-person or video and a time, which re-checks the
  slot is still free (in case of a near-simultaneous double-booking) before creating the calendar
  event. Video bookings get `conferenceData` with a Google Meet link created inline; in-person
  bookings get the school's address as the event location instead. The school's own branded
  confirmation email (not Google Calendar's own generic invite email, which is left off via not
  setting `sendUpdates`) goes to the parent, and a notification to the school inbox.
- **One invite per send** (`meeting_invites` table, FK'd to the child and — when there is one — the
  specific letter of offer) — re-sending creates a new row rather than overwriting, so the Child
  Card can show the current state (awaiting a pick vs. booked with full details) without losing
  history.
- **Automatic send on enrolment**: `submitEnrolment()` (`src/lib/enrolments.ts`) sends this same
  invite automatically the moment a Student Enrolment Form comes in — no letter of offer exists
  yet at that point, so `letter_of_offer_id` is nullable and left null for these. Silently skipped
  (logged, not thrown) if Google Calendar isn't connected, same "never block the actual
  submission" resilience as the family-linking step right above it in that file. Shown on the
  Child Card as a "Meeting (from enrolment form)" line above the Letter of Offer list, separate
  from any letter-specific invite.

### Phase 7: Lunch ordering

- **Parent flow**: on `/account/learning`, each child's card has a "Lunches" section — a parent
  either clicks **"I'll bring my own lunch"** (a one-click acknowledgement, no charge) or **"Order
  lunches"**, which expands a form to pick a start/end date, which weekdays, Normal or Large size,
  food preferences, and allergies/intolerances (pre-filled from the child's existing
  `allergies_medical_notes`, editable). The total (lunch days in range × price for the chosen size)
  updates live as they fill it in. **"Confirm & checkout"** creates a real invoice — same
  `invoices`/`invoice_children`/`invoice_line_items` tables tuition and activity invoices already
  use (`invoice_type = 'lunch'`), no separate billing system — and emails a confirmation with the
  PDF attached (bank transfer details inside, same as every other invoice; there's no online
  payment gateway anywhere in this app, by design).
- **Not configured out of the box** — unlike `school_settings` (seeded with the school's real bank
  details), the new `lunch_settings` singleton starts empty: no supplier name, no bank details, and
  both `normal_price_idr`/`large_price_idr` at 0. There's no real lunch-supplier pricing or payment
  info to seed it with. **An admin must fill these in at `/admin/settings` (new "Lunch Ordering"
  section) before parents can place a real order** — the "Order lunches" button on the parent
  portal stays disabled with an explanatory note until both prices are set, and the order route
  itself refuses to create an invoice (409) if pricing or bank details are still missing, as a
  second line of defense.
- **`lunch_orders`** (`src/lib/lunch-orders.ts`) is a separate table from `invoices` — one row per
  parent action (a priced order, linked to the invoice it generated via `invoice_id`, or a
  `own_lunch = true` acknowledgement with no invoice at all). `lunch_count` is computed once at
  order time and stored, not recomputed on read, so a later price change in Settings never
  silently reprices an order already placed.
- **No sibling discount** on lunch invoices — unlike tuition/activity invoices (which can bill
  multiple children together), a lunch order is always placed one child at a time from that
  child's own card, so there's no multi-child invoice to discount across.
- **Admin visibility**: a new **Lunch Orders** page (sidebar, admin-only) lists every order and
  "bring own lunch" acknowledgement school-wide — child, dates, days, size, food
  preference/allergies, and a link to the invoice and its paid/outstanding status. This is what the
  school would hand to (or read off for) the actual lunch supplier to know what to prepare.
- The invoice PDF route (`src/pages/api/invoices/[id]/pdf.ts`) already checks admin-or-guardian
  authorization regardless of invoice type, so lunch invoices are viewable by the ordering parent
  automatically — no new auth code needed there.
- **Supplier email copy** (optional, "Supplier email" field in the same Settings section): when
  set, each priced order automatically emails the supplier the prep-relevant details (child, dates,
  days, size, food preference, allergies) — not the invoice/pricing, which the kitchen doesn't need.
  Skipped silently if unset, and never blocks or fails the order itself if the send errors.

### Phase 8: Attendance check-in/check-out

A gate kiosk (no login) and the parent portal both write to one shared attendance log, covering
the twice-daily gate roster and one-off activity sessions, with admin reporting/export and a
self-service child-linking flow with approval.

- **Data model**: `attendance_events` (`src/lib/attendance.ts`) is one row per check-in or
  check-out — `session_type` is `'daily'` (the AM/PM gate roster, `activity_id` always null) or
  `'activity'` (`activity_id` required, reusing the existing `activities` table rather than a
  parallel list). `source` is `'kiosk'` (anonymous by design — no `performed_by_*`), `'parent_portal'`
  (`performed_by_customer_id` set), or `'admin'` (`performed_by_admin_id` set, for corrections).
  `children.enrollment_type` (`'regular'` default, or `'activities_only'`) decides whether a
  student appears on the daily gate roster at all — an activities-only student only ever shows up
  in the activity check-in flow, on both the kiosk and the portal. Set per-child from the Child
  Card edit form.
- **Gate kiosk** (`/kiosk`, `/kiosk/activities`): a shared tablet screen at the gate — a staff
  member logs in once (see "Gate kiosk behind a staff login" below for how that gate evolved from
  a shared PIN to reusing the staff login). Not linked from anywhere in the site nav or the
  marketing header/footer (`SiteChrome.tsx` skips both on `/kiosk/*` specifically, so a curious tap
  can't navigate off the check-in flow to the public site). Flow: tap a student's name (searchable
  list, big touch targets) → tap Check In or Check Out on a full-screen confirmation sheet (the
  time-appropriate action is visually emphasized, defaulting to Check In before noon / Check Out
  after, school-local time) → sign, or use the staff override → a big checkmark confirmation with
  an Undo option, auto-reverting to the list after ~6s. `/kiosk/activities` is a separate
  three-step flow (pick activity → pick student, from every active student regardless of
  `enrollment_type` → check in/out) since it's much less frequent than the twice-daily gate rush.
- **Parent portal**: `/account/attendance` lists each linked (and approved — see below) child with
  a single one-tap Check In/Check Out button that toggles based on today's status, an activity
  check-in picker, and a recent-attendance list with an anomaly flag ("checked in with no
  check-out" on a past day). The same one-tap button also appears directly on the `/account`
  overview's child cards, so checking a child in/out never needs more than the one nav tap to get
  there. `getTodayDailyStatusForChildren`/`getTodayEventStatus` compute "checked in" vs "checked
  out" from the day's events — there's no separate stored status column to keep in sync.
- **Self-service child linking + approval**: `/account/link-child` lets a parent search by their
  child's exact full name *and* date of birth (both required — a name-only search would let anyone
  browse the roster) and request a link. `guardian_children` gained a `status` column
  (`'pending'`/`'approved'`/`'rejected'`, default `'approved'` so every pre-existing, admin-created
  link keeps working unchanged) — a self-service request starts `'pending'` and is invisible
  everywhere (learning page, bookings, invoices, attendance — `getChildrenForGuardian` and
  `guardianOwnsChild` both filter to `status = 'approved'`) until an admin approves it from the
  **Pending Child Link Requests** list on `/admin/attendance`. An admin linking a guardian directly
  from the Child Card (the pre-existing flow) still auto-approves immediately, same as before this
  feature existed.
- **Admin** (`/admin/attendance`, sidebar): today's whole-school roster with checked-in/checked-out/
  not-yet-arrived counts, an Undo action per student, the pending link-request queue
  (approve/reject), and a link to open the gate kiosk. `/admin/attendance/report`: date-range +
  class filters over every attendance event
  (kiosk/portal/admin, all session types) with a **CSV export** button
  (`/api/admin/attendance/export`). The Child Card gained an **Attendance** section (self-fetching,
  under `/api/admin/children/[id]/attendance`) showing a student's full history, the same anomaly
  flag as the portal, and an "Add correction" mini-form (backdated check-in/out, `source = 'admin'`)
  for e.g. a parent who called the office after forgetting to check a child out — entries can also
  be deleted outright if they were a kiosk mis-tap or duplicate.
- **No seed/demo data** was added for this feature — unlike earlier phases' `npm run db:seed-*`
  scripts, this app's database now holds a real school's real student/family records, so inserting
  fake sample students or attendance history wasn't done. Test the flow end-to-end against a real
  (or a couple of test) child records already in `children` instead.

#### Signed check-in/check-out, with an admin override

Every kiosk or parent-portal check-in/out is signed for — a drawn signature plus the signer's
name, the same `<canvas>`-based capture already used for compliance-form signatures (now shared as
`src/components/SignaturePad.tsx` rather than living under `components/admin`). `attendance_events`
gained `signature_data_url`/`signed_by_name` columns; `attendanceCheckSchema` (the schema shared by
`/api/kiosk/check` and `/api/account/attendance/check`) makes the signature required — there's no
DB-level `CHECK` constraint enforcing it, since that would also have to account for the handful of
rows already written before this existed, so it's enforced at the validation layer only.

- **Kiosk**: tapping Check In/Check Out now leads to a full-screen sign step
  (`KioskSignStep.tsx`, shared by `/kiosk` and `/kiosk/activities`) — a typed name plus a signature
  — before the usual checkmark confirmation. This captures the *parent's* identity for a
  kiosk-sourced event; see below for how the kiosk itself is now gated by a staff login.
- **Parent portal**: the one-tap Check In/Check Out button now opens a small sign-to-confirm modal
  (`AttendanceSignModal.tsx`) first. The signer's name is never taken from the client here — the
  API route resolves it server-side from the logged-in customer's own `name`/`email`, the same
  "don't trust the client for identity" pattern used everywhere else in the app.
- **Admin override**: the Child Card's Attendance section button is now labelled "+ Check in/out
  (admin override)" — an explicit admin-recorded check-in/out (`source = 'admin'`) never requires a
  signature, since it exists precisely for when a parent isn't the one doing it (they called the
  office, or forgot to check out and staff are recording it after the fact). The panel says so in
  plain text.
- **Viewing a signature**: history rows with one show a "View signature" link
  (`/api/admin/children/[id]/attendance/[eventId]/signature`) that opens the drawn signature as a
  plain image in a new tab — decoded server-side from the stored PNG data URL rather than a
  dedicated lightbox component. Kiosk rows also show who signed inline (`signed_by_name`) directly
  in the source label, since that's the only identity a kiosk event carries at all.

#### Gate kiosk behind a staff login, admin check-in, and Undo

The kiosk's own shared PIN (`kiosk_settings`, `/kiosk/unlock`) is gone. `/kiosk` and `/api/kiosk/*`
now require the same staff session as `/admin/*` (an unauthenticated visit redirects to
`/admin/login` like any other admin page, via `src/proxy.ts`) — so an admin/teacher logs into the
gate tablet once at the start of the day (`/admin/login`, then navigate to `/kiosk`) and it stays
signed in for that staff session (12 hours), no parent login involved at any point after that.

- **Two ways to check a student in/out at the gate**, both on the same action sheet: **"Parent
  signs"** (the existing tap-then-sign flow, still `source = 'kiosk'`) or **"staff check in without
  a signature"** (new — `/api/kiosk/admin-check`, `source = 'admin'`, attributed to whichever staff
  member is signed into the kiosk right now via `performedByAdminId`). The parent-signs flow also
  now stamps `performed_by_admin_id` with the on-duty staff member (in addition to the parent's own
  `signed_by_name`) purely for audit — "which shift was this during" — without changing what's
  shown as the acting party.
- **Undo**: every kiosk confirmation screen (daily and activity) offers an "Undo — made a mistake"
  button for ~6 seconds before it auto-returns to the list (long enough to catch a mis-tap; it
  doesn't just vanish immediately). The daily roster's tiles also carry a persistent "Undo" link
  for a student's most recent event, and the admin dashboard's Today's Roster
  (`TodayRosterTable.tsx`) gets the same action — so a mistake can be corrected right from wherever
  it's noticed, not just from the Child Card. All three reuse the existing
  `DELETE /api/admin/children/[id]/attendance/[eventId]` route.
- **`kiosk_settings` table is dropped** (migration, `SCHEMA_VERSION` bumped) rather than left behind
  unused, along with `/kiosk/unlock`, `/api/kiosk/unlock`, `/api/kiosk/lock`, and the admin PIN
  settings form — all superseded by the staff-login gate above.

### Phase 4: Invoicing

- **`school_settings`** (singleton, `id = 1`): payable-to/bank details, currency, and invoice due
  days — the invoice PDF template never hardcodes these, only reads this record, so a bank change
  in the future is a settings edit, not a code change. Seeded with the canonical values confirmed
  against the real Term 1 invoice. Editable at `/admin/settings` (admin only; teachers still see
  the page for their own password change, just not this section).
- **Invoice numbering** continues the school's existing manual sequence — confirmed to start the
  software's `invoice_number_seq` at 51 (the two sample invoices were #040/#050) so it can't
  collide with an invoice already sent out manually.
- **Sibling discount**: confirmed as 5% off the first child's line items, 10% off each additional
  child's, and *only* when 2+ children are billed on the same invoice — a single-child invoice
  gets no discount. Nothing in the source spreadsheet or sample invoices defined an actual
  schedule (just a freeform "Sibling Discount Tier" text field per child), so this rule is
  confirmed with the school rather than guessed, and lives in one place
  (`src/app/api/admin/invoices/route.ts`) if it ever needs revisiting.
- **Generating an invoice** (`/admin/families/:id/invoices/new`, admin only): pick tuition or
  activity type, optionally add a sibling to bill together, freeform line items per child. A line
  item with quantity 0 renders as a blank-cell informational row (matching the real invoice's
  "Lunches - provided by parents" / activities-surcharge note rows) rather than needing a separate
  notes field for that. The server always recomputes subtotal/discount/total itself — the client
  preview is just for the admin's benefit, never trusted.
- **Invoice PDF** (`/api/invoices/:id/pdf`) reproduces the real template closely: logo top-left,
  script "Invoice" headline, Number/Date top-right, PAYABLE TO + BANK DETAILS blocks, teal-header
  itemized table, totals box, NOTES block repeating the bank details, teal footer bar. The QR
  square is a plain visual placeholder (no encoded payment data), per the brief. Same
  three-session auth pattern as the Learning Profile PDF: admin, any guardian of a billed child,
  or the billed child's own student login can view it.
- **Paid/outstanding/overdue** is manual reconciliation (a "Mark as Paid" action), matching how
  the existing site's activity bookings already work — no payment gateway wired up, confirmed with
  the school. Days-overdue is computed live from the due date, never stored.
- Surfaced on the Child Card (with Mark as Paid), and on the parent portal (read-only, plus the
  PDF link) — both replace the "coming in a later phase" placeholder from Phase 3.

### Phase 3: Learning Profile + LMS portal

- **Learning Profile** (`/admin/families/[id]/learning-profile`): term reports per child —
  general comment, attendance, a 6-item social-development checklist, and freeform subject rows
  (learning area/sub-subject/achievement/effort/comment), matching the fields on the real "Noah
  Term 1 Report" PDF sample. Achievement (Outstanding→Limited) and Effort (High/Satisfactory/Low)
  scales, plus their A-E letter grades, live in `src/lib/family-data.ts`.
- **PDF export** (`/api/learning-profiles/:id/pdf`) renders the report with `@react-pdf/renderer`,
  matching the brand (teal header with the real logo, script "Term Report" headline, orange/teal
  accents) — not a pixel-perfect clone of the sample PDF's watercolor texture, since only the
  invoice template (Phase 4) is required to reproduce the source design exactly. Fonts are
  self-hosted in `public/fonts/` (downloaded from Google Fonts) rather than fetched at request
  time, so a PDF request can never fail because a font CDN is briefly unreachable. This one route
  isn't gated by `src/proxy.ts` (that middleware only covers `/admin`, `/account`, `/student`) —
  it checks all three session types itself, since admin, the assigned teacher, the child's linked
  guardian, and the child's own student login can all legitimately open it.
- **Lesson plans, curriculum units, resources** (`/admin/teaching`): class-scoped content teachers
  (their assigned classes only) or admins (any class) can post; these feed the "upcoming lessons,"
  "current curriculum unit," and "downloadable resources" views on the parent/student portals —
  the resources section is aimed particularly at hybrid/worldschooling families' off-campus days.
- **Work samples & photo feed** are managed per-child directly on the Child Card now (teachers
  upload for their own classes' children only); the photo feed also matches a class-wide photo
  with no specific child tags (e.g. a whole-class group photo).
- **Parent portal** (`/account/learning`): for each linked child — current curriculum unit,
  upcoming lessons, learning profile PDFs, work samples, resources, and photo feed. Since there
  was previously no way to connect a parent's `/account` login to a child at all, admins now link
  guardians directly from the Child Card (creates the `customers` row if the parent has never
  logged in before) — this populates `guardian_children`, added in Phase 1 but unused until now.
- **Student portal** (`/student`): upcoming lessons, their own work samples, and resources for
  their class band.
- Invoice/payment status and lunch/activity booking are still stubbed on both the Child Card and
  the parent portal — those are Phase 4 data models.

### LMS redesign: Oak Academy-style parent/student dashboard (in progress)

Working toward an Oak National Academy-style LMS on top of the parent/student portals — easy
lesson browsing, Cambridge curriculum links, quizzes/flashcards/teacher videos, downloadable
resources, teacher-set assignments synced to Google Classroom, and "class starting soon"
notifications — built in phases, shipping each piece before starting the next:

1. **Weekly Schedule (shipped)** — a new `class_schedule` table (one row per recurring weekly
   slot: class, subject, teacher, day, start/end time, online vs in-person, room or video link).
   Managed at `/admin/teaching/schedule` (same class-permission model as lesson plans — teachers
   edit only their assigned classes, admins edit any). Rendered by `WeeklyScheduleBoard`
   (`src/components/WeeklyScheduleBoard.tsx`) as the first thing shown on both the parent portal
   (`/account/learning`, one board per linked child) and the student portal (`/student`) — the
   "main screen" view of what's on this week, at a glance.
2. **Lesson/curriculum browser redesign** — not yet built. Will extend `lesson_plans` /
   `curriculum_units` with structure closer to Oak Academy's unit → lesson → resources model
   (video link, worksheet, quiz, flashcards per lesson). Per the "build the shell first" decision:
   no placeholder/fake curriculum content — these stay empty until a teacher/admin adds real
   Cambridge unit references, videos, quiz questions, etc. through the admin UI.
3. **Notifications** — not yet built. Planned as browser push notifications (Web Push API) plus an
   in-app banner, rather than depending on Google Classroom's own push notifications, which require
   a verified Google Workspace domain that doesn't apply to the personal/testing-mode Google
   account already connected for Classroom sync.
4. **Deeper Google Classroom sync** — not yet built. Planned as one-way: a teacher creating an
   assignment in this dashboard also creates it in Google Classroom via the Classroom API
   (`courseWork.create`), extending the existing one-way pull (Classroom → this app, see Phase 5
   below). Full bidirectional sync (edits/grades in both directions) was deliberately ruled out —
   more complex, more prone to conflicts, and not needed for the "set it here, it shows up there"
   workflow that was actually asked for.

### Phase 2: drag-and-drop board, calendar, child card

- **Family Board** (`/admin/families`) is now a real drag-and-drop board (`@dnd-kit/core`) —
  dragging a card to a different status column PATCHes `children.status` immediately (optimistic
  update, reverts on failure). Admin-only; teachers get the same board read-only, scoped to their
  assigned classes.
- **Family Calendar** (`/admin/families/calendar`) is a custom month-grid calendar (matching the
  existing `BookingCalendar.tsx` pattern rather than adding FullCalendar/react-big-calendar, to
  stay consistent with the rest of the app's bespoke, brand-matched components) showing who's
  on-site each day, derived from `enrolment_date`/`exit_date`. A child with no enrolment date on
  file shows as on-site every day rather than being silently hidden.
- **Child Card** (`/admin/families/[id]`) is the full detail view: family/guardian info, health &
  personal, family & financial, the 7-item compliance checklist (matching the Dashboard sheet's
  "Forms outstanding" tile — NISN Request is tracked separately since the source sheet doesn't
  count it as one of the 7), and an admin-only edit form covering all of the above. Learning
  Profile, Activities, Photo Feed, Invoice status, and Lunch selection are stubbed with "coming in
  a later phase" notes — those are separate data models arriving in Phases 3-4.
  - **Immigration documents** (passport copy, visa status, KITAS copy) are a further admin-only
    addition — not shown on the teacher view of the card at all, unlike the rest of the
    compliance/health data. Uploads go through a dedicated `/api/admin/children/upload` route
    (Vercel Blob, admin-only, accepts PDF or image) separate from the activities photo upload
    route, since these are more sensitive documents.
- **`/admin/staff`** (added after Phase 6): create admin/teacher accounts and assign a teacher's
  classes directly in the UI — no more hand-written SQL against `teacher_assignments` or the CLI
  script for day-to-day use. `npm run db:create-staff` still exists for bootstrapping the very
  first accounts before any admin session exists to use the UI with.

### Phase 1: data model, roles, import

- **Roles**: `admin_users.role` is `admin` or `teacher` — both log in at `/admin/login` and share
  the same session cookie/table, but teacher-only pages redirect back to `/admin/families` (see
  `requireAdmin()` in `src/lib/current-staff.ts`; `AdminSidebar` also hides admin-only nav items
  for teachers). **Known gap:** `/admin/activities` is a client component and isn't gated yet —
  low risk (session/booking admin, not child data) but should get the same guard before teacher
  accounts are handed out.
  - Parents reuse the existing `customers` table/`/account` login (see "Customer accounts" above);
    `guardian_children` links a customer to the child(ren) they're guardian of.
  - Students get their own simple username/password login at `/student/login` (magic-link email
    isn't practical for young children) — one row per child in `student_accounts`.
  - Create additional staff/student logins with `npm run db:create-staff -- <email> <admin|teacher>`
    and `npm run db:create-student -- "<Child Full Name>" <username>` (both print a one-time
    temporary password, same pattern as `db:seed-admin`).
- **Tables**: `children` (mirrors the "Family Tracker" spreadsheet schema — status is one of
  `enquiry`/`booking_waitlist`/`full_time`/`temporary`/`worldschooler`/`hybrid`, plus an
  `is_active` overall flag), `admissions_enquiries` (unified lead pipeline, tagged by `source`),
  `class_forecast_entries` (monthly roster forecast by class band), `teacher_assignments` (which
  classes a teacher can see — managed at `/admin/staff`, added after Phase 6).
- **Import**: two ways to run the same import (parsing/DB-write logic lives once in
  `src/lib/family-import.ts` so they can never drift apart):
  - **`/admin/import`** (admin only, added after Phase 6) — upload the .xlsx directly through the
    browser once logged into the deployed site. Has a "Preview" mode (parses and shows counts,
    saves nothing) and an "Import" mode, with a checkbox to clear `admissions_enquiries` first for
    a safe re-run. This is the one to use for a real deployment — no database credentials ever
    need to leave Vercel.
  - **`npm run db:import-family -- /path/to/file.xlsx`** (add `--dry-run` to only parse and print
    counts, `--clear-enquiries` to wipe `admissions_enquiries` first) — for local/direct-DB-access
    use, e.g. from a machine with `DATABASE_URL` in `.env.local`.

  Either way: populates `children` from the spreadsheet's real "Sheet1" roster (the "Family
  Tracker" tab itself was almost empty in the source file — used only to define the column set),
  `admissions_enquiries` from the "School Tours"/"Inquiries from WA"/"Old Inquiries"/"Other
  islanders"/"Visitors only" tabs, and `class_forecast_entries` from "Student Count". Safe to
  re-run for `children` (matched by name + DOB, never duplicates) and `class_forecast_entries`
  (wiped and fully reinserted every run, cheap to regenerate); `admissions_enquiries` has no
  stable ID in the source sheets to de-duplicate against, so clear it first on any run after the
  first (the checkbox / `--clear-enquiries` flag above).
  - Dates are parsed defensively: `D/M/Y` is tried first (the dominant format elsewhere in the
    sheet), falling back to `M/D/Y` only when `D/M/Y` isn't a real calendar date (the sheet has at
    least one genuinely `M/D/Y` cell, `10/21/2020` — "21" can't be a month, so it can only be
    October 21) — and to skipping just that one field (never a crash) when neither reading is
    valid. More generally, every row is inserted independently: a bad row anywhere (a rejected
    date, or anything else Postgres refuses) is caught, recorded in the returned `rowErrors` list,
    and skipped, rather than aborting every row after it partway through an import.
- **Add a child directly** (`/admin/families/new`, "+ Add Child" on the Family Board, admin only):
  for a family that isn't in the imported spreadsheet at all. Only asks for the essentials (name,
  status, class, parents, contact, medical notes) — compliance forms, immigration documents, and
  everything else on the Child Card get filled in afterward via the existing edit form.
- **Compliance data**: `children` holds allergy/medical notes and 7 compliance-form signed?/date
  pairs (including the Indonesian UU 27/2022 personal data consent already tracked in the source
  spreadsheet). Not yet access-restricted beyond the admin/teacher role split above — before real
  student data goes in, revisit exactly who should see medical notes vs. just compliance status.
- **Admin nav additions**: Family Board (`/admin/families`, grouped by status — read-only for now),
  Admissions Pipeline (`/admin/families/enquiries`), Class Forecast (`/admin/families/forecast`,
  admin-only), plus enrolment summary tiles (Total Registered/Active/Inactive/Waitlist) on the
  Overview page, matching the spreadsheet's own Dashboard tab.

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

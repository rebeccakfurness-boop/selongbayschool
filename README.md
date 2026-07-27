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
| `BLOB_READ_WRITE_TOKEN` | For activity photo uploads | Set automatically when you add the Vercel Blob integration to this project (Storage tab → Create Database → Blob). Without it, activity photo uploads in `/admin/activities` will fail; everything else still works. |
| `NEXT_PUBLIC_SNAPWIDGET_ID` | No | Widget ID from [snapwidget.com](https://snapwidget.com) for the homepage's live Instagram grid. Until set, the site shows a "follow us" fallback card instead. |
| `CRON_SECRET` | Yes (for the daily passes job) | Any long random string. Vercel automatically sends it as `Authorization: Bearer <value>` when it triggers `/api/cron/passes` (see `vercel.json`); the route rejects any request whose header doesn't match, so without this set the cron job can never run instead of running unauthenticated. |

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

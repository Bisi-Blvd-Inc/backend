# Mobile app parity — features that must appear in the Flutter apps

Living document. Every web/backend feature change that the mobile apps
(`bisi-blvd-mobile`: `professional` = business owners, `client` = their
customers, `core` = shared package) need to match is listed here. **Add a
new section whenever a feature ships or is staged on the web/backend.**

Status key: **Prod** = live on production. **Staging** = on `stage` only.
**Planned** = decided, not built anywhere yet.

Last updated: 2026-09-24.

---

## 1. Compatibility check — does anything break the apps already released?

Checked 2026-09-24 by reading the Flutter code (`core/lib/src/services/*.dart`
defines every endpoint; `professional/lib/src/repository/*.dart` uses them).
The professional app is more complete than it first looked: it has **Budget**
(7-step wizard), **My Goals**, **Inventory**, **Calendar/Bookings**, Clients,
Reports, Settings, and link generation. The customer app has no screens
folder of its own to check against these features.

**Nothing crashes or is rejected, but there are gaps to close:**

- **Personal budget save** — `POST frontend/personal/saveBudget` sends only the
  seven category objects, never `summaryObject`. The server's new "every field
  answered" rule only rejects saves that include totals, so app saves are still
  accepted. But the app can save a budget with blanks (no rule), and it never
  refreshes `summaryObject` (the totals the web Goals page uses), so totals go
  stale after edits made in the app. Fix in the app: apply the same
  every-field-required rule and send `summaryObject` when all seven steps are
  complete (formulas are in `src/pages/personalBudgetIncome.jsx`, step 7).
- **Goals save** — `POST frontend/company/saveBudget` (`saveBudgetGoal`) sends
  `companyBudget` as its own model, which does not know the new
  `desiredProfit` field. Saving goals from the app **overwrites `companyBudget`
  and drops a web-saved `desiredProfit`**. The server falls back to
  `revenueEarn` minus annual expenses, so Planned Profit stays correct until
  the values change, but the app model should carry `desiredProfit`.
- **My Goals screen** (`professional/lib/src/screens/my_goals.dart:146`) shows
  `summaryObject.netAnnualExpense` without checking that the budget is
  complete; the web Goals page now ignores incomplete budgets.
- **Professional app, payment settings**
  (`professional/lib/src/screens/settings/payment_settings/payment_settings.dart:41`)
  pre-fills the Stripe secret key from `user.secretKey`. Keys are now stored
  encrypted, so the profile returns a value starting with `enc:`. Saving it
  back is safe (no double encryption) but the field shows gibberish. Show a
  masked "key saved" state and only send a key when a new one is typed.
- **Signup:** `User.email` is now unique. Signup/activation screens must show a
  clear message on "Email Already Exists".
- **Unaffected:** inventory CRUD (`frontend/inventory/*`), bookings
  (`/frontend/booking/*`), clients, and the customer app's public lookups
  (secret keys were removed from the public "external user" response; the app
  does not use that endpoint).
- **Automatically benefits:** bookings created in the app (`/frontend/booking/create`)
  now push to a connected Google Calendar server-side, no app change needed.

---

## 2. Features to build in the apps

### 2.1 Personal Budget — every line item required (Staging)
- **Rule:** every field in every step needs an entry. `0` is valid; blank is
  not. The gray "0" placeholder is not an entry.
- **Steps lock in order:** Housing → Transportation → Household → Loan
  Payments → Personal Insurance → Discretionary → Company Expenses →
  Summary. The Summary opens only when all seven are complete.
- **Why:** skipped spending areas understate expenses, which shrinks loan
  requests, and these totals feed Goals, Profit Comparison, and (later)
  Budget vs. Actual.
- **API:** `POST` save personal budget (`personalBudget.controller.js`
  `savePersonalBudget`) now returns **400** if totals are sent with any blank
  field. `GET` personal budget now includes `budgetComplete` (boolean).
- **Source of truth for which fields exist per step:**
  `helpers/budgetCompleteness.js` (backend) and
  `src/helper/budgetCompleteness.js` (web). Keep the app's field lists in
  sync.
- **App note:** the app already has this wizard; the work is to add the same
  rules, not build it from scratch.
- **UI parts:** blank-field highlighting with a count message, Budget Setup
  progress card shows real "N/7 steps completed", existing users with blanks
  are sent back to the first incomplete step.

### 2.2 Goals page (Prod / Staging)
- Take-home profit ("What profit do you want to take home…") is saved with the
  goal (`companyBudget.desiredProfit`, annual) and restored on load. **Prod.**
- Profit and revenue fields display commas while typing and two decimals on
  blur; stored as plain numeric strings; up to 2 decimals accepted. **Prod.**
- A second **Calculate** button sits above the "To hit this revenue goal…"
  box. **Prod.**
- If the Personal Budget is incomplete, Goals ignores budget expenses, shows a
  banner linking to the budget, and blocks Calculate. **Staging.**

### 2.2b Services checked on Goals now appear everywhere (Staging)
- The calendar, bookings, and Settings → Booking Service all read the
  `serviceSetting` list (`GET /frontend/serviceSetting/get`), not the goals
  record. Services checked on My Goals used to stay invisible to booking until
  selected again in Settings.
- **Now:** saving Goals (`POST /frontend/company/saveBudget`) adds every checked
  service to `serviceSetting` with the Goals price and time. Only adds missing
  entries; never overwrites (Settings price changes are safe) or removes.
- **Mobile:** the app saves goals through the same endpoint, so it benefits
  automatically **if its goal rows send `checked`, `serviceCharge`,
  `serviceHours`, `serviceMinute`** — verify the app's `BudgetGoal.service`
  model carries these. Also a one-time backfill exists for accounts that
  saved goals earlier: `scripts/syncGoalServicesToBooking.js` (dry run by
  default, `--apply` to write).

### 2.3 Booked Services vs. Planned Profit (Prod)
- `GET /frontend/company/profit-comparison?year=YYYY` → `{ year,
  plannedProfit, actualRevenue, completedCount, bookedNotYetCompleted,
  pendingCount, delta }`.
- `plannedProfit` is the saved annual take-home profit (fallback for goals
  saved before it existed: revenue target minus annual budget expenses).
- Compared against the calendar year's Completed bookings; Confirmed-but-not-
  completed shows separately.
- Personal Budget page progress cards: **Financial Goals** and **Track
  Progress** turn green once a profit goal is saved; Track Progress shows the
  percent of the year's goal reached. **Staging.**

### 2.4 Service inventory (Prod)
- Add Service (from the Goals page and from Settings) has an **Inventory Used
  in This Service** list: product name, price, in stock, services used in
  (multi-select of the owner's real services), estimated uses.
- `POST /admin/businessService/create` accepts `inventory: [{ productName,
  price, inStock, servicesUsedIn: [serviceId…], estUses }]`.
- The server also creates/links real **Inventory** records (matched by product
  name per owner) so items show on the Inventory page. A service can be linked
  to many inventory items and vice versa.
- **Not yet built anywhere:** editing inventory on an existing service
  (`settingServiceEdit.jsx` on web has no inventory UI).

### 2.5 Calendar sync — Google now, Outlook next (Staging)
- **Connect flow (web):** `GET /api/google-calendar/auth-url` (logged in) →
  redirect the browser to the returned Google URL → Google returns to
  `/api/google-calendar/oauth2callback`, which stores the connection.
  `GET /api/google-calendar/status` → `{ connected }`.
- **Mobile needs:** open the auth URL in an in-app browser and return to the
  app afterwards. The callback currently ends on a plain text page ("connected
  successfully. You can close this window") — design a redirect back to the
  app (deep link) when building this.
- **Automatic push (no app work needed for it to happen):** any booking
  created, changed, cancelled, or deleted — from the app, the web calendar, or
  a client booking link — creates/updates/removes the matching Google event.
  Events are tagged with `bisiBookingId`.
- **Outlook:** Microsoft Graph, same behavior. Button exists on web, disabled
  ("coming soon"). Needs an Azure app registration (redirect
  `…/api/microsoft-calendar/oauth2callback`).
- **Planned — outside calendar blocks Bisi Books time:** events on the
  connected external calendar block availability, especially non-service
  events (personal/other obligations). **Per-owner setting** to block **full
  days** (all-day events) and/or **timed events**. Events tagged
  `bisiBookingId` are ignored (they are Bisi Books' own). Events marked
  Free/transparent should not block. The client app's slot picker and the
  owner's calendar must both respect these blocks; check whether mobile
  computes availability itself or uses a server endpoint.
- **Planned — availability by weekday:** recurring weekly blocks ("every
  Tuesday 12–1", "unavailable all day Sunday") from the earlier availability
  redesign; build together with the blocking work.

### 2.6 Bank connection and Budget vs. Actual (Staging only, waiting on Plaid)
- Plaid bank connection, transaction sync, and a Budget vs. Actual comparison
  are built on `stage` but deliberately **not** in production: Plaid's
  production approval is pending.
- Needs: Bank page (connect / reconnect / disconnect), Budget vs. Actual chart
  and table. Depends on 2.1 (complete budget) for meaningful projected
  amounts.

---

## 3. Server fixes with app implications (already live)

- **Coupon codes at subscription checkout** now match Stripe *promotion
  codes* (previously never matched). Any app checkout that takes a code uses
  the same endpoint.
- **Enterprise activation** no longer creates a second account for an email
  that already exists (owner path). The licensee **sub-account** activation
  path still has a duplicate-account bug — see "Enterprise sub-account
  activation" in the project plan; fix before enterprise licensee activation
  is offered in the apps.
- **Stripe secret keys** encrypted at rest; the public "external user" lookup
  no longer returns them.
- **`/frontend/bank/*`** endpoints exist on staging only.

---

## 4. What the apps have vs. lack today (for planning)

- **Have:** budget wizard, my goals, inventory list/create/edit/delete,
  bookings + calendar, clients, payments, reports, settings (incl. payment
  settings), link generation.
- **Do not have (need building):** Booked Services vs. Planned Profit and the
  progress cards, service creation with inventory (the app has **no**
  service-create endpoint — services are managed on the web only), Google /
  Outlook calendar connection, outside-calendar blocking and its per-owner
  settings, Bank / Budget vs. Actual, Enterprise dashboards.

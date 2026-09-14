# Agribusiness Recruitment — initial application

Svelte 5 + Vite + Supabase. No demonstration business records are inserted.

## 1. Prepare Supabase

**Before running SQL, disable “Allow new users to sign up” in Supabase Auth settings.** This is an internal staff application. As requested, Auth users created directly in the Dashboard automatically become Manager Employees. Public sign-ups must stay disabled to prevent public users obtaining Manager access. There is no browser sign-up screen.

Run the separately supplied `Agribusiness_Recruitment_Setup.sql` once in the SQL Editor of your new project. It creates only Employees, Companies, People, Jobs and JobSeekers, indexes, constraints, RLS policies and Auth triggers. Existing Auth users are bootstrapped as Managers. SQL is deliberately excluded from this ZIP.

Create your first login in Authentication → Users → Add user. Add `nameFirst` and `nameLast` user metadata if desired; otherwise complete the Employee through the application. Manually created Auth Employees may have blank names until completed, the explicit bootstrap exception.

## 2. Deploy the Employees function

Install the Supabase CLI and run from this project:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REFERENCE
supabase functions deploy employees
```

The function uses the Supabase-provided server environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never place a service-role/secret key in `.env` or frontend code. `verify_jwt = false` permits current signing-key configurations; the function itself requires a Bearer token, verifies it using `auth.getUser`, and independently checks Manager status before every operation. Anonymous requests are rejected.

Set Supabase Auth password policy to match the UI: minimum 12 characters with uppercase, lowercase, number and symbol. Stronger project password policies are also enforced by Auth; failures are displayed.

## 3. Configure and run the frontend

Create a `.env` file in the project root and set:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REFERENCE.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The legacy anonymous API key also works in the publishable-key variable. Both are intended for browser use. Do not supply privileged keys.

```sh
npm ci
npm run dev
```

Sign in using your manually created Auth user. Restart Vite after editing `.env`.

```sh
npm run build
npm run preview
```

Host the resulting `dist` directory on your preferred static host. Retain the root `index.html`; navigation uses query parameters, including `?view=Jobs&id=UUID`, so browser Back/Forward and bookmarked detail records work without a router.

## Included behaviour

- Jobs: generated seq, Pending status, required Title and Client. Identity sequence values are unique, may have gaps and are never editable. Pending is the only supported status initially.
- Companies: required Company Name and optional Client classification, default false.
- People: required First Name and Last Name and optional Seeker classification, default false.
- JobSeekers: multiple Seekers per Job and multiple Jobs per Seeker; duplicate pairs prohibited. Link/unlink associations from a saved Job.
- Employees: Manager-only navigation and module, blank creation forms, required names on application saves, nullable email for Employees without accounts. Manager defaults false on creation.
- Create User: Manager-only function creates an Auth account against the existing Employee. Temporary password requirements are displayed. Admin-controlled `app_metadata.employee_id` is the authoritative trigger link; editable `user_metadata` cannot claim another Employee or grant Manager access. Failed association removes the newly created Auth account where possible.
- Linked email edits go through Auth Admin. Auth email changes synchronize back to Employees, including Dashboard changes. Direct frontend Employee writes are prohibited. Managers cannot remove their own Manager access.
- Business tables are accessible to signed-in users linked to Employees. Unauthenticated and unlinked users have no business-table access. Employees can read their own record; Managers can read all Employee records. Employee inserts/updates are performed only through the secured function.
- Client/Seeker classification cannot be removed while referenced. Referenced Companies/People cannot be deleted. No business-record deletion UI is included in this first version; authenticated Employee RLS grants cover CRUD for future screens.
- Lists use 25-record server pages; text/header filters are debounced. Relationship selectors fetch up to 15 matching eligible records and fetch a selected record individually.
- Existing detail forms open read-only; Save returns to read-only. New forms insert only on Save. Buttons show disabled state and validation guidance.

## Validation and next steps

Production builds are verified both without configuration and with placeholder configuration so the authenticated frontend is included in compilation. Twenty-one local PostgreSQL assertions passed for RLS, Auth bootstrap/linking, email synchronization, eligibility and duplicate links; trigram index creation is omitted from this local engine and must be verified in Supabase. Eight Edge Function checks passed with mocked Auth/database responses, covering missing/invalid tokens, Manager authorization, validation and account rollback. Browser smoke checks could not run: no browser was installed and the Chromium download failed. Responsive CSS is included, but browser layout and live Supabase integration still require verification.

Your actual Supabase instance has not been configured or tested by this deliverable. After deployment, test Manager and non-Manager logins, Create User, linked-email edits and Client/Seeker associations against your instance before entering real recruitment data.

Auth administration and subsequent database operations cross service boundaries. If an email change fails, the function attempts to restore the prior Employee fields and reports the error. Concurrent Manager changes to the same Employee should be avoided in this first version; these operations are not a single cross-service transaction. Temporary passwords are not automatically forced to change at first login; a dedicated password-change workflow is not included yet.

Company–Person relationships, recruiting stages, documents, placement records and additional statuses are intentionally left for later requirements.

Reference: https://supabase.com/docs/guides/functions/auth

## v0.1.16 — Pair up the Seeker link panels

On the Person detail page, Industries+Skills now sit side by side, and Education+Licenses sit side by side below them, instead of all four stacking full-width. Stacks back to one column on narrow/mobile widths. No database or Edge Function changes; frontend only.

## v0.1.15 — Remove tests folder

Removed the `tests/` folder and the `test` script from `package.json`. Those were request-string regression checks (correct quoting/sorting/embeds against Supabase/PostgREST), not required to build or run the app; `npm run dev`/`build`/`preview` were unaffected by their presence and are unaffected by their removal.

## v0.1.14 — Multiple Industries/Skills/Education/Licenses per Seeker

Added four many-to-many link tables (`PersonIndustries`, `PersonSkills`, `PersonEducation`, `PersonLicenses`), following the same pattern as `JobSeekers`: duplicate pairs prohibited, same authenticated-Employee access model. A saved Person marked as a Seeker now shows four link panels below the main form (Industries, Skills, Education, Licenses) — search and link multiple entries from each Settings table, and unlink individually, the same way Seekers are linked to a Job. These panels are hidden for People not marked as Seekers, and for new/unsaved records. Along the way, generalized `Selector.svelte` to support plain single-column lookup tables (via a new `nameField` prop) instead of only tables with a Client/Seeker eligibility flag, so it could be reused here without duplicating search/selection logic. For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.14_Add_person_links.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes needed.

## v0.1.13 — Settings hub page

Added a dedicated Settings page with quick-link tiles for Industries, Skills, Licenses, Education and (Manager-only) Employees, reachable via a Settings tile on Home and a single Settings link in the sidebar nav. The sidebar's separate Settings subsection (with one link per item) is gone; the nav is now just Jobs, Clients, Seekers, Settings — Companies and People no longer appear there directly (still reachable via their Home page tiles, or by opening a record from Clients/Seekers). No database or Edge Function changes; frontend only.

## v0.1.12 — Clients/Seekers on the Home page

Added Clients and Seekers quick-link tiles to the Home page, alongside the existing Companies and People tiles, matching the sidebar nav added in v0.1.10. No database or Edge Function changes; frontend only.

## v0.1.11 — Drop redundant flag columns from general lists

Removed the Client column/filter from the general Companies list, and the Seeker column/filter from the general People list, now that the dedicated Clients and Seekers nav items cover that use case. The flags themselves, the Detail screen's checkboxes, and the Selector component's Client/Seeker eligibility filtering are unchanged — this only affects what the two general list screens display and let you filter by. No database or Edge Function changes; frontend only.

## v0.1.10 — Settings subsection, Clients/Seekers shortcuts

The sidebar nav is now grouped: Jobs, Companies, People, Clients and Seekers up top, then a "Settings" subsection with Industries, Skills, Licenses, Education and (Manager-only) Employees. Clients and Seekers are filtered views of the existing Companies/People lists (`flag_Client`/`flag_Seeker` = true) rather than new tables — opening a record from either still opens the real Company/Person, and Save/Back return to the filtered list you came from. While wiring the Client filter in, fixed a regression from the v0.1.3 field rename where the Companies list had silently lost its `flag_Client` column (People kept the equivalent `flag_Seeker` column throughout) — it's restored now, and is what makes the Clients filter possible. No database or Edge Function changes; frontend only.

## v0.1.9 — Account name in sidebar

The sidebar now shows the signed-in user's full name (First + Last) instead of just their first name, falling back to their email if both are blank. Clicking the name opens their own Employee record. Non-Managers can now reach exactly their own Employee record this way (matching the "Employees can read their own record" RLS rule already in place) — the Employees list/module stays Manager-only, and a non-Manager still can't open anyone else's record. Since only Managers can write to Employees (enforced by the `employees` Edge Function regardless of whose record it is), the Edit and Create User controls are now hidden for a non-Manager viewing their own record too, so there's no dead-end Save attempt. No database or Edge Function changes; frontend only.

## v0.1.8 — Anchor sidebar to viewport height

Fixed the sidebar (brand, nav, Sign out) being cropped off-screen when the page's content was taller than the viewport. The `.shell` layout is now pinned to `100vh` on desktop widths, with the main content area scrolling independently; the sidebar stays fixed to the window and the account/Sign out block stays anchored to its bottom. The same fix extends to the list view's pagination controls: `main` is now a flex column, and the table area (`.table-wrap`) grows to fill the leftover space and scrolls internally, so Previous/Next stay visible at the bottom without needing to scroll the page. Column headers/filters are now sticky within that scrolling area too, so they stay visible while rows scroll. On narrow/mobile widths, where the sidebar and content stack vertically, the page reverts to normal full-page scrolling and none of this internal-scroll/sticky behaviour applies. No database or Edge Function changes; frontend only.

## v0.1.7 — Clickable list rows

Removed the per-row "Open" button; the whole row now opens the record on click, with keyboard support (Tab to a row, Enter to open) and a visible focus outline. No database or Edge Function changes; frontend only.

## v0.1.6 — Brand logo

Replaced the text "Agribusiness / Recruitment" brand mark with the actual Agrecruit horizontal logo, shown on the sign-in screen, the "connect your app" screen, and the sidebar (still linking Home). The image is currently hotlinked from `agrecruit.com.au` rather than bundled locally — that was a limitation of the environment this change was generated in (no outbound network access to download the binary), not a deliberate choice. Recommended follow-up: download the logo file yourself, add it under `src/assets/`, and change the single `logoUrl` constant in `App.svelte` to a local import so the app doesn't depend on the marketing site staying up. No database or Edge Function changes; frontend only.

## v0.1.5 — Home page

Signed-in users now land on a Home page instead of the Jobs list, with quick-link tiles to every section (Employees only shown to Managers). Clicking the "Agribusiness Recruitment" brand in the top-left from anywhere in the app also returns to Home. No database or Edge Function changes; frontend only.

## v0.1.4 — Settings tables

Added four reference/lookup tables: Industries (`nameIndustry`), Skills (`nameSkill`), Licenses (`nameLicense`), Education (`nameEducation`). Each is a simple single-field table with a `New`/list/detail screen, reachable from the main navigation. Access matches Companies/People/Jobs: any signed-in user linked to an Employee record has full read/write access. Name fields are unique per table to keep these lists usable as a controlled vocabulary; drop the `UNIQUE` constraint in the migration if you don't want that enforced. For a new installation, run the original setup SQL, then `Agribusiness_Recruitment_v0.1.4_Add_settings_tables.sql`. For an existing installation, stop Vite, run the migration, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes are needed. These tables aren't yet linked to Companies/People — that relationship is left for a future update.

## v0.1.3 — Companies/People name fields

Renamed `Companies."Company Name"` to `nameCompany`, and `People."First Name"`/`"Last Name"` to `nameFirst`/`nameLast`, matching the existing Employees naming convention. For an existing installation, stop Vite, run the separately supplied `Agribusiness_Recruitment_v0.1.3_Rename_name_fields.sql` in the Supabase SQL Editor, replace the application files while retaining your `.env`, then run `npm ci` and `npm run dev`. The rename preserves indexes, constraints and RLS policies; no Edge Function redeployment is needed.

## v0.1.1 correction

Quoted PostgREST sort identifiers, including Sequence #, Company Name and Last Name. Embedded select expressions now preserve Company Name, First Name and Last Name rather than allowing the SDK to remove their spaces. No SQL or Edge Function changes are required. Three request-level regression tests are available with `npm test`.

## v0.1.2 — seq field

The generated Jobs field is now named `seq`. For an existing installation, stop Vite, run the separately supplied `Agribusiness_Recruitment_v0.1.2_Rename_seq.sql` in Supabase SQL Editor, replace the application files while retaining your `.env`, then run `npm ci` and `npm run dev`. The migration renames only the Jobs column and preserves existing numbers, identity generation, uniqueness and permissions. For a fresh installation using the original setup SQL, run that setup first and then this rename migration. Do not rerun the original setup on an existing installation. No Edge Function redeployment is needed.

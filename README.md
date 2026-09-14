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

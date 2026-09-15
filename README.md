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

- Jobs: generated seq, Pending status, required title and Client. Identity sequence values are unique, may have gaps and are never editable. Pending is the only supported status initially.
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

## v0.1.40 — Remove date placeholder in read-only mode

Any field classified as `date` by `fieldType()` now renders as plain text when not editing, instead of `type="date"` — removing the native "dd/mm/yyyy" hint in view mode (shows genuinely blank when empty, the raw date value when set). While editing, it's still a real `type="date"` input with the v0.1.39 forced-open calendar picker on click. Since this keys off `fieldType(key)==='date'` rather than specific field names, it automatically covers Start Date and Date of Birth today, and any date field added later without further changes. No database or Edge Function changes; frontend only.

## v0.1.39 — Force calendar picker open on click for date fields

Clicking into a native `<input type="date">` normally focuses a digit segment for typing — only the small calendar icon opens the popup picker. Added a click handler using `HTMLInputElement.showPicker()` (Chrome/Edge, recent Firefox) so clicking anywhere in a date field forces the calendar open, for both Start Date and Date of Birth. Typing digits directly still works too; this only adds the forced-open behavior on click. In browsers without `showPicker()` support, or when the field is read-only (view mode), the click is silently a no-op — no error, just normal native behavior. No database or Edge Function changes; frontend only.

## v0.1.38 — Date inputs: reverted placeholder-removal attempt

Attempted to suppress `<input type="date">`'s native "dd/mm/yyyy" empty-state hint via `input[type="date"]:placeholder-shown{color:transparent}`. This doesn't actually work: per the HTML spec, the `placeholder` attribute explicitly does not apply to `type="date"` inputs, so `:placeholder-shown` never matches one — there's no supported CSS/HTML hook to remove just that hint while keeping the native calendar picker. Reverted; date fields (Start Date, Date of Birth) use plain `type="date"` with normal browser-default behavior in both edit and view modes, same as before this was ever touched. No database or Edge Function changes; frontend only.

## v0.1.37 — Split Jobs form into Job Details / Client Details panels

The Jobs form is now two visually separate panels: "Job Details" (Title through Instructions) and "Client Details" (Client, Contact, Address, Employee). Still one continuous form/edit/save cycle — Edit, Cancel and Save behave exactly as before, just spanning two panels instead of one. Every other table (Companies, People, Employees, Settings tables) is unchanged, still a single panel with no heading. No database or Edge Function changes; frontend only.

## v0.1.36 — Jobs form layout: wide Brief Description, Experience as textarea

Brief Description now spans the full row (still a single-line input, just wider), bumping Location down to its own row paired with Industry. Experience is now a textarea like Full Description/Instructions/Terms, instead of a single-line input. Resulting layout: Title/Status, Brief Description (full width), Location/Industry, Start Date/Employment Type, Salary Min/Salary Max, then Full Description, Experience and Instructions each full-width below. No database or Edge Function changes; frontend only.

## v0.1.35 — Ten more Jobs fields, and a save-payload bug fix

Added, in this order underneath Title/Status: Brief Description, Location, Industry (single Selector, not the multi-select panel Companies/Seekers use), Start Date, Employment Type, Salary Min, Salary Max, Full Description (textarea), Experience, Instructions (textarea). All optional. Industry needed a Selector rather than a plain input despite being one value, so it's special-cased in the field loop alongside the existing textarea handling (now shared by Terms, Full Description, and Instructions).

While wiring in the numeric/date fields, found a real bug in the existing save logic: every field was being sent as a trimmed string, including empty optional numbers and dates — which sends `""` into a `numeric`/`date` column and Postgres rejects it. This wasn't unique to the new fields; it already affected People's Current Salary/Date of Birth and Companies' Agrecruit %, they just hadn't been exercised with an empty save yet. Fixed generally: the save loop now sends `null` for an empty number/date field instead of `""`, based on each field's declared type. Text-type fields are unaffected — they still save as empty strings, unchanged.

For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.35_Add_Jobs_detail_fields.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes.

## v0.1.34 — Jobs form: drop seq, Title/Status first

Removed the read-only `seq` field from the Jobs form — it's redundant with the `#123` shown in the page header. Title is now the first field, with Status immediately after it (they land side by side in the 2-column form grid). No database or Edge Function changes; frontend only.

## v0.1.33 — Hide empty-state text for Contact/Address while editing

Added a `hidePlaceholder` prop to `Selector.svelte`, tied to edit mode on Jobs' Contact and Address fields. While editing, "Not selected" is suppressed (the "Select a Client first" hint already explains why they're empty, so showing both was redundant). In view mode, the "Not selected" text still shows normally, same as Client, Employee, and People's Company field. No database or Edge Function changes; frontend only.

## v0.1.32 — Selector: clear-before-reselect, fix label click-forwarding

`Selector.svelte` no longer shows the search box when a value is already selected — you now have to click Clear first before picking a different one, rather than being able to search-and-overwrite directly.

Found and fixed the actual cause of "the whole row is still clickable": every Selector was wrapped in a `<label>` alongside its caption text. Once the search box disappears (previous change), the Clear button becomes that label's *only* interactive control — and clicking anywhere inside a `<label>`, including on plain caption text, is native browser behavior that forwards the click to its associated control. That's what made the whole area act like the Clear button, not a CSS sizing issue. Fixed by switching every Selector's wrapper from `<label>` to a new `.field` div (same visual styling, no native label semantics) across all six usages: Jobs' Client/Contact/Address/Employee, People's Company field, and the "Add a {Skill/Industry/etc.}" and "Link a Seeker" pickers. No database or Edge Function changes; frontend only.

## v0.1.31 — Contact, Address and Employee on Jobs

Added three optional fields to Jobs: Contact (a Person), Address (a CompanyAddresses row), and Employee (any Employee, unfiltered — presumably the assigned recruiter). Contact and Address are filtered to the Job's currently selected Client: both selectors are disabled with a "Select a Client first" hint until a Client is chosen, and both reset automatically if you change the Client afterward, since a Contact/Address from the old Company wouldn't make sense against the new one.

Under the hood, generalized `Selector.svelte` further: it now accepts `nameFn` (a display function, for entities like addresses that don't have a single "name" column), `sortField`/`searchFields` (explicit overrides instead of the hardcoded Companies/People-shaped defaults), and `filterColumn`/`filterValue` (an arbitrary `.eq()` filter, used here to scope Contact/Address to the Job's Client). All existing usages (Companies-as-Client, People-as-Seeker, the various Settings-table pickers) are unaffected — the new props default to the same behavior they already had.

For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.31_Add_Jobs_contact_address_employee.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes. Note: there's no database-level constraint tying Contact/Address to the Job's actual Client — that's enforced only in the UI by filtering the picker, so a direct API/SQL write could still mismatch them.

## v0.1.30 — Lowercase Jobs.status/title

Renamed Jobs `"Status"` → `"status"` and `"Title"` → `"title"`, matching the lowercase-key convention used elsewhere (`nameCompany`, `nameFirst`, etc.). Display labels in the UI are unchanged ("Status", "Title"). For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.30_Rename_Jobs_status_title.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes; the rename preserves indexes, constraints and RLS policies.

## v0.1.29 — Pair Addresses/Contacts, swap LinkedIn for Position in Add Contact

Addresses and Contacts now sit side by side in a `.pair-grid`, matching the Industries/Skills pairing on Seeker Detail. In the Add Contact modal, swapped LinkedIn URL for Position — matches what the Contacts list already displays per row, and is a far more relevant field for a company contact than a LinkedIn profile. No database or Edge Function changes; frontend only.

## v0.1.28 — Multiple addresses per Company/Client

Added a new `CompanyAddresses` panel, shown on both Company Detail and Client Detail (like Contacts), for a one-to-many set of addresses per Company — head office, branch, warehouse, billing, however you want to label them (`label` is free text). "Add Address" opens a modal matching the Contacts one (Label, Street, Suburb, State, Postcode, Country). Existing addresses can be removed individually; there's no inline edit yet, only add/view/remove. For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.28_Add_company_addresses.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes; the new table's RLS matches the rest of the app.

## v0.1.27 — Contacts wording, modal Add Contact form

Renamed the "People" panel on Company/Client Detail to "Contacts" (button, empty-state text, and the component file itself: `CompanyPeople.svelte` → `CompanyContacts.svelte`). "Add Contact" now opens a modal (new `.modal-overlay`/`.modal` styles) instead of expanding inline, and collects First Name/Last Name plus basic contact details (Phone, Mobile, Email, LinkedIn URL) rather than just the two names — all copied straight onto the new Person record along with `id_Company`. The modal closes on Escape, on backdrop click, or Cancel; a click inside the modal itself doesn't propagate to the backdrop. No database or Edge Function changes; frontend only.

## v0.1.26 — Company Detail fields, Client Detail fields, related People

Added fields to Companies, split by navigation context like People/Seekers:
- **Company Detail**: Contact (Phone, Mobile, Email, Website) and Business Numbers (ACN, ABN), alongside the existing Company Name.
- **Client Detail**: Industries (multi-select, same mechanism as the Seeker Industries/Skills/etc. panels), Agrecruit % (`splitAgrecruit`), and Terms (a multi-line text area, since fee/contract terms don't fit a single-line input).

As with the original People/Seekers split, these are separate sets, not merged — Client Detail doesn't show Contact/Business Numbers unless you ask for that too, matching how Seeker Detail didn't show Contact/Address until a follow-up request.

Also added, shown on **both** Company Detail and Client Detail: a People panel listing everyone whose `id_Company` points at this Company, with an inline "Add Person" form (First Name/Last Name, matching People's actual required fields) that creates a new Person already linked to this Company. Rows are clickable through to that Person's own detail page.

Under the hood, generalized the four-panel Industries/Skills/Education/Licenses linker (previously hardcoded to People, `PersonLinks.svelte`) into `EntityLinks.svelte`, which now takes an `ownerColumn` (defaulting to `id_Person` for the existing People usages) so the same component could be reused for the new Company→Industries link without duplicating it. Also refactored `Detail.svelte` to receive the app's `navigate` function directly instead of a single-purpose `switchView` callback, since it now needs to navigate to an arbitrary related Person's page too, not just flip between the current record's two modes.

For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.26_Add_company_fields.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes; RLS is row-level so the existing Companies policy already covers the new columns on that table, and the new `CompanyIndustries` junction table gets its own policy matching the rest of the app.

## v0.1.25 — Same treatment for Companies/Clients

Mirrored the People/Seekers navigation-context work for Companies/Clients: opening a Company from the Companies list reads "Company"/"← Companies" as before; opening it from the Clients list now reads "Client"/"← Clients". A "Go to Client" button appears next to Edit on Company Detail when the record is flagged as a Client (mirroring "Go to Seeker"); "Go to Company" always appears on Client Detail (every Client is a Company, mirroring "Go to Person"). The People/Seekers field-visibility split (Contact/Address/Employment sections, Industries/Skills/Education/Licenses panels) has no Companies equivalent yet, since Companies only has one field (Company Name) plus the Client flag — nothing to split. No database or Edge Function changes; frontend only.

## v0.1.24 — Cross-navigation between Person Detail and Seeker Detail

Added a button next to Edit to jump between the two views of the same Person record. On Person Detail, "Go to Seeker" appears only when the record is flagged as a Seeker (opens Seeker Detail for the same record). On Seeker Detail, "Go to Person" always appears (every Seeker is a Person). Both preserve the current record's id and switch only the list-context (People vs Seekers) driving which fields are shown, per v0.1.19/v0.1.20/v0.1.21. No database or Edge Function changes; frontend only.

## v0.1.23 — Company and Position columns on the People list

The People list now shows Company and Position (embedding the linked Companies name, same technique Jobs already uses for its Client column). Display-only, not filterable — same as Jobs' Client column. These two columns are hidden on the Seekers-filtered list, since Company/Position are Person Detail-only fields (not shown or editable in Seeker Detail). No database or Edge Function changes; frontend only.

## v0.1.22 — Visible empty state for Selector fields

`Selector.svelte` (used for Jobs' Client field and Person Detail's Company field) previously rendered nothing at all when read-only and nothing was selected — the field's existence, and that it's searchable once you click Edit, wasn't visible until you were already editing. It now shows a muted "Not selected" placeholder in that state. No database or Edge Function changes; frontend only.

## v0.1.21 — Contact and address details in Seeker Detail

Seeker Detail now also shows Contact (Phone, Mobile, Email, LinkedIn URL) and Physical/Mailing Address, in addition to the Employment section and the Industries/Skills/Education/Licenses panels — editable and saved the same as everywhere else. Company and Position remain Person Detail-only, unchanged. No database or Edge Function changes; frontend only.

## v0.1.20 — Seeker-aware detail header/back label

When a Person record is opened from the Seekers list, the detail page now shows "Seeker" as the record type (instead of "Person") and "← Seekers" as the back link (instead of "← People"). Opened from the People list, it still reads "Person"/"← People" as before. Every other table is unaffected. No database or Edge Function changes; frontend only.

Note: the same "People" vs "Companies" wording mismatch exists for Clients (opening a Company from the Clients list still says "Company"/"← Companies"), which wasn't part of this request — happy to apply the same fix there if wanted.

## v0.1.19 — Navigation-based People detail view

Reworked which People fields show on the detail page based on which list you opened the record from, rather than the Seeker flag's value:
- **From People**: Contact (Phone, Mobile, Email, LinkedIn URL), Physical Address, Mailing Address, plus Company and Position.
- **From Seekers**: Employment (Date of Birth, Source, Current Position, Current Salary, Salary Range), plus the Industries/Skills/Education/Licenses link panels.

The Seeker checkbox itself is still shown either way, since it's the flag that determines who shows up in the Seekers list; toggling it doesn't clear the other mode's field values, it's just not editable in the mode you're not currently viewing. A new Person created from the Seekers screen now defaults Seeker to checked (previously always unchecked regardless of context). No database or Edge Function changes; frontend only.

## v0.1.18 — Link a non-Seeker Person to a Company

Added `id_Company` and `position` to People, for a Person who works at a Company rather than being a Seeker candidate. On the detail form, unchecking Seeker now reveals a Company selector (any Company, not just those flagged Client) and a Position text field; checking Seeker hides them again (the field values are preserved either way — toggling the checkbox doesn't clear them). For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.18_Add_person_company_link.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes; RLS is row-level so the existing People policy already covers the new columns.

## v0.1.17 — Contact, employment and address fields for People

Added optional fields to People, grouped into sections on the detail form: Contact (Phone, Mobile, Email, LinkedIn URL), Employment (Date of Birth, Source, Current Position, Current Salary, Salary Range), Physical Address and Mailing Address (Street, Suburb, State, Postcode, Country each). Only First Name/Last Name remain required. Salary Range is free text (e.g. "$90k–$110k") rather than two numeric fields, and State/Country are free text rather than a constrained dropdown, since candidates and placements aren't necessarily Australia-only. These new fields don't appear in the People list columns, only on the detail form. For an existing installation, stop Vite, run `Agribusiness_Recruitment_v0.1.17_Add_person_fields.sql`, replace the application files while retaining your `.env`, then `npm ci` and `npm run dev`. No Edge Function changes; RLS is row-level so the existing People policy already covers the new columns.

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

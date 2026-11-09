# JobFinder

JobFinder is a private job-search workspace built with TanStack Start, Drizzle,
PostgreSQL, and the [Genesis design system](./DESIGN.md).

- **Find Jobs** searches with Brave and imports job descriptions from public
  posting URLs. When a posting cannot be imported, paste its description into
  the job form.
- **Saved Jobs** tracks application status and runs Gemini fit reviews against
  the active resume. The fit review shows matching evidence, gaps, and suggested
  edits.
- **Resume** accepts text-based PDF and DOCX files up to 5 MB. The server keeps
  the extracted text and reviews and discards the uploaded file. Replacing or
  deleting the resume clears its reviews.
- **Profile** stores private professional details, target role, summary,
  experience by area and duration, and LinkedIn, GitHub, and portfolio links.
- **Settings** saves the account's theme, accent color, and text size. Users
  can add, replace, or remove a personal Gemini API key.

## Local setup

Requires Node.js 22.12 or later and a running PostgreSQL server. Create a
database, then run:

```powershell
npm install
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set `DATABASE_URL` to your database and `BETTER_AUTH_SECRET` to the generated
value; it should be at least 32 characters. Keep `APP_URL` and
`BETTER_AUTH_URL` on the same origin you open in the browser. Then run:

```powershell
npm run db:migrate
npm run dev
```

Open http://localhost:3000 and sign up. The migration preserves starter user
and job IDs. Starter users created before authentication have no password
credentials.

## Dev tooling

[React Grab](https://react-grab.com) loads in development only. Hover any
element and press **⌘C** (**Ctrl+C** on Windows/Linux) to copy it with its
component stack and source location, then paste that into your coding agent.
`import.meta.env.DEV` gates the import, so production builds drop it.

## Provider setup

- Set `BRAVE_SEARCH_API_KEY` for live search. URL import and manual entry work
  without it. JobFinder fetches descriptions only on request from publicly
  accessible HTTP or HTTPS pages. Login walls, JavaScript-only pages, and
  unavailable postings can use the paste form.
- Add a key from a billing-enabled Gemini API project in **Settings**. A
  personal key takes precedence for both kinds of review. Set
  `GEMINI_API_KEY` on the server to offer a shared fallback. Keep
  `GEMINI_MODEL` at `gemini-3.5-flash` or set it to another model that supports
  structured outputs. The upload works without an API key. A review sends
  extracted resume text and, for a fit review, the job description to Gemini.
  The scores estimate ATS readiness and job fit from the supplied text.

Personal keys are encrypted in PostgreSQL using a key derived from
`SETTINGS_ENCRYPTION_SECRET` or, by default, `BETTER_AUTH_SECRET`. Keep the
encryption secret stable. Changing it requires users to re-enter their keys.
Use HTTPS and
matching URLs when hosting the workspace. Keep SQL logging disabled on
instances that store real resumes.

## Checks

```powershell
npm run typecheck
npm run db:check
npm run build
npm start
```

`npm start` serves the production build locally for verification. If you
change the Drizzle schema, use `npm run db:generate` to create a migration and
`npm run db:migrate` to apply it.

> Latest update (15 November 2026): five role workspaces. Read [the current workflow and presentation guide](docs/FIVE_ROLE_WORKSPACES.md). This supersedes older six-role documentation. Do not reseed the configured database.

# PUBLIXIA

Research. Write. Collaborate. Publish.

**Teacher presentation:** Read [the six-account connected walkthrough](docs/PRESENTATION_WALKTHROUGH.md). The configured archive includes `PRIVATE_PRESENTATION_ACCOUNTS.md` and the five prepared manuscript uploads. The six presentation accounts each have exactly one role; other accounts remain available.

**Six-role update:** Student and Author are now Researcher; academic status is a profile field. See [roles and permissions](docs/SIX_ROLE_MODEL.md). Existing users should restart the server and sign in again after the migration.

**Author workspace update:** See [the walkthrough and verification report](docs/AUTHOR_WORKSPACE_UPDATE.md) for research plans, structured writing templates, evidence selection, source catalogs and the imported reading lists. All existing active accounts received the supplied 14 publications. Complete login details are in `PRIVATE_ALL_CREDENTIALS.md` in the private package.

A connected academic research and journal publishing application built with React/Vite, Express, MongoDB Atlas, Google Gemini and Gmail-compatible SMTP. The requested Gemini, Atlas and email integrations are configured in the **private** distribution. See `PROJECT_STATUS.md` for the exact implemented scope and `QA_REPORT.md` for executed verification.

## Start the configured ZIP on Windows

1. Extract `Publixia-Configured-PRIVATE.zip`.
2. Install Node.js 22.12 or newer from [nodejs.org](https://nodejs.org/). Node 24 was used for verification.
3. Double-click `START-WINDOWS.cmd` inside the extracted `PUBLIXIA` folder.
4. Wait for “MongoDB connected”, then open [http://localhost:4000](http://localhost:4000).
5. Read `PRIVATE_SETUP.md` for the administrator account and demo credentials.

The launcher installs locked dependencies if needed and starts the included production frontend with the backend. Keep its console open. Closing it stops the application and email/reminder workers.

Alternatively, from the project directory:

```sh
npm ci
npm start
```

`dist/` is included. Rebuild after editing the frontend:

```sh
npm run build
npm start
```

## Development

```sh
npm install
npm run seed
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend on port 4000. Both commands must run from this repository. The private package already has the supplied Atlas database populated; rerunning the seed adds missing demo records without deleting real data or resetting passwords.

## Source ZIP setup

`Publixia-Source.zip` contains the code, lockfile, built frontend and documentation, without `.env`, administrator credentials, uploads, or database contents.

Copy `.env.example` to `.env`, fill in the settings below, and generate a JWT secret:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the result in `JWT_SECRET`. Then run:

```sh
npm ci
npm run check:services
npm run seed
npm run setup:admin
npm run dev
```

## Configuration

| Variable                        | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `MONGODB_URI`                   | Atlas SRV connection string with the `publixia` database              |
| `JWT_SECRET`                    | At least 32 random characters; server-side session signing            |
| `APP_URL`                       | Public frontend URL used in verification and notification emails      |
| `PORT`                          | Backend port, default `4000`                                          |
| `GEMINI_API_KEY`                | Google Gemini API key; never sent to the browser                      |
| `GEMINI_MODEL`                  | Configurable model; `gemini-3.5-flash` verified with the supplied key |
| `SMTP_HOST`                     | SMTP server, e.g. `smtp.gmail.com`                                    |
| `SMTP_PORT`                     | `587` for STARTTLS or `465` for implicit TLS                          |
| `SMTP_SECURE`                   | `false` on 587, `true` on 465; STARTTLS is required when false        |
| `SMTP_USER`, `SMTP_PASS`        | Sender account and app password                                       |
| `EMAIL_FROM`                    | Sender display name and address, e.g. `PUBLIXIA <sender@example.com>` |
| `EMAIL_WORKER_ENABLED`          | Set to `false` to suspend the worker; queued jobs remain stored       |
| `DEMO_PASSWORD`                 | Password assigned to newly created synthetic accounts by the seed     |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial real administrator; password must be at least 16 characters   |
| `UPLOAD_DIR`                    | Private document storage directory, default `./uploads`               |

The supplied `SMTP_FROM` value is mapped to `EMAIL_FROM` in this application. Credentials are stored only in the ignored root `.env`. They are intentionally included in the private ZIP for your local setup. Use the source ZIP for sharing.

### MongoDB Atlas

The supplied cluster was connected, seeded, and tested. To run from another network, allow the specific computer/server public IP in Atlas Network Access. Verify the database user has `readWrite` for the application database. Use the Atlas-provided SRV URI; URL-encode special characters in passwords. Do not put the URI into frontend configuration.

Mongoose schemas create indexes automatically in development. For production, run `npm run db:indexes` after configuration. Upload/review/project-delete transactions require Atlas or another replica set; an ordinary standalone local MongoDB process is insufficient.

### Gemini

All AI requests use the official `@google/genai` SDK from the Express backend. Nine assistant profiles share a central orchestration service with validation, per-user limits, bounded history, request timeouts, transient retries and usage records.

Chat content is sent to Gemini when the user presses Send. Project/library context is included only when its checkbox is selected. Manuscript screening separately requires explicit consent. No fake AI responses are used when the provider fails. The rest of the application remains available when AI is unavailable.

### Notification email

Every in-app notification is also an email outbox job in the same MongoDB document. The worker polls every 15 seconds, claims jobs atomically, and retries failures with exponential backoff (up to five attempts). Failed messages are visible to administrators and can be retried. Stable Message-IDs reduce duplicate delivery risk; SMTP cannot guarantee exactly-once delivery after a crash.

Covered categories: manuscript submission/status/decisions, reviewer invitations and responses, completed reviews, screening results, completed tasks, task and conference deadline reminders, collaboration/feedback, completed lessons, announcements and account verification/reset.

Regular email requires a verified, active recipient who opted in. Demo accounts never send email. Account verification/reset mail is transactional and is not disabled by preferences. “Sent” means SMTP accepted the message; it does not prove arrival in the inbox rather than spam. In-app notifications are retained independently.

For a self-directed setup test, run `npm run test:email`. It sends only to `ADMIN_EMAIL`, uses an idempotent setup event, and does not send the same successful test again. The supplied Gmail sender accepted this test in verification.

The server must remain running for delivery and reminders. Deadline reminders run hourly for deadlines in the next 24 hours. Set a publicly reachable `APP_URL` before using email links outside your development computer.

## Accounts and demonstration

Use the private setup file for the real administrator. Demo accounts use the `DEMO_PASSWORD` supplied when the seed first creates them:

| Role          | Login                           |
| ------------- | ------------------------------- |
| Researcher    | `researcher@demo.publixia.test` |
| Author        | `author@demo.publixia.test`     |
| Reviewer      | `reviewer@demo.publixia.test`   |
| Editor        | `editor@demo.publixia.test`     |
| Publisher     | `publisher@demo.publixia.test`  |
| Supervisor    | `supervisor@demo.publixia.test` |
| Student       | `student@demo.publixia.test`    |
| Instructor    | `instructor@demo.publixia.test` |
| Administrator | `admin@demo.publixia.test`      |

Demo login and seeding are disabled when `NODE_ENV=production`. The real administrator bootstrap does not overwrite an existing account, password, or roles.

Seeded data includes 40 synthetic users, 12 journals, 80 manuscripts (60 published examples), 80 manuscript versions, 74 review assignments, 72 reviews, 12 issues, 30 projects, 300 tasks (120 milestones), 150 library entries, 12 courses with 60 lessons, 50 conferences and 40 opportunities. All example research, journals and events are explicitly illustrative, not real scholarly or publication claims.

## Demonstrate a publishing workflow

1. Sign in as **author**. Create a manuscript, complete declarations, upload a PDF/DOCX/TXT, and submit.
2. Sign in as **editor**. Open the manuscript and move it to initial screening. Invite the reviewer with a future deadline.
3. Sign in as **reviewer**. Open Peer review and accept the invitation.
4. As **editor**, move the manuscript under review. As **reviewer**, submit scores, author-facing feedback and optional confidential editorial comments.
5. As **editor**, request a revision with an explanation. As **author**, upload a new version with a point-by-point response and resubmit.
6. Repeat screening/reviewer assignment for the revised version. After human review, record acceptance and advance copyediting → typesetting → proofreading.
7. As **publisher**, create/select an issue and publish. Open the article from the journal directory without signing in.

Authors cannot see reviewer identities or confidential comments. Reviewers can access only assigned manuscripts and their own reviews. Editors/publishers are restricted to assigned journals; administrators have platform access. AI screening never changes editorial state.

## Other working workflows

- **Planner:** persistent projects, task editing/status changes, drag-and-drop with keyboard-select alternative, milestones, collaborator membership, owner settings and project feedback.
- **Research library:** live Crossref search, source links, saved papers, notes, literature matrix, BibTeX export and deletion. External Consensus, SciSpace and Undermind links are clearly separate services, not bundled API credentials.
- **AI lab:** nine assistants, saved conversations, optional authorized context, Markdown/code rendering, copy, rename and delete.
- **Pre-check:** private document extraction, structured Gemini report, unique-text anchored suggestions, accept/reject/edit/undo, corrected DOCX and report PDF.
- **Academy:** courses, enrollment, readable lessons/exercises, server-graded quizzes and persistent completion.
- **Discovery:** conference bookmarks, submission status/budget, opportunity application tracking and notes.
- **Writing studio:** saved plain-text paper, abstract, proposal, presentation outline, poster outline and questionnaire outline; DOCX export.
- **Administration:** account roles, real record counts, audit events, AI usage, email queue/retry and announcements.

## Tests and diagnostics

```sh
npm test
npm run build
npm audit
npm run check:services
```

The integration suite uses an isolated temporary MongoDB replica set and deterministic AI/SMTP test doubles. It never writes to the Atlas application database or sends mail. The first test run downloads an official MongoDB binary (approximately 780 MB on the verified Windows setup); later runs use its cached copy.

`node scripts/live-smoke.js` is an explicitly invoked live integration test. It uses the seeded author, creates one temporary synthetic manuscript in Atlas, sends that text to Gemini, verifies report/export behavior, and removes only the records/files it created. It consumes Gemini quota. It does not send real recipient email.

`npm run package` rebuilds both ZIPs from an explicit inclusion list and scans the source archive for configured secret values. Run `npm run build` first. SHA-256 checksums are written alongside the archives.

## Deployment

1. Use a persistent Node.js server, Atlas, and a persistent private volume for `uploads/`.
2. Set `NODE_ENV=production`, a strong secret and `APP_URL=https://your-domain.example`. Create the real admin before disabling demo access.
3. Install locked packages, run `npm run build` and `npm run db:indexes`, then `npm start` behind an HTTPS reverse proxy forwarding to `127.0.0.1:4000`.
4. Keep the process running with your server's service manager. Back up Atlas and uploads together. Do not expose the upload directory as a static web folder.
5. Configure a precise trusted-proxy setting only if needed for your chosen proxy; do not trust arbitrary forwarded IP headers. Without it, proxy users share the default IP rate limit.
6. Test registration, verification links, chat and delivery from the deployed domain. No cloud deployment or custom domain is included in this local ZIP delivery.

This is a verified core application, not every advanced feature in the very large master specification. See `PROJECT_STATUS.md` for the remaining scope. In particular, no actual DOI registration, plagiarism certification, live conference verification, rich collaborative document editor, payment handling, slide/poster layout renderer, or scientific validity assessment is claimed.

## References

- [Google GenAI JavaScript SDK](https://github.com/googleapis/js-genai)
- [Gemini API documentation](https://ai.google.dev/gemini-api/docs)
- [Nodemailer SMTP configuration](https://nodemailer.com/smtp)
- [MongoDB Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [Skiper UI component reference](https://skiper-ui.com/components): interface interactions are implemented locally; no unavailable or paid component imports are required.


## Research intelligence additions

Open /discover for real academic records, /guide for FAQ and research scope, /tools for academic resources, and /admin/criteria for authority criteria and imports. Restart npm start after updating. Optional OPENALEX_API_KEY stays on the server. Run npm run import:research to synchronize metadata and npm run setup:criteria to add initial standards and attributed Bangladesh ranking entries. Existing records remain preserved. See EVALUATION_COMPLIANCE.md for evidence and outstanding extended requirements.

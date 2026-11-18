# API reference

Base path: `/api`. JSON unless an upload/download is specified. Cookies authenticate browser requests; use `credentials: same-origin`. Mutating browser requests must originate from the configured application origin. Errors use `{ "error": "human-readable message", "code": "optional machine code" }`.

List endpoints support `q`, `page` and `limit` where applicable; default 30, maximum 100. The demonstration UI loads bounded catalogs up to 100 records. Catalog pagination controls and very large installations remain future interface work.

## Authentication

| Method    | Path                        | Input / result                                                                        |
| --------- | --------------------------- | ------------------------------------------------------------------------------------- |
| POST      | `/auth/register`            | `name, email, password, affiliation?`; creates researcher/author, queues verification |
| POST      | `/auth/login`               | `email, password`; sets eight-hour HttpOnly session cookie                            |
| POST      | `/auth/logout`              | Clears session cookie                                                                 |
| GET/PATCH | `/auth/me`                  | Own profile; editable name, affiliation, bio, interests, emailNotifications           |
| POST      | `/auth/forgot-password`     | `email`; non-enumerating response                                                     |
| POST      | `/auth/reset-password`      | `token, password`; one-use token, increments session version                          |
| POST      | `/auth/resend-verification` | Signed-in account; queues fresh link                                                  |
| POST      | `/auth/verify-email`        | `token`; one-use verification                                                         |

## Publishing

| Method   | Path                                          | Access / input                                                                                       |
| -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET      | `/journals`, `/journals/:id`                  | Public journal catalog and articles/issues                                                           |
| GET      | `/articles/:id`                               | Published articles only; public                                                                      |
| GET/POST | `/manuscripts`                                | Accessible records / create draft with title, abstract, keywords, journal, coauthors?, declarations  |
| GET      | `/manuscripts/:id`                            | Owner, assigned reviewer or assigned editor; role-filtered reviews                                   |
| POST     | `/manuscripts/:id/versions`                   | Owner in draft/revision; multipart `file`, revision `response`                                       |
| GET      | `/manuscripts/:id/versions/:version/download` | Same private manuscript authorization                                                                |
| POST     | `/manuscripts/:id/status`                     | `status, note?, issue?, doi?`; validated state and role                                              |
| GET      | `/reviewers`                                  | Editor/publisher/admin directory                                                                     |
| POST     | `/manuscripts/:id/assignments`                | Assigned editor; `reviewer, due`                                                                     |
| PATCH    | `/assignments/:id`                            | Invited reviewer; status `accepted` or `declined`                                                    |
| POST     | `/assignments/:id/review`                     | Accepted reviewer, current open round; recommendation, scores, authorComments, confidentialComments? |
| GET      | `/issues?journal=:id`                         | Authorized journal editor/publisher/admin                                                            |
| POST     | `/issues`                                     | Publisher/admin; journal, volume, number, title                                                      |

Declarations contain `ethics, consent, conflicts, funding, data, ai, contributions`. Review scores contain `originality, methodology, results, presentation`, each 1–5. Recommendations: `accept, minor_revision, major_revision, reject`.

State flow: draft → submitted → screening → under_review → revision or accepted/rejected. Revision requires a new upload and point-by-point response before resubmission. Accepted → copyediting → typesetting → proofreading → published. Publishing requires publisher/admin access and an issue from the same journal. Authors may withdraw unpublished active manuscripts. AI reports never update these states.

## AI and screening

| Method           | Path                                  | Input / result                                                      |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------- |
| GET              | `/ai/assistants`                      | Supported assistant instructions                                    |
| GET/POST         | `/ai/conversations`                   | Own history / `assistant, title?`                                   |
| GET/PATCH/DELETE | `/ai/conversations/:id`               | Own conversation; PATCH renames title                               |
| POST             | `/ai/conversations/:id/messages`      | `message, includeContext?`; saves prompt/answer on provider success |
| GET/POST         | `/ai/screening`                       | Own report list / `manuscript, consent:true, mode`                  |
| GET              | `/ai/screening/:id`                   | Own report and original extracted text                              |
| PATCH            | `/ai/screening/:id/issues/:issue`     | `decision: pending/accepted/rejected`, optional edited replacement  |
| GET              | `/ai/screening/:id/export`            | Corrected DOCX with accepted changes only                           |
| GET              | `/ai/screening/:id/export?format=pdf` | Preliminary screening report PDF                                    |

Assistant IDs: mentor, writing, literature, methodology, citation, proposal, coding, conference, planner. Screening modes: general, journal, final. AI endpoints permit 10 generation requests/minute/account, at most 200 stored messages per conversation, last 20 messages as context, 12,000 characters per user message.

## Research and collaboration

| Method           | Path                            | Behavior                                                         |
| ---------------- | ------------------------------- | ---------------------------------------------------------------- |
| GET/POST         | `/projects`                     | Own/shared projects / create                                     |
| GET/PATCH/DELETE | `/projects/:id`                 | Read shared; owner edits or deletes project and tasks            |
| POST             | `/projects/:id/tasks`           | Shared member creates task; `title, due?, priority?, milestone?` |
| PATCH/DELETE     | `/tasks/:id`                    | Shared project member; title/status/priority/due                 |
| POST             | `/projects/:id/members`         | Owner adds registered user by email                              |
| DELETE           | `/projects/:id/members/:member` | Owner removes member; member may remove self                     |
| POST             | `/projects/:id/feedback`        | Shared member; `text`                                            |
| GET              | `/papers/search?q=…&year=…`     | Live Crossref metadata, explicit 503 on upstream failure         |
| GET/POST         | `/papers`                       | Own library / save source metadata                               |
| PATCH/DELETE     | `/papers/:id`                   | Own paper, notes, collection, methodology/findings/limitations   |
| GET              | `/papers/:id/citation`          | BibTeX                                                           |
| GET              | `/researchers`                  | Limited public academic profiles, no email/password fields       |
| GET/POST         | `/documents`                    | Own writing documents / create title/type/content                |
| GET/PATCH/DELETE | `/documents/:id`                | Owner-only editing                                               |
| GET              | `/documents/:id/export`         | DOCX                                                             |

Task states: todo, in_progress, review, done. Priorities: low, medium, high. Studio types: paper, abstract, proposal, presentation, poster, questionnaire.

## Academy, discovery and notifications

| Method       | Path                                    | Behavior                                                        |
| ------------ | --------------------------------------- | --------------------------------------------------------------- |
| GET          | `/catalog/stats`                        | Public live collection counts                                   |
| GET          | `/courses`                              | Public lessons; quiz answers omitted                            |
| GET          | `/enrollments`                          | Own progress                                                    |
| POST         | `/courses/:id/enroll`                   | Idempotent enrollment                                           |
| POST         | `/courses/:id/lessons/:lesson/complete` | Zero-based lesson, integer `answer`; server grading             |
| GET          | `/conferences`                          | Public catalog; `country`, `upcoming=true` supported            |
| GET/POST     | `/bookmarks`                            | Own bookmarks / conference ID                                   |
| PATCH/DELETE | `/bookmarks/:id`                        | Status, planned budget / remove                                 |
| GET          | `/opportunities`                        | Public catalog                                                  |
| GET/POST     | `/applications`                         | Own tracker / opportunity ID                                    |
| PATCH        | `/applications/:id`                     | Status and notes                                                |
| GET          | `/notifications`                        | Own non-archived items, unread count, sender configuration flag |
| POST         | `/notifications/read-all`               | Marks own notifications read                                    |
| PATCH        | `/notifications/:id`                    | Own `read` / `archived` flags                                   |
| POST         | `/notifications/test-email`             | Verified, non-demo account; one per minute; recipient is self   |
| GET          | `/dashboard`                            | Role-scoped live dashboard data                                 |

## Administration and health

- `GET /admin/overview`: record counts, AI usage, outbox aggregates, audit events, non-secret integration configuration.
- `GET /admin/users`, `PATCH /admin/users/:id`: role/active-state management. Self-privilege editing is rejected.
- `GET /admin/email`, `POST /admin/notifications/:id/retry`: delivery records and retry of failed jobs.
- `POST /admin/announcements`: title/body → per-recipient notifications, respecting email preferences.
- `GET /health`: 200 when MongoDB is connected; 503 otherwise. All other data routes fail explicitly while disconnected.

## Operational notes

Uploads are not exposed as static files. Maximum upload is 10 MB; maximum extracted document text is 300,000 characters. Scanned PDFs need OCR outside the application. DOCX ZIP expansion is bounded before extraction. Gemini screening covers the first 70,000 characters and marks partial scope.

The API returns 400 for validation failures, 401 for missing/expired/invalid sessions, 403 for insufficient access, 404 for absent or owner-scoped hidden records, 409 for duplicate/state/concurrency conflicts, 429 for limits, and 503 for disconnected services. Provider errors are sanitized; credentials and raw provider stack traces are not sent to clients.

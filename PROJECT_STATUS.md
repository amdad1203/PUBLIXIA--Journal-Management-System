# Project status

Delivery date: 6 November 2026 (Asia/Dhaka).

## Delivered and connected

The initial folder was empty. This delivery creates a complete runnable core application rather than modifying an existing codebase. Gemini, MongoDB Atlas and Gmail SMTP are configured in the private package. Source, built frontend, lockfile, launch script, test suite and documentation are included.

| Area          | Implemented behavior                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity      | Registration, bcrypt hashes, expiring HttpOnly cookie JWT, email verification, password reset and session invalidation, multi-role accounts                                                                   |
| Authorization | Private record ownership, journal-assigned editorial permissions, reviewer assignment checks, author-safe feedback projections, administrative role controls                                                  |
| Publishing    | Journal directory/details, declarations, manuscript drafts, private uploads, preserved versions, valid transitions, review invitations/acceptance/reviews, revision response, issues and public HTML articles |
| AI            | Nine Gemini assistants, conversations, explicit context option, provider retries/timeouts, quotas surfaced as errors, usage records                                                                           |
| Screening     | PDF/DOCX/TXT extraction, consent, structured report, exact-text suggestions, individual accept/reject/edit/undo, DOCX/PDF exports                                                                             |
| Email         | Persistent outbox, atomic leases, retries/backoff, SMTP state, opt-out, verification requirement, admin retry, all application notification categories                                                        |
| Research      | Live Crossref discovery, library, literature notes/matrix, BibTeX, project/task CRUD, milestones, teams and feedback                                                                                          |
| Learning      | 12 courses, 60 lessons, exercises, server-graded quizzes and persisted progress                                                                                                                               |
| Discovery     | Synthetic conference/opportunity catalogs, bookmarks, submission/budget/application tracking, deadline reminders                                                                                              |
| Studio        | Plain-text document templates, saved drafts, DOCX export                                                                                                                                                      |
| Interface     | Responsive landing page, role-sensitive dashboard, shared navigation, searchable catalogs, loading/error/empty states, notification center and profile                                                        |
| Admin         | Role management, usage/count dashboards, audit events, announcements and email delivery inspection                                                                                                            |

## Deliberate limits and remaining master-spec scope

- This package does **not** implement every standalone page and advanced module listed in the master prompt. It does not claim full parity with that specification.
- Co-author names/contributions are metadata; there is no separate co-author manuscript permission workflow. Roles use nine practical groups rather than the specification's 28 distinct job titles.
- The publishing pipeline has real state checks and human reviews, but production stages store state/history rather than separate rich copyediting, typesetting and proof-approval tools. Public articles have an HTML view; there is no dedicated final-publication PDF composition engine or DOI registry integration.
- The AI chat is request/response, without streamed tokens, chat attachments or dedicated regeneration. A user can send a follow-up prompt. Screening considers up to 70,000 characters and explicitly marks a partial check. No OCR is provided for scanned PDFs.
- Corrected DOCX is rebuilt from extracted text and approved suggestions. Original pagination, equations, tables, figures and formatting are not preserved. Original uploaded bytes remain private and downloadable.
- Literature discovery uses Crossref. There is no claim of direct deployed Consensus, SciSpace or Undermind API integration; those entries link to their respective services. OpenAlex, arXiv, Semantic Scholar, dataset discovery and a dedicated novelty/gap verification engine remain extensions.
- Planner supports tasks/milestones/teams/feedback; a full calendar, Gantt chart, meetings, task comments/subtasks/attachments, invitations with approval gates and supervisor scheduling are not implemented.
- Studio presentation/poster/questionnaire documents are writing outlines exported as DOCX, not designed PPTX/poster rendering or live survey collection. Real-time multi-user editing is not included.
- Academy content is introductory synthetic material. No video library, instructor course editor, downloadable certificate or accredited qualification is claimed.
- Administration includes accounts and operations, but no complete catalog/content editor, journal-assignment editor, fine-grained custom permission builder, billing or payment system. Journal assignments are set by the seed or directly by the operating administrator in MongoDB.
- Demo content is broad but does not meet every suggested record count or entity type in the master specification. Example AI conversations are not fabricated to inflate sample counts.
- No public hosting/domain, production backup schedule, load test, penetration test, antivirus service, mail deliverability/inbox guarantee, or operational SLA is included.

## Self-review and fixes made

1. Initial browser navigation exposed an effect-cleanup error. Fixed implicit effect return values and verified route navigation.
2. Missing multipart data caused a 500 error. Added safe body access and verified the 400 validation response.
3. Initial download assertions used the wrong response parser. Verified actual DOCX/ZIP and PDF signatures with binary parsers.
4. Dependency audit identified archive-tool advisories. Replaced that tool with `fflate`; the final audit is clean.
5. Public catalogs initially sat behind the authentication shell. Added the public layout and preserved guarded private workflows.
6. Added hot-reload root reuse, disabled production demo login/seeding, removed focusable off-screen mobile navigation, and explicitly labeled screening truncation.
7. All synthetic users are marked as demo accounts, so operating the example workflows does not email nonexistent or unintended recipients.

The requested three live integrations were verified; the remaining items above are product-scope extensions, not silently simulated functionality.


## Research intelligence upgrade on 7 November 2026

Added live OpenAlex, Crossref, Europe PMC and DataCite discovery, 410 attributed external records, research FAQ and scope, academic tool directory, authority criteria versioning and report snapshots. Existing records are preserved. Read EVALUATION_COMPLIANCE.md and TEST_RESULTS.md for evidence and remaining scope; earlier descriptions of discovery and criteria capabilities are superseded by this update.

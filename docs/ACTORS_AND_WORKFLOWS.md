> Updated role model: see [SIX_ROLE_MODEL.md](SIX_ROLE_MODEL.md). Student, Author and Instructor account roles have been retired; academic status is now a profile field. Older role descriptions below are historical.

# Publixia actors, features, and workflows

This guide describes the **implemented** Publixia application for users, journal staff, and administrators. It explains who can see or change each record, how a task moves through the system, and which features are shared. An account can have more than one role. A role label alone does not grant access to someone else's private manuscript, paper, document, or project.

## 1. Access model

Publixia has nine role labels: **researcher, student, author, reviewer, editor, publisher, supervisor, instructor, and admin**. New registrations receive researcher and author. Existing accounts may have several labels. Public catalogs are open without signing in; personal workspaces require a session. Each action is checked on the server.

| Actor | Main work in the current application | Access condition |
| --- | --- | --- |
| Visitor | Browse journals, published articles, courses and lesson descriptions, conferences, opportunities, and public counts | No login; cannot change data |
| Researcher | Search papers, manage a personal library, use AI, create projects and tasks, use Studio, track opportunities and conferences, take courses | Signed in; own records or project membership |
| Student | Use the shared research and learning tools | Signed in; no separate student-only controls |
| Author | Create, upload, submit, revise, or withdraw own manuscripts; read permitted decisions and author-facing reviews | Must own the manuscript |
| Reviewer | Respond to assigned invitations and submit a review for an open round | Must be individually assigned; reviewer role alone does not reveal manuscripts |
| Editor | Manage submissions, invite reviewers, record decisions and advance production stages | Must be listed as editor of that manuscript's journal, or be admin |
| Publisher | Create issues and publish an eligible article; can work as a journal editor when assigned | Publishing requires publisher/admin **and** journal access; issue must match journal |
| Supervisor | Participate in shared projects, tasks, and feedback | Must own or be added to the project; title gives no global access |
| Instructor | Use the shared course and workspace features | No course-authoring or grading-management interface yet |
| Admin | Manage users, roles, announcements, email queue, audit/usage overview, and journal manuscripts | Global manuscript access; cannot change own roles through the admin user endpoint |

The role names are practical product groups. Co-authors are manuscript metadata, not separately authorized collaborators. Associate editors, managing editors, journal administrators, and similar titles do not have distinct roles in this build. An admin can manage access through users and MongoDB operations, but the app has no journal-assignment editor screen.

### Permission summary

| Resource or action | Who can do it |
| --- | --- |
| Read public journal/article/course/conference/opportunity catalog | Anyone |
| Read or edit profile and notification preference | Account owner |
| Use AI assistants, private library, Studio, personal trackers, course enrollment | Any signed-in active account |
| Read a private manuscript | Its author, assigned journal editor/admin, or its assigned reviewer |
| Upload a manuscript version; submit or withdraw | Manuscript author, in allowed states |
| Invite a reviewer or decide editorial state | Assigned journal editor or admin |
| Accept/decline invitation; submit review | Individually invited reviewer |
| Create a journal issue | Publisher or admin, subject to journal authorization |
| Publish an article | Publisher or admin with editorial access, after proofreading, with a matching issue |
| Read or change project tasks and feedback | Project owner and listed members |
| Change project details, add members, delete project | Project owner |
| Manage users, announcements, and failed email jobs | Admin |

## 2. Features shared by signed-in users

**Account and dashboard.** Users can register, sign in and out, reset a password, verify an email address, edit their own name, affiliation, biography, interests, and email-notification preference. The dashboard reports live counts and items relevant to the account and its roles. Sessions use an HttpOnly cookie. Public pages remain readable without an account.

**Notification center.** Each user can read, mark as read, mark all as read, and archive their own notices. A notification also creates an email delivery job. Optional email requires a verified, non-demo recipient who has enabled email notifications. Password reset and verification emails are transactional. A successful SMTP handoff does not guarantee inbox delivery.

**Research discovery and library.** Search live Crossref metadata by query and optional year; save a record to a private library; edit citation metadata, notes, methodology, findings, limitations, and collection; remove it; or export BibTeX. When Crossref is unavailable, the saved library still works. Seeded example papers are synthetic. Links to Consensus, SciSpace, and Undermind open those services; their APIs are not integrated into the library.

**AI Lab.** The nine assistants are mentor, writing, literature, methodology, citation, proposal, coding, conference, and planner. Users create, rename, and delete their own conversations. A user can explicitly include their project and saved-paper context in a message. Gemini responses are saved after a successful request. AI text does not automatically change a manuscript, task, or library entry. Requests are limited, and provider outages or quota errors are shown as errors.

**Projects and collaboration.** Users can create a project with objectives, domain, due date, and status. A project owner can edit or delete it and add an active registered member by email. Members can view the project, add/change/delete tasks, set priorities and due dates, flag milestones, and add feedback. A member may leave; the owner may remove members. Adding someone gives immediate access and sends a notification; there is no invitation-acceptance step. The task states are `todo`, `in_progress`, `review`, and `done`; the project states are `active`, `paused`, and `completed`.

**Studio.** Users can create and edit their own text documents of type paper, abstract, proposal, presentation, poster, or questionnaire, and export them as DOCX. The last three are written outlines; the app does not generate PPTX slides, graphical posters, or live surveys.

**Academy.** Anyone can browse course and lesson descriptions. A signed-in user enrolls, reads lessons, submits quiz answers, and receives server-graded progress. Instructors do not currently have course creation, quiz editing, learner administration, or certificate issuance controls.

**Conferences and opportunities.** Anyone can browse these catalogs. Signed-in users can bookmark a conference, set a personal status (`saved`, `preparing`, `submitted`, `accepted`, `rejected`) and planned budget, or track an opportunity application with status (`saved`, `preparing`, `submitted`, `successful`, `unsuccessful`) and notes. These are personal trackers, not external submission systems. Seeded listings are synthetic; confirm real dates and eligibility with organizers.

**Researcher directory.** Signed-in users can search limited academic profiles, including names, affiliations, interests, biography, and role labels. The directory does not disclose passwords or email addresses. Adding a project member uses their known email address.

## 3. Manuscript and journal workflow

### 3.1 Find a journal and prepare a draft

1. Anyone can browse the journal directory, journal details, published articles, and issues.
2. A signed-in author creates a private manuscript draft, selects a journal, and supplies title, abstract, keywords, co-author metadata, and declarations covering ethics, consent, conflicts, funding, data, AI, and contributions.
3. The author uploads a PDF, DOCX, or TXT file, up to 10 MB. The original upload remains private and versioned. Text extraction supports screening; scanned PDFs need external OCR.
4. The author submits after a version exists. The status becomes `submitted`; journal editors receive a notification.

### 3.2 Editorial screening and peer review

1. An editor assigned to the journal moves a submitted manuscript to `screening`. The editor can return it for revision or reject it with an explanation.
2. In screening or under review, the editor chooses an active reviewer and a future deadline. The author cannot be their own reviewer.
3. The reviewer receives an invitation and accepts or declines. The editor is notified of the response. At least one reviewer must accept before the editor can move the manuscript to `under_review`.
4. An accepted reviewer submits a recommendation (`accept`, `minor_revision`, `major_revision`, `reject`), four scores from 1 to 5, comments for the author, and optional confidential editor comments. Submission is allowed only for the current open review round.
5. The editor reviews the reports and decides `revision`, `accepted`, or `rejected`, with a written explanation. Acceptance requires at least one completed human review of the current version. A review recommendation does not itself decide the manuscript.

Authors see author-facing reviews only after the relevant decision permits it; reviewer identities and confidential editor comments remain hidden. Reviewers see their own work, not other reviewers' reports. Editors can see the complete editorial record.

### 3.3 Revision and final publication

1. If the decision is `revision`, the author reads the decision and author-facing comments.
2. The author uploads a **new** version and a point-by-point response. Both are required before resubmission.
3. Resubmission returns the manuscript to `submitted`, where another screening/review cycle can follow.
4. Once accepted, the assigned editor advances `accepted` → `copyediting` → `typesetting` → `proofreading`.
5. A publisher or admin with journal access selects an issue belonging to the same journal and advances `proofreading` → `published`. A DOI-shaped value may be stored, but the app does not register a DOI with an external agency.
6. The published article receives a public HTML page. The author can withdraw an unpublished active manuscript; published, rejected, and already withdrawn records cannot be withdrawn through that action.

The production stages above are tracked states and history entries. The current app does not include separate rich copyediting, layout composition, proof approval, final PDF production, or DOI registration workflows.

### 3.4 Status map

`draft` → `submitted` → `screening` → `under_review` → (`revision` → new version → `submitted`) or `accepted` or `rejected`; `accepted` → `copyediting` → `typesetting` → `proofreading` → `published`. Screening can also lead directly to revision or rejection. The author may withdraw while eligible. Only the actor and prerequisites described above can make each transition.

## 4. AI manuscript screening workflow

1. The manuscript owner chooses a screening mode: general, journal, or final.
2. The owner explicitly consents to sending extracted manuscript text to Gemini. The check considers up to the first 70,000 characters and labels partial coverage; it is not a full-document guarantee.
3. The service returns a structured preliminary report with suggestions. It does **not** change the editorial status or replace human review.
4. The owner reviews each issue and accepts, rejects, edits, or undoes the proposed change.
5. The owner may export a corrected DOCX using accepted changes or a PDF screening report. The corrected DOCX is rebuilt from extracted text, so original formatting, tables, figures, equations, and pagination may not survive. The uploaded source remains preserved.

## 5. Other end-to-end workflows

**Research project.** Create project → add registered collaborators → make tasks and milestones → move tasks through todo, in progress, review, and done → exchange feedback → complete or pause project. Finishing a task notifies the owner. Deadline reminders are scheduled while the server is running. Project membership controls access; the supervisor label alone does not.

**Literature review.** Search Crossref or add metadata manually → save paper → enter notes, methodology, findings, and limitations → group with a collection name → export BibTeX. The AI literature assistant can discuss the saved context when the user opts to include it; it does not silently edit the library.

**Course learning.** Browse public courses → sign in and enroll → study lessons → submit an answer for each lesson quiz → see graded completion and progress. No accredited certificate is issued.

**Conference planning.** Browse catalog → bookmark a conference → set preparation/submission/decision status and budget → receive deadline reminders where applicable → remove a bookmark when no longer needed. Actual submission happens outside Publixia.

**Opportunity tracking.** Browse catalog → add opportunity to personal applications → update progress and notes → record the eventual outcome. Applying to the provider happens outside Publixia.

**Writing in Studio.** Choose document type → write and save a private text outline → revise it → export DOCX. Real-time co-editing and designed presentation/poster output are outside the current feature set.

## 6. Notification and email workflow

Application events create an in-app notification for the intended recipient and a persistent email job. Covered events include submission and editorial state changes, reviewer invitations and responses, review submissions, project membership and feedback, completed tasks, course activity, deadlines, and admin announcements. A worker claims pending jobs, sends via configured Gmail SMTP, records delivery state, and retries failures with backoff. An admin can inspect jobs and retry failed ones. The server must be running for sending and scheduled reminders. Recipients can disable optional email in their profile, while the in-app notice remains. Demo accounts are excluded from sending; verified real users can send a rate-limited test email to themselves.

## 7. Administration workflow

An admin opens the overview to see record counts, AI usage, email queue totals, and audit activity. They can search users, set role labels and active state for other accounts, inspect email delivery records, retry failed jobs, and send an announcement to all active users. Announcements create individual in-app notifications and eligible email jobs. Admin does not have a full interface for creating journals, courses, lessons, conferences, or opportunities, assigning journal editors, configuring custom permissions, or taking payments. Admin role changes do not grant project or personal library ownership.

## 8. Operational boundaries

All personal records live in MongoDB; uploads are private and are not served as public static files. Public articles are only those marked published. Search and catalog views are bounded; very large installations need additional pagination UI. AI uses Gemini through the server key, and outgoing email uses configured SMTP. Database, AI, SMTP, and Crossref failures are reported rather than silently replaced with fabricated results. The seeded content is demonstration material. Production deployment, backups, external DOI registration, payment processing, video courses, rich production tools, and direct Consensus/SciSpace/Undermind integration are not part of the implemented build.

For request paths and payloads, see [API.md](API.md). For implementation scope and limitations, see [PROJECT_STATUS.md](../PROJECT_STATUS.md).

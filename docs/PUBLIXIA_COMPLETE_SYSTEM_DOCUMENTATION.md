# PUBLIXIA Complete System Documentation

System manual and implementation reference

Updated 14 November 2026

This document explains the current Publixia application for its users, project team, teacher and maintainers. It describes the six actors, the functions each can perform, the information saved by each workflow, the controls that connect those workflows, and the limits of the implementation. It incorporates the Researcher sidebar simplification completed on 14 November 2026.

The application connects research planning, literature management, writing, preliminary AI feedback, human peer review, publication and academic development. The implemented system uses six account roles. Academic status and manuscript authorship are separate from account roles. The six presentation accounts each have one role; other existing accounts can hold several roles.

This is an implementation document, not a promise that every proposed feature exists. The current source code takes precedence over older project descriptions. Database counts and presentation starting states below describe the recorded setup, not a fresh live database audit on 14 November. No database writes, migrations, reseeding, account changes or email sends were performed for this documentation and sidebar update. Service credentials and account passwords are intentionally kept in the separate private setup files.

## 1 System purpose and boundaries

Publixia supports a connected academic process: define a question, gather and compare evidence, plan the study, draft a manuscript, request preliminary feedback, submit to an internal journal, obtain human review, revise, and publish an eligible article. Projects and editorial workflows are related activities with different permissions. A project supervisor does not automatically become an editor or gain access to confidential reviews.

The internal application is a React single-page interface served by an Express API with MongoDB persistence. The configured installation uses MongoDB Atlas. Uploaded manuscripts are stored on the server filesystem, not inside MongoDB. Gemini supplies AI responses through a server-side integration. SMTP sends eligible email notifications through a persistent outbox.

Public journal records may represent internal Publixia journals or external journals. Internal journals support the local editorial workflow. External journals direct users to the official publisher; Publixia does not submit to them automatically. An external record is not an endorsement, partnership or claim of ownership of that journal.

The system runs locally at http://localhost:4000 by default. This address is reachable on the presenter computer, not a public hosted deployment. The server binds to 127.0.0.1. Network availability is required for Atlas and external integrations. A local browser interface is not an offline database mode.

## 2 Actors and identity

### 2.1 Six account roles

| Actor | Main responsibility | Access boundary |
|---|---|---|
| Researcher | Learn, search literature, plan and conduct research, write, submit and revise own manuscripts | Own personal records; owned or joined projects; manuscripts authored or individually assigned for review |
| Supervisor | Guide assigned projects, edit their research plans, assign tasks and provide feedback | Must be added to the project; the title alone grants no access to other projects or manuscripts |
| Reviewer | Respond to manuscript invitations and submit scores, reports and recommendations | Must be individually assigned; cannot review their own manuscript or inspect another reviewer's confidential report |
| Editor | Screen submissions, assign reviewers and make editorial decisions | Must be assigned to the journal, unless Administrator |
| Publisher | Handle production stages, issue creation and final publication | Must be assigned to the journal; Publisher alone cannot accept/reject submissions or assign reviewers |
| Administrator | Manage users, roles, journal staffing, authority criteria, import operations, audit visibility and notification operations | Platform permissions do not remove owner-only controls on private libraries, documents, conversations or screening reports |

Student and Author have been merged into Researcher. Instructor is also no longer an assignable account role; Academy is available to all signed-in accounts. The six internal role keys are researcher, supervisor, reviewer, editor, publisher and admin. The user-facing label for admin is Administrator.

Academic status is stored on the profile. Options are undergraduate, postgraduate, independent researcher, faculty, academic author and other. Users select or change status during registration or in Account Settings. Academic status never grants editorial, administrative or project permissions.

Authorship is a relationship between a manuscript and the account that created it. Any signed-in account can create its own manuscript and use its owner actions; a separate Author role is not required. Co-author names are manuscript metadata and do not grant another login access to the private manuscript.

General accounts may hold multiple roles. Permissions are the combination of those roles plus the required ownership or assignments. The six classroom accounts are deliberately single-role so the teacher can see the separation clearly. Legacy email addresses containing author, student or instructor remain valid login identifiers even though those roles were retired.

### 2.2 Six presentation identities

| Role | Presentation login | Connected responsibility |
|---|---|---|
| Researcher | labibafnanbb2004@gmail.com | Owns the presentation research project and five prepared manuscripts |
| Supervisor | amdadul019710@gmail.com | Member of the presentation project; guides planning and assigned tasks |
| Reviewer | rocklevi96@gmail.com | Receives review assignments for the prepared cases |
| Editor | amdadboss11@gmail.com | Assigned editorial staff for the presentation journal |
| Publisher | mimma9087mim@gmail.com | Assigned publishing staff for the same journal |
| Administrator | amdadulhaque1203@gmail.com | Platform and journal staffing oversight |

These are application accounts, not access to the corresponding Gmail inboxes. Passwords are in PRIVATE_PRESENTATION_ACCOUNTS.md and PRIVATE_ALL_CREDENTIALS.md in the private distribution. The original migration preserved all 46 account identities. Changing the six presentation roles did not delete other accounts, their papers or their manuscripts.

### 2.3 Permission rules by resource

| Resource or action | Effective rule |
|---|---|
| Public catalogs and published articles | Visitors can read the public routes without signing in |
| Profile and notification preferences | Only the account owner edits their profile through the profile API |
| AI Lab, library, Studio, courses and personal trackers | Available to signed-in active accounts; private records remain owner-scoped |
| Create a project | Researcher or Administrator |
| Read project and participate in tasks or feedback | Researcher/Supervisor who owns or belongs to it; Administrator has oversight |
| Edit research plan | Project owner, assigned Supervisor, or Administrator |
| Edit project metadata or add members | Project owner or Administrator through the project access helper |
| Delete project | Project owner or Administrator; associated tasks are deleted transactionally |
| Remove a member | Route explicitly permits the owner or the member removing themselves |
| Create or revise own manuscript | Manuscript owner in a permitted state |
| Read private manuscript | Owner, assigned journal staff/Administrator, or individually assigned reviewer |
| Invite a reviewer or decide acceptance/revision/rejection | Assigned Editor or Administrator |
| Receive a review assignment | Active Reviewer, Researcher or Supervisor; never the manuscript's own author |
| Submit a review | Assigned person after accepting the invitation, during the current open review round |
| Advance production | Assigned Editor, Publisher or Administrator, subject to state prerequisites |
| Create issue or execute final publication | Assigned Publisher or Administrator |
| Edit journal profile | Assigned Editor/Publisher or Administrator |
| Create journal or assign journal staff | Administrator |
| Read audit activity | Own recorded actions; assigned journal activity for journal staff; all audit activity for Administrator |

Private libraries and Studio documents do not become globally readable merely because an account is Administrator. Likewise, project membership does not grant access to another member's private AI conversations or manuscript files. An assignment is checked on the server, not merely by hiding a button.

## 3 Navigation and page organization

### 3.1 Current Researcher sidebar

The simplified sidebar applies only when the account has exactly one role and that role is Researcher. This is the current equivalent of the former Author workspace. Supervisor, Reviewer, Editor, Publisher, Administrator and mixed-role accounts retain their previous configuration and existing role filters.

| Group | Label | Existing destination |
|---|---|---|
| WORKSPACE | Overview | /dashboard |
| WORKSPACE | Research planner | /projects |
| WORKSPACE | Research library | /research |
| WORKSPACE | Writing studio | /studio |
| PUBLISH AND GROW | Journal directory | /journals |
| PUBLISH AND GROW | My manuscripts | /manuscripts |
| PUBLISH AND GROW | Manuscript pre-check | /screening |
| PUBLISH AND GROW | Opportunities | /opportunities |
| PUBLISH AND GROW | Help and guidelines | /guide |
| ACCOUNT | Account settings | /settings |

On screen, the original labels use “PUBLISH & GROW” and “Help & guidelines.” There are exactly ten destination links. The existing logo, navy sidebar, pink active state, icons, widths, typography and responsive CSS remain unchanged. No nested menu, replacement page or new tab system was added.

Study design and plan, research evidence, discovery, handbook, FAQ, tools, AI Lab, Academy, conferences and researcher directory no longer each occupy a separate Researcher sidebar entry. Activity History is available through an action in the Researcher's existing Account Settings page. Other actors retain their sidebar Activity History link.

This is navigation consolidation only. The existing /projects, /research, /guide and /opportunities pages were not reconstructed to absorb other components. In particular, the FAQ page is not a newly merged Academy/handbook page, and Opportunities is not a newly merged conference browser. Their original routes remain usable through existing links or saved URLs.

### 3.2 Preserved destinations

| Route | Purpose and access |
|---|---|
| / | Public landing page |
| /login and /register | Sign-in and new account registration |
| /forgot-password and /reset-password | Account recovery |
| /verify-email | Email verification link |
| /dashboard | Signed-in overview with role-specific work queue |
| /projects and /projects/:id | Project listing, board, milestones, team feedback and settings |
| /plan | Nine-part study design and plan |
| /research | Private library, discovery controls and literature matrix |
| /discover | Live and saved academic discovery |
| /author-sources | Curated publications, researchers, journals, opportunities and conferences |
| /author-handbook | Searchable writing and research guidance |
| /guide | Existing FAQ and research scope |
| /tools | External academic tool directory |
| /ai | Private AI conversations and assistants |
| /studio and /studio/legacy | Structured and classic writing editors |
| /journals and /journals/:id | Journal listing and profile |
| /manuscripts and /manuscripts/:id | Private submission and editorial workspaces |
| /screening and /screening/:id | AI pre-check requests and saved correction reports |
| /academy and /academy/:id | Courses, lessons and enrolled progress |
| /conferences and /opportunities | Academic event and opportunity catalogs and tracking |
| /collaboration | Registered researcher community |
| /notifications | In-app notices and email test controls |
| /settings | Profile, academic status, notification preferences and Researcher activity link |
| /journal-management | Assigned journal profiles and Administrator staffing controls |
| /activity | Role-scoped audit history |
| /admin and /admin/criteria | Administration, AI evaluation criteria and imports |
| /articles/:id | Public article page for a published manuscript |

Routes with private records require sign-in and server-side access checks. PublicWorkspace renders the signed-in shell for a logged-in user and the public header for a visitor. The active-project selector remains in eligible workspaces and preserves the same project context behavior.

## 4 Account lifecycle and sessions

Registration collects name, email, password, affiliation and optional academic status. The server validates the input, lowercases the email, rejects duplicates, hashes the password with bcrypt and creates a Researcher account. Client-supplied privileged roles are not accepted through registration. A verification token and email job are created, and a session is established.

Sign-in compares the supplied password against the stored hash. Inactive accounts cannot sign in. Legacy demo-flagged accounts are blocked when NODE_ENV is production. Successful sign-in sets the HttpOnly publixia_session cookie; JavaScript cannot read it. The signed session lasts eight hours and carries the user ID and token version. Every protected request loads the current user and rejects inactive users or mismatched token versions.

Sign-out clears the browser cookie. Ordinary tabs in one browser profile share the same session; use separate profiles to present simultaneous independent actors. A private window shared by several tabs also shares its own session.

Verification tokens are hashed in storage, expire after 24 hours and are consumed once. The verification route marks the email address verified. Resending verification replaces the outstanding token for that purpose. Password-reset responses use the same public message whether or not an eligible account exists. Reset tokens expire after one hour, are single-use, and successful reset increments tokenVersion so older sessions no longer work.

Registration and reset require a password between 10 and 128 characters. The existing classroom accounts have the short password previously requested by the project owner; login does not retroactively enforce the registration minimum. Their credentials belong in the private setup document, not in public source documentation.

Account Settings saves name, affiliation, biography, research interests and academic status. Email notification preference is saved separately through the profile endpoint. Self-service profile editing cannot change roles, verification status or active state. An Administrator edits another user's roles and active flag through Administration; that endpoint prevents self-privilege changes and invalidates the target user's older sessions.

## 5 Dashboard and shared functions

Overview is a role-aware summary of saved database records. The role introduction links to the appropriate work queue. Researcher and Supervisor project summaries include tasks, progress and deadlines; Administrator project oversight is broader. Editorial users see manuscripts from assigned journals, Reviewers see assigned manuscripts, and a Researcher normally sees their own submissions. Counts reflect the scoped database query, not an assertion that research has been completed.

The notification icon shows unread activity and refreshes periodically. Each account also has a private library, documents, AI conversations, learning progress, conference bookmarks and opportunity applications. Shared tools do not imply shared private records.

Some lists are capped at 100 records, while others use page/limit parameters. The default common page size is 30 and maximum is 100. A large installation would need additional pagination interfaces beyond the currently bounded lists. Empty states and load errors are shown rather than substituting fabricated successful results.

## 6 Projects and supervision

### 6.1 Create and organize a project

The Researcher creates a project with a title, description, domain, objectives and optional due date. Status can be active, paused or completed. The owner is taken from the signed-in account; the browser cannot nominate another owner. The project appears in the owner's project listing and can become the active context.

The owner adds an active registered collaborator by email. Membership is applied immediately and a notification is created; there is no separate acceptance step. To grant supervision, add an account that has the Supervisor role. Merely adding an account with only Reviewer/Editor/Publisher does not bypass the role check for project access. The role and membership conditions must both be satisfied.

The project detail page provides Board, Milestones, Team & feedback, and Project settings. Existing tabs remain unchanged by the sidebar cleanup. The owner manages project metadata and membership. A member can remove themselves. Project deletion also deletes its tasks in a database transaction; it is an intentional destructive action, not a sidebar operation.

### 6.2 Tasks and assignment

A project participant creates a task with title, optional due date, low/medium/high priority, optional milestone flag and optional assignee. The assignee must be the project owner or a member. Tasks use todo, in_progress, review and done states. The board supports dragging a task between columns and a select control for the same state change.

Assignment is stored on the Task record. Creating an assigned task or changing it to another assignee generates a task-assignment notification. An unrelated user cannot be selected as assignee. Participants with project access can update task details and assignment; assignment is a responsibility label, not exclusive edit ownership. Completing a task notifies the project owner. Unassigning a task does not send a new-assignee notice.

A milestone is a marked task, not a separate workflow engine. The Milestones tab lists these tasks and their states. Team feedback saves the author, text and timestamp on the project and notifies the owner. Comments are shared with people who can access the project.

### 6.3 Research plan and active context

The study plan contains nine sections: area and problem; question and objectives; literature and evidence map; gap and contribution; methodology; data and ethics; experiment and analysis plan; risks and feasibility; manuscript and dissemination. Each section stores text rather than an automatically executed analysis.

The owner, assigned Supervisor or Administrator can save a plan. Ordinary Researcher members can read it but do not receive plan-edit authority merely from membership. The plan API validates section names and text lengths. A section can hold up to 12,000 characters.

The active-project selector saves a project reference on the account after checking access. It provides quick links to the plan and relevant discovery search. New structured drafts can copy the active plan's question and methodology into relevant sections. AI context sharing can include active-project planning. No AI assistant silently modifies the project.

Current limitation: the active-context read endpoint and AI context queries filter by ownership/membership, while Administrator project-access checks are broader. An Administrator can oversee a project without automatically receiving it as private AI context. This manual does not describe a universal context bypass.

## 7 Literature library and discovery

### 7.1 Private library and literature matrix

A saved Paper contains title, authors, year, DOI, URL, abstract, source, notes, methodology, findings, limitations and collection. Users can add records, edit their own notes and metadata, organize collections, remove an entry and export a BibTeX citation. The literature matrix presents research methods, findings and limitations for comparison; it does not verify those statements automatically.

Saving through the curated-source or imported-record action uses an owner-specific identifier such as DOI or URL to avoid inserting the same record repeatedly. Different users have separate copies and notes. Removing a private library item does not delete its public source record. A DOI is bibliographic metadata and is not created or registered by saving a paper.

Evidence annotations supplied in the content pack remain annotations. A successful Crossref lookup can confirm a title, authors or DOI identity; it does not certify reported accuracy, methodological quality or reproducibility. The user should consult full text before citing substantive findings. Preprints and published versions should be distinguished rather than treated as independent studies without review.

### 7.2 Live discovery and saved imports

The implemented live providers are OpenAlex, Crossref, Europe PMC and DataCite. OpenAlex supports the broader entity selector for works, authors, sources, institutions and topics; the other implementations are publication/DOI searches. Search results include provider attribution, retrieval time and a source link where supplied. Bangladesh filtering is supported in the OpenAlex request path; not every provider supports every filter in the same way.

Live retrieval and saved imports are different. A live search retrieves an upstream response. Administrator synchronization upserts normalized ResearchRecord data and writes an ImportRun with success/failure information. The saved-record endpoint searches these stored records. The /research/discover route is a compatibility route to the live retrieval service, not a separate search engine.

The library also retains its direct Crossref search endpoint with query and optional year. External requests have timeouts and explicit error responses. Provider failures do not produce invented papers. A saved local record can remain useful even if an upstream source is temporarily unavailable.

### 7.3 Curated evidence and researcher profiles

Research evidence contains five record kinds: publications, researchers, journals, opportunities and conferences. Users can search supplied fields, inspect detailed metadata and source-check status, open the original source, copy a source link, and compare up to three records. Publications can be saved into the private library.

Following a researcher saves a private SourceFollow relationship. It does not send a message to that researcher, create an external subscription, or prove the profile owner has joined Publixia. Institutional or publication-linked profiles are distinct from registered application users. The Collaboration page lists limited registered academic profiles without exposing their passwords or email addresses.

The initial author-content import contained 14 publications, eight researcher profiles, seven external journals, five opportunities and three conferences. These are setup counts, not promises of current availability. The existing wider discovery collection also contains earlier provider imports and Bangladesh ranking records with source attribution. Date-sensitive information must be checked at its original source before acting.

## 8 Writing Studio

### 8.1 Structured documents

The structured Studio supports nine templates: original research article, systematic literature review, scoping review, research proposal, conference paper, thesis/dissertation, conference abstract, response to reviewers and journal cover letter. Creating a draft establishes an owned Document and an editable outline. Save the modules after creating the structure; local unsaved edits are not a saved manuscript upload.

The original-article outline includes title/author information, abstract, keywords, introduction, related work, problem formulation, materials and methods, results, discussion, conclusion/future work, declarations and references. Other templates provide structures suited to their purpose. Template names do not imply automated compliance with a journal or reporting standard.

Each module has a stable key, title, text, status, saved-source IDs and experiment-result IDs. Statuses are not_started, draft, needs_evidence, needs_review and complete. These are author-maintained writing states. Marking a module complete does not certify scientific quality.

### 8.2 Editor and evidence workflow

Choose a module in the outline and edit its text. The editor shows a word count and guidance for the section. In Evidence, select a paper from your own library and insert a citation marker. The action links that source ID to the module. The server rejects another user's private paper ID.

In Experiments, record title, dataset, method, findings and limitations, then link the record to an appropriate section. These are manually entered records, not code execution or automatic experimental results. The backend rejects missing linked-result IDs and duplicate identifiers. No scientific measurements should be entered as observed results unless they were actually obtained.

### 8.3 Save history and exports

Saving checks the document owner, project access, source ownership and current revision. A stale revision receives a conflict rather than overwriting someone else's intervening save. Up to 20 previous snapshots are retained, including module text, experiment records and template information. Restoring a snapshot creates an editable working state; saving records the new revision.

Limits are 40 modules, 20,000 characters per module text, 100 experiment records and 150,000 characters for the serialized workspace payload. Each module may link up to 100 sources and 100 result identifiers. Split supplementary material into another draft if the workspace grows too large.

Saved module text is assembled into document content with linked bibliographic references. DOCX export becomes available after saving changes. It exports textual content; it is not a rich typesetting, figure-layout or equation-authoring system. The original uploaded manuscript in the publishing workflow is a different record from the Studio draft.

The classic editor remains at /studio/legacy for older documents and plain text outlines. Legacy document types include paper, abstract, proposal, presentation, poster and questionnaire. These last three are text outlines, not generated PPTX decks, graphical posters or executable surveys. Classic content replacement is blocked for a structured document to protect its module/history structure.

## 9 AI Research Lab

### 9.1 Assistants and appropriate use

| Assistant | Intended work |
|---|---|
| Research mentor | Refine questions, feasibility, study stages and next deliverables |
| Academic writing | Improve supplied prose while preserving meaning and uncertainty |
| Literature review | Compare supplied sources and identify tentative evidence gaps |
| Research methodology | Propose study design, controls, metrics, uncertainty and reproducibility measures |
| Citations and references | Format supplied verifiable bibliographic information |
| Research proposal | Structure objectives, methods and feasibility |
| Research coding | Explain and draft reproducible analysis code and tests |
| Conference planning | Assess supplied event information and planning constraints |
| Research planning | Suggest tasks and milestones without claiming to save them |
| Research ethics and integrity | Identify consent, privacy, licences, disclosure and reporting questions |

Users create a conversation with an assistant, send messages, rename conversations, reopen saved history or delete their own conversation. Responses are generated through Gemini. Successful exchanges persist in Conversation; usage or failure records are stored in AIUsage. Missing credentials, quota errors or unavailable providers return explicit errors, not substituted scripted answers.

### 9.2 Context sharing and evidence

Context sharing is optional. When enabled, the request can include accessible project objectives/plans and owned library records. Users may select up to 20 source IDs. The server rejects source selection without the context flag and rejects papers belonging to someone else. With no explicit source selection, up to eight eligible library records may be included. Context serialization is bounded, so large source records may not be fully transmitted.

The latest 20 conversation messages are used as conversational context. A message can contain up to 12,000 characters, and a conversation is capped at 200 stored messages before a new one is required. The AI route limiter allows ten requests per minute per user. Provider calls use a 45-second timeout, up to three attempts for specified transient errors, and a 4,096-token output cap.

Literature, citation and proposal assistants may retrieve matching public metadata from the local ResearchRecord collection using terms in the question. This is not unrestricted live web browsing or access to full text. It is separate from sending private project/library context.

### 9.3 Human review of AI output

The interface renders the response, permits copying it and can save it as a separate Studio draft after the user supplies a title. This explicit action creates a new document; it does not overwrite an existing manuscript. Generated research code is text for the user to inspect and run in an appropriate environment; the assistant does not execute it inside Publixia.

System prompts require source integrity, uncertainty and preservation of scientific meaning. They instruct the model not to invent references, results or approvals and not to follow instructions embedded inside manuscript text. These are safeguards, not guarantees that every response is correct. Users remain responsible for checking claims, references, calculations and applicable disclosure requirements.

## 10 Manuscript pre check and authority criteria

### 10.1 Request and report

The manuscript owner selects an uploaded manuscript, chooses general, journal or final mode, and explicitly consents to sending extracted text to Gemini. No uploaded version means no screening request. Journal mode adds the internal journal's author guidance; the modes do not represent independent scientific certification levels.

The service selects the newest published authority criterion for the inferred research domain, falling back to general criteria and then built-in defaults. It also builds accessible research context. Up to the first 70,000 manuscript characters are analyzed. The report identifies partial coverage when the original text is longer.

Gemini returns a structured summary and proposed corrections. Each correction must identify an original substring, replacement, category and explanation. The backend drops corrections whose original substring does not occur exactly once in the source. Missing sections and uncertainty belong in the summary rather than fabricated replacement content.

The report stores the manuscript/version reference, owner, mode, model, text coverage, context and criteria snapshot. Later authority changes do not rewrite the snapshot of a previous report. A notification tells the owner when the report is available.

### 10.2 Correction decisions

The owner can accept, reject, edit and accept, or undo a decision. Suggestions remain pending until decided. The corrected DOCX export applies only accepted replacements to the saved original extracted text. Replacement logic avoids cascading one replacement into another; overlapping accepted corrections produce a conflict requiring the user to undo one.

The report can also be exported as PDF. The original uploaded file remains preserved. Text-based corrected DOCX output may not retain original page layout, tables, figures or equations. The screening route does not change editorial state, assign reviewers, approve ethics or issue an originality certificate.

### 10.3 Administrator criteria workflow

Administrator opens AI criteria and imports, enters a name, domain, evaluation instructions, response depth and named numeric weights, and saves a draft or published version. Weights are individually bounded from 0 to 100; the API does not enforce that they total 100. Treat them as prompt guidance rather than a calibrated scoring instrument.

Every saved criteria entry is a new version; earlier entries remain available for audit. Published domain-specific entries take precedence over published general entries. This mechanism is implemented for manuscript screening. Ordinary AI Lab chat uses the configured assistant/system prompts and supplied context; the current chat route does not automatically apply the criteria snapshot used by screening. Changing criteria does not retrain Gemini or expose hidden model reasoning.

## 11 Journal directory and journal management

The directory shows journal names, subjects, descriptions and profiles. Internal profiles provide overview, author guidance, editorial staff, issues, published articles and policies. External profiles display source metadata and link to official journal/submission information. The API rejects manuscript creation against an external journal entry.

Journal management is available to Editor, Publisher and Administrator. Journal staff can edit only assigned journals. Editable fields include name, subject, description, guidelines, ISSN and frequency. Administrator can create an internal journal using a validated slug and assign active Editors, Publishers or Administrators as journal staff. Internally the editors array is used for assigned editorial/publishing staff; role checks still distinguish which actions each staff account may perform.

Changing directory metadata does not register an ISSN, change an external publisher's policies, create a DOI prefix or certify indexing. External fees, review methods and board membership should be checked at their official source. Some imported profiles deliberately retain incomplete-verification notes rather than invented details.

## 12 Manuscript submission and versioning

### 12.1 Draft creation

A signed-in user creates a manuscript with title, abstract, keywords, target internal journal, optional co-author text and declarations for ethics, consent, conflicts, funding, data, AI use and contributions. The server assigns the owner from the session and generates a manuscript code. A draft starts private and does not appear as a public article.

The abstract requires at least 30 characters. Title is bounded at 250 characters; abstract at 10,000; keywords at 500; co-author text at 2,000; each declaration at 3,000. Server validation rejects missing required data. These technical bounds do not replace substantive journal requirements.

### 12.2 Upload and preservation

The owner uploads PDF, DOCX or UTF-8 TXT, one file up to 10 MB. The backend checks supported file types, basic content signatures and readable extracted text. PDF requires a text layer; scanned pages need OCR outside the application. DOCX advertised ZIP expansion is capped at 30 MB, and extracted text is limited to 300,000 characters.

The original bytes receive a generated filename in the configured upload directory. A Version record stores file metadata, extracted text, version number and any revision response. Private downloads go through authorized routes; uploads are not a publicly exposed static folder. Database-only backups do not include these files.

### 12.3 Submit and revise

A draft cannot be submitted without an uploaded current version. Submit to journal changes status to submitted, records history and creates notifications for the journal staff listed on the journal. The owner can inspect Documents & versions, Peer review and Editorial history.

When a revision is requested, the owner must upload a new version after the revision decision and provide a point-by-point response. Resubmission returns to submitted. A prior version's completed review does not satisfy acceptance requirements for the new version. The author can withdraw an eligible unpublished manuscript; published, rejected or already withdrawn manuscripts cannot be withdrawn through that action.

## 13 Human review and editorial decisions

### 13.1 Screening and invitation

An assigned Editor moves a submission into screening or records an allowed rejection with an explanation. The reviewer-selection API offers eligible active Reviewer, Researcher and Supervisor accounts. The editor cannot assign the manuscript's own author and must supply a future deadline.

Each assignment is associated with a manuscript, reviewer and review round, where the round corresponds to the current version. The unique combination prevents duplicate assignment of the same reviewer for that round. An invitation creates a notification for the reviewer. Only the invited account can accept or decline its pending invitation. The response notifies the inviting editor.

### 13.2 Conducting review

At least one invitation must be accepted before the editor can move the manuscript into under_review. The reviewer submits only while their assignment is accepted, the manuscript is under_review and the assignment round matches the current version.

The report includes an accept/minor_revision/major_revision/reject recommendation, four integer scores from 1 to 5 for originality, methodology, results and presentation, author comments of at least 20 characters, and optional confidential editor comments. The report and assignment completion update are committed together in a MongoDB transaction. The inviting editor is notified that the review is ready.

The author's view receives released author-facing reviews only in the implemented decision/production states. Reviewer identity and confidential editor comments are not included in the author's released report. Reviewers see their own review rather than other reviewers' confidential reports. Journal staff have the editorial view permitted by their journal access.

### 13.3 Decision rules

The Editor decides revision, accepted or rejected after considering the report. These decisions require a note of at least ten characters. Acceptance additionally requires a completed human review for the current version. An AI pre-check or a reviewer recommendation alone cannot advance a manuscript to accepted.

Publisher-only accounts are denied screening, review-start, revision, acceptance and rejection decisions, and cannot assign reviewers. Administrator can perform editorial oversight actions. The interface hides inappropriate controls, while the backend independently enforces the rule.

## 14 Production and publication

After acceptance, assigned journal staff advance copyediting, typesetting and proofreading in order. Each transition records who acted, when and any note. These are tracked workflow states, not a built-in desktop publishing or automatic proof-composition system.

Publisher or Administrator creates an issue with journal, volume, issue number and title. The journal/volume/number combination is unique. To publish a manuscript in proofreading, the actor must have publishing authority and select an issue belonging to the same journal. DOI entry is optional and syntax-checked; Publixia does not register it with Crossref or DataCite.

Publication stores issue and publication time and makes the article page available publicly. The public article view is rendered from the saved manuscript/version information. The action does not claim that external indexing or DOI registration has occurred. Author notifications and audit/history entries record the transition.

### 14.1 Complete state transition reference

| Current state | Permitted next state | Required actor or prerequisite |
|---|---|---|
| draft | submitted | Owner; current upload exists |
| submitted | screening or rejected | Assigned Editor/Administrator; decision explanation when rejecting |
| screening | under_review | Assigned Editor/Administrator; accepted reviewer invitation exists |
| screening | revision or rejected | Assigned Editor/Administrator; explanation |
| under_review | revision or rejected | Assigned Editor/Administrator; explanation |
| under_review | accepted | Assigned Editor/Administrator; completed human review of current version and explanation |
| revision | submitted | Owner; new version uploaded after decision and response provided |
| accepted | copyediting | Assigned journal staff/Administrator |
| copyediting | typesetting | Assigned journal staff/Administrator |
| typesetting | proofreading | Assigned journal staff/Administrator |
| proofreading | published | Assigned Publisher/Administrator; issue belongs to journal |
| Eligible unpublished state | withdrawn | Owner; not published, rejected or already withdrawn |

Rejected, withdrawn and published records have no general reopen/reset command in the current workflow. A presentation setup is not reset by simply rerunning the insertion script.

## 15 Academy and guidance resources

Anyone can browse the course catalog and lesson descriptions. A signed-in user enrolls in a course; repeated enrollment is idempotent. Lessons contain content, a practical exercise and a multiple-choice check. Correct answers are omitted from public course responses. A completion request supplies the lesson index and selected answer; the server grades it, records the attempt and updates completed lesson indices when appropriate.

The six research-practice pathways cover foundations; literature search and synthesis; methodology and design; research coding and reproducibility; academic writing/publication; and responsible AI/integrity. Earlier course records remain present. The presentation accounts were enrolled to give them a starting workspace, not falsely marked as having completed the lessons.

There is no separate Instructor role, instructor grading dashboard, course-authoring interface or accredited certificate system. Content is populated through maintained data/scripts. Course progress is private to the enrolled account.

Help & guidelines opens the existing FAQ and research-scope page. Topics include manuscripts, publication, DOI concepts, preprints, citation differences, open access, journal fit and responsible use of AI. Domain links open research discovery with a relevant query. The handbook remains a searchable separate route with planning, writing and publication guidance. Some handbook recommendations describe good practice beyond what the app automates.

The academic tool hub links to services such as Overleaf, Zotero, Mendeley, LanguageTool, Grammarly, Consensus, Elicit, SciSpace, Undermind, ResearchRabbit, Connected Papers, Semantic Scholar, OpenAlex, Crossref, DBLP, arXiv, IEEE Xplore and ORCID. These links do not imply embedded APIs, account federation or manuscript sharing. Uploading to those external services is a separate user action.

## 16 Conferences and opportunities

Conference records contain title, domain, location, dates/deadline, description, source/verification information and official URL where available. Users can search and filter the catalog, save an event, set a personal status and record a planned budget. Bookmark states are saved, preparing, submitted, accepted and rejected. These states are user-maintained tracking, not decisions fetched from a conference organizer.

The “upcoming” conference API filter checks submission deadline rather than event date. An event can still be upcoming while its call for papers is closed. Read the official schedule before interpreting the state. Imported CONFS.TECH events and the supplied conference records retain source information. ConferenceAlert Bangladesh is an external destination; the app does not claim an unrestricted automated scraping integration.

Opportunity records include title, type, description, eligibility, funding, deadline and source link. Users save an opportunity into a personal application tracker and maintain notes and saved/preparing/submitted/successful/unsuccessful status. Actual applications take place on the official external site. Recording submitted in Publixia does not send an application.

Dates and employment/funding conditions may change. The content-pack records were checked at their recorded source dates, not continuously certified. Some sources are vacancy-list pages rather than fully enriched individual position pages. The implementation does not automatically send opportunity-deadline reminders; the scheduled reminder job currently covers tasks and bookmarked conference deadlines.

## 17 Notifications and email delivery

### 17.1 Events and recipients

| Event | Notification recipient |
|---|---|
| Account verification or password reset | Account concerned |
| Project member added | Added account |
| Task assigned or reassigned | Selected assignee |
| Task marked done | Project owner |
| Project feedback added | Project owner |
| Manuscript submitted | Accounts listed as assigned journal staff |
| Manuscript status changed | Manuscript owner |
| Review invitation | Invited reviewer |
| Invitation accepted or declined | Inviting editor |
| Review submitted | Inviting editor |
| AI pre-check ready | Report owner |
| Task due within the next 24 hours | Project owner |
| Bookmarked conference deadline within 24 hours | Bookmark owner |
| Administrator announcement | Active users selected by the broadcast operation |

Notifications are persisted with recipient, category, title, body, link, read/archive flags and email delivery state. The notification document is also the email outbox job. Event keys support idempotent creation for reminders and prepared setup notices. An in-app notice can exist even if email is skipped or fails.

Users open Notifications, mark individual notices read/unread, mark all read or archive a notice. Read state does not cancel an already queued email. The test-email action targets the signed-in user's own verified real address and is rate-limited to one per minute.

### 17.2 Queue behavior

The worker runs at startup and every 15 seconds while enabled. It atomically leases a pending job for two minutes, increments its attempt count, sends through SMTP and records the result. Stale leases can be reclaimed. Retryable failures return to pending with exponential delay capped at one hour; five failed attempts exhaust the job into failed. Administrator can retry eligible failed jobs.

Email states are pending, processing, sent, failed and skipped. A sent state means the SMTP server accepted at least one recipient, not confirmed inbox delivery or opening. Check spam filtering and recipient inbox separately. Errors are sanitized to avoid exposing transport credentials.

Eligible optional email requires an active, non-demo account, verified address and email notifications enabled. Transactional account messages have their own verification/preference exceptions. Disabling optional email does not delete in-app notices. The six workspace setup briefings were deliberately created as in-app-only skipped-email records.

The hourly reminder scan starts with the server and covers the next 24 hours. Task reminders currently notify the owner, not necessarily the assignee. Reminder event keys include record and deadline so repeated scans do not repeatedly create the same notice. Server downtime means no scanning or sending during that period.

## 18 Administrator operations and audit

Administration shows counts for users, journals, manuscripts and projects; AI success/failure usage; email queue totals; recent audit entries; and non-secret availability of configured integrations. Configuration indicators do not prove that a live upstream request currently succeeds.

Users & roles lets an Administrator search accounts, assign the six permitted roles and set active state. The endpoint requires at least one role, prevents editing one's own privileges through that action, increments the edited user's token version and records an audit event. Retired Student/Author/Instructor values are rejected.

Journal management creates internal journal profiles and assigns eligible staff. AI criteria and imports manages screening criteria versions, provider synchronization and import history. Email delivery exposes job states and retries. Announcements persist per-user notices and eligible email jobs; sending a broadcast is an external communication action and should be done intentionally.

Activity History shows recorded actions within the viewer's scope. A regular user sees their own instrumented actions. Editors and Publishers also see activity for their assigned journal and manuscript IDs. Administrator sees platform audit activity. The log is not a recording of every click, every field edit or every external service event.

The application does not provide a web console for editing SMTP passwords, Gemini keys, MongoDB credentials, operating-system security or backups. Those are server/environment operations. There is no general content-moderation queue or configurable arbitrary permission-builder UI beyond the implemented role and journal assignment controls.

## 19 Connected classroom demonstration

### 19.1 Prepared workspace

The six-account setup contains the project “Explainable phishing detection: evidence and reporting protocol,” owned by the Researcher with the Supervisor as a member. Eight tasks span board states and have responsibilities assigned. The journal is “Publixia Research Practice and Methods,” with the Editor and Publisher assigned. Volume 1, Issue 1 is titled “Research protocols and transparent reporting.”

Each account's recorded setup includes 14 papers, three working documents, three course enrollments, three conference bookmarks, two opportunity trackers and three in-app briefings. These counts come from setup and verification artifacts; users may have changed their records since then. No claim is made that enrollment equals completed study.

| Prepared manuscript | Starting state | Demonstration purpose |
|---|---|---|
| PX-CLASS-01 | draft with an upload | Complete live submission-to-publication walkthrough |
| PX-CLASS-02 | screening with invitation | Accept or decline a review invitation |
| PX-CLASS-03 | under_review with accepted invitation | Submit a report |
| PX-CLASS-04 | revision with prepared report | Upload a revised version and response |
| PX-CLASS-05 | proofreading with prepared report | Select an issue and publish |

Prepared review examples and initial state histories identify their teaching origin. The protocol manuscripts do not assert measured experimental results. These examples are not evidence that independent scientific peer review was completed by real people. New actions performed during the presentation persist as ordinary workflow changes.

### 19.2 Demonstrate the same paper end to end

1. Sign in as Researcher. Show the library, writing documents, project plan and assigned tasks.
2. Sign in as Supervisor. Open the assigned project, assign a task to the owner and add feedback. Return to Researcher to show the notification and saved change.
3. As Researcher, open PX-CLASS-01 and Documents & versions. Show the existing text upload, then click Submit to journal.
4. As Editor, open the new submission, record Screening with a note, select Rock Levi and a future deadline, and send the review invitation.
5. As Reviewer, open Peer review and accept the invitation. Inspect the source manuscript.
6. As Editor, move the manuscript to Under review after acceptance of the invitation.
7. As Reviewer, submit the four scores, recommendation, author comments and confidential comments. Evaluate only the content actually present.
8. As Editor, read the report and record Accepted with an explanation, or choose Revision to demonstrate that branch. Show that a recommendation alone did not make the decision.
9. As Researcher, inspect the decision notice and released author-facing feedback. Confidential editorial comments remain unavailable.
10. As Publisher, advance Copyediting, Typesetting and Proofreading, then select the matching issue and publish. Leave DOI empty unless a genuinely registered identifier exists.
11. Open the public article through the journal directory. As Administrator, show staffing, single-role accounts, audit entries, criteria and notification delivery states.

For a revision branch, use PX-CLASS-04: download its text, make a revision, upload the new file with a point-by-point response, and resubmit. The editor then opens a new round for the new version. For a shorter session, use different prepared cases at their existing stages and explicitly explain that they are separate cases.

With the simplified Researcher sidebar, reach AI Lab, Academy, detailed plan or other preserved modules through an existing link or a saved route listed in section 3. No new sidebar item is required. Switching roles requires sign-out/sign-in or separate browser profiles. Keep the server running and verify recipient email addresses before attempting an inbox demonstration.

## 20 Architecture and code organization

The browser runs React components and React Router. The api helper sends same-origin requests with cookies, serializes JSON or multipart form data, and converts failed responses into visible errors. Shared context manages the current user, load state and toast notifications. The shell supplies navigation, mobile open/close behavior, notifications and the active-project selector.

Express mounts authentication, author-workspace, governance, intelligence, AI, community, publishing and research routers under /api. Each router applies validation and resource authorization. Mongoose models persist records in MongoDB. Services isolate external AI, scholarly retrieval, document extraction and notification delivery. Jobs handle periodic reminders. The server serves the built frontend from dist and falls back to the SPA entry for browser routes.

| Location | Responsibility |
|---|---|
| frontend/src/main.jsx | Route definitions, protected/public shell selection and error boundary |
| frontend/src/components.jsx | Shared controls, shell and role-specific navigation |
| frontend/src/pages | Feature pages for publishing, research, AI, community, governance and author workspace |
| frontend/src/content | Supplied handbook content |
| frontend/src/styles.css | Existing responsive visual system |
| backend/app.js and server.js | API assembly, validation/error handling, static frontend and worker lifecycle |
| backend/config | Environment loading, startup requirements and database connection |
| backend/middleware/auth.js | Session validation and role helpers |
| backend/routes | Feature endpoints and business rules |
| backend/models/index.js | Core schemas, references and indexes |
| backend/services | Access, discovery, Gemini, files and SMTP services |
| backend/jobs/reminders.js | Scheduled task/conference reminder scan |
| backend/seed and scripts | Setup, migration, imports, verification and packaging utilities |
| tests | Isolated integration and discovery tests |
| uploads | Private original manuscript files |
| docs | System guides, source verification reports and recorded checks |
| deliverables | Configured/private and shareable source archives |

The package declares React 19, Vite 8, Express 5, Mongoose 9, Zod 4, bcryptjs, jsonwebtoken, nodemailer, the Google GenAI SDK, document extraction/export libraries and test utilities. The lockfile controls installed versions. The Node engine requirement is at least 22.12. This describes the repository's declarations, not a recommendation to install unverified newer releases.

## 21 Data model and relationships

| Entity | Key contents and relationship |
|---|---|
| User | Identity, password hash, roles, academic status, profile, active/verification flags, tokenVersion and activeProject |
| AuthToken | Hashed verification/reset token, user, purpose and expiry |
| Journal | Profile, guidelines, source metadata, internal/external flag and assigned staff IDs |
| Manuscript | Unique code, journal, owner, declarations, status, current version, history, issue and optional DOI |
| Version | Manuscript, version number, original file location/metadata, extracted text and response |
| Assignment | Manuscript, reviewer, inviting editor, deadline, round and invitation/review state |
| Review | Unique assignment, manuscript, reviewer, recommendation, scores and separated comments |
| Issue | Journal, volume, number, title and optional publication metadata |
| Screening | Owned report tied to a manuscript version, criteria/context snapshot and correction decisions |
| Project | Owner, members, objectives, domain, status, due date, plan and feedback |
| Task | Project, assignee, title, state, priority, due date and milestone flag |
| Paper | Owned citation metadata and literature notes |
| Document | Owned draft with plain content and optional structured workspace/history |
| Conversation | Owned assistant selection and message history with explicitly selected evidence IDs |
| AIUsage | User, feature, model, token count when supplied, success and failure code |
| Course and Enrollment | Lesson/quiz definitions and per-user progress/attempts |
| Conference and Bookmark | Event metadata and a user's saved status/budget |
| Opportunity and Application | Vacancy/funding metadata and a user's application status/notes |
| Notification | Recipient, event key, notice content, reading flags and embedded email job |
| Audit | Actor, action, resource type, resource ID and timestamps |
| ResearchRecord and ImportRun | Normalized provider metadata and synchronization outcomes |
| EvaluationCriteria | Versioned domain instructions, weights, depth, publication state and author |
| CuratedRecord and SourceFollow | Supplied source record/provenance and private followed-profile relationships |

Important uniqueness constraints include user email, manuscript code, manuscript/version number, manuscript/reviewer/round, one Review per Assignment, journal/volume/issue, owner/course enrollment, owner/conference bookmark, owner/opportunity application, notification event key and provider/external-record identity. Core schemas use timestamps and optimistic concurrency where configured. Object IDs are references, not public access tokens.

Transactions are used for operations such as saving a review and completing its assignment together, and deleting a project with its tasks. The database must support transactions; Atlas or an appropriate replica set does so. A standalone local MongoDB configuration may fail these operations.

## 22 API conventions and limits

All application API paths use /api. Browser page URLs are separate routes. Most mutations accept JSON; manuscript version upload is multipart form data with one file. Authentication uses the session cookie rather than an API key supplied in browser JavaScript.

Zod validates request fields, enumerations and IDs. Unknown role/privilege fields are not accepted through ordinary profile/registration schemas. Search text is escaped before regular-expression matching where implemented. The common helper supports page and limit, but not every endpoint exposes a paginated UI.

The global API limiter is 300 requests per minute per client according to the configured middleware. Authentication endpoints use 30 requests per 15 minutes. AI endpoints use a per-user ten-per-minute limiter. These are application limits in addition to any provider quotas.

| Status | Typical meaning |
|---|---|
| 200 or 201 | Successful read/update or creation |
| 400 | Invalid input, invalid file, missing prerequisite data or unsupported enum |
| 401 | Missing, expired, inactive or invalidated session |
| 403 | Wrong role, ownership, assignment or context-sharing permission |
| 404 | Missing record or a private record not found within the user's scope |
| 409 | Duplicate key, illegal workflow transition, stale version or conflicting corrections |
| 429 | Application/provider request limit |
| 502 | Invalid/empty upstream response in relevant paths |
| 503 | Database unavailable or external provider unavailable/configuration failure |

The health route reports whether MongoDB is connected. Other data routes return service-unavailable errors while disconnected. Unexpected server errors are sanitized for the browser rather than exposing internal stack traces or credentials. The API inventory appended to this manual is extracted from the current route source files.

## 23 Security and privacy controls

Passwords are hashed with bcrypt; the configured cost in normal registration/reset is 12. Sessions use HS256-signed JWTs stored in HttpOnly cookies, SameSite Lax, with secure cookies in production. Token versions invalidate sessions after reset or access changes. Helmet applies security headers and a self-origin content policy with the explicitly configured style allowance.

Mutating API requests check supplied Origin against allowed application origins and reject cross-site fetch requests. This is the implemented origin/SameSite approach; the system does not claim a separate synchronizer CSRF token mechanism. Do not describe it as a security audit or penetration-test certification.

Resource checks cover ownership, project membership, journal assignment and review assignment. Uploaded originals are served through authorized downloads. Review confidentiality is handled separately from public article visibility. AI context is selected explicitly and source ownership is validated before sharing.

There is no implemented MFA, SSO, end-to-end encryption, comprehensive antivirus scanning or automated security-incident console. The short classroom passwords and service configuration are suitable only to the intended controlled presentation setup; production hardening is a separate deployment responsibility. Keep .env, PRIVATE files and the configured archive out of public repositories.

## 24 Installation and operating procedures

### 24.1 Start the configured local installation

Extract the private ZIP to a writable folder. It includes dist, the environment configuration, documentation and selected prepared manuscript uploads. The database is the configured remote Atlas database; a ZIP is not a database dump.

For a fresh extraction, run the following commands from the extracted application folder:

```powershell
npm ci
npm start
```

For the existing workspace, stop an older server with Ctrl+C, then run:

```powershell
Set-Location E:\project\Publixia
npm start
```

Open http://localhost:4000. The alternative START-WINDOWS.cmd installs dependencies when needed and starts the bundled frontend/backend. Keep the console open while presenting. Rebuild after frontend changes with npm run build. Development uses npm run dev, with Vite at localhost:5173 proxying API requests to port 4000.

### 24.2 Configuration reference

| Variable | Purpose |
|---|---|
| NODE_ENV | production enables production cookie/startup conditions |
| PORT | Local API/web port; default 4000 |
| APP_URL | Application origin and base for notification links |
| MONGODB_URI | MongoDB connection URI; required |
| JWT_SECRET | Session signing secret; at least 32 characters |
| GEMINI_API_KEY | Server-side Gemini credential |
| GEMINI_MODEL | Requested model; code default is gemini-3.5-flash, which must be available to the configured account |
| SMTP_HOST, SMTP_PORT, SMTP_SECURE | SMTP server and connection settings |
| SMTP_USER, SMTP_PASS | SMTP authentication; keep secret |
| EMAIL_FROM | Sender identity actually read by the application; SMTP_FROM is not the current code's setting name |
| UPLOAD_DIR | Original-file directory; defaults to uploads |
| EMAIL_WORKER_ENABLED | Setting false disables the email worker; it does not disable the reminder scan |
| OPENALEX_API_KEY | Optional credential included in OpenAlex requests when configured |
| ADMIN_PASSWORD and DEMO_PASSWORD | Setup/seed inputs used by the relevant utilities |

Production startup requires an HTTPS APP_URL. The provided server still binds to loopback; public hosting requires deliberate reverse proxy, TLS, process supervision, storage and database-access configuration. Changing APP_URL alone is not deployment.

### 24.3 Maintenance commands

| Command or script | Intended purpose and caution |
|---|---|
| npm run build | Build frontend assets into dist |
| npm test | Run isolated integration/discovery tests; does not validate every external service live |
| npm run check:services | Inspect configured external-service connectivity; use intentionally |
| npm run db:indexes | Database index utility; inspect before use against a populated database |
| npm run setup:admin | Create/configure initial Administrator using environment inputs |
| npm run seed | Insert general seed data; not needed to view the configured database |
| node scripts/migrate-six-roles.js | Idempotent legacy-role migration with local role backup and session invalidation |
| node scripts/import-author-pack.js | Fetch/check supplied source records and upsert curated/journal metadata |
| node scripts/populate-author-workspaces.js | Add starter library records and update supplied courses/events/opportunities |
| node scripts/setup-presentation-team.js | Establish six single-role accounts and insert missing classroom starting records |
| node scripts/setup-team.js | Older setup utility that can queue/send setup emails; do not run as a harmless refresh |
| npm run package | Build shareable and configured archives from existing files; build frontend first |

Do not rerun setup scripts simply to demonstrate a page. Some utilities update configuration, roles or shared content. The presentation insertion script preserves later workflow progress and is not a reset button. The sidebar update required none of these database operations.

### 24.4 Backup and recovery

A complete operational backup needs the MongoDB data, private upload files and securely stored environment configuration. Restoring database references without their upload files leaves downloads broken. The configured ZIP includes the five prepared presentation uploads, not an exhaustive backup of every user-uploaded manuscript. Use the maintained local upload directory or an appropriate storage backup for the rest.

The source ZIP excludes .env, private credential files and private upload content. The private ZIP includes the configured service credentials and selected presentation material; share it only with authorized project operators. Neither archive automatically installs a public server, configures Atlas access for another network or guarantees upstream service availability.

## 25 Troubleshooting

| Symptom | Check and action |
|---|---|
| npm ci reports EPERM unlink on Windows | Stop the old Node server using that project and close tools holding native modules, then retry; do not keep starting from a partially installed node_modules |
| mongoose or another dependency cannot be found | Resolve the failed installation first, then rerun npm ci and npm start |
| Port already in use | Stop the previous Publixia process or deliberately change PORT and related URL/proxy settings |
| MongoDB unavailable | Check network, Atlas cluster status, credentials, IP access list and DNS; no browser-only workaround restores persistence |
| Session invalid after migration or role change | Sign out, refresh and sign in again; old token versions are intentionally rejected |
| New sidebar not visible | Confirm a single Researcher role, rebuild dist if needed, restart/refresh the correct installation and avoid a stale browser asset cache |
| Removed feature missing from sidebar | Its route remains; use the preserved route reference. Removal is not deletion of its data or component |
| Invitation accepted but review form unavailable | Editor must set under_review, and the assignment round must match the current manuscript version |
| Acceptance rejected | A completed human review of the current version and valid state are required |
| Revision resubmission rejected | Upload a new version after the revision decision and provide the response |
| Final publication rejected | Use assigned Publisher/Administrator, proofreading state and an issue from the same journal |
| AI request fails | Check key/model availability, quota, provider response and server configuration; saved prior work remains available |
| Correction export conflicts | Undo overlapping accepted replacements and retry |
| Manuscript extraction fails | Use a valid supported file with readable text; OCR scanned PDFs externally |
| Email job skipped | Inspect active/demo/verification/preference eligibility; setup briefings were intentionally in-app only |
| Email marked sent but not in inbox | SMTP acceptance is not inbox proof; check spam and recipient filtering |
| Notification link fails on another computer | localhost points to the computer opening the link; use the presenter machine or a deliberately hosted APP_URL |
| Studio save conflict | Reload current saved state and reconcile edits before saving; do not blindly overwrite |
| Source deadline or profile seems wrong | Consult the linked official source and recorded retrieval date; imported metadata is not continuously certified |

## 26 Validation and current limitations

The latest stored presentation test report records 33 passing automated tests. It covers account/session behavior, role boundaries, project ownership, task assignments, notification creation, journal staff restrictions, manuscript transitions, review confidentiality, revisions, screening corrections, source ownership, document revisions, courses, trackers, email retries and service errors. The stored six-account check records successful logins, one role each and readable dashboard/document/notification endpoints.

Those results predate this navigation-only change and are reported as stored evidence, not as a new live end-to-end test on 14 November. For the sidebar change, the production build passed, exact ten-link order and existing route mappings were checked, and original navigation configuration was verified for the other five roles and a mixed-role account. Hash comparison found only components.jsx and Community.jsx changed among application source/scripts/tests at that point. Backend, schemas, route definitions, seed files and CSS were unchanged. No database operations were executed for this update.

The browser tool timed out during visual verification. Therefore this update does not claim a completed browser walkthrough, responsive screenshot review or fresh logged-in manuscript operation test. The code retains the same mobile classes, sidebar styling and active-project component. The build reports a main-bundle size advisory, not a build failure.

Known functional limits include no automated external journal submission, DOI registration, payments, comprehensive content moderation, rich production typesetting, collaborative real-time document editing, certificate issuance, automatic full-text verification, automated empirical experiments, complete all-action audit logging or universal external-provider API coverage. Administrative model criteria affect screening prompts, not model training. Prepared classroom records are teaching starting points, not proof of real-world publication acceptance.

## 27 Sidebar change record

The requested update was restricted to Researcher-only navigation and relocation of its activity link. Application source files changed: frontend/src/components.jsx and frontend/src/pages/Community.jsx. Built dist files were regenerated. Documentation and delivery artifacts are separate outputs of the requested system-document task.

The ten links follow the requested WORKSPACE, PUBLISH & GROW and ACCOUNT order. Research planner maps to the existing project destination; Research library to the existing library; Help & guidelines to the existing FAQ/scope page; Opportunities to its existing page. Separate primary entries for study design, research evidence/discovery, handbook, FAQ, tool hub, AI Lab, Academy, conferences, researcher directory and activity history were removed or represented under those primary labels. Activity is reachable from the existing profile page. No replacement interface was created for hidden features.

All old routes, controllers, components, API operations, authentication and role checks remain. Other actors and mixed-role accounts use the previous menu configuration. The active-project selector remains intact. Seed data, database IDs, relationships, users, journals, manuscripts and other records were not changed. This is the final behavior documented here.

## 28 Glossary and implementation evidence

| Term | Meaning in Publixia |
|---|---|
| Manuscript | A submitted or draft scholarly document tracked through editorial states |
| Version | One stored uploaded file and its extracted text |
| Author | The owner of a manuscript; not a separate account role |
| Review round | Assignment cycle tied to a manuscript version number |
| Screening | Preliminary AI language/structure assistance, distinct from human peer review |
| Issue | A journal's volume/number grouping used for publication |
| DOI | Externally registered persistent publication identifier; the app can store but not register one |
| Evidence matrix | Comparative notes about source methods, findings and limitations |
| Source verification | A recorded check with a stated scope, not blanket validation of scientific claims |
| Outbox | Persistent notification email jobs awaiting or recording delivery |
| Academic status | Self-described study/professional stage without privilege implications |
| Journal assignment | Staff membership that combines with account role to authorize journal actions |
| Active project | A selected accessible project used for planning and optional context |

This manual was prepared from the route definitions, model schemas, access middleware, service code, frontend components, package scripts and saved verification artifacts in the current workspace. Principal references are backend/routes, backend/models/index.js, backend/services/access.js, backend/services/ai.js, backend/services/notifications.js, backend/jobs/reminders.js, frontend/src/main.jsx, frontend/src/components.jsx, and docs/presentation-tests.txt. Older actor documents may contain superseded nine-role descriptions; this six-role manual and the current source supersede them.

The following appendices list the API endpoints and source-snapshot details extracted during preparation. They support maintenance and assessment without disclosing service secrets.




## 29 API endpoint inventory

Extracted from the current route source. Each path includes its /api mount prefix. Authentication and resource scope are described in the corresponding workflow sections; listing an endpoint does not make it public. Dynamic :id values are database record identifiers.

### Account and profile

| Method | Full API path |
|---|---|
| POST | /api/auth/register |
| POST | /api/auth/login |
| POST | /api/auth/logout |
| GET | /api/auth/me |
| PATCH | /api/auth/me |
| POST | /api/auth/forgot-password |
| POST | /api/auth/resend-verification |
| POST | /api/auth/verify-email |
| POST | /api/auth/reset-password |

### Author workspace and curated sources

| Method | Full API path |
|---|---|
| GET | /api/author/catalog |
| GET | /api/research/discover |
| GET | /api/author/following |
| PUT | /api/author/catalog/:id/follow |
| GET | /api/author/context |
| PUT | /api/author/context |
| PUT | /api/author/documents/:id |
| GET | /api/author/projects/:id/plan |
| PUT | /api/author/projects/:id/plan |
| POST | /api/author/catalog/:id/save |

### Journal governance and activity

| Method | Full API path |
|---|---|
| GET | /api/governance/journals |
| POST | /api/governance/journals |
| PATCH | /api/governance/journals/:id |
| GET | /api/governance/activity |

### Discovery and authority criteria

| Method | Full API path |
|---|---|
| GET | /api/intelligence/bangladesh |
| GET | /api/intelligence/domains |
| GET | /api/intelligence/search |
| GET | /api/intelligence/records |
| GET | /api/intelligence/context |
| POST | /api/intelligence/save |
| GET | /api/intelligence/criteria |
| POST | /api/intelligence/criteria |
| POST | /api/intelligence/sync |
| GET | /api/intelligence/imports |

### AI conversations and manuscript screening

| Method | Full API path |
|---|---|
| GET | /api/ai/assistants |
| GET | /api/ai/conversations |
| POST | /api/ai/conversations |
| GET | /api/ai/conversations/:id |
| PATCH | /api/ai/conversations/:id |
| DELETE | /api/ai/conversations/:id |
| POST | /api/ai/conversations/:id/messages |
| POST | /api/ai/screening |
| GET | /api/ai/screening |
| GET | /api/ai/screening/:id |
| PATCH | /api/ai/screening/:id/issues/:issue |
| GET | /api/ai/screening/:id/export |

### Projects library and documents

| Method | Full API path |
|---|---|
| GET | /api/projects |
| POST | /api/projects |
| GET | /api/projects/:id |
| PATCH | /api/projects/:id |
| DELETE | /api/projects/:id |
| POST | /api/projects/:id/tasks |
| PATCH | /api/tasks/:id |
| DELETE | /api/tasks/:id |
| POST | /api/projects/:id/members |
| DELETE | /api/projects/:id/members/:member |
| POST | /api/projects/:id/feedback |
| GET | /api/papers/search |
| GET | /api/papers |
| POST | /api/papers |
| PATCH | /api/papers/:id |
| DELETE | /api/papers/:id |
| GET | /api/papers/:id/citation |
| GET | /api/researchers |
| GET | /api/documents |
| POST | /api/documents |
| GET | /api/documents/:id |
| PATCH | /api/documents/:id |
| DELETE | /api/documents/:id |
| GET | /api/documents/:id/export |

### Journal editorial and publication

| Method | Full API path |
|---|---|
| GET | /api/journals |
| GET | /api/journals/:id |
| GET | /api/articles/:id |
| GET | /api/manuscripts |
| POST | /api/manuscripts |
| GET | /api/manuscripts/:id |
| POST | /api/manuscripts/:id/versions |
| GET | /api/manuscripts/:id/versions/:version/download |
| POST | /api/manuscripts/:id/status |
| GET | /api/reviewers |
| POST | /api/manuscripts/:id/assignments |
| PATCH | /api/assignments/:id |
| POST | /api/assignments/:id/review |
| GET | /api/issues |
| POST | /api/issues |

### Learning tracking notifications and administration

| Method | Full API path |
|---|---|
| GET | /api/catalog/stats |
| GET | /api/courses |
| GET | /api/conferences |
| GET | /api/opportunities |
| GET | /api/enrollments |
| POST | /api/courses/:id/enroll |
| POST | /api/courses/:id/lessons/:lesson/complete |
| GET | /api/bookmarks |
| POST | /api/bookmarks |
| PATCH | /api/bookmarks/:id |
| DELETE | /api/bookmarks/:id |
| GET | /api/applications |
| POST | /api/applications |
| PATCH | /api/applications/:id |
| GET | /api/notifications |
| POST | /api/notifications/read-all |
| PATCH | /api/notifications/:id |
| POST | /api/notifications/test-email |
| GET | /api/dashboard |
| GET | /api/admin/overview |
| GET | /api/admin/users |
| PATCH | /api/admin/users/:id |
| POST | /api/admin/notifications/:id/retry |
| GET | /api/admin/email |
| POST | /api/admin/announcements |

### Service health

| Method | Full API path |
|---|---|
| GET | /api/health |

## 30 Document control and verification record

Edition date: 14 November 2026. Scope: current local implementation plus the requested Researcher sidebar cleanup. The latest stored regression report contains 33 passing tests. No database or external service was modified to prepare this edition.

Navigation checks confirmed the exact ten Researcher destinations, all ten existing route mappings, and reuse of the original configuration for Supervisor, Reviewer, Editor, Publisher, Administrator and a Researcher plus Editor account. The production build completed successfully with a bundle-size advisory. Browser verification timed out and is not claimed.

| Source file | SHA256 prefix for this edition |
|---|---|
| frontend/src/components.jsx | e9a8b97acaf57bee10a7 |
| frontend/src/pages/Community.jsx | e7de23ba48d247c53a77 |
| frontend/src/main.jsx | 77f2c6abe193e65fd489 |
| backend/models/index.js | b54f14b34da38362cb6e |
| backend/services/access.js | 832d2841b4b966550454 |

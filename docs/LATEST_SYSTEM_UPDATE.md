# PUBLIXIA — five connected workspaces

Updated 15 November 2026. This report supersedes the six-role descriptions and sidebar instructions in older documents, including the previous complete system manual. The latest final MVP brief takes precedence over the earlier enterprise architecture brief.

## Actors and navigation

| Actor | Sidebar destinations | Responsibility |
|---|---|---|
| Author / Researcher | Overview, Research Planner, Research Library, Writing Studio, Journal Directory, My Manuscripts, Profile & Settings | Own research and manuscripts; guidance, tasks and feedback in projects where they are members |
| Reviewer | Overview, Review Invitations, My Reviews, Review History, Profile & Settings | Own invitations, accepted assignments, saved drafts and submitted reports |
| Editor | Overview, Submission Queue, Reviewer Assignments, Decision Center, Assigned Journals, Profile & Settings | Assigned-journal screening, invitations, review assessment, explicit decisions and acceptance handoff |
| Publisher | Overview, Production Queue, Author Proofs, Published Articles, Profile & Settings | Accepted, handed-off manuscripts in assigned journals; production, proofs, issues and publication |
| Administrator | Dashboard, User & Role Management, Journal Management, Audit & System Settings, Profile & Settings | Accounts, roles, journal staffing/policies, AI criteria, delivery and audit |

Notifications remain in the top bar and Profile & Settings. Activity history is in Profile & Settings. Existing research modules and source records remain available; the compact primary navigation excludes conferences, opportunities, Academy, social discovery and standalone AI Lab. Study design is linked from Planner; evidence discovery from Library; writing assistance is inside Studio; pre-check is available from manuscript preparation. The original module routes are preserved for the Researcher workspace.

Existing multi-role accounts may switch only among their authorized workspaces. Selecting a workspace never grants a role. The five presentation identities remain single-role accounts. The former Supervisor account is an additional Researcher and retains its project membership.

## State and access rules

Manuscript editorialStatus, productionStatus and publicationStatus are separate persisted fields. Review assignment status is a fourth independent state. Legacy status is retained for old records and compatibility; it is not the authoritative production workflow. For example, a paper remains editorially accepted while production is copyediting and publication is not_published.

Only an assigned Editor can accept or reject; an author's own editorial role cannot decide their manuscript. Journal policy configures required completed reviews and single-blind, double-blind or open review. Acceptance checks the required number of completed assignments for the current version. Recommendations do not decide outcomes.

Acceptance freezes the accepted version and records a handoff on the same manuscript. Publishers cannot access papers before handoff, change editorial decisions or read confidential reviews. For older already-accepted records, an Editor explicitly hands off the accepted version using the manuscript page. Existing history is retained.

Double-blind review blocks original manuscript downloads and requires an Editor-supplied anonymized file. The Editor must remove identifiers from the uploaded document and its metadata; automatic anonymization is not claimed. Reviewers cannot download files before accepting or outside their assigned version. They see their own submitted report, not other reviewers' reports. Confidential comments are released to the assigned Editor, never to the Author or Publisher. Administrator operational inspection requires an explicit reason and creates an audit record; it does not grant editorial or publication actions or return confidential reports.

## Connected presentation: approximately 15 minutes

1. **Researcher:** Open a project, its plan and task board. Show library sources and Writing Studio. Save/export a manuscript. In My Manuscripts, create a draft, choose an internal active journal, complete metadata and declarations, upload the document, and Submit to journal. Existing PX-CLASS-01 can be used if it is still a draft.
2. **Editor:** Open Submission Queue and the same manuscript. Record Screening. Complete and save all four initial-screening checks. Invite a registered Reviewer with future response and review deadlines. For double-blind journals, upload an anonymized manuscript file.
3. **Reviewer:** In Review Invitations, confirm no conflict and accept. The invitation moves to My Reviews.
4. **Editor:** Move the manuscript to Under review after acceptance of the invitation and completion of screening checks.
5. **Reviewer:** Open the assigned manuscript, inspect permitted files and fill in the four scores, recommendation, author comments and confidential comments. Save draft, resume, then submit. Submitted reports are locked.
6. **Editor:** Open Decision Center, read the report and request minor/major revision with a decision letter. The Author receives notification and permitted feedback.
7. **Researcher:** Upload a revised version with a point-by-point response and resubmit. Original versions remain available. The Editor repeats screening and the required current-version reviews, then explicitly accepts with a decision letter.
8. **Publisher:** The same accepted manuscript appears in Production Queue. Move through Copyediting and Typesetting, upload a formatted production document, then move to Proof preparation. Upload the proof and Send proof to Author.
9. **Researcher:** Open My Manuscripts, download the exact proof and record approval or request corrections. If corrections are requested, the Publisher uploads a new proof and sends it for another explicit approval.
10. **Publisher:** After approval, select or create the issue, enter optional DOI metadata, confirm all quality checks and publish. The public article uses the approved proof text. DOI entry is shown as provided metadata, not successful registration.
11. **Administrator:** Show five role choices, existing accounts, journal staff and review policy, activity history and delivery status. This account does not accept manuscripts or publish articles.

Email uses the existing SMTP outbox. Submission notifies the Author and assigned Editors; invitation responses and review reports notify the Editor; acceptance notifies Author and Publishers; proofs notify Author; proof responses notify Publishers; publication notifies Author and Editors. SMTP acceptance is not proof of inbox delivery.

## Accounts and running

The five presentation accounts are Researcher labibafnanbb2004@gmail.com, Reviewer rocklevi96@gmail.com, Editor amdadboss11@gmail.com, Publisher mimma9087mim@gmail.com and Administrator amdadulhaque1203@gmail.com. The former Supervisor amdadul019710@gmail.com is now another Researcher with its existing project relationship. Passwords were not changed; see the private credentials files in the configured archive.

Stop an older running server with Ctrl+C. From E:\project\Publixia run `npm start` and open http://localhost:4000. Sign out and sign back in after role migration. For a fresh extraction, run `npm ci` first. Do not reseed. The archive connects to the existing Atlas database; it is not a database backup.

## Implementation and verification

Reused authentication, manuscript/version models, journal staff relationships, document extraction/storage, AI integrations, notifications/outbox, project tools and shared UI components. Added five role navigation policies, distinct dashboards, review queues/drafts, assignment management, screening checklist, production files, author proofs, quality checks and separate workflow state fields.

Principal changed files: shared/workspaces.js; frontend/src/navigation.js, context.jsx, components.jsx, main.jsx, styles.css and pages Dashboard, Publishing, Community, Governance, Research, AuthorWorkspace; backend/models/index.js, routes publishing/community/research/author/ai/governance, services access/workspaces; scripts/package.js. New files include frontend Workflow.jsx and WritingAssistant.jsx; backend workflow.js, editorial.js and lifecycle.js; scripts/migrate-five-roles.js and workspace tests.

New APIs include review-assignments, editorial/assignments, assignment draft and manage actions, screening-checklist, handoff, manuscript files/downloads, production transitions, proof send/respond and audited administrative operational reads. Existing submission, version, review, decision, issue and notification APIs remain connected.

Automated results are in five-role-workflow-tests.txt. The tests run against an isolated MongoDB replica set, not Atlas, and cover the connected lifecycle, revision preservation, proof approval gate, confidentiality, role restrictions and prior research functionality. The production build passes with a bundle-size advisory. A fresh browser walkthrough and live external-provider/email-delivery checks are not claimed for this update.

The requested identity migration changed role labels on two existing accounts, incremented their session versions and recorded audit events. A pre-migration role backup is stored locally. It did not replace users, manuscript IDs, project memberships, journal relationships or seed files. No database reset or reseeding was performed. No invented literature or successful DOI registrations were added. Existing sourced research records remain intact.

Limitations: production formatting is a human file-upload process; DOI registration is not integrated; blind files require human anonymization; native figure editing is not added to Writing Studio. Historical six-role setup scripts are retained for reference and should not be rerun. The updated migration is idempotent. Live presentation actions intentionally persist and can queue email; tests do not demonstrate that a recipient opened an email.

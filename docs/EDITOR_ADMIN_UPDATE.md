# Editor and Administrator update — 15 November 2026

## Scope and preservation

Inspected the five role policies, navigation, dashboards, publishing and workflow APIs, journal governance, account management, notifications, models, original seed scripts and Atlas record counts. Reused the existing workflow and permissions. No workflow state machine, authentication mechanism, role model or database schema was changed. Original seed files and existing manuscript contents, credentials, IDs, reports and versions were preserved.

Author, Reviewer and Publisher navigation and page functionality were retained. Shared dashboard and assignment components contain Editor/Admin-only additions. Existing handoffs, notification functions and confidentiality checks remain in place.

## Improvements

- Editor: searchable submission and decision tables with journal/status filters and date sorting; ID search; current-version review counts; links to the existing manuscript actions and confidential report view; clickable overview metrics; assignment, decision and activity previews.
- Reviewer Assignments: four actual assignment counts, journal and invitation dates, existing reviewer search, and existing remind/extend/cancel actions. Overdue is calculated from dates and open assignment state.
- Administrator: searchable user list with role/status filters, registration dates, journal memberships, account suspension/reactivation and confirmation before access changes. Journal membership management opens the existing journal editor.
- Journal listing: registered and external journals, scopes, ISSNs, availability, assigned staff and submission counts, alongside the existing form. Supplied duplicate ISSNs are rejected on create/edit; existing records are not rewritten.
- Services: live database ping with verification time; Gemini and SMTP explicitly display configuration separately from unverified connectivity. No credentials are exposed. No test email was sent.

## Additive data

The database already had 46 users, 21 journals, 85 manuscripts and 74 review reports. These totals exceeded the requested manuscript/journal targets, so no journals were recreated and the old manuscripts were reused.

Added six fictional classroom reviewer accounts, bringing the reviewer total to eight. Emails use example.test; passwords are hashed and the accounts cannot send email. Existing user passwords were not changed.

Added six specifically identified classroom cases, PX-SUP-001 through PX-SUP-006, to fill missing modern decision/handoff examples: two under review, one accepted and queued, one awaiting author proof, and two published protocol articles. They contain six versions, seven assignments, six reports, three proof files and one issue. One assignment is overdue. The cases have dataset identifiers and explicit teaching provenance; they do not claim empirical findings, registered DOIs or actual independent scientific certification. Fictional academic accounts are used for their authorship, reviews and editorial decisions.

Added the presentation Editor/Publisher to three existing journal staff lists, preserving the original staff. The presentation Editor now has five assigned journals and 31 visible manuscript records including drafts (the operational submission queue excludes drafts). A supplemental fictional Editor was also added to the teaching journal to make its prepared decisions referentially consistent. A repeat-run limit issue was corrected, excess supplemental memberships were reverted to their prior scope, and correction events were retained in the audit log.

Final totals: 52 users, 21 journals, 91 manuscripts and 80 reports. Existing content was not replaced. The new scenario file paths are included in the configured ZIP's existing upload manifest.

## Repeat-run safety

`node scripts/supplement-editor-admin.js` is the separate supplemental process. It does not run the original seed. It uses stable email addresses, manuscript codes, existing unique version/assignment/report keys and find-before-insert/setOnInsert operations. It never resets progressed scenario states. Journal memberships use addToSet. Repeating the completed script created zero records and added zero memberships. See editor-admin-supplement-summary.json and the first-run reports for counts.

## APIs and files

New scoped read APIs: `/api/operations/editor`, `/users`, `/journals`, `/services` under the operations prefix. They reuse the existing models and journal authorization.

Backend changes: app.js mounts operations.js; community.js adds meaningful administrative counts; governance.js validates duplicate supplied ISSNs; workflow.js includes journal names in Editor assignment results. No model/schema changes were needed.

Frontend changes: EditorOperations.jsx, AdminUsers.jsx and ServiceHealth.jsx; Editor routes in main.jsx; Editor/Admin branches of Dashboard.jsx; existing administrator area in Community.jsx; journal listing in Governance.jsx; Editor assignment summary in Workflow.jsx. New scripts: supplement-editor-admin.js and check-editor-admin.js. Integration tests were extended.

## Verification and limits

Production build passed with the existing bundle-size advisory. Automated results are in editor-admin-tests.txt and include the complete submission/revision/acceptance/proof/publication regression, role boundaries, confidentiality and scoped operational lists. Live Atlas GET checks returned 200 for the six Editor/Admin list/service endpoints. All six supplemental scenarios passed relationship checks for users, journals, manuscript versions, assignments/reports, acceptance/handoff and approved-proof publication records. The live checks did not send mail or operate the submission workflow on original records.

No fresh browser visual walkthrough is claimed. SMTP and Gemini connectivity remain explicitly unverified in the UI; only the database is pinged live. Legacy prepared publications retain their original history and are not retroactively certified against the newer proof workflow. The six supplemental cases supply the newer connected examples. Native user-profile editing beyond roles/status is still handled by the account owner; Administrator does not impersonate them. The journal list uses existing ISSN and staff fields rather than adding new eISSN or publisher schemas.

Restart the local server and refresh the browser to load the update. Use the existing Editor and Administrator credentials. Do not run old reset/setup scripts.

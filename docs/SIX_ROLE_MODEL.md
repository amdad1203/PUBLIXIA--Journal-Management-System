# Publixia: six-role access model

Updated 8 November 2026. This document supersedes older role descriptions in the original project guides.

The six account roles are **Researcher, Supervisor, Reviewer, Editor, Publisher and Administrator**. Student, Author and Instructor are no longer assignable roles. Existing Student and Author accounts have been merged into Researcher. Former Instructor accounts also become Researcher; Academy remains available to every signed-in user.

Academic status is a separate profile field: undergraduate, postgraduate, independent researcher, faculty, academic author or other. Users can set it during registration or in Profile & preferences. Changing academic status never grants extra permissions. New accounts receive only Researcher. Administrators can assign additional responsibilities; one person can hold several of the six roles.

## Responsibilities and access

| Role | Implemented responsibility | Boundary |
|---|---|---|
| Researcher | Learn, discover and save papers, plan research, create projects, write, submit and revise manuscripts | Personal library/documents and owned manuscripts; projects require ownership or membership |
| Supervisor | Read assigned projects, edit research plans, manage tasks and provide feedback | Must be a project member; cannot create a project without also being a Researcher, or delete another person's project |
| Reviewer | Accept/decline invitations and submit reports and recommendations | Requires an individual manuscript assignment; cannot review their own manuscript |
| Editor | Screen submissions, assign reviewers, make decisions and advance production | Must be assigned to the journal; cannot execute final publication without Publisher or Administrator role |
| Publisher | Manage assigned journal details, production stages, issues and final publication | Cannot assign reviewers or make acceptance/rejection decisions without Editor or Administrator role |
| Administrator | Manage accounts and roles, journals and journal staff, inspect platform activity, manage email jobs and announcements, configure AI criteria and imports | Service secrets and server configuration remain environment settings; there is no web editor for credentials or an operating-system administration console |

AI Lab, private libraries, Writing Studio, Academy and personal trackers remain available to every signed-in account. Authorship describes a relationship to a manuscript, not a seventh role: any account may submit its own work and revise its own manuscript. Researcher and Supervisor accounts may also receive a peer-review assignment. A review recommendation never automatically becomes an editorial decision.

Project creation requires Researcher or Administrator. Researcher members can participate in shared tasks and feedback; the owner controls membership and project details. An assigned Supervisor can edit the plan and contribute tasks and feedback. Administrators have project oversight. Users without Researcher, Supervisor or Administrator do not receive project menus or project access merely from an editorial/reviewing title.

Journal management appears for Editor, Publisher and Administrator. Editors and publishers can edit the profile of their assigned journals. Administrators can create journals and assign active editorial/publishing staff. External journal entries remain external; editing their directory metadata does not connect Publixia to that publisher's submission system.

Activity history shows a user's own recorded audit actions. Journal staff additionally see recorded activity for their assigned journals and manuscripts. Administrators see platform audit activity. This is an audit of instrumented actions, not a recording of every click. Personal manuscript ownership, reviewer confidentiality and private-library isolation remain enforced.

## Account migration

All 46 existing accounts were migrated without deleting or merging account identities. Email addresses, passwords, projects, manuscripts and papers were preserved. Legacy addresses containing `author`, `student` or `instructor` still work, but now have Researcher permissions. Passwords remain `12345` as previously requested. See `PRIVATE_ALL_CREDENTIALS.md` in the private archive.

The migration invalidated older sessions so users must sign in again. Original role assignments were backed up locally in `.local-data/roles-before-six-role-migration.json`. The idempotent migration is `node scripts/migrate-six-roles.js`; run it when applying this code to an older database. Seed/setup scripts use the new role model.

## Verification and deployment

32 automated tests passed. Coverage includes rejection of retired role labels, profile privilege protection, project restrictions, supervisor collaboration, publisher/editor separation, journal-assignment boundaries and private activity history. Production build passed, with the existing bundle-size advisory. Visual browser verification remains unavailable because the local browser tool could not initialise.

Restart the existing server with Ctrl+C followed by `npm start`, refresh the page and sign in again. The configured ZIP includes the built frontend and updated private credentials list.

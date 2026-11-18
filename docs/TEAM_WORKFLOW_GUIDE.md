> Updated role model: see [SIX_ROLE_MODEL.md](SIX_ROLE_MODEL.md). Student, Author and Instructor account roles have been retired; academic status is now a profile field. Older role descriptions below are historical.

# Team presentation workflow

Private account passwords are in PRIVATE_TEAM_CREDENTIALS.md in the configured archive. They are Publixia login passwords, not email-account passwords.

Each of the five team addresses received one setup email accepted by Gmail SMTP. Inbox placement is not confirmed by SMTP acceptance. Each recipient should open their verification link on the presenter computer running Publixia at http://localhost:4000. Localhost is not remotely accessible from another person's computer. After verification, workflow events can send regular notification emails.

## Roles and sequence

1. Author opens Publixia Research Methods, creates a manuscript, uploads the team's actual PDF/DOCX/TXT and submits. The editor and publisher have journal access and receive submission notifications.
2. Editor moves the submission to screening and invites the team reviewer with a future due date. The reviewer receives an invitation email.
3. Reviewer accepts; editor receives the response and moves the manuscript to under review.
4. Reviewer submits scores and author-facing comments. Editor receives notice, then records a decision. The author receives the decision email.
5. For revision, author uploads a new version and a point-by-point response, then resubmits.
6. After a completed human review and acceptance, publisher advances copyediting, typesetting and proofreading, creates/selects a journal issue and publishes. Do not assign an unregistered DOI as if it were registered.
7. Admin opens AI criteria and imports to publish evaluation standards; email delivery history shows pending, sent, failed or skipped states.

AI screening retains consent and author review of corrections. Literature/citation/proposal assistants now receive relevant public source metadata from the database; personal project and paper context still requires the context checkbox. The methodology guidance was improved after inspecting a live Gemini response. The captured response is in AI_LIVE_RESPONSE.md.

## Source events

74 distinct upcoming events were retrieved from CONFS.TECH's open JSON feed. Each has a direct organizer URL and source attribution. Conference Alert Bangladesh opens directly from the conference hub. Its separate API requires a provider key, so no automated HTML harvesting or unconfigured integration is represented as active. Old generated records remain in storage but are excluded from public discovery.

26 automated tests passed; team login checks passed for all five accounts. Build and ZIP checks completed. This does not establish production hosting or guarantee inbox delivery or an evaluation score.

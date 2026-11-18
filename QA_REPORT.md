# Final verification report

Date: 6 November 2026 (Asia/Dhaka).
Environment: Windows, Node.js 24.22.0, npm 11.19.1. Application database: the supplied MongoDB Atlas `publixia` database. Automated tests: isolated temporary MongoDB 8.2.3 replica set.

## Executed results

| Check                       | Observed result                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production frontend         | `npm run build` passed                                                                                                                                                                        |
| Automated integration suite | 21 passed, 0 failed, 0 skipped; see `docs/test-results.txt`                                                                                                                                   |
| Dependency security audit   | `npm audit` reported 0 vulnerabilities                                                                                                                                                        |
| Atlas connection            | Connected and database ping succeeded                                                                                                                                                         |
| Atlas indexes               | `npm run db:indexes` succeeded without removing existing data/indexes                                                                                                                         |
| Seed                        | Repeatable seed completed; second run preserved the baseline record counts                                                                                                                    |
| Gemini diagnostics          | `gemini-3.5-flash` returned a successful live response                                                                                                                                        |
| Chat UI                     | Real Gemini answer displayed for a reproducible literature-search question; conversation persisted                                                                                            |
| Live pre-check              | Temporary synthetic TXT uploaded privately, Atlas record persisted, Gemini structured report returned one anchored correction, accepted-correction DOCX and PDF exports returned successfully |
| Gmail SMTP                  | TLS/authentication verification passed                                                                                                                                                        |
| Notification delivery       | One setup notification to the supplied sender/admin address accepted by Gmail SMTP on the first attempt; stored `sent` state                                                                  |
| Browser sign-in             | Seeded researcher login succeeded on both development and built frontend                                                                                                                      |
| Browser navigation          | All 12 main workspace destinations rendered their expected page headings                                                                                                                      |
| Browser persistence         | Created a project, added a milestone task, moved it to Done, reloaded, and observed the saved Done state; temporary QA project subsequently removed                                           |
| Responsive dashboard        | Inspected at 1440 × 1000 and 390 × 844 viewport settings; mobile document width equaled viewport width, without horizontal overflow                                                           |
| Production frontend console | No error entries associated with the built frontend origin during the verified navigation and project workflow                                                                                |

SMTP acceptance is not independent confirmation of inbox placement. The email recipient was the user's own configured administrator/sender; no test was sent to external third-party recipients or synthetic users.

## Archive and discovery checks

Additional delivery checks: live Crossref search returned 20 metadata records. Both ZIPs were opened and their required files verified. The source archive was scanned against the configured secret values. The private archive was extracted to a temporary folder and started against Atlas; its frontend, public journal API, and unauthenticated private-API rejection all passed. This extraction check reused the locked workspace dependencies rather than performing a second standalone dependency installation.

The extraction check exposed a static index-path issue when the project lived under a directory beginning with a dot. The index is now served relative to its explicit static root; the extracted package was retested successfully.

## Automated coverage

1. Public catalogs and protected endpoints.
2. Registration, password hashing, safe default roles and verification outbox.
3. One-use verification/reset tokens and session invalidation.
4. Cross-origin request rejection and role escalation denial.
5. Expired JWT rejection and disabled production demo login.
6. Manuscript creation, missing upload validation, private upload/download and ownership checks.
7. Journal-scoped editors, legal state transitions, reviewer invitation/acceptance/review.
8. Revision version/response requirements, human review, production stages, publisher-only publication.
9. Saved AI chat and conversation isolation.
10. Isolation of confidential comments between assigned reviewers.
11. Screening consent, source-anchored corrections, original preservation, binary DOCX and PDF outputs.
12. Non-cascading corrections and overlap rejection.
13. Missing Gemini configuration, transient retry and credential failure behavior.
14. Project/task/milestone/team/feedback persistence and permissions.
15. Library, citations and document studio persistence/export/ownership.
16. Server-side quiz grading and course completion.
17. Conference and opportunity tracking; idempotent reminders.
18. Notifications, read-all, preference suppression, concurrent worker claims and retry success.
19. Invalid PDF/DOCX/text rejection.
20. Five-attempt email exhaustion and stale-lease recovery.
21. Explicit database-disconnected 503 behavior.

The automated suite injects deterministic AI/SMTP test doubles. Live Google/Gmail checks are separately identified above. No mocked result is represented as a live-provider success.

## Review findings resolved

- Corrected the initial missing-upload 500 error and verified a 400 validation response.
- Corrected browser effect cleanup and dev root-reuse issues, then verified the built application separately.
- Removed archive dependencies with advisories; selected a clean archive library and retained the lockfile.
- Added public catalog access, explicit screening scope, inaccessible closed mobile navigation, disabled production demo access and current-version review requirements.
- Fixed binary parsers in export tests and verified file signatures, rather than only HTTP status.

## Verification boundaries

There was no load/stress test, comprehensive accessibility audit, external penetration test, domain deployment, inbox/spam placement verification, or cross-browser matrix. PDF/DOCX extraction supports text documents; difficult scientific layouts and scanned PDFs require separate validation. The screenshot and browser checks cover representative views, not every possible form/input combination.

See `PROJECT_STATUS.md` for advanced master-spec features that are not implemented. These are not claimed as complete or simulated by decorative controls.

# Evaluation evidence and presentation plan

The uploaded rubric totals 40 marks: completeness 5, UI/UX 6, JavaScript/JSON/Fetch/async 12, MongoDB 5, integration/validation 5, code quality/testing 3, presentation 4. This is an evidence map, not a self-awarded score.

| Criterion | Working evidence | Remaining assessment |
| --- | --- | --- |
| Problem and completeness 5 | Existing publication, project, library, Academy and notification workflows preserved. Discovery, FAQ, research scope, tool hub and authority criteria added. | The extended development brief also requests OAI harvesting, many more providers, vacancy ingestion and production tools. Those remain beyond this increment. Full brief parity is not claimed. |
| UI and responsiveness 6 | Existing shell retained; new routes use its fields, panels and buttons. Discovery grid wraps and controls stack; FAQ is searchable and expandable. | Desktop/tablet/mobile visual and keyboard review still required for the new pages. |
| JavaScript and async 12 | React form state, fetch JSON, paginated search, live provider selection, loading/error/empty states, criteria save/load, imports, personal context and library saving. | Demonstrate the new interactions live, including an upstream failure and empty results. |
| MongoDB 5 | 400 API-sourced records plus 10 attributed ranking entries persisted. Composite source/ID uniqueness, upserts, import logs, immutable criteria versions and report snapshots. Existing CRUD tests pass. | Show records remain after restart; external records are separate from member accounts and manuscripts. |
| Integration and validation 5 | Four successful HTTP providers; server Zod validation; administrator-only imports/criteria; owner-only library and manuscript actions. | Providers requiring additional credentials and unimplemented feeds must not be shown as active. |
| Quality and tests 3 | 25 automated tests pass after correcting public-route authentication. Provider normalization and failure tests added. Code split into service, router, page and migration scripts. | Automated AI tests use an injected provider; no new live Gemini quality benchmark or load test was performed. |
| Presentation 4 | Use the ordered walkthrough below and actual DB/import logs. | Awarded by examiner after presentation. |

## Suggested demonstration

1. Explain the problem: discover evidence, organize research, prepare a manuscript and obtain accountable feedback.
2. Open FAQ; search DOI, expand the answer, choose Cybersecurity under Scope.
3. Search live OpenAlex publications. Switch to researchers and Bangladesh; show original source links and retrieval dates. Explain rankings separately from identity verification.
4. Sign in as admin; import a query. Show import history and the same records in imported database mode. Save a publication to the personal library.
5. Publish a domain-specific criterion. Load an earlier version as a new draft to explain rollback without changing history.
6. As author, upload a manuscript, consent and screen it. Show the criteria snapshot and approve a correction. Follow author/editor/reviewer/publisher roles through the existing workflow.
7. Show invalid input, access denial, persistent tasks, and test results. Explain which external links are directories versus live integrations.

The final grade cannot be guaranteed. Do not claim 40/40 or that all requirements of the extended brief are complete.

> Updated role model: see [SIX_ROLE_MODEL.md](SIX_ROLE_MODEL.md). Student, Author and Instructor account roles have been retired; academic status is now a profile field. Older role descriptions below are historical.

# Author workspace update — 8 November 2026

## Accounts and data

The supplied author content is available throughout the existing Publixia application. All 46 existing active accounts received the 14 source-pack publications in **My Library**, under **Starter reading list**. Existing private notes and records were preserved: the import only inserts missing DOI/URL records.

For an author walkthrough, sign in as `labibafnanbb2004@gmail.com`, password `12345`. The test author is `author@demo.publixia.test`, password `12345`. For administration use `amdadul019710@gmail.com`, password `12345`. The private distribution includes `PRIVATE_ALL_CREDENTIALS.md` with all 46 accounts and roles. Application passwords are separate from Gmail, MongoDB and API credentials.

Shared content includes 14 publication records, eight researcher profiles, seven external journals, five opportunities and three conferences. Six practical Research Academy lessons with exercises and separately graded quizzes were added. Existing courses and event records remain available.

## Author walkthrough

1. Open **Projects**, create or choose your project, then select it in the **Active project** bar.
2. Open **Research plan**. Save the nine modules covering the question, evidence, contribution, methods, ethics, analysis, feasibility and dissemination.
3. Open **Research evidence and communities**. Switch between publications, researchers, journals, opportunities and conferences. Inspect original sources and verification notes. Compare up to three records; save publications; follow researcher profiles or copy source links. A follow is a private saved relationship, not an email subscription to that external researcher.
4. Open **My Library** to inspect the starter reading list and edit your own evidence notes and literature matrix. Imported notes retain their source-pack attribution.
5. Open **Writing Studio**. Choose one of nine academic templates, enter a working title and create a structured draft. An active project's question and method plan seed relevant sections. Save the newly created outline.
6. Use the outline to edit a section and set its status. In **Evidence**, insert a citation from your own saved library. In **Experiments**, record data, methods, observed findings and limitations, then link the result to a section.
7. Save changes. **History** retains up to 20 previous snapshots; restore a snapshot as an editable draft and save to make a new revision. Concurrent stale saves are rejected rather than silently overwriting changes. The classic editor remains available for older unstructured documents.
8. Review **Readiness**, save and export DOCX. The export contains section text and a linked-reference list. Create a manuscript and upload the file before using the existing AI pre-check and editorial workflow.
9. In **AI Lab**, select one of ten assistants. Enable context sharing to include project planning and library evidence; choose specific sources if needed. Save a useful response as a separate Studio draft for human review. AI output never automatically overwrites a manuscript.
10. Use **Research Academy**, **Academic tool hub**, **Research guide and FAQ**, and **Author workspace handbook** for practical guidance. External journal submissions and job applications continue on their official websites; local trackers record your own progress.

## Implementation and persistence

Plans are stored in Project records; the selected project is stored on the account. Structured modules, citations, experiment links and revision history are stored in Document records. Source metadata is stored in CuratedRecord; library imports are owned Paper records. Researcher follows are private SourceFollow records. AI conversation messages retain explicitly selected evidence IDs. Existing manuscript versions, editorial decisions, screening reports, course progress, bookmarks and application trackers retain their existing persistence and permissions.

New API routes:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/author/catalog?kind=publications` | Public source records; also researchers, journals, opportunities, conferences |
| GET | `/api/research/discover` | Compatibility route for live provider discovery |
| GET / PUT | `/api/author/context` | Read or select an accessible project |
| GET / PUT | `/api/author/projects/:id/plan` | Read a shared plan; only the project owner can edit |
| PUT | `/api/author/documents/:id` | Save owned modules with revision and evidence validation |
| POST | `/api/author/catalog/:id/save` | Import a publication into the signed-in account's library |
| GET | `/api/author/following` | Read your followed researcher records |
| PUT | `/api/author/catalog/:id/follow` | Follow or unfollow a researcher record |

AI messages accept up to 20 `sourceIds` when `includeContext` is true. Foreign evidence IDs are rejected. The existing document API is used for saving a reviewed AI response as a new draft.

## Data provenance and limits

DOI publication metadata was retrieved from Crossref where available. A DOI match validates the bibliographic record, not the paper's methodology or findings. Detailed methods, reported results and limitations supplied in the pack are reading annotations and require checking against the original full text. Source-page reachability and identity checks are recorded separately in `AUTHOR_SOURCE_CHECKS.json`.

Some profiles and journal policies still require manual enrichment. The Data Science and Management page returned HTTP 403 during retrieval. The Gothenburg opportunity uses an official vacancy-list source; its individual project details and supervisor relationship are not independently certified. Fees, vacancies and submission deadlines may change. No acceptance rate, review duration or performance metric is invented.

OpenAlex, Crossref, Europe PMC and DataCite retain the existing live discovery integrations. The compatibility discovery endpoint uses those providers. Other tools and services in the hub are explicitly external links, not implemented API integrations. External journal records cannot accept an internal Publixia submission.

The Studio supports text modules, bibliography links and experiment records. It does not provide a rich-text figure upload/layout system, automated statistical validation, automatic DOI registration or automatic submission to external publishers. DOCX export is text-based. Readiness states and AI feedback are advisory. The handbook includes planning and reporting guidance beyond the currently automated features.

## Verification

- All **30 automated tests passed**, including four new author-workspace integration scenarios. Output: `author-workspace-tests.txt`.
- Production frontend build passed. Vite reported a bundle-size advisory for the main JavaScript chunk.
- Live Atlas checks returned HTTP 200 for health, the Studio entry page, publication/researcher catalogs, journals and courses. Author login succeeded and returned all 14 starter papers.
- Import completed for 46 account libraries, five opportunities, three conferences and six courses. Re-running it does not overwrite existing private paper notes.
- Visual browser testing could not run: the browser tool failed to initialise its local assets. No claim of a completed visual check is made for this update.
- No additional team emails were sent as part of this update. Automated email tests use an isolated database and a test transport.

## Run the updated application

Stop the old server with Ctrl+C in its terminal, then run from the project directory:

```powershell
Set-Location E:\project\Publixia
npm start
```

Open `http://localhost:4000` and refresh the page. The ZIP includes the built frontend; existing installed dependencies need no reinstall. For a fresh extraction, run `npm ci` first. If Windows reports an EPERM file lock, stop the old Node process using that project before reinstalling dependencies.

The supplied Atlas database is already populated. To import into another configured database:

```powershell
node scripts/import-author-pack.js
node scripts/populate-author-workspaces.js
```

The second command adds the reading list to existing active users; create those users first. Review and refresh date-sensitive source records before using a later import. The private archive contains service credentials and must remain private; use the source archive for sharing code.

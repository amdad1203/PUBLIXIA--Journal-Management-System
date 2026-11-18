# Researcher sidebar update — 14 November 2026

Author responsibilities belong to the merged Researcher role. This navigation update applies only to accounts whose sole role is Researcher. Other roles and mixed-role accounts retain their existing menus.

## Application files changed

- `frontend/src/components.jsx`: conditional flat sidebar configuration, matching page-title lookup, and removal of duplicate footer navigation for Researcher.
- `frontend/src/pages/Community.jsx`: Activity history link in the existing Researcher Account settings page.

The production `dist` files were rebuilt. Documentation and ZIP artifacts were refreshed separately.

## Exact sidebar

| Group | Label | Existing destination |
|---|---|---|
| WORKSPACE | Overview | /dashboard |
| WORKSPACE | Research planner | /projects |
| WORKSPACE | Research library | /research |
| WORKSPACE | Writing studio | /studio |
| PUBLISH & GROW | Journal directory | /journals |
| PUBLISH & GROW | My manuscripts | /manuscripts |
| PUBLISH & GROW | Manuscript pre-check | /screening |
| PUBLISH & GROW | Opportunities | /opportunities |
| PUBLISH & GROW | Help & guidelines | /guide |
| ACCOUNT | Account settings | /settings |

Study design, research evidence, discovery, handbook, tool hub, AI Lab, Academy, conferences and researcher-directory entries are no longer separate Researcher sidebar items. FAQ and research scope now uses the Help & guidelines label. Activity history is available from Account settings at its existing `/activity` route.

This is navigation consolidation only. It does not claim that hidden modules were rebuilt inside other pages. Their original routes and components remain available. No replacement pages, nested menus, tabs or secondary navigation systems were introduced.

## Preservation and verification

- Production build: passed; Vite reported a bundle-size advisory.
- Configuration checks: exactly ten links in the requested order, with all destinations present in the existing route table.
- Role isolation checks: Supervisor, Reviewer, Editor, Publisher, Administrator and a Researcher-plus-Editor account reuse the original navigation configuration.
- Source hash comparison: only the two application files above changed among the captured frontend, backend, scripts and tests. Seed files, schemas, route definitions and CSS were unchanged.
- Existing logo, icons, sidebar classes, responsive behavior and Active Project component were retained. No manuscript or research operation was rewritten.
- No database writes, reseeding, migrations, account changes or email sends were performed for this update. Existing records and relationships were left untouched.
- Browser verification could not complete because the browser tool timed out. Therefore fresh login/click-through, mobile visual checks, Active Project interaction and manuscript-operation checks are not claimed. The previous stored full test report remains historical evidence, not a new browser test.

The complete system manual documents the current workflows and preserved routes: `PUBLIXIA_Complete_System_Documentation.docx`.

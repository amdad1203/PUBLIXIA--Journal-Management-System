# Research and criteria API additions

Public GET routes:

- `/api/intelligence/search`: provider (openalex/crossref/europepmc/datacite), kind (works/authors/sources/institutions/topics for OpenAlex), q, page, country (BD for OpenAlex authors). Calls the actual provider.
- `/api/intelligence/records`: paginated persisted metadata. Same provider/kind/query selection; 20 records/page.
- `/api/intelligence/bangladesh`: attributed TOPSCINET ranking entries.
- `/api/intelligence/domains`: supported research-area navigation.

Authenticated routes:

- `GET /api/intelligence/context`: current user's interests, affiliation and accessible projects.
- `POST /api/intelligence/save`: `{record: ObjectId}` saves an imported work in the current user's library.

Admin routes:

- `POST /api/intelligence/sync`: query parameters as JSON; persists normalized source metadata and an import log.
- `GET /api/intelligence/imports`: recent import success/failure history.
- `GET /api/intelligence/criteria`: criteria history.
- `POST /api/intelligence/criteria`: name, domain, instructions, depth, weights, published. Creates a new version; loading and republishing an earlier version is the rollback mechanism.

OPENALEX_API_KEY is optional and server-side. Provider calls have timeouts and explicit 503 errors. URLs are fixed to supported providers; users cannot supply arbitrary outbound endpoints. Live search does not persist automatically. External tool directory entries are links, not active integrations.

Semantic Scholar, CORE, OpenAIRE, ORCID, arXiv, DOAJ, Unpaywall, DBLP, ROR, OAI-PMH, conference feeds and vacancy feeds are not implemented by this increment. They must not be represented as tested integrations.

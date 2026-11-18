# Publixia architecture

React/Vite serves the existing workspace and new public discovery, guide and tool pages. The browser calls same-origin Express JSON routes with session cookies. Express validates input and checks role/ownership before MongoDB operations. Gemini remains behind the server; SMTP credentials remain server-side.

The discovery service normalizes public metadata from OpenAlex, Crossref, Europe PMC and DataCite. Live search reads the provider; administrator synchronization upserts normalized ResearchRecord documents using provider and external ID. ImportRun records capture successful and failed synchronization attempts. Public academic profiles never create User login accounts. Public imports never create editorial Manuscript records.

EvaluationCriteria versions are append-only through the API. The latest published version for the applicable domain is selected, with general fallback. Screening stores a criteria snapshot and user/project context with the generated report. The core integrity rules and correction output schema remain controlled by application code. Criteria are evaluation guidance, not access to a model's hidden reasoning.

Existing collections and permissions remain. ContentRevisionBackups preserve text before terminology refinement. Original uploaded files remain unchanged. See docs/API.md for existing workflows and API_INTEGRATIONS.md for additions.

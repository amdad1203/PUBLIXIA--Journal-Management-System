# Verification results

7 November 2026: `npm test` passed all 25 tests with zero failures. Full output: docs/upgrade-test-results.txt. This covers existing authentication, editorial state transitions, uploads, confidentiality, projects, library, courses, notifications and email behavior, plus new criteria authorization/version preservation, provider JSON normalization and provider failure handling.

The first run exposed public catalog authentication regressions because the new router's authentication middleware was too broad. Restricting it to `/intelligence` resolved all three failures. The subsequent complete run passed.

Live imports called OpenAlex, Crossref, Europe PMC and DataCite and saved their responses in Atlas. Import history retains the outcomes. API fixture tests do not substitute for those live import results. No notification or announcement was sent as part of this upgrade.

Production build passed. Browser visual checks at desktop/tablet/mobile sizes and new live Gemini output quality evaluation remain unperformed; no evidence for those is claimed.

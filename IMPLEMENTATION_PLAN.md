# Publixia implementation plan

The supplied workspace was empty on inspection. Build a coherent JavaScript application from the attached specifications, with Gemini, Atlas and email as priorities.

1. Infrastructure: React/Vite, Express, Mongoose models, validation, secure session cookies, roles and resource permissions.
2. Integrations: centralized official Gemini SDK, persistent email outbox with retries, Atlas connection and diagnostic command. Keep secrets in ignored environment configuration.
3. Publishing: journals, private manuscript uploads, version history, author submission, reviewer invitations and review, editorial decisions, production and public articles.
4. Research: persistent projects/tasks/milestones/team feedback, Crossref discovery and saved literature, AI conversations and screening with approved corrections and exports.
5. Learning and discovery: courses/lessons/quizzes/progress, conference bookmarks/tracking, opportunities, document studio.
6. Interface: responsive deep-blue/white/pink design, shared navigation, actionable dashboard, notification center, profile and administration.
7. Verification: isolated MongoDB integration tests, live service diagnostics, production build and browser inspection; record actual results and limitations.
8. Delivery: documented source ZIP and private configured ZIP, setup commands, API reference, progress and QA reports.

Email delivery requires sender/SMTP credentials, requested from the user. Do not report mail delivered until SMTP confirms acceptance. Synthetic examples must be labeled; no invented live research, DOI registrations or AI output.

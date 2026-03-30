# AI Instructions for rc_ryan_fu

## How AI Helped
- Initialized the project structure and dependencies.
- Wrote tests first (TDD) and implemented the matching functionality.
- Handled environmental setup issues (ESM vs CommonJS, `uuid` versioning).
- Implemented core logic for notification dispatching and retries.

## Suggestions Rejected
- **External Message Brokers**: I initially considered suggesting Redis or RabbitMQ for the queue, but rejected it to keep the MVP "minimal and clean" as requested. An in-memory Map was used instead.
- **Complex Persistence**: I avoided adding a database layer (like SQLite or MongoDB) to maintain simplicity, though it's noted as a trade-off in README.md.

## Human-made Decisions (via Prompt)
- **TDD Requirement**: The strict "test first" mandate drove the development workflow.
- **Project Scope**: The focus on "At Least Once" delivery and handling external API variability was directly from the prompt.
- **Stack**: TypeScript/Node.js was chosen for its reliability and type safety.
- **Language**: English for all project artifacts was a core requirement.

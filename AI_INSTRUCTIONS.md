# AI Instructions

## AI Help Summary

This project was implemented with Claude Code assistance following strict TDD (Red-Green-Refactor) methodology.

### AI Contributions
- **Architecture design**: Component separation (model, queue, retry, worker, app) for testability and single responsibility.
- **TDD guidance**: Tests written before implementation for every component. Each test suite verified RED (failing) before implementation, then GREEN (passing).
- **Retry pattern**: Exponential backoff implementation with configurable parameters.
- **Dependency decisions**: Chose `crypto.randomUUID()` over `uuid` package (ESM compatibility issues with Jest/ts-jest), built-in `fetch` over `axios`.

### Key Technical Decisions Made with AI Assistance
1. **In-memory over persistent storage**: Deliberate MVP scoping. Queue and store use native JS data structures (Array + Map) for zero infrastructure dependencies.
2. **Separate queue + store**: The queue (Array) handles FIFO ordering for delivery; the store (Map) enables O(1) status lookups. Notifications exist in both.
3. **Worker as polling loop**: `setInterval`-based processing. Simple, testable, no event-driven complexity for MVP.
4. **Express app factory pattern**: `createApp()` returns a fresh app instance, enabling isolated test suites with supertest.

## Rejected AI Suggestions
- **Database integration (PostgreSQL/Redis)**: Rejected for MVP scope. In-memory is sufficient for demonstrating the pattern.
- **Message broker (RabbitMQ/Kafka)**: Over-engineering for an internal notification system MVP.
- **UUID v7 (time-ordered)**: Not needed; simple random UUIDs are sufficient for this use case.
- **Jitter in backoff**: Adds complexity without significant benefit at MVP scale.

## Human-Driven Decisions
- **TDD methodology**: Required by project specification; all tests written before implementation.
- **TypeScript + Express + Jest stack**: Specified in project requirements.
- **At-least-once delivery guarantee**: Specified in project requirements.
- **Atomic commit strategy**: Required by project specification; each TDD step committed separately.
- **English-only codebase**: All code, comments, documentation, and commit messages in English as specified.

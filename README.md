# Internal API Notification System (rc_ryan_fu)

## Overview
A reliable service for internal systems to send notifications to external providers.

## Architecture
- **API Entry**: Receives requests and validates them.
- **Queue/Store**: Temporarily holds notifications for delivery.
- **Dispatcher**: Handles the actual delivery to external providers with retry logic.
- **Storage (Persistence)**: Ensures "At Least Once" delivery by tracking state.

## Engineering Decisions
- **TypeScript**: For type safety and better developer experience.
- **Express**: Lightweight HTTP server.
- **In-memory Queue (for MVP)**: To keep it minimal, but designed with an interface for easy replacement (e.g., Redis/RabbitMQ).
- **At Least Once**: Achieved by retrying until success or max attempts.

## Trade-offs
- Using an in-memory store for the MVP means data is lost on restart. In production, this would be backed by a database or persistent queue.

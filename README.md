# Internal API Notification System

An internal webhook notification system with at-least-once delivery guarantees, built with TypeScript, Express, and Jest.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  POST /notify│────▶│ NotificationQueue │────▶│ DeliveryWorker  │
│  (Express)   │     │  (In-Memory)     │     │ (fetch + retry) │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │
       │              ┌──────┴──────┐
       │              │ Store (Map) │
       │              └──────┬──────┘
       │                     │
┌──────┴──────┐     ┌───────┴───────┐
│GET /status/:id│───▶│ Lookup by ID  │
└─────────────┘     └───────────────┘
```

### Components

- **Notification Model** (`src/models/notification.ts`): Defines the notification structure, statuses (PENDING, DELIVERED, RETRYING, FAILED), and validation.
- **NotificationQueue** (`src/queue/notification-queue.ts`): FIFO in-memory queue with a Map-based store for O(1) lookups by ID. Supports enqueue, dequeue, and requeue for at-least-once delivery.
- **Retry Logic** (`src/delivery/retry.ts`): Exponential backoff (base * 2^attempt) capped at a configurable max delay. Configurable max retry count.
- **DeliveryWorker** (`src/delivery/worker.ts`): Dequeues notifications, POSTs payloads to target URLs, handles success/failure, and requeues for retry on failure.
- **Express App** (`src/app.ts`): REST API with `POST /notify`, `GET /status/:id`, and `GET /health` endpoints.

## API Endpoints

### POST /notify
Create a new notification.

**Request:**
```json
{
  "type": "order.created",
  "targetUrl": "https://example.com/webhook",
  "body": { "orderId": "123", "amount": 99.99 }
}
```

**Response (201):**
```json
{ "id": "uuid", "status": "PENDING" }
```

### GET /status/:id
Check notification delivery status.

**Response (200):**
```json
{
  "id": "uuid",
  "type": "order.created",
  "status": "DELIVERED",
  "attempt": 1,
  "createdAt": "2026-03-30T...",
  "updatedAt": "2026-03-30T..."
}
```

### GET /health
Health check endpoint.

## Engineering Decisions

| Decision | Rationale |
|---|---|
| **In-memory queue** | MVP scope: fast iteration, no infrastructure dependencies. Trade-off: data lost on restart. |
| **Exponential backoff** | Prevents overwhelming failing targets. Base 1s, cap 30s, max 5 retries. |
| **At-least-once delivery** | Failed deliveries are requeued. Duplicates possible but acceptable for notification use case. |
| **`crypto.randomUUID()`** | Built-in Node.js, no external dependency needed for UUID generation. |
| **Express 5** | Latest stable Express version with improved routing and async support. |
| **Fetch API** | Built into Node.js 18+, no need for axios/node-fetch. |

## Trade-offs

| What we solve (MVP) | What we don't solve |
|---|---|
| HTTP webhook delivery | Persistent storage (Redis, DB) |
| Retry with exponential backoff | Jitter in backoff calculation |
| Status tracking per notification | Authentication/authorization |
| Input validation | Rate limiting |
| At-least-once delivery | Exactly-once delivery |
| Health check endpoint | Metrics/monitoring dashboard |

## Running

```bash
npm install
npm run dev      # Start development server
npm test         # Run tests
npm run build    # Compile TypeScript
npm start        # Run compiled server
```

import { DeliveryWorker } from "./worker";
import { NotificationQueue } from "../queue/notification-queue";
import { createNotification, NotificationStatus } from "../models/notification";
import http from "http";

describe("DeliveryWorker", () => {
  let queue: NotificationQueue;
  let worker: DeliveryWorker;
  let mockServer: http.Server;
  let serverPort: number;
  let receivedRequests: Array<{ body: any; headers: any }>;

  beforeEach((done) => {
    queue = new NotificationQueue();
    receivedRequests = [];

    mockServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        receivedRequests.push({
          body: JSON.parse(body),
          headers: req.headers,
        });

        if (req.url === "/fail") {
          res.writeHead(500);
          res.end("Internal Server Error");
        } else {
          res.writeHead(200);
          res.end("OK");
        }
      });
    });

    mockServer.listen(0, () => {
      const addr = mockServer.address();
      if (addr && typeof addr !== "string") {
        serverPort = addr.port;
      }
      done();
    });
  });

  afterEach((done) => {
    worker?.stop();
    mockServer.close(done);
  });

  it("should deliver a notification to the target URL", async () => {
    const n = createNotification({
      type: "order.created",
      targetUrl: `http://localhost:${serverPort}/webhook`,
      body: { orderId: "123" },
    });
    queue.enqueue(n);

    worker = new DeliveryWorker(queue, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
    await worker.processNext();

    expect(receivedRequests.length).toBe(1);
    expect(receivedRequests[0].body).toEqual({
      id: n.id,
      type: "order.created",
      body: { orderId: "123" },
    });
    expect(queue.getById(n.id)!.status).toBe(NotificationStatus.DELIVERED);
  });

  it("should set Content-Type to application/json", async () => {
    const n = createNotification({
      type: "test",
      targetUrl: `http://localhost:${serverPort}/webhook`,
      body: { test: true },
    });
    queue.enqueue(n);

    worker = new DeliveryWorker(queue, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
    await worker.processNext();

    expect(receivedRequests[0].headers["content-type"]).toBe("application/json");
  });

  it("should retry on failure and mark as RETRYING", async () => {
    const n = createNotification({
      type: "test",
      targetUrl: `http://localhost:${serverPort}/fail`,
      body: { test: true },
    });
    queue.enqueue(n);

    worker = new DeliveryWorker(queue, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
    await worker.processNext();

    const stored = queue.getById(n.id)!;
    expect(stored.status).toBe(NotificationStatus.RETRYING);
    expect(stored.attempt).toBe(1);
    expect(queue.size()).toBe(1); // re-queued
  });

  it("should mark as FAILED after max retries exceeded", async () => {
    const n = createNotification({
      type: "test",
      targetUrl: `http://localhost:${serverPort}/fail`,
      body: { test: true },
    });
    queue.enqueue(n);

    worker = new DeliveryWorker(queue, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 });

    // Process: attempt 0 -> retry (attempt=1), attempt 1 -> retry (attempt=2), attempt 2 -> fail
    await worker.processNext(); // attempt becomes 1, requeued (1 < 2)
    await worker.processNext(); // attempt becomes 2, fails (2 >= 2)

    const stored = queue.getById(n.id)!;
    expect(stored.status).toBe(NotificationStatus.FAILED);
    expect(stored.attempt).toBe(2);
    expect(queue.size()).toBe(0); // not re-queued
  });

  it("should do nothing when queue is empty", async () => {
    worker = new DeliveryWorker(queue, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
    await worker.processNext(); // should not throw
    expect(receivedRequests.length).toBe(0);
  });

  it("should increment attempt counter on each retry", async () => {
    const n = createNotification({
      type: "test",
      targetUrl: `http://localhost:${serverPort}/fail`,
      body: {},
    });
    queue.enqueue(n);

    worker = new DeliveryWorker(queue, { maxRetries: 5, baseDelayMs: 10, maxDelayMs: 100 });
    await worker.processNext();
    expect(queue.getById(n.id)!.attempt).toBe(1);
    await worker.processNext();
    expect(queue.getById(n.id)!.attempt).toBe(2);
  });
});

import { NotificationQueue } from "./notification-queue";
import { createNotification, NotificationStatus } from "../models/notification";

describe("NotificationQueue", () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    queue = new NotificationQueue();
  });

  describe("enqueue", () => {
    it("should add a notification to the queue", () => {
      const n = createNotification({
        type: "order.created",
        targetUrl: "https://example.com/webhook",
        body: { orderId: "1" },
      });
      queue.enqueue(n);
      expect(queue.size()).toBe(1);
    });

    it("should store the notification retrievable by id", () => {
      const n = createNotification({
        type: "order.created",
        targetUrl: "https://example.com/webhook",
        body: { orderId: "1" },
      });
      queue.enqueue(n);
      expect(queue.getById(n.id)).toEqual(n);
    });
  });

  describe("dequeue", () => {
    it("should return undefined when queue is empty", () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it("should return notifications in FIFO order", () => {
      const n1 = createNotification({
        type: "a",
        targetUrl: "https://example.com/a",
        body: { id: "1" },
      });
      const n2 = createNotification({
        type: "b",
        targetUrl: "https://example.com/b",
        body: { id: "2" },
      });
      queue.enqueue(n1);
      queue.enqueue(n2);
      expect(queue.dequeue()!.id).toBe(n1.id);
      expect(queue.dequeue()!.id).toBe(n2.id);
    });

    it("should decrease size after dequeue", () => {
      const n = createNotification({
        type: "a",
        targetUrl: "https://example.com/a",
        body: {},
      });
      queue.enqueue(n);
      queue.dequeue();
      expect(queue.size()).toBe(0);
    });
  });

  describe("requeue (at-least-once)", () => {
    it("should re-add a notification for retry", () => {
      const n = createNotification({
        type: "a",
        targetUrl: "https://example.com/a",
        body: {},
      });
      queue.enqueue(n);
      queue.dequeue();
      expect(queue.size()).toBe(0);

      n.attempt += 1;
      n.status = NotificationStatus.RETRYING;
      queue.requeue(n);
      expect(queue.size()).toBe(1);
    });

    it("should update the stored notification on requeue", () => {
      const n = createNotification({
        type: "a",
        targetUrl: "https://example.com/a",
        body: {},
      });
      queue.enqueue(n);
      queue.dequeue();

      n.attempt = 2;
      n.status = NotificationStatus.RETRYING;
      n.lastError = "timeout";
      queue.requeue(n);

      const stored = queue.getById(n.id);
      expect(stored!.attempt).toBe(2);
      expect(stored!.lastError).toBe("timeout");
    });
  });

  describe("updateStatus", () => {
    it("should update the status of a notification", () => {
      const n = createNotification({
        type: "a",
        targetUrl: "https://example.com/a",
        body: {},
      });
      queue.enqueue(n);
      queue.updateStatus(n.id, NotificationStatus.DELIVERED);
      expect(queue.getById(n.id)!.status).toBe(NotificationStatus.DELIVERED);
    });

    it("should return false for non-existent notification", () => {
      expect(queue.updateStatus("nonexistent", NotificationStatus.DELIVERED)).toBe(false);
    });
  });
});

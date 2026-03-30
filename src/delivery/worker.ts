import { NotificationQueue } from "../queue/notification-queue";
import { NotificationStatus } from "../models/notification";
import { RetryConfig, DEFAULT_RETRY_CONFIG, shouldRetry } from "./retry";

export class DeliveryWorker {
  private queue: NotificationQueue;
  private config: RetryConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(queue: NotificationQueue, config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.queue = queue;
    this.config = config;
  }

  async processNext(): Promise<void> {
    const notification = this.queue.dequeue();
    if (!notification) return;

    try {
      const payload = JSON.stringify({
        id: notification.id,
        type: notification.type,
        body: notification.body,
      });

      const response = await fetch(notification.targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      notification.status = NotificationStatus.DELIVERED;
      notification.updatedAt = new Date();
      this.queue.updateStatus(notification.id, NotificationStatus.DELIVERED);
    } catch (error) {
      notification.attempt += 1;
      notification.lastError = error instanceof Error ? error.message : String(error);
      notification.updatedAt = new Date();

      if (shouldRetry(notification.attempt, this.config)) {
        notification.status = NotificationStatus.RETRYING;
        this.queue.requeue(notification);
      } else {
        notification.status = NotificationStatus.FAILED;
        this.queue.updateStatus(notification.id, NotificationStatus.FAILED);
      }
    }
  }

  start(intervalMs: number = 1000): void {
    this.intervalId = setInterval(() => this.processNext(), intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

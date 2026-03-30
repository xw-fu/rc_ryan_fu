import { Notification, NotificationStatus } from "../models/notification";

export class NotificationQueue {
  private queue: Notification[] = [];
  private store: Map<string, Notification> = new Map();

  enqueue(notification: Notification): void {
    this.queue.push(notification);
    this.store.set(notification.id, notification);
  }

  dequeue(): Notification | undefined {
    return this.queue.shift();
  }

  requeue(notification: Notification): void {
    this.store.set(notification.id, notification);
    this.queue.push(notification);
  }

  getById(id: string): Notification | undefined {
    return this.store.get(id);
  }

  updateStatus(id: string, status: NotificationStatus): boolean {
    const notification = this.store.get(id);
    if (!notification) return false;
    notification.status = status;
    notification.updatedAt = new Date();
    return true;
  }

  size(): number {
    return this.queue.length;
  }
}

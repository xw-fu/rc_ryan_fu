import express, { Request, Response } from "express";
import { createNotification } from "./models/notification";
import { NotificationQueue } from "./queue/notification-queue";
import { DeliveryWorker } from "./delivery/worker";
import { DEFAULT_RETRY_CONFIG } from "./delivery/retry";

export function createApp() {
  const app = express();
  const queue = new NotificationQueue();
  const worker = new DeliveryWorker(queue, DEFAULT_RETRY_CONFIG);

  app.use(express.json());

  app.post("/notify", (req: Request, res: Response) => {
    try {
      const notification = createNotification({
        type: req.body.type,
        targetUrl: req.body.targetUrl,
        body: req.body.body,
      });

      queue.enqueue(notification);

      res.status(201).json({
        id: notification.id,
        status: notification.status,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.get("/status/:id", (req: Request, res: Response) => {
    const notification = queue.getById(req.params.id);
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json({
      id: notification.id,
      type: notification.type,
      status: notification.status,
      attempt: notification.attempt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      lastError: notification.lastError,
    });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", queueSize: queue.size() });
  });

  return app;
}

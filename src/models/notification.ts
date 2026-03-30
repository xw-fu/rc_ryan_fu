import { randomUUID } from "crypto";

export enum NotificationStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
}

export interface NotificationPayload {
  type: string;
  targetUrl: string;
  body: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: string;
  targetUrl: string;
  body: Record<string, unknown>;
  status: NotificationStatus;
  attempt: number;
  createdAt: Date;
  updatedAt: Date;
  lastError?: string;
}

export function createNotification(payload: NotificationPayload): Notification {
  if (!payload.type) {
    throw new Error("type is required");
  }
  if (!payload.targetUrl) {
    throw new Error("targetUrl is required");
  }
  try {
    new URL(payload.targetUrl);
  } catch {
    throw new Error("targetUrl must be a valid URL");
  }
  if (!payload.body) {
    throw new Error("body is required");
  }

  const now = new Date();
  return {
    id: randomUUID(),
    type: payload.type,
    targetUrl: payload.targetUrl,
    body: payload.body,
    status: NotificationStatus.PENDING,
    attempt: 0,
    createdAt: now,
    updatedAt: now,
  };
}

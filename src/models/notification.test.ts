import {
  createNotification,
  NotificationPayload,
  NotificationStatus,
} from "./notification";

describe("Notification Model", () => {
  const validPayload: NotificationPayload = {
    type: "order.created",
    targetUrl: "https://example.com/webhook",
    body: { orderId: "123", amount: 99.99 },
  };

  describe("createNotification", () => {
    it("should create a notification with a unique id", () => {
      const n = createNotification(validPayload);
      expect(n.id).toBeDefined();
      expect(typeof n.id).toBe("string");
      expect(n.id.length).toBeGreaterThan(0);
    });

    it("should set initial status to PENDING", () => {
      const n = createNotification(validPayload);
      expect(n.status).toBe(NotificationStatus.PENDING);
    });

    it("should store the type, targetUrl, and body", () => {
      const n = createNotification(validPayload);
      expect(n.type).toBe("order.created");
      expect(n.targetUrl).toBe("https://example.com/webhook");
      expect(n.body).toEqual({ orderId: "123", amount: 99.99 });
    });

    it("should set attempt to 0", () => {
      const n = createNotification(validPayload);
      expect(n.attempt).toBe(0);
    });

    it("should set createdAt to a valid date", () => {
      const n = createNotification(validPayload);
      expect(n.createdAt).toBeInstanceOf(Date);
    });

    it("should generate unique ids for different notifications", () => {
      const n1 = createNotification(validPayload);
      const n2 = createNotification(validPayload);
      expect(n1.id).not.toBe(n2.id);
    });
  });

  describe("validation", () => {
    it("should require type", () => {
      expect(() =>
        createNotification({ ...validPayload, type: "" })
      ).toThrow("type is required");
    });

    it("should require targetUrl", () => {
      expect(() =>
        createNotification({ ...validPayload, targetUrl: "" })
      ).toThrow("targetUrl is required");
    });

    it("should require a valid URL for targetUrl", () => {
      expect(() =>
        createNotification({ ...validPayload, targetUrl: "not-a-url" })
      ).toThrow("targetUrl must be a valid URL");
    });

    it("should require body", () => {
      expect(() =>
        createNotification({ ...validPayload, body: undefined as any })
      ).toThrow("body is required");
    });
  });
});

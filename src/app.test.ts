import request from "supertest";
import { createApp } from "./app";

describe("API Endpoints", () => {
  const app = createApp();

  describe("POST /notify", () => {
    it("should accept a valid notification and return 201", async () => {
      const res = await request(app)
        .post("/notify")
        .send({
          type: "order.created",
          targetUrl: "https://example.com/webhook",
          body: { orderId: "123" },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("PENDING");
    });

    it("should return 400 when type is missing", async () => {
      const res = await request(app)
        .post("/notify")
        .send({
          targetUrl: "https://example.com/webhook",
          body: { orderId: "123" },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 400 when targetUrl is missing", async () => {
      const res = await request(app)
        .post("/notify")
        .send({
          type: "order.created",
          body: { orderId: "123" },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 400 when targetUrl is invalid", async () => {
      const res = await request(app)
        .post("/notify")
        .send({
          type: "order.created",
          targetUrl: "not-a-url",
          body: { orderId: "123" },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 400 when body is missing", async () => {
      const res = await request(app)
        .post("/notify")
        .send({
          type: "order.created",
          targetUrl: "https://example.com/webhook",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /status/:id", () => {
    it("should return the status of an existing notification", async () => {
      const createRes = await request(app)
        .post("/notify")
        .send({
          type: "order.created",
          targetUrl: "https://example.com/webhook",
          body: { orderId: "123" },
        });

      const id = createRes.body.id;
      const res = await request(app).get(`/status/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.status).toBe("PENDING");
      expect(res.body.type).toBe("order.created");
      expect(res.body.attempt).toBe(0);
    });

    it("should return 404 for non-existent notification", async () => {
      const res = await request(app).get("/status/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Notification not found");
    });
  });

  describe("GET /health", () => {
    it("should return 200 with status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});

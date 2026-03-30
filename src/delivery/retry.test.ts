import { calculateBackoff, shouldRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from "./retry";

describe("Retry Logic", () => {
  describe("DEFAULT_RETRY_CONFIG", () => {
    it("should have sensible defaults", () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(5);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000);
    });
  });

  describe("calculateBackoff", () => {
    it("should return baseDelay for attempt 0", () => {
      const delay = calculateBackoff(0, DEFAULT_RETRY_CONFIG);
      expect(delay).toBe(1000);
    });

    it("should double delay for each attempt (exponential)", () => {
      const delay1 = calculateBackoff(1, DEFAULT_RETRY_CONFIG);
      expect(delay1).toBe(2000);

      const delay2 = calculateBackoff(2, DEFAULT_RETRY_CONFIG);
      expect(delay2).toBe(4000);

      const delay3 = calculateBackoff(3, DEFAULT_RETRY_CONFIG);
      expect(delay3).toBe(8000);
    });

    it("should cap delay at maxDelayMs", () => {
      const delay = calculateBackoff(10, DEFAULT_RETRY_CONFIG);
      expect(delay).toBe(30000);
    });

    it("should use custom config", () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
      };
      expect(calculateBackoff(0, config)).toBe(500);
      expect(calculateBackoff(1, config)).toBe(1000);
      expect(calculateBackoff(2, config)).toBe(2000);
      expect(calculateBackoff(10, config)).toBe(5000);
    });
  });

  describe("shouldRetry", () => {
    it("should return true when attempt < maxRetries", () => {
      expect(shouldRetry(0, DEFAULT_RETRY_CONFIG)).toBe(true);
      expect(shouldRetry(4, DEFAULT_RETRY_CONFIG)).toBe(true);
    });

    it("should return false when attempt >= maxRetries", () => {
      expect(shouldRetry(5, DEFAULT_RETRY_CONFIG)).toBe(false);
      expect(shouldRetry(6, DEFAULT_RETRY_CONFIG)).toBe(false);
    });
  });
});

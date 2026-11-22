import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "../lib/api/api-client";

describe("ApiClient — Token Refresh, Deduplication & Retry", () => {
  let client: ApiClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    client = new ApiClient("http://localhost:4000/api/v1");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("automatically refreshes token on 401 and retries original request once", async () => {
    let callCount = 0;
    const mockTokenProvider = vi.fn().mockImplementation(() => {
      return callCount > 1 ? "new-refreshed-token" : "expired-token";
    });
    client.setAuthTokenProvider(mockTokenProvider);

    const refreshHandler = vi.fn().mockResolvedValue("new-refreshed-token");
    client.setRefreshTokenHandler(refreshHandler);

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (url.includes("/products/special")) {
        if (callCount === 1) {
          // First attempt fails with 401 expired token
          return new Response(
            JSON.stringify({
              success: false,
              error: { message: "Access token expired", code: "UNAUTHORIZED" },
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        } else {
          // Retry succeeds with refreshed token
          return new Response(
            JSON.stringify({
              success: true,
              data: { item: "Precision Mechanical Keyboard", stock: 12 },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      return new Response("Not found", { status: 404 });
    });

    const result = await client.get<{ item: string; stock: number }>("/products/special");

    expect(result).toEqual({ item: "Precision Mechanical Keyboard", stock: 12 });
    expect(refreshHandler).toHaveBeenCalledTimes(1);
    expect(callCount).toBe(2);
  });

  it("deduplicates concurrent 401 requests into a single in-flight refresh call", async () => {
    let refreshCalls = 0;
    const refreshHandler = vi.fn().mockImplementation(async () => {
      refreshCalls++;
      // Simulate network latency for refresh
      await new Promise((resolve) => setTimeout(resolve, 50));
      return "new-shared-token";
    });
    client.setRefreshTokenHandler(refreshHandler);

    let requestCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      requestCount++;
      if (requestCount <= 3) {
        // First 3 concurrent requests all receive 401
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: "Token expired", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      // Retries all succeed
      return new Response(
        JSON.stringify({
          success: true,
          data: { url, resolved: true },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    // Execute 3 requests concurrently
    const [resA, resB, resC] = await Promise.all([
      client.get("/endpoint-a"),
      client.get("/endpoint-b"),
      client.get("/endpoint-c"),
    ]);

    expect(resA).toBeDefined();
    expect(resB).toBeDefined();
    expect(resC).toBeDefined();
    // Exactly one refresh operation occurred
    expect(refreshHandler).toHaveBeenCalledTimes(1);
    expect(refreshCalls).toBe(1);
  });

  it("handles refresh failure by invoking onSessionExpired and throwing ApiClientError", async () => {
    const sessionExpiredSpy = vi.fn();
    client.setOnSessionExpired(sessionExpiredSpy);

    const refreshHandler = vi.fn().mockResolvedValue(null);
    client.setRefreshTokenHandler(refreshHandler);

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { message: "Invalid session", code: "UNAUTHORIZED" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(client.get("/protected-profile")).rejects.toThrow(
      "Authentication session expired"
    );
    expect(sessionExpiredSpy).toHaveBeenCalledTimes(1);
  });

  it("does not trigger refresh for auth endpoints such as /auth/login on 401", async () => {
    const refreshHandler = vi.fn().mockResolvedValue("new-token");
    client.setRefreshTokenHandler(refreshHandler);

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { message: "Invalid credentials", code: "UNAUTHORIZED" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(
      client.post("/auth/login", { email: "a@b.com", password: "wrong" })
    ).rejects.toThrow("Invalid credentials");
    expect(refreshHandler).not.toHaveBeenCalled();
  });
});

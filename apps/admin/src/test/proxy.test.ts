import { describe, it, expect } from "vitest";
import { proxy, getSafeRedirectUrl } from "../proxy";
import { NextRequest } from "next/server";

describe("Admin Console Proxy & URL Security", () => {
  describe("getSafeRedirectUrl", () => {
    it("allows valid administrative paths", () => {
      expect(getSafeRedirectUrl("/products")).toBe("/products");
      expect(getSafeRedirectUrl("/orders/ord-999?tab=history")).toBe("/orders/ord-999?tab=history");
      expect(getSafeRedirectUrl("/inventory")).toBe("/inventory");
    });

    it("neutralizes external URLs to fallback", () => {
      expect(getSafeRedirectUrl("https://phishing.site", "/")).toBe("/");
      expect(getSafeRedirectUrl("//evil.com", "/")).toBe("/");
    });
  });

  describe("Administrative Navigation Rules", () => {
    it("allows operator page navigation to proceed to AdminProtectedRoute for session verification", () => {
      const adminUrls = [
        "http://localhost:3001/",
        "http://localhost:3001/products/prod-123",
        "http://localhost:3001/orders",
        "http://localhost:3001/inventory",
      ];

      for (const url of adminUrls) {
        const req = new NextRequest(url);
        const res = proxy(req);
        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
      }
    });

    it("allows unauthenticated operator to view /login", () => {
      const req = new NextRequest("http://localhost:3001/login");
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows operator to view /login with return destination", () => {
      const req = new NextRequest("http://localhost:3001/login?redirect=%2Finventory");
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("bypasses API and static assets", () => {
      const req = new NextRequest("http://localhost:3001/api/health");
      const res = proxy(req);
      expect(res.status).toBe(200);
    });
  });
});

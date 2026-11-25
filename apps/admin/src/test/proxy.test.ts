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
    it("redirects unauthenticated operator from dashboard to login", () => {
      const req = new NextRequest("http://localhost:3001/");
      const res = proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?redirect=%2F");
    });

    it("redirects unauthenticated operator from /products to login with return URL", () => {
      const req = new NextRequest("http://localhost:3001/products/prod-123");
      const res = proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?redirect=%2Fproducts%2Fprod-123");
    });

    it("allows unauthenticated operator to view /login", () => {
      const req = new NextRequest("http://localhost:3001/login");
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("always allows operator to view /login at proxy level regardless of cookie presence", () => {
      const req = new NextRequest("http://localhost:3001/login", {
        headers: {
          cookie: "refreshToken=mock-session-hint",
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows operator to view /login with return destination to resolve session via client auth provider", () => {
      const req = new NextRequest("http://localhost:3001/login?redirect=%2Finventory", {
        headers: {
          cookie: "refreshToken=mock-session-hint",
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows operator with session hint to access protected dashboard for client-side resolution", () => {
      const req = new NextRequest("http://localhost:3001/", {
        headers: {
          cookie: "refreshToken=mock-session-hint",
        },
      });
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

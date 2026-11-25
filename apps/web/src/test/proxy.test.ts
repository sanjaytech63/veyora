import { describe, it, expect } from "vitest";
import { proxy, getSafeRedirectUrl } from "../proxy";
import { NextRequest } from "next/server";

describe("Web Storefront Proxy & URL Security", () => {
  describe("getSafeRedirectUrl (Open Redirect Protection)", () => {
    it("accepts safe local application relative paths", () => {
      expect(getSafeRedirectUrl("/checkout")).toBe("/checkout");
      expect(getSafeRedirectUrl("/account/orders?page=2&sort=desc")).toBe(
        "/account/orders?page=2&sort=desc"
      );
      expect(getSafeRedirectUrl("/shop?category=ethnic-wear")).toBe("/shop?category=ethnic-wear");
    });

    it("rejects absolute external URLs with protocols", () => {
      expect(getSafeRedirectUrl("https://evil.com")).toBe("/account");
      expect(getSafeRedirectUrl("http://attacker.com/steal")).toBe("/account");
      expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/account");
    });

    it("rejects protocol-relative and backslash evasion URLs", () => {
      expect(getSafeRedirectUrl("//evil.com")).toBe("/account");
      expect(getSafeRedirectUrl("/\\attacker.com")).toBe("/account");
      expect(getSafeRedirectUrl("//attacker.com/path")).toBe("/account");
      expect(getSafeRedirectUrl("/%5Cevil.com")).toBe("/account");
    });

    it("returns custom fallback if provided", () => {
      expect(getSafeRedirectUrl("https://phishing.site", "/")).toBe("/");
      expect(getSafeRedirectUrl(null, "/")).toBe("/");
      expect(getSafeRedirectUrl(undefined, "/shop")).toBe("/shop");
    });
  });

  describe("Storefront Authentication-Aware Routing", () => {
    it("redirects unauthenticated visitor from protected account page to login", () => {
      const req = new NextRequest("http://localhost:3000/account/profile");
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login?redirect=%2Faccount%2Fprofile");
    });

    it("redirects unauthenticated visitor from orders page to login", () => {
      const req = new NextRequest("http://localhost:3000/orders/12345");
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login?redirect=%2Forders%2F12345");
    });

    it("always allows visitors to view /login at proxy level regardless of cookie presence", () => {
      const req = new NextRequest("http://localhost:3000/login", {
        headers: {
          cookie: "refreshToken=valid-mock-session-hint",
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows visitors to view /login with return destination to resolve session via client auth provider", () => {
      const req = new NextRequest("http://localhost:3000/login?redirect=%2Fcheckout", {
        headers: {
          cookie: "refreshToken=valid-mock-session-hint",
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows visitors with session hint to access protected routes for client-side resolution", () => {
      const req = new NextRequest("http://localhost:3000/account/profile", {
        headers: {
          cookie: "refreshToken=valid-mock-session-hint",
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("permits public storefront browsing for unauthenticated visitors", () => {
      const publicPaths = [
        "http://localhost:3000/",
        "http://localhost:3000/shop",
        "http://localhost:3000/products/linen-kurti",
        "http://localhost:3000/category/ethnic-wear",
        "http://localhost:3000/collections/festive-edit",
        "http://localhost:3000/cart",
        "http://localhost:3000/checkout",
      ];

      for (const url of publicPaths) {
        const req = new NextRequest(url);
        const res = proxy(req);
        // NextResponse.next() returns a 200 without redirect headers
        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
      }
    });

    it("bypasses API routes to preserve API authority", () => {
      const req = new NextRequest("http://localhost:3000/api/internal/cache/revalidate");
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });
  });
});

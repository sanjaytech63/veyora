import { describe, it, expect, vi } from "vitest";
import { Response } from "express";
import {
  AUTH_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../modules/auth/config/auth-cookie.config";

describe("Auth Cookie Configuration & Operations", () => {
  it("generates correct refresh token cookie options", () => {
    const options = getRefreshTokenCookieOptions();

    expect(AUTH_COOKIE_NAME).toBe("refreshToken");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/api/v1/auth");
    expect(typeof options.maxAge).toBe("number");
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it("generates matching cookie options for clearing on logout", () => {
    const setOptions = getRefreshTokenCookieOptions();
    const clearOptions = getClearRefreshTokenCookieOptions();

    expect(clearOptions.path).toBe(setOptions.path);
    expect(clearOptions.sameSite).toBe(setOptions.sameSite);
    expect(clearOptions.httpOnly).toBe(setOptions.httpOnly);
    expect(clearOptions.secure).toBe(setOptions.secure);
  });

  it("sets refresh token cookie on Express response", () => {
    const mockRes = {
      cookie: vi.fn(),
    } as unknown as Response;

    setRefreshTokenCookie(mockRes, "test-refresh-token-xyz");

    expect(mockRes.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "test-refresh-token-xyz",
      expect.objectContaining({
        httpOnly: true,
        path: "/api/v1/auth",
        sameSite: "lax",
      })
    );
  });

  it("clears refresh token cookie on Express response with exact matching path", () => {
    const mockRes = {
      clearCookie: vi.fn(),
    } as unknown as Response;

    clearRefreshTokenCookie(mockRes);

    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        path: "/api/v1/auth",
        sameSite: "lax",
      })
    );
  });
});

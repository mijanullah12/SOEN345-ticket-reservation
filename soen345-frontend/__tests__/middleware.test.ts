import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({ type: "next" })),
      redirect: vi.fn((url: URL) => ({ type: "redirect", url })),
    },
  };
});

import { middleware } from "@/middleware";
import { NextResponse } from "next/server";

function buildRequest(pathname: string, hasToken = false): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const req = new NextRequest(url);
  if (hasToken) {
    req.cookies.set("auth_token", "mock-jwt-token");
  }
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("middleware", () => {
  describe("protected routes", () => {
    it("redirects unauthenticated users from /dashboard to /login", () => {
      middleware(buildRequest("/dashboard"));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/dashboard");
    });

    it("redirects unauthenticated users from /dashboard/settings to /login", () => {
      middleware(buildRequest("/dashboard/settings"));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe(
        "/dashboard/settings",
      );
    });

    it("allows authenticated users to access /dashboard", () => {
      middleware(buildRequest("/dashboard", true));

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe("auth pages redirect when authenticated", () => {
    it("redirects authenticated users from / to /dashboard", () => {
      middleware(buildRequest("/", true));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/dashboard");
    });

    it("redirects authenticated users from /login to /dashboard", () => {
      middleware(buildRequest("/login", true));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/dashboard");
    });

    it("redirects authenticated users from /register to /dashboard", () => {
      middleware(buildRequest("/register", true));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/dashboard");
    });
  });

  describe("public access", () => {
    it("allows unauthenticated users to access /login", () => {
      middleware(buildRequest("/login"));

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("allows unauthenticated users to access /register", () => {
      middleware(buildRequest("/register"));

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("allows unauthenticated users to access /", () => {
      middleware(buildRequest("/"));

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});

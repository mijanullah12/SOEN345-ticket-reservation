import { describe, it, expect, vi } from "vitest";

const mockCookieDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ delete: mockCookieDelete })),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("deletes the auth_token cookie and returns success", async () => {
    const res = await POST();
    const body = await res.json();

    expect(mockCookieDelete).toHaveBeenCalledWith("auth_token");
    expect(body.message).toBe("Logged out");
  });
});

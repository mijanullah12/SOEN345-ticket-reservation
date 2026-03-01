import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/auth/login/route";

function buildRequest(body: object): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  mockCookieSet.mockReset();
});

describe("POST /api/auth/login", () => {
  const loginPayload = { identifier: "test@example.com", password: "Pass1234" };

  const backendSuccess = {
    tokenType: "Bearer",
    accessToken: "jwt-token-123",
    expiresIn: 3600,
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      phone: null,
      role: "USER",
    },
  };

  it("proxies credentials to the backend and sets an HTTP-only cookie", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(backendSuccess),
    });

    const res = await POST(buildRequest(loginPayload));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(loginPayload),
      }),
    );

    expect(mockCookieSet).toHaveBeenCalledWith(
      "auth_token",
      "jwt-token-123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        maxAge: 3600,
        path: "/",
      }),
    );

    expect(body.user).toEqual(backendSuccess.user);
    expect(body.accessToken).toBeUndefined();
  });

  it("forwards backend error responses without setting a cookie", async () => {
    const errorBody = { message: "Invalid credentials", status: 401 };
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve(errorBody),
    });

    const res = await POST(buildRequest(loginPayload));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Invalid credentials");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns 500 when the backend is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await POST(buildRequest(loginPayload));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Internal server error");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });
});

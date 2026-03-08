import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/auth/register/route";

function buildRequest(body: object): Request {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("POST /api/auth/register", () => {
  const registerPayload = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    password: "Pass1234",
  };

  it("proxies registration to the backend and returns the response", async () => {
    const backendResponse = { id: "2", firstName: "Jane", lastName: "Doe" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(backendResponse),
    });

    const res = await POST(buildRequest(registerPayload));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(registerPayload),
      }),
    );
    expect(res.status).toBe(201);
    expect(body).toEqual(backendResponse);
  });

  it("forwards validation errors from the backend", async () => {
    const errorBody = {
      message: "Validation failed",
      fieldErrors: [{ field: "email", message: "Invalid email format" }],
    };
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(errorBody),
    });

    const res = await POST(buildRequest(registerPayload));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.fieldErrors).toHaveLength(1);
    expect(body.fieldErrors[0].field).toBe("email");
  });

  it("forwards duplicate resource errors from the backend", async () => {
    const errorBody = { message: "Email already registered" };
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve(errorBody),
    });

    const res = await POST(buildRequest(registerPayload));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toBe("Email already registered");
  });

  it("returns 500 when the backend is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await POST(buildRequest(registerPayload));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Internal server error");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/auth/register-organizer/route";

function buildRequest(body: object): Request {
  return new Request("http://localhost:3000/api/auth/register-organizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("POST /api/auth/register-organizer", () => {
  const payload = {
    firstName: "Org",
    lastName: "Owner",
    email: "org@example.com",
    password: "Pass1234",
  };

  it("proxies organizer registration to the backend", async () => {
    const backendResponse = { id: "3", role: "ORGANIZER" };
    fetchMock.mockResolvedValueOnce({
      status: 201,
      text: () => Promise.resolve(JSON.stringify(backendResponse)),
    });

    const res = await POST(buildRequest(payload));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/register-organizer",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(res.status).toBe(201);
    expect(body).toEqual(backendResponse);
  });

  it("forwards non-JSON backend errors as message text", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    const res = await POST(buildRequest(payload));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toContain("Not Found");
  });
});

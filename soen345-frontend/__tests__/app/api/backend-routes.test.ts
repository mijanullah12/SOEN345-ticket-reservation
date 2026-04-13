import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => mockGet(name),
  })),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { GET as eventsGet, POST as eventsPost } from "@/app/api/events/route";
import { PUT as eventPut } from "@/app/api/events/[id]/route";
import { PATCH as eventCancelPatch } from "@/app/api/events/[id]/cancel/route";
import { GET as eventsMineGet } from "@/app/api/events/mine/route";
import { POST as setupIntentPost } from "@/app/api/payments/setup-intent/route";
import { GET as reservationsGet, POST as reservationsPost } from "@/app/api/reservations/route";
import { PATCH as reservationCancelPatch } from "@/app/api/reservations/[id]/cancel/route";
import { POST as usersAdminPost } from "@/app/api/users/admin/route";
import { GET as usersMeGet, PATCH as usersMePatch } from "@/app/api/users/me/route";
import { PATCH as notifPrefPatch } from "@/app/api/users/me/notification-preference/route";

function withAuth() {
  mockGet.mockImplementation((name: string) =>
    name === "auth_token" ? { value: "jwt-1" } : undefined,
  );
}

function noAuth() {
  mockGet.mockImplementation(() => undefined);
}

beforeEach(() => {
  fetchMock.mockReset();
  mockGet.mockReset();
});

describe("GET/POST /api/events", () => {
  it("returns 401 when unauthenticated", async () => {
    noAuth();
    expect((await eventsGet()).status).toBe(401);
  });

  it("proxies GET to backend", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: "e1" }]),
    });
    const res = await eventsGet();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/events",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("proxies POST to backend", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: "new" }),
    });
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ name: "N" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await eventsPost(req);
    expect(res.status).toBe(201);
  });

  it("returns 500 on GET failure", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const res = await eventsGet();
    expect(res.status).toBe(500);
  });

  it("returns 500 on POST failure", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ name: "N" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await eventsPost(req)).status).toBe(500);
  });
});

describe("PUT /api/events/[id]", () => {
  it("returns 401 without token", async () => {
    noAuth();
    const res = await eventPut(new Request("http://x", { method: "PUT", body: "{}" }), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(401);
  });

  it("proxies with id", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "e1" }),
    });
    const req = new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ name: "U" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await eventPut(req, { params: Promise.resolve({ id: "e1" }) });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/events/e1",
      expect.any(Object),
    );
  });

  it("returns 500 on error", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    const req = new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ name: "U" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await eventPut(req, { params: Promise.resolve({ id: "e1" }) })).status).toBe(500);
  });
});

describe("PATCH /api/events/[id]/cancel", () => {
  it("returns 401 without token", async () => {
    noAuth();
    const res = await eventCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(401);
  });

  it("proxies cancel", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    const res = await eventCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/events/e1/cancel",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("returns 500 when fetch throws", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const res = await eventCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(500);
  });
});

describe("GET /api/events/mine", () => {
  it("returns 401 without token", async () => {
    noAuth();
    expect((await eventsMineGet()).status).toBe(401);
  });

  it("proxies mine", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    const res = await eventsMineGet();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/events/mine",
      expect.any(Object),
    );
  });

  it("returns 500 on failure", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    expect((await eventsMineGet()).status).toBe(500);
  });
});

describe("POST /api/payments/setup-intent", () => {
  it("returns 401 without token", async () => {
    noAuth();
    expect((await setupIntentPost()).status).toBe(401);
  });

  it("returns setup payload on success", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ clientSecret: "cs", customerId: "cus" }),
    });
    const res = await setupIntentPost();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("cs");
  });

  it("forwards error status", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "bad" }),
    });
    const res = await setupIntentPost();
    expect(res.status).toBe(400);
  });

  it("returns 502 on throw", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    const res = await setupIntentPost();
    expect(res.status).toBe(502);
  });
});

describe("/api/reservations", () => {
  it("GET returns 401 without token", async () => {
    noAuth();
    expect((await reservationsGet()).status).toBe(401);
  });

  it("GET lists reservations", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    const res = await reservationsGet();
    expect(res.status).toBe(200);
  });

  it("GET returns 500 on error", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    expect((await reservationsGet()).status).toBe(500);
  });

  it("POST returns 401 without token", async () => {
    noAuth();
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ eventId: "e1" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await reservationsPost(req)).status).toBe(401);
  });

  it("POST creates reservation", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "r1" }),
    });
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ eventId: "e1", quantity: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await reservationsPost(req);
    expect(res.status).toBe(200);
  });

  it("POST returns 500 on error", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ eventId: "e1" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await reservationsPost(req)).status).toBe(500);
  });
});

describe("PATCH /api/reservations/[id]/cancel", () => {
  it("returns 401 without token", async () => {
    noAuth();
    const res = await reservationCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(401);
  });

  it("proxies cancel", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "CANCELLED" }),
    });
    const res = await reservationCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/reservations/r1/cancel",
      expect.any(Object),
    );
  });

  it("returns 500 when fetch throws", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    const res = await reservationCancelPatch(new Request("http://x"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(500);
  });
});

describe("POST /api/users/admin", () => {
  it("requires auth", async () => {
    noAuth();
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    expect((await usersAdminPost(req)).status).toBe(401);
  });

  it("proxies to backend", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "a1" }),
    });
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ email: "a@a.com", password: "Pp123456", firstName: "A", lastName: "B" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await usersAdminPost(req);
    expect(res.status).toBe(200);
  });

  it("returns 500 on failure", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ email: "a@a.com", password: "Pp123456", firstName: "A", lastName: "B" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await usersAdminPost(req)).status).toBe(500);
  });
});

describe("/api/users/me", () => {
  it("GET returns 401 without token", async () => {
    noAuth();
    expect((await usersMeGet()).status).toBe(401);
  });

  it("GET returns profile", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "u1" }),
    });
    const res = await usersMeGet();
    expect(res.status).toBe(200);
  });

  it("GET forwards non-ok as json message", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve("down"),
    });
    const res = await usersMeGet();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.message).toBe("down");
  });

  it("PATCH updates profile", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "u1", firstName: "X" }),
    });
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ firstName: "X" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await usersMePatch(req);
    expect(res.status).toBe(200);
  });

  it("PATCH returns error body when backend fails", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "invalid" }),
    });
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await usersMePatch(req);
    expect(res.status).toBe(400);
  });

  it("PATCH returns 502 on network error", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("econn"));
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await usersMePatch(req);
    expect(res.status).toBe(502);
  });
});

describe("PATCH /api/users/me/notification-preference", () => {
  it("returns 401 without token", async () => {
    noAuth();
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ preferredNotificationChannel: "SMS" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await notifPrefPatch(req)).status).toBe(401);
  });

  it("proxies preference", async () => {
    withAuth();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ preferredNotificationChannel: "SMS" }),
    });
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ preferredNotificationChannel: "SMS" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await notifPrefPatch(req);
    expect(res.status).toBe(200);
  });

  it("returns 500 on error", async () => {
    withAuth();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    const req = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ preferredNotificationChannel: "EMAIL" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await notifPrefPatch(req)).status).toBe(500);
  });
});

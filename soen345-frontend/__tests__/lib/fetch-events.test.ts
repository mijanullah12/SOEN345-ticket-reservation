import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BACKEND_URL } from "@/lib/backend";
import {
  fetchEventsWithAuth,
  fetchOrganizerEventsWithAuth,
} from "@/lib/fetch-events";

describe("fetchEventsWithAuth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn() as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when response status is 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const result = await fetchEventsWithAuth("token");

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/v1/events`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      }),
    );
  });

  it("returns events when response is ok", async () => {
    const payload = [
      {
        id: "1",
        name: "Show",
        date: "2025-01-01T00:00:00.000Z",
        location: "Hall",
        capacity: 50,
        ticketPrice: 10,
        status: "ACTIVE",
      },
    ];
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchEventsWithAuth("abc");

    expect(result).toEqual({ ok: true, events: payload });
  });

  it("returns error when response is not ok and not 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Server exploded", { status: 500 }),
    );

    const result = await fetchEventsWithAuth("abc");

    expect(result).toEqual({
      ok: false,
      reason: "error",
      message: "Server exploded",
    });
  });
});

describe("fetchOrganizerEventsWithAuth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn() as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests the organizer-only events endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await fetchOrganizerEventsWithAuth("organizer-token");

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/v1/events/mine`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer organizer-token",
        }),
      }),
    );
  });
});

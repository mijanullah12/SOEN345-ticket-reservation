import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
});

describe("api utility", () => {
  it("makes a GET request with correct defaults", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    });

    const result = await api("/api/test");

    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    expect(result).toEqual({ data: "ok" });
  });

  it("merges custom headers with defaults", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await api("/api/test", {
      headers: { "X-Custom": "value" },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Custom": "value",
      },
    });
  });

  it("passes method and body through", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "1" }),
    });

    const body = JSON.stringify({ name: "test" });
    await api("/api/test", { method: "POST", body });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ method: "POST", body }),
    );
  });

  it("throws with message and fieldErrors on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () =>
        Promise.resolve({
          message: "Validation failed",
          fieldErrors: [{ field: "email", message: "Invalid email" }],
        }),
    });

    await expect(api("/api/test")).rejects.toEqual({
      status: 400,
      message: "Validation failed",
      fieldErrors: [{ field: "email", message: "Invalid email" }],
    });
  });

  it("falls back to statusText when error body has no message", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
    });

    await expect(api("/api/test")).rejects.toEqual({
      status: 500,
      message: "Internal Server Error",
      fieldErrors: [],
    });
  });

  it("handles unparseable error body gracefully", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(api("/api/test")).rejects.toEqual({
      status: 502,
      message: "Bad Gateway",
      fieldErrors: [],
    });
  });
});

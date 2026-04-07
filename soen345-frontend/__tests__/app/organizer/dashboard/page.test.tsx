import { beforeEach, describe, expect, it, vi } from "vitest";
import OrganizerDashboardPage from "@/app/organizer/dashboard/page";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

const cookiesGetMock = vi.fn();
const cookiesMock = vi.fn(async () => ({
  get: cookiesGetMock,
}));

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

const fetchEventsWithAuthMock = vi.fn();
vi.mock("@/lib/fetch-events", () => ({
  fetchEventsWithAuth: (...args: unknown[]) => fetchEventsWithAuthMock(...args),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrganizerDashboardPage", () => {
  it("redirects to organizer login when token is missing", async () => {
    cookiesGetMock.mockReturnValue(undefined);

    await expect(OrganizerDashboardPage()).rejects.toThrow(
      "REDIRECT:/organizer/login?redirect=/organizer/dashboard",
    );
  });

  it("redirects to organizer login when token is unauthorized", async () => {
    cookiesGetMock.mockReturnValue({ value: "expired-token" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "ORGANIZER" }),
    });
    fetchEventsWithAuthMock.mockResolvedValueOnce({
      ok: false,
      reason: "unauthorized",
    });

    await expect(OrganizerDashboardPage()).rejects.toThrow(
      "REDIRECT:/organizer/login?redirect=/organizer/dashboard",
    );
  });

  it("renders organizer dashboard client for authenticated users", async () => {
    cookiesGetMock.mockReturnValue({ value: "good-token" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "ORGANIZER" }),
    });
    fetchEventsWithAuthMock.mockResolvedValueOnce({
      ok: true,
      events: [],
    });

    const result = await OrganizerDashboardPage();
    expect(result).toBeTruthy();
    expect(fetchEventsWithAuthMock).toHaveBeenCalledWith("good-token");
  });
});

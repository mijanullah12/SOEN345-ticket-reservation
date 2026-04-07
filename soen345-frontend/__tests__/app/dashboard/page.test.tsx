import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
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

beforeEach(() => {
  vi.clearAllMocks();
});

function atLocalToday(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

describe("DashboardPage", () => {
  it("redirects to login when auth_token cookie is missing", async () => {
    cookiesGetMock.mockReturnValue(undefined);

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(fetchEventsWithAuthMock).not.toHaveBeenCalled();
  });

  it("redirects to login when fetch returns unauthorized", async () => {
    cookiesGetMock.mockImplementation((name: string) =>
      name === "auth_token" ? { value: "expired" } : undefined,
    );
    fetchEventsWithAuthMock.mockResolvedValueOnce({
      ok: false,
      reason: "unauthorized",
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
    expect(fetchEventsWithAuthMock).toHaveBeenCalledWith("expired");
  });

  it("renders dashboard with events when fetch succeeds", async () => {
    cookiesGetMock.mockImplementation((name: string) =>
      name === "auth_token" ? { value: "ok-token" } : undefined,
    );
    fetchEventsWithAuthMock.mockResolvedValueOnce({
      ok: true,
      events: [
        {
          id: "1",
          name: "Test film night",
          description: "",
          date: atLocalToday(18, 0),
          location: "Hall",
          capacity: 50,
          ticketPrice: 20,
          status: "ACTIVE",
        },
      ],
    });

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText("THE KINETIC")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /test film night/i }),
    ).toBeInTheDocument();
  });

  it("renders dashboard with empty events and error message when fetch errors", async () => {
    cookiesGetMock.mockImplementation((name: string) =>
      name === "auth_token" ? { value: "tok" } : undefined,
    );
    fetchEventsWithAuthMock.mockResolvedValueOnce({
      ok: false,
      reason: "error",
      message: "bad gateway",
    });

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText(/bad gateway/i)).toBeInTheDocument();
  });
});

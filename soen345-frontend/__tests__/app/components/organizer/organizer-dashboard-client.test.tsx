import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizerDashboardClient } from "@/app/components/organizer/organizer-dashboard-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

vi.mock("@/app/components/dashboard/use-user-profile", () => ({
  useUserProfile: vi.fn(),
}));

import { api } from "@/lib/api";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";

const apiMock = vi.mocked(api);
const useUserProfileMock = vi.mocked(useUserProfile);

function mkEvent(id: string, name: string) {
  return {
    id,
    name,
    description: "",
    date: new Date().toISOString(),
    location: "Hall",
    capacity: 100,
    ticketPrice: 20,
    status: "ACTIVE" as const,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  useUserProfileMock.mockReturnValue({
    user: {
      id: "org-1",
      firstName: "Omar",
      lastName: "Nguyen",
      role: "ORGANIZER",
      paymentInfo: {},
    },
    loading: false,
  });
});

describe("OrganizerDashboardClient", () => {
  it("renders heading and current events list", async () => {
    apiMock.mockResolvedValueOnce([mkEvent("1", "Warm-up Event")]);

    render(
      <OrganizerDashboardClient
        initialEvents={[mkEvent("1", "Warm-up Event")]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /organizer dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/warm-up event/i)).toBeInTheDocument();
    expect(screen.getByText(/hi omar nguyen/i)).toBeInTheDocument();
  });

  it("requests events when refresh is clicked", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (path, options) => {
      const method = options?.method ?? "GET";
      if (path === "/api/events/mine" && method === "GET") return [];
      return [];
    });

    render(<OrganizerDashboardClient initialEvents={[]} />);
    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(apiMock).toHaveBeenCalledWith(
      "/api/events/mine",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("starts editing and prefills form values", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (path, options) => {
      const method = options?.method ?? "GET";
      if (path === "/api/events/mine" && method === "GET") {
        return [mkEvent("1", "Old Name")];
      }
      return [];
    });

    render(
      <OrganizerDashboardClient initialEvents={[mkEvent("1", "Old Name")]} />,
    );

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const nameInput = screen.getByLabelText(/event name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    fireEvent.change(screen.getByLabelText(/^date$/i), {
      target: { value: "2026-04-10T20:30" },
    });

    expect(
      screen.getByRole("button", { name: /update event/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/event name/i)).toHaveValue("Updated Name");
  });

  it("cancels an active event", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (path, options) => {
      const method = options?.method ?? "GET";
      if (path === "/api/events/mine" && method === "GET") {
        return [mkEvent("1", "Cancelable Event")];
      }
      if (path === "/api/events/1/cancel" && method === "PATCH") {
        return {
          ...mkEvent("1", "Cancelable Event"),
          status: "CANCELLED" as const,
        };
      }
      return [];
    });

    render(
      <OrganizerDashboardClient
        initialEvents={[mkEvent("1", "Cancelable Event")]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(apiMock).toHaveBeenCalledWith(
      "/api/events/1/cancel",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(await screen.findByText(/event cancelled/i)).toBeInTheDocument();
  });

  it("shows a sign-up success popup when signup feedback exists in session storage", () => {
    sessionStorage.setItem(
      "auth-feedback",
      JSON.stringify({
        kind: "signup",
        firstName: "Omar",
        lastName: "Nguyen",
      }),
    );

    render(<OrganizerDashboardClient initialEvents={[]} />);

    expect(screen.getByText(/successful sign up/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /organizer account created for omar nguyen\. you can sign in now\./i,
      ),
    ).toBeInTheDocument();
  });

  it("does not render a greeting strip when the organizer profile has no name", () => {
    useUserProfileMock.mockReturnValue({
      user: {
        id: "org-2",
        firstName: "",
        lastName: "",
        role: "ORGANIZER",
        paymentInfo: {},
      },
      loading: false,
    });

    render(<OrganizerDashboardClient initialEvents={[]} />);

    expect(screen.queryByText(/hi organizer/i)).not.toBeInTheDocument();
  });
});

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

import { api } from "@/lib/api";

const apiMock = vi.mocked(api);

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
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/app/components/dashboard/dashboard-client";
import type { Event } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    sizes: _sizes,
    fill: _fill,
    priority: _priority,
  }: {
    alt?: string;
    src?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    <div
      role="img"
      aria-label={alt ?? ""}
      className={className}
      data-testid="mock-next-image"
    />
  ),
}));

vi.mock("@/app/dashboard/logout-button", () => ({
  LogoutButton: () => (
    <button type="button" className="logout-btn">
      Log Out
    </button>
  ),
}));

vi.mock("@/app/components/dashboard/use-user-profile", () => ({
  useUserProfile: vi.fn(),
}));

import { useUserProfile } from "@/app/components/dashboard/use-user-profile";

const useUserProfileMock = vi.mocked(useUserProfile);

function inFutureDays(days: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeEvent(
  overrides: Partial<Event> & Pick<Event, "id" | "name">,
): Event {
  return {
    description: "",
    date: inFutureDays(3),
    location: "Main Hall",
    capacity: 200,
    ticketPrice: 45,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("DashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u1",
        firstName: "Avery",
        lastName: "Stone",
        role: "CUSTOMER",
      },
      loading: false,
    });
  });

  it("renders brand, sidebar controls, category tabs, and logout", () => {
    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={true} />,
    );

    expect(screen.getByText("Tiqthat")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /event views/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Upcoming Events$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Reservation History$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Tickets$/i }),
    ).toBeInTheDocument();

    const categories = screen.getByRole("navigation", {
      name: /event categories/i,
    });
    expect(
      within(categories).getByRole("button", { name: /^All$/i }),
    ).toBeInTheDocument();
    expect(
      within(categories).getByRole("button", { name: /^Movies$/i }),
    ).toBeInTheDocument();
    expect(
      within(categories).getByRole("button", { name: /^Sports$/i }),
    ).toBeInTheDocument();
    expect(
      within(categories).getByRole("button", { name: /^Concerts$/i }),
    ).toBeInTheDocument();
    expect(
      within(categories).getByRole("button", { name: /^Travel$/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/city or postal code/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/artist, event or venue/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/hi avery stone/i)).toBeInTheDocument();
  });

  it("shows a sign-up success popup when signup feedback exists in session storage", () => {
    sessionStorage.setItem(
      "auth-feedback",
      JSON.stringify({
        kind: "signup",
        firstName: "Avery",
        lastName: "Stone",
      }),
    );

    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={false} />,
    );

    expect(screen.getByText(/successful sign up/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /account created for avery stone\. you can sign in now\./i,
      ),
    ).toBeInTheDocument();
  });

  it("does not render a greeting strip when the profile has no name", () => {
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u2",
        firstName: "",
        lastName: "",
        role: "CUSTOMER",
      },
      loading: false,
    });

    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={true} />,
    );

    expect(screen.queryByText(/hi guest/i)).not.toBeInTheDocument();
  });

  it("shows load error banner when loadError is set", () => {
    render(
      <DashboardClient
        events={[]}
        loadError="connection refused"
        isAuthenticated={false}
      />,
    );

    expect(
      screen.getByText(/could not load events from the server/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/connection refused/i)).toBeInTheDocument();
  });

  it("shows tickets placeholder when Tickets sidebar item is selected", async () => {
    const user = userEvent.setup();
    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={false} />,
    );

    await user.click(screen.getByRole("button", { name: /^Tickets$/i }));

    expect(
      screen.getByRole("heading", { name: /^tickets$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please log in to view and manage your reservations/i),
    ).toBeInTheDocument();
  });

  it("shows a movie event on Upcoming + Movies when name matches keywords", () => {
    const events: Event[] = [
      makeEvent({
        id: "e1",
        name: "Indie Film Festival",
        date: inFutureDays(5),
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /^all events$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /indie film festival/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when category has no matches for current sidebar slice", async () => {
    const user = userEvent.setup();
    const events: Event[] = [
      makeEvent({
        id: "e1",
        name: "Indie Film Festival",
        date: inFutureDays(5),
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Sports$/i }));

    expect(
      screen.getByText(/no events match this category and filter/i),
    ).toBeInTheDocument();
  });

  it("excludes past events from the upcoming view", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    past.setHours(19, 0, 0, 0);

    const events: Event[] = [
      makeEvent({
        id: "later",
        name: "Summer film premiere",
        date: inFutureDays(7),
      }),
      makeEvent({
        id: "past",
        name: "Yesterday film matinee",
        date: past.toISOString(),
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /summer film premiere/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /yesterday film matinee/i }),
    ).not.toBeInTheDocument();
  });

  it("shows ticker text for the selected category", async () => {
    const user = userEvent.setup();
    const future = new Date();
    future.setDate(future.getDate() + 2);
    future.setHours(20, 0, 0, 0);

    const events: Event[] = [
      makeEvent({
        id: "t1",
        name: "Jazz Night",
        description: "live concert experience",
        date: inFutureDays(4),
        status: "ACTIVE",
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Concerts$/i }));

    const tickerHits = screen.getAllByText(/CONCERTS:.*Jazz Night/i);
    expect(tickerHits.length).toBeGreaterThanOrEqual(1);
  });

  it("filters events using location and keyword search fields", async () => {
    const user = userEvent.setup();
    const events: Event[] = [
      makeEvent({
        id: "l1",
        name: "Downtown Concert",
        description: "live concert",
        location: "Montreal",
        date: inFutureDays(2),
      }),
      makeEvent({
        id: "l2",
        name: "Cinema Evening",
        description: "movie special",
        location: "Toronto",
        date: inFutureDays(3),
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/city or postal code/i),
      "mont",
    );
    await user.type(
      screen.getByPlaceholderText(/artist, event or venue/i),
      "concert",
    );

    expect(screen.getAllByText(/downtown concert/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/cinema evening/i)).not.toBeInTheDocument();
  });

  it("applies filtering by date range", async () => {
    const user = userEvent.setup();
    const dayA = new Date();
    dayA.setDate(dayA.getDate() + 2);
    dayA.setHours(18, 0, 0, 0);
    const dayB = new Date();
    dayB.setDate(dayB.getDate() + 3);
    dayB.setHours(18, 0, 0, 0);
    const dateValue = `${dayA.getFullYear()}-${String(
      dayA.getMonth() + 1,
    ).padStart(2, "0")}-${String(dayA.getDate()).padStart(2, "0")}`;

    const events: Event[] = [
      makeEvent({
        id: "d1",
        name: "Day A Show",
        date: dayA.toISOString(),
        location: "Montreal",
      }),
      makeEvent({
        id: "d2",
        name: "Day B Show",
        date: dayB.toISOString(),
        location: "Montreal",
      }),
    ];

    render(
      <DashboardClient
        events={events}
        loadError={null}
        isAuthenticated={true}
      />,
    );

    const fromInput = screen.getByLabelText(/from date/i);
    const toInput = screen.getByLabelText(/to date/i);
    await user.type(fromInput, dateValue);
    await user.type(toInput, dateValue);
    expect(screen.getAllByText(/day a show/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/day b show/i)).not.toBeInTheDocument();
  });

  it("allows hiding and unhiding the search bar", async () => {
    const user = userEvent.setup();
    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={true} />,
    );

    expect(screen.getByLabelText(/event search filters/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /hide filters/i }),
    );
    expect(
      screen.queryByLabelText(/event search filters/i),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /show filters/i }),
    );
    expect(screen.getByLabelText(/event search filters/i)).toBeInTheDocument();
  });
});

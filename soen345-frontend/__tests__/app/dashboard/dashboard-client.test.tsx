import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
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
    src,
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
      data-src={typeof src === "string" ? src : ""}
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

function atLocalToday(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeEvent(
  overrides: Partial<Event> & Pick<Event, "id" | "name">,
): Event {
  return {
    description: "",
    date: atLocalToday(18, 0),
    location: "Main Hall",
    capacity: 200,
    ticketPrice: 45,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("DashboardClient", () => {
  it("renders brand, sidebar controls, category tabs, and logout", () => {
    render(
      <DashboardClient events={[]} loadError={null} isAuthenticated={true} />,
    );

    expect(screen.getByText("THE KINETIC")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /event views/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Live$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Upcoming$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Archive$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Tickets$/i }),
    ).toBeInTheDocument();

    const categories = screen.getByRole("navigation", {
      name: /event categories/i,
    });
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
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
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
      screen.getByText(/reserved tickets and confirmations/i),
    ).toBeInTheDocument();
  });

  it("shows a movie event on Live + Movies when name matches keywords", () => {
    const events: Event[] = [
      makeEvent({
        id: "e1",
        name: "Indie Film Festival",
        date: atLocalToday(20, 0),
      }),
    ];

    render(
      <DashboardClient events={events} loadError={null} isAuthenticated={true} />,
    );

    expect(
      screen.getByRole("heading", { name: /^movies$/i }),
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
        date: atLocalToday(20, 0),
      }),
    ];

    render(
      <DashboardClient events={events} loadError={null} isAuthenticated={true} />,
    );

    await user.click(screen.getByRole("button", { name: /^Sports$/i }));

    expect(
      screen.getByText(/no events match this category and filter/i),
    ).toBeInTheDocument();
  });

  it("lists upcoming-only events when Upcoming is selected", async () => {
    const user = userEvent.setup();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    future.setHours(19, 0, 0, 0);

    const events: Event[] = [
      makeEvent({
        id: "later",
        name: "Summer film premiere",
        date: future.toISOString(),
      }),
      makeEvent({
        id: "today",
        name: "Today film matinee",
        date: atLocalToday(10, 0),
      }),
    ];

    render(
      <DashboardClient events={events} loadError={null} isAuthenticated={true} />,
    );

    await user.click(screen.getByRole("button", { name: /^Upcoming$/i }));

    expect(
      screen.getByRole("heading", { name: /summer film premiere/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /today film matinee/i }),
    ).not.toBeInTheDocument();
  });

  it("shows ticker text for the selected category", async () => {
    const user = userEvent.setup();
    const events: Event[] = [
      makeEvent({
        id: "t1",
        name: "Jazz Night",
        description: "live concert experience",
        status: "ACTIVE",
      }),
    ];

    render(
      <DashboardClient events={events} loadError={null} isAuthenticated={true} />,
    );

    await user.click(screen.getByRole("button", { name: /^Concerts$/i }));

    const tickerHits = screen.getAllByText(/CONCERTS:.*Jazz Night/i);
    expect(tickerHits.length).toBeGreaterThanOrEqual(1);
  });
});

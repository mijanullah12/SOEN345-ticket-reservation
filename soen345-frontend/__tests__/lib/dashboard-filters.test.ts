import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventCategoryId } from "@/lib/dashboard-config";
import {
  categoryById,
  eventsForCategory,
  filterBySidebar,
  tickerItems,
} from "@/lib/dashboard-filters";
import type { Event } from "@/lib/types";

function makeEvent(
  overrides: Partial<Event> & Pick<Event, "id" | "name">,
): Event {
  return {
    description: "",
    date: new Date(2025, 5, 15, 14, 0, 0).toISOString(),
    location: "Venue",
    capacity: 100,
    ticketPrice: 25,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("filterBySidebar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("live keeps only active events scheduled for today (local)", () => {
    const events: Event[] = [
      makeEvent({
        id: "1",
        name: "Today show",
        date: new Date(2025, 5, 15, 20, 0, 0).toISOString(),
        status: "ACTIVE",
      }),
      makeEvent({
        id: "2",
        name: "Tomorrow",
        date: new Date(2025, 5, 16, 12, 0, 0).toISOString(),
        status: "ACTIVE",
      }),
      makeEvent({
        id: "3",
        name: "Cancelled today",
        date: new Date(2025, 5, 15, 10, 0, 0).toISOString(),
        status: "CANCELLED",
      }),
    ];

    const out = filterBySidebar(events, "live");
    expect(out.map((e) => e.id)).toEqual(["1"]);
  });

  it("upcoming keeps active events after end of today", () => {
    const events: Event[] = [
      makeEvent({
        id: "1",
        name: "Later",
        date: new Date(2025, 5, 20, 12, 0, 0).toISOString(),
      }),
      makeEvent({
        id: "2",
        name: "Today",
        date: new Date(2025, 5, 15, 18, 0, 0).toISOString(),
      }),
    ];

    const out = filterBySidebar(events, "upcoming");
    expect(out.map((e) => e.id)).toEqual(["1"]);
  });

  it("archive includes cancelled or events before today", () => {
    const events: Event[] = [
      makeEvent({
        id: "1",
        name: "Past",
        date: new Date(2025, 5, 10, 12, 0, 0).toISOString(),
        status: "ACTIVE",
      }),
      makeEvent({
        id: "2",
        name: "Future cancelled",
        date: new Date(2025, 5, 20, 12, 0, 0).toISOString(),
        status: "CANCELLED",
      }),
      makeEvent({
        id: "3",
        name: "Today active",
        date: new Date(2025, 5, 15, 10, 0, 0).toISOString(),
        status: "ACTIVE",
      }),
    ];

    const out = filterBySidebar(events, "archive");
    expect(out.map((e) => e.id).sort()).toEqual(["1", "2"]);
  });

  it("tickets returns no events", () => {
    const events: Event[] = [makeEvent({ id: "1", name: "A" })];
    expect(filterBySidebar(events, "tickets")).toEqual([]);
  });
});

describe("eventsForCategory", () => {
  const movies = categoryById("movies");
  const all = categoryById("all");

  it("matches keywords in name or description (case insensitive)", () => {
    const events: Event[] = [
      makeEvent({ id: "1", name: "Blockbuster Movie Night", description: "" }),
      makeEvent({
        id: "2",
        name: "Symphony",
        description: "Classical music only",
      }),
      makeEvent({ id: "3", name: "CINEMA club", description: "" }),
    ];

    const out = eventsForCategory(events, movies);
    expect(out.map((e) => e.id).sort()).toEqual(["1", "3"]);
  });

  it("returns all events for the all category", () => {
    const events: Event[] = [
      makeEvent({ id: "1", name: "Blockbuster Movie Night" }),
      makeEvent({ id: "2", name: "Championship Match" }),
    ];

    const out = eventsForCategory(events, all);
    expect(out).toHaveLength(2);
  });
});

describe("categoryById", () => {
  it("returns the category definition", () => {
    const sports = categoryById("sports");
    expect(sports.id).toBe("sports");
    expect(sports.keywords).toContain("sport");
  });

  it("throws for unknown id", () => {
    expect(() => categoryById("invalid" as EventCategoryId)).toThrow(
      /Unknown category/,
    );
  });
});

describe("tickerItems", () => {
  it("builds lines from active events in category", () => {
    const movies = categoryById("movies");
    const events: Event[] = [
      makeEvent({
        id: "a",
        name: "Film fest",
        status: "ACTIVE",
      }),
      makeEvent({
        id: "b",
        name: "No keyword",
        status: "ACTIVE",
      }),
    ];

    const items = tickerItems(events, movies);
    expect(items).toHaveLength(1);
    expect(items[0].reactKey).toBe("evt-a");
    expect(items[0].text.toLowerCase()).toContain("film fest");
    expect(items[0].text).toMatch(/^MOVIES:/i);
  });

  it("uses fallback lines when no active category events", () => {
    const concerts = categoryById("concerts");
    const items = tickerItems([], concerts);
    expect(items).toHaveLength(2);
    expect(items[0].reactKey).toBe("fallback-browse");
    expect(items[1].reactKey).toBe("fallback-reserve");
  });
});

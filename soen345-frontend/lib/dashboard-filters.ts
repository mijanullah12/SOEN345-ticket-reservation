import type {
  EventCategoryDefinition,
  EventCategoryId,
} from "@/lib/dashboard-config";
import { EVENT_CATEGORIES } from "@/lib/dashboard-config";
import type { Event } from "@/lib/types";

export type SidebarView = "live" | "upcoming" | "archive" | "tickets";

function eventText(e: Event): string {
  return `${e.name} ${e.description ?? ""}`.toLowerCase();
}

export function eventsForCategory(
  events: Event[],
  category: EventCategoryDefinition,
): Event[] {
  if (category.id === "all") {
    return events;
  }
  return events.filter((e) => {
    if (e.category) {
      return e.category === category.id;
    }
    const text = eventText(e);
    return category.keywords.some((kw) => text.includes(kw.toLowerCase()));
  });
}

export function categoryById(id: EventCategoryId): EventCategoryDefinition {
  const c = EVENT_CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown category: ${id}`);
  return c;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function filterBySidebar(events: Event[], view: SidebarView): Event[] {
  const start = startOfToday();
  const end = endOfToday();

  switch (view) {
    case "live":
      return events.filter((e) => {
        if (e.status === "CANCELLED") return false;
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      });
    case "upcoming":
      return events.filter((e) => {
        if (e.status === "CANCELLED") return false;
        return new Date(e.date).getTime() > end;
      });
    case "archive":
      return events.filter((e) => {
        if (e.status === "CANCELLED") return true;
        return new Date(e.date).getTime() < start;
      });
    case "tickets":
      return [];
    default:
      return events;
  }
}

export interface TickerItem {
  reactKey: string;
  text: string;
}

/** Stable keys use event ids when possible (duplicate track uses `-a` / `-b` suffixes in the UI). */
export function tickerItems(
  events: Event[],
  category: EventCategoryDefinition,
): TickerItem[] {
  const pool = eventsForCategory(events, category).filter(
    (e) => e.status === "ACTIVE",
  );
  const fromEvents = pool.slice(0, 5).map((e) => ({
    reactKey: `evt-${e.id}`,
    text: `${category.label.toUpperCase()}: ${e.name}`,
  }));
  if (fromEvents.length > 0) {
    return fromEvents;
  }
  return [
    {
      reactKey: "fallback-browse",
      text: `${category.label.toUpperCase()}: Browse live listings`,
    },
    {
      reactKey: "fallback-reserve",
      text: "Reserve seats from your dashboard",
    },
  ];
}

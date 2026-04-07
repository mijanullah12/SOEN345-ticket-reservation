import { BACKEND_URL } from "@/lib/backend";
import type { Event } from "@/lib/types";

export type FetchEventsResult =
  | { ok: true; events: Event[] }
  | { ok: false; reason: "unauthorized"; message?: string }
  | { ok: false; reason: "error"; message: string };

export async function fetchEventsPublic(): Promise<FetchEventsResult> {
  const res = await fetch(`${BACKEND_URL}/api/v1/events`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      reason: "error",
      message: text || `Events request failed (${res.status})`,
    };
  }

  const events = (await res.json()) as Event[];
  return { ok: true, events };
}

export async function fetchEventsWithAuth(
  token: string,
): Promise<FetchEventsResult> {
  const res = await fetch(`${BACKEND_URL}/api/v1/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      reason: "error",
      message: text || `Events request failed (${res.status})`,
    };
  }

  const events = (await res.json()) as Event[];
  return { ok: true, events };
}

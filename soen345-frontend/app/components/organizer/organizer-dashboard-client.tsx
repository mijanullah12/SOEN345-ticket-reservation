"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Event, EventWritePayload } from "@/lib/types";

type OrganizerDashboardClientProps = {
  initialEvents: Event[];
};

type FormState = {
  name: string;
  description: string;
  date: string;
  location: string;
  capacity: string;
  ticketPrice: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  date: "",
  location: "",
  capacity: "",
  ticketPrice: "",
};

function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60_000;
  const local = new Date(d.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function eventToForm(event: Event): FormState {
  return {
    name: event.name,
    description: event.description ?? "",
    date: toDateTimeLocalValue(event.date),
    location: event.location,
    capacity: String(event.capacity),
    ticketPrice: String(event.ticketPrice),
  };
}

function validateForm(form: FormState): string | null {
  if (!form.name.trim()) return "Event name is required.";
  if (!form.date) return "Event date is required.";
  if (!form.location.trim()) return "Location is required.";

  const cap = Number(form.capacity);
  if (!Number.isFinite(cap) || cap < 1) {
    return "Capacity must be at least 1.";
  }

  const price = Number(form.ticketPrice);
  if (!Number.isFinite(price) || price < 0) {
    return "Ticket price must be non-negative.";
  }
  return null;
}

function toPayload(form: FormState): EventWritePayload {
  const local = new Date(form.date);
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    date: local.toISOString(),
    location: form.location.trim(),
    capacity: Number(form.capacity),
    ticketPrice: Number(form.ticketPrice),
  };
}

export function OrganizerDashboardClient({
  initialEvents,
}: OrganizerDashboardClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [events],
  );

  const refreshEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await api<Event[]>("/api/events", { method: "GET" });
      setEvents(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to load events.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    // Sync with latest backend state after mount.
    void refreshEvents();
  }, [refreshEvents]);

  function startEdit(event: Event) {
    setEditingId(event.id);
    setForm(eventToForm(event));
    setMessage(null);
    setError(null);
  }

  function clearForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(form);

      if (editingId) {
        await api<Event>(`/api/events/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Event updated.");
      } else {
        await api<Event>("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Event created.");
      }

      clearForm();
      await refreshEvents();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Could not save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelEvent(eventId: string) {
    setMessage(null);
    setError(null);
    try {
      await api<Event>(`/api/events/${eventId}/cancel`, { method: "PATCH" });
      setMessage("Event cancelled.");
      await refreshEvents();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Could not cancel event.");
    }
  }

  return (
    <main className="org-container">
      <section className="org-grid">
        <article className="org-card">
          <div className="org-top-actions">
            <button
              type="button"
              className="org-back-link"
              onClick={() => router.push("/dashboard")}
            >
              Back to Main Dashboard
            </button>
          </div>
          <h1 className="org-title">Organizer Dashboard</h1>
          <p className="org-subtitle">
            Create, update, and cancel events using organizer/admin permissions.
          </p>

          {message ? <p className="org-success">{message}</p> : null}
          {error ? <p className="org-error">{error}</p> : null}

          <form className="org-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="org-name">Event Name</label>
              <input
                id="org-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Neon Nights Tour"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="org-description">Description</label>
              <input
                id="org-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional summary"
              />
            </div>

            <div className="form-group">
              <label htmlFor="org-date">Date</label>
              <input
                id="org-date"
                type="datetime-local"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="org-location">Location</label>
              <input
                id="org-location"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Bell Centre"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="org-capacity">Capacity</label>
                <input
                  id="org-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="org-price">Ticket Price</label>
                <input
                  id="org-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.ticketPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketPrice: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div
              className={`org-actions ${editingId ? "org-actions-editing" : ""}`}
            >
              <button
                type="submit"
                className="dash-btn-solid org-primary-btn"
                disabled={saving}
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Event"
                    : "Create Event"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="dash-btn-solid org-secondary-btn org-secondary-btn-edit"
                  onClick={clearForm}
                  disabled={saving}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="org-card">
          <div className="org-list-head">
            <h2 className="org-list-title">Your Events</h2>
            <button
              type="button"
              className="org-secondary-btn"
              onClick={() => void refreshEvents()}
              disabled={loadingEvents}
            >
              {loadingEvents ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {sortedEvents.length === 0 ? (
            <p className="org-empty">No events yet.</p>
          ) : (
            <ul className="org-event-list">
              {sortedEvents.map((event) => (
                <li key={event.id} className="org-event-item">
                  <div>
                    <p className="org-event-name">{event.name}</p>
                    <p className="org-event-meta">
                      {formatWhen(event.date)} · {event.location} · Cap{" "}
                      {event.capacity} · ${event.ticketPrice}
                    </p>
                    <p
                      className={`org-event-status ${
                        event.status === "ACTIVE"
                          ? "org-event-status-active"
                          : "org-event-status-cancelled"
                      }`}
                    >
                      {event.status}
                    </p>
                  </div>
                  <div className="org-event-actions">
                    <button
                      type="button"
                      className="org-secondary-btn"
                      onClick={() => startEdit(event)}
                    >
                      Edit
                    </button>
                    {event.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className="org-danger-btn"
                        onClick={() => void handleCancelEvent(event.id)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

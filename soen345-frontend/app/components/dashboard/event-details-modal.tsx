"use client";

import { useEffect } from "react";
import type { Event } from "@/lib/types";

export function EventDetailsModal({
  event,
  onClose,
}: {
  event: Event | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!event) return;
    function handleKey(eventKey: KeyboardEvent) {
      if (eventKey.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [event, onClose]);

  if (!event) return null;

  const eventDate = new Date(event.date).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="dash-auth-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="dash-auth-backdrop"
        aria-label="Close event details"
        onClick={onClose}
      />
      <div className="dash-auth-modal-card dash-auth-container">
        <button
          type="button"
          className="dash-auth-modal-close dash-btn-solid"
          aria-label="Close"
          onClick={onClose}
        >
          Close
        </button>
        <div className="auth-card">
          <h2 className="auth-title">{event.name}</h2>
          <p className="auth-subtitle">{event.description ?? "No description."}</p>
          <div className="event-details-grid">
            <div className="event-details-item">
              <p className="event-details-label">Date & time</p>
              <p className="event-details-value">{eventDate}</p>
            </div>
            <div className="event-details-item">
              <p className="event-details-label">Location</p>
              <p className="event-details-value">{event.location}</p>
            </div>
            <div className="event-details-item">
              <p className="event-details-label">Price</p>
              <p className="event-details-value">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(event.ticketPrice)}
              </p>
            </div>
            <div className="event-details-item">
              <p className="event-details-label">Status</p>
              <p className="event-details-value">{event.status}</p>
            </div>
            <div className="event-details-item">
              <p className="event-details-label">Organizer</p>
              <p className="event-details-value">
                {event.organizerName ?? "Unknown"}
              </p>
            </div>
            <div className="event-details-item">
              <p className="event-details-label">Organizer email</p>
              <p className="event-details-value">
                {event.organizerEmail ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

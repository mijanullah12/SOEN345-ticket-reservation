"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  DASHBOARD_BRAND,
  EVENT_CATEGORIES,
  type EventCategoryId,
} from "@/lib/dashboard-config";
import {
  tickerItems as buildTickerItems,
  categoryById,
  eventsForCategory,
  filterBySidebar,
  type SidebarView,
} from "@/lib/dashboard-filters";
import type { Event, Reservation } from "@/lib/types";
import { LogoutButton } from "../../dashboard/logout-button";
import { AuthModal, type AuthModalMode } from "./auth-modal";
import { ProfileMenu } from "./profile-menu";
import { SidebarNavIcon } from "./sidebar-icons";

function formatEventStamp(iso: string): string {
  const d = new Date(iso);
  const date = d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toUpperCase()
    .replace(",", "");
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} / ${time}`;
}

function formatMoney(value: number | string): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const SIDEBAR_ITEMS: { id: SidebarView; label: string }[] = [
  { id: "live", label: "Available Events" },
  { id: "upcoming", label: "Upcoming Events" },
  { id: "archive", label: "Reservation History" },
  { id: "tickets", label: "Tickets" },
];

export function DashboardClient({
  events,
  loadError,
  isAuthenticated,
}: {
  events: Event[];
  loadError: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [sidebarView, setSidebarView] = useState<SidebarView>("live");
  const [categoryId, setCategoryId] = useState<EventCategoryId>("all");
  const [showSearch, setShowSearch] = useState(true);
  const [locationQuery, setLocationQuery] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");
  const [authModal, setAuthModal] = useState<AuthModalMode | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationMessage, setReservationMessage] = useState<string | null>(
    null,
  );
  const [reservationActionKey, setReservationActionKey] = useState<
    string | null
  >(null);

  const category = useMemo(() => categoryById(categoryId), [categoryId]);

  const sidebarFiltered = useMemo(
    () => filterBySidebar(events, sidebarView),
    [events, sidebarView],
  );

  const categoryEvents = useMemo(
    () => eventsForCategory(sidebarFiltered, category),
    [sidebarFiltered, category],
  );

  const searchedEvents = useMemo(() => {
    return categoryEvents.filter((event) => {
      const locationText = event.location.toLowerCase();
      const eventText =
        `${event.name} ${event.description ?? ""}`.toLowerCase();
      const locationOk = locationQuery
        ? locationText.includes(locationQuery.toLowerCase())
        : true;
      const keywordOk = keywordQuery
        ? eventText.includes(keywordQuery.toLowerCase())
        : true;
      const dateOk = dateQuery
        ? new Date(event.date).toDateString() ===
          new Date(`${dateQuery}T00:00:00`).toDateString()
        : true;
      return locationOk && keywordOk && dateOk;
    });
  }, [categoryEvents, dateQuery, keywordQuery, locationQuery]);

  const tickerTrack = useMemo(
    () => buildTickerItems(searchedEvents, category),
    [searchedEvents, category],
  );

  const activeReservationByEventId = useMemo(() => {
    const map = new Map<string, Reservation>();
    for (const reservation of reservations) {
      if (reservation.status === "ACTIVE") {
        map.set(reservation.eventId, reservation);
      }
    }
    return map;
  }, [reservations]);

  const featured = searchedEvents[0];
  const rest = searchedEvents.slice(1, 5);

  const loadReservations = useCallback(async () => {
    if (!isAuthenticated) {
      setReservations([]);
      return;
    }
    setReservationsLoading(true);
    try {
      const data = await api<Reservation[]>("/api/reservations", {
        method: "GET",
      });
      setReservations(data);
      setReservationError(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setReservationError(e.message ?? "Could not load reservations.");
    } finally {
      setReservationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function reserveEvent(eventId: string) {
    if (!isAuthenticated) {
      setAuthModal("login");
      return;
    }
    setReservationMessage(null);
    setReservationError(null);
    setReservationActionKey(`reserve-${eventId}`);
    try {
      await api<Reservation>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({ eventId }),
      });
      setReservationMessage("Reservation confirmed.");
      await loadReservations();
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setReservationError(e.message ?? "Could not reserve ticket.");
    } finally {
      setReservationActionKey(null);
    }
  }

  async function cancelReservation(reservationId: string) {
    setReservationMessage(null);
    setReservationError(null);
    setReservationActionKey(`cancel-${reservationId}`);
    try {
      await api<Reservation>(`/api/reservations/${reservationId}/cancel`, {
        method: "PATCH",
      });
      setReservationMessage("Reservation cancelled.");
      await loadReservations();
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setReservationError(e.message ?? "Could not cancel reservation.");
    } finally {
      setReservationActionKey(null);
    }
  }

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar" aria-label="Main navigation">
        <div className="dash-sidebar-header">
          <p className="dash-brand">{DASHBOARD_BRAND}</p>
        </div>
        <nav className="dash-sidebar-nav" aria-label="Event views">
          <ul className="dash-nav-list">
            {SIDEBAR_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="dash-nav-item"
                  data-active={sidebarView === item.id}
                  onClick={() => setSidebarView(item.id)}
                >
                  <SidebarNavIcon id={item.id} label={item.label} />
                  <span className="dash-nav-item-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="dash-sidebar-footer">
          {isAuthenticated ? <LogoutButton /> : null}
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-main">
            <nav className="dash-category-tabs" aria-label="Event categories">
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="dash-category-tab"
                  data-active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </nav>
            <ProfileMenu
              isAuthenticated={isAuthenticated}
              onOpenAuthModal={setAuthModal}
            />
          </div>
          <div className="dash-search-controls">
            <button
              type="button"
              className="dash-search-toggle"
              onClick={() => setShowSearch((prev) => !prev)}
            >
              {showSearch ? "Hide search filters" : "Show search filters"}
            </button>
          </div>
          {showSearch ? (
            <section className="dash-searchbar" aria-label="Event search filters">
              <label className="dash-search-segment">
                <span>Location</span>
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="City or Postal Code"
                />
              </label>
              <label className="dash-search-segment">
                <span>Dates</span>
                <input
                  type="date"
                  value={dateQuery}
                  onChange={(e) => setDateQuery(e.target.value)}
                />
              </label>
              <label className="dash-search-segment">
                <span>Search</span>
                <input
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  placeholder="Artist, Event or Venue"
                />
              </label>
            </section>
          ) : null}
        </header>

        <div className="dash-ticker" aria-live="polite">
          <div className="dash-ticker-track">
            {tickerTrack.map((item) => (
              <span key={`${item.reactKey}-a`}>{item.text}</span>
            ))}
            {tickerTrack.map((item) => (
              <span key={`${item.reactKey}-b`}>{item.text}</span>
            ))}
          </div>
        </div>

        {loadError ? (
          <p className="dash-error-banner">
            Could not load events from the server. ({loadError})
          </p>
        ) : null}
        {reservationError ? (
          <p className="dash-error-banner">{reservationError}</p>
        ) : null}
        {reservationMessage ? (
          <p className="dash-success-banner">{reservationMessage}</p>
        ) : null}

        <div className="dash-content">
          {sidebarView === "tickets" ? (
            <TicketsPanel
              isAuthenticated={isAuthenticated}
              reservations={reservations}
              loading={reservationsLoading}
              actionKey={reservationActionKey}
              onCancelReservation={cancelReservation}
              onPromptLogin={() => setAuthModal("login")}
            />
          ) : (
            <>
              <CategoryPanels
                categoryId={categoryId}
                categoryEvents={searchedEvents}
                featured={featured}
                rest={rest}
              />
              <ReservePanel
                isAuthenticated={isAuthenticated}
                events={searchedEvents}
                activeReservationByEventId={activeReservationByEventId}
                loading={reservationsLoading}
                actionKey={reservationActionKey}
                onReserve={reserveEvent}
                onCancelReservation={cancelReservation}
                onPromptLogin={() => setAuthModal("login")}
              />
            </>
          )}
        </div>
      </div>

      <AuthModal
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitch={setAuthModal}
        onAuthSuccess={() => {
          setAuthModal(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ReservePanel({
  isAuthenticated,
  events,
  activeReservationByEventId,
  loading,
  actionKey,
  onReserve,
  onCancelReservation,
  onPromptLogin,
}: {
  isAuthenticated: boolean;
  events: Event[];
  activeReservationByEventId: Map<string, Reservation>;
  loading: boolean;
  actionKey: string | null;
  onReserve: (eventId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  onPromptLogin: () => void;
}) {
  const featured = events.slice(0, 4);
  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="dash-reserve-panel">
      <div className="dash-reserve-head">
        <h3 className="dash-reserve-title">Reserve Tickets</h3>
        {!isAuthenticated ? (
          <button
            type="button"
            className="dash-btn-solid"
            onClick={onPromptLogin}
          >
            Log in to reserve
          </button>
        ) : null}
      </div>
      <ul className="dash-reserve-list">
        {featured.map((event) => {
          const activeReservation = activeReservationByEventId.get(event.id);
          const isReserving = actionKey === `reserve-${event.id}`;
          const isCancelling =
            activeReservation && actionKey === `cancel-${activeReservation.id}`;
          return (
            <li key={event.id} className="dash-reserve-item">
              <div>
                <p className="dash-reserve-item-name">{event.name}</p>
                <p className="dash-reserve-item-meta">
                  {new Date(event.date).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {event.location}
                </p>
              </div>
              {activeReservation ? (
                <button
                  type="button"
                  className="dash-btn-solid dash-reserve-cancel"
                  onClick={() => onCancelReservation(activeReservation.id)}
                  disabled={Boolean(isCancelling)}
                >
                  {isCancelling ? "Cancelling..." : "Cancel reservation"}
                </button>
              ) : (
                <button
                  type="button"
                  className="dash-btn-solid"
                  onClick={() => onReserve(event.id)}
                  disabled={Boolean(isReserving || loading)}
                >
                  {isReserving ? "Reserving..." : "Reserve"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TicketsPanel({
  isAuthenticated,
  reservations,
  loading,
  actionKey,
  onCancelReservation,
  onPromptLogin,
}: {
  isAuthenticated: boolean;
  reservations: Reservation[];
  loading: boolean;
  actionKey: string | null;
  onCancelReservation: (reservationId: string) => void;
  onPromptLogin: () => void;
}) {
  if (!isAuthenticated) {
    return (
      <div className="dash-tickets-placeholder">
        <h2 className="dash-section-title">Tickets</h2>
        <p>Please log in to view and manage your reservations.</p>
        <button
          type="button"
          className="dash-btn-solid"
          onClick={onPromptLogin}
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <section className="dash-tickets-panel">
      <h2 className="dash-section-title">Tickets</h2>
      {loading ? <p className="dash-empty">Loading reservations...</p> : null}
      {!loading && reservations.length === 0 ? (
        <p className="dash-empty">No reservations yet.</p>
      ) : null}
      {reservations.length > 0 ? (
        <ul className="dash-tickets-list">
          {reservations.map((reservation) => {
            const isCancelling = actionKey === `cancel-${reservation.id}`;
            return (
              <li key={reservation.id} className="dash-tickets-item">
                <div>
                  <p className="dash-tickets-item-name">
                    {reservation.eventName}
                  </p>
                  <p className="dash-tickets-item-meta">
                    {new Date(reservation.eventDate).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {reservation.eventLocation}
                  </p>
                </div>
                {reservation.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="dash-btn-solid dash-reserve-cancel"
                    onClick={() => onCancelReservation(reservation.id)}
                    disabled={Boolean(isCancelling)}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel"}
                  </button>
                ) : (
                  <span className="dash-ticket-status-cancelled">
                    Cancelled
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function CategoryPanels({
  categoryId,
  categoryEvents,
  featured,
  rest,
}: {
  categoryId: EventCategoryId;
  categoryEvents: Event[];
  featured: Event | undefined;
  rest: Event[];
}) {
  const cat = categoryById(categoryId);

  if (categoryEvents.length === 0) {
    return (
      <>
        <h2 className="dash-section-title">{cat.label}</h2>
        <div className="dash-empty">
          No events match this category and filter. Try another tab or add
          events whose names mention keywords from{" "}
          <code style={{ fontSize: "0.85em" }}>lib/dashboard-config.ts</code>.
        </div>
      </>
    );
  }

  const featureSlides = categoryEvents.slice(0, 5);

  switch (categoryId) {
    case "all":
      return (
        <>
          <FeaturedCarousel
            title="All Events"
            images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
            events={featureSlides}
          />
          <MoviesPanel featured={featured} rest={rest} hints={cat.imageHints} />
        </>
      );
    case "movies":
      return (
        <>
          <FeaturedCarousel
            title="Movies"
            images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
            events={featureSlides}
          />
          <MoviesPanel featured={featured} rest={rest} hints={cat.imageHints} />
        </>
      );
    case "sports":
      return (
        <>
          <FeaturedCarousel
            title="Sports"
            images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
            events={featureSlides}
          />
          <SportsPanel events={categoryEvents} hints={cat.imageHints} />
        </>
      );
    case "concerts":
      return (
        <>
          <FeaturedCarousel
            title="Concerts"
            images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
            events={featureSlides}
          />
          <ConcertsPanel events={categoryEvents} hints={cat.imageHints} />
        </>
      );
    case "travel":
      return (
        <>
          <FeaturedCarousel
            title="Travel"
            images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
            events={featureSlides}
          />
          <TravelPanel featured={featured} hints={cat.imageHints} />
        </>
      );
    default:
      return null;
  }
}

function FeaturedCarousel({
  title,
  images,
  events,
}: {
  title: string;
  images: string[];
  events: Event[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = events.length > 0 ? events : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const activeEvent = slides[activeIndex];
  const imagePool = images.length > 0 ? images : [""];
  const imageSrc = imagePool[activeIndex % imagePool.length];

  return (
    <section
      className="dash-featured-carousel"
      aria-label={`${title} features`}
    >
      <div className="dash-featured-carousel-image-wrap">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="dash-photo"
          sizes="100vw"
          priority
        />
      </div>
      <div className="dash-featured-overlay">
        <h2 className="dash-featured-title">{title}</h2>
        {activeEvent ? (
          <p className="dash-featured-meta">
            {activeEvent.name} · {formatEventStamp(activeEvent.date)} ·{" "}
            {activeEvent.location}
          </p>
        ) : (
          <p className="dash-featured-meta">Browse featured events</p>
        )}
      </div>
    </section>
  );
}

function MoviesPanel({
  featured,
  rest,
  hints,
}: {
  featured: Event | undefined;
  rest: Event[];
  hints: (typeof EVENT_CATEGORIES)[0]["imageHints"];
}) {
  return (
    <>
      <h2 className="dash-section-title">Movies</h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] bg-[var(--dash-surface-muted)]">
          <Image
            src={hints.featured}
            alt=""
            fill
            className="dash-photo"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          {featured ? (
            <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
              <div>
                <span className="dash-card-label">Premiere</span>
                <h3 className="mt-3 max-w-[18ch] text-2xl font-extrabold uppercase tracking-tight text-white drop-shadow-md md:text-3xl">
                  {featured.name}
                </h3>
              </div>
              <p className="self-end text-xs font-bold uppercase tracking-wider text-white drop-shadow">
                {formatEventStamp(featured.date)}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)]">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
            Upcoming releases
          </p>
          <ul className="flex flex-1 flex-col gap-3 text-sm font-semibold">
            {rest.map((e) => (
              <li
                key={e.id}
                className="border-b border-[var(--dash-border)] pb-3 last:border-0"
              >
                <span className="text-[var(--dash-text-muted)]">
                  {new Date(e.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  :{" "}
                </span>
                {e.name}
              </li>
            ))}
          </ul>
          <button type="button" className="dash-btn-solid mt-auto w-full">
            View all films
          </button>
        </div>
      </div>
    </>
  );
}

function SportsPanel({
  events,
  hints,
}: {
  events: Event[];
  hints: (typeof EVENT_CATEGORIES)[0]["imageHints"];
}) {
  const rows = events.slice(0, 2);
  return (
    <>
      <h2 className="dash-section-title">Sports</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col bg-[var(--dash-accent)] p-6 text-[var(--dash-accent-ink)]">
          <h3 className="text-xl font-extrabold uppercase tracking-tight">
            Sports redefined
          </h3>
          <p className="mt-3 text-sm font-medium leading-relaxed opacity-90">
            High-stakes venues and live energy — browse capacity, pricing, and
            schedule from your event feed.
          </p>
          <ul className="mt-6 space-y-2">
            {rows.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between bg-black/10 px-3 py-2 text-xs font-bold uppercase tracking-wide"
              >
                <span>{e.name}</span>
                <span>{e.status === "ACTIVE" ? "Active" : "Cancelled"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[16/10] min-h-[220px] bg-[var(--dash-surface-muted)]">
          <Image
            src={hints.featured}
            alt=""
            fill
            className="dash-photo"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </>
  );
}

function ConcertsPanel({
  events,
  hints,
}: {
  events: Event[];
  hints: (typeof EVENT_CATEGORIES)[0]["imageHints"];
}) {
  const slots = [0, 1, 2].map((i) => ({
    src: hints.thumb[i] ?? hints.featured,
    title: events[i]?.name,
  }));

  return (
    <>
      <h2 className="dash-section-title">Concerts</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {slots.map((slot) => (
          <div
            key={`${slot.src}-${slot.title ?? "poster"}`}
            className="relative aspect-[3/4] bg-[var(--dash-surface-muted)]"
          >
            <Image
              src={slot.src}
              alt={slot.title ?? "Concert"}
              fill
              className="dash-photo"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            {slot.title ? (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white">
                  {slot.title}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

function TravelPanel({
  featured,
  hints,
}: {
  featured: Event | undefined;
  hints: (typeof EVENT_CATEGORIES)[0]["imageHints"];
}) {
  return (
    <>
      <h2 className="dash-section-title">Travel</h2>
      <div className="relative min-h-[320px] w-full bg-[var(--dash-surface-muted)] lg:min-h-[420px]">
        <Image
          src={hints.hero}
          alt=""
          fill
          className="dash-photo"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/20 to-transparent p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <h3 className="text-4xl font-extrabold uppercase tracking-tight text-[var(--dash-accent)] md:text-5xl">
            Travel
          </h3>
          <div className="mt-6 max-w-md text-right md:mt-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white">
              {featured ? featured.name : "Expedition 01: curated journeys"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {featured?.description ??
                "Reserve departures and experiences as soon as travel events are published to the API."}
            </p>
            {featured ? (
              <p className="mt-2 text-xs text-white/80">
                {formatEventStamp(featured.date)} · {featured.location} ·{" "}
                {formatMoney(featured.ticketPrice)}
              </p>
            ) : null}
            <button
              type="button"
              className="dash-btn-solid dash-btn-accent mt-4"
            >
              Start journey
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

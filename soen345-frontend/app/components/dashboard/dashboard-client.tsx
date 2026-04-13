"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";
import { StatusPopup } from "@/app/components/shared/status-popup";
import { ToastContainer, useToast } from "@/app/components/shared/toast";
import { api } from "@/lib/api";
import { buildDisplayName, consumeAuthFeedback } from "@/lib/auth-feedback";
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
import { EventDetailsModal } from "./event-details-modal";
import { PaymentInfoModal } from "./payment-info-modal";
import { ProfileMenu } from "./profile-menu";
import { OrganizerDashboardIcon, SidebarNavIcon } from "./sidebar-icons";

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

function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function eventDisplayName(name: string | null | undefined): string {
  if (!name || !name.trim()) {
    return "your event";
  }
  return name;
}

function buildReceiptMessage(
  reservation: Reservation,
  firstName: string | null | undefined,
): string {
  const safeName = firstName?.trim() ? firstName.trim() : "there";
  const eventName = eventDisplayName(reservation.eventName);
  const dateLine = formatReceiptDate(reservation.eventDate);
  const locationLine = reservation.eventLocation;

  if (reservation.status === "CANCELLED") {
    return (
      `Hi ${safeName},\n\n` +
      "Your reservation has been cancelled.\n" +
      `Event: ${eventName}\n` +
      `Date: ${dateLine}\n` +
      `Location: ${locationLine}\n\n` +
      "If this was a mistake, please make a new reservation."
    );
  }

  return (
    `Hi ${safeName},\n\n` +
    "Your reservation is confirmed.\n" +
    `Event: ${eventName}\n` +
    `Date: ${dateLine}\n` +
    `Location: ${locationLine}\n\n` +
    "Thank you for using our ticket reservation system."
  );
}

const SIDEBAR_ITEMS: { id: SidebarView; label: string }[] = [
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
  const [sidebarView, setSidebarView] = useState<SidebarView>("upcoming");
  const [sessionAuthenticated, setSessionAuthenticated] =
    useState(isAuthenticated);
  const [categoryId, setCategoryId] = useState<EventCategoryId>("all");
  const [showSearch, setShowSearch] = useState(true);
  const [locationQuery, setLocationQuery] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc" | "price-asc" | "price-desc" | "name-asc" | "name-desc">("date-asc");
  const [loginPopupName, setLoginPopupName] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalMode | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();
  const [reservationActionKey, setReservationActionKey] = useState<
    string | null
  >(null);
  const [reserveQuantities, setReserveQuantities] = useState<
    Record<string, number>
  >({});
  const { user: currentUser, loading: profileLoading } =
    useUserProfile(sessionAuthenticated);
  const isOrganizer = currentUser?.role === "ORGANIZER";
  const greetingName = buildDisplayName(
    currentUser?.firstName,
    currentUser?.lastName,
  );

  const category = useMemo(() => categoryById(categoryId), [categoryId]);

  const roleKnown = !profileLoading || !sessionAuthenticated;
  const sidebarItems = useMemo(
    () =>
      SIDEBAR_ITEMS.filter((item) => {
        if (item.id === "tickets" && (!roleKnown || isOrganizer)) return false;
        return true;
      }),
    [isOrganizer, roleKnown],
  );

  useEffect(() => {
    if (isOrganizer && sidebarView === "tickets") {
      setSidebarView("upcoming");
    }
  }, [isOrganizer, sidebarView]);

  useEffect(() => {
    if (isAuthenticated) {
      setSessionAuthenticated(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const feedback = consumeAuthFeedback();
    if (!feedback || feedback.kind !== "signup") {
      return;
    }

    const displayName =
      buildDisplayName(feedback.firstName, feedback.lastName) || "User";
    setLoginPopupName(displayName);
  }, []);

  const sidebarFiltered = useMemo(
    () => filterBySidebar(events, sidebarView),
    [events, sidebarView],
  );

  const categoryEvents = useMemo(
    () => eventsForCategory(sidebarFiltered, category),
    [sidebarFiltered, category],
  );

  const searchedEvents = useMemo(() => {
    const filtered = categoryEvents.filter((event) => {
      const locationText = event.location.toLowerCase();
      const eventText =
        `${event.name} ${event.description ?? ""}`.toLowerCase();
      const locationOk = locationQuery
        ? locationText.includes(locationQuery.toLowerCase())
        : true;
      const keywordOk = keywordQuery
        ? eventText.includes(keywordQuery.toLowerCase())
        : true;

      const eventDate = new Date(event.date);
      const dateFromOk = dateFrom
        ? eventDate >= new Date(`${dateFrom}T00:00:00`)
        : true;
      const dateToOk = dateTo
        ? eventDate <= new Date(`${dateTo}T23:59:59`)
        : true;

      const parsedMin = priceMin !== "" ? Number.parseFloat(priceMin) : null;
      const parsedMax = priceMax !== "" ? Number.parseFloat(priceMax) : null;
      const priceMinOk = parsedMin !== null ? event.ticketPrice >= parsedMin : true;
      const priceMaxOk = parsedMax !== null ? event.ticketPrice <= parsedMax : true;

      return locationOk && keywordOk && dateFromOk && dateToOk && priceMinOk && priceMaxOk;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "price-asc":
          return a.ticketPrice - b.ticketPrice;
        case "price-desc":
          return b.ticketPrice - a.ticketPrice;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [categoryEvents, dateFrom, dateTo, keywordQuery, locationQuery, priceMin, priceMax, sortBy]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string }[] = [];
    if (locationQuery) filters.push({ key: "location", label: `Venue: ${locationQuery}` });
    if (keywordQuery) filters.push({ key: "keyword", label: `Name: ${keywordQuery}` });
    if (dateFrom) filters.push({ key: "dateFrom", label: `From: ${dateFrom}` });
    if (dateTo) filters.push({ key: "dateTo", label: `To: ${dateTo}` });
    if (priceMin) filters.push({ key: "priceMin", label: `Min $${priceMin}` });
    if (priceMax) filters.push({ key: "priceMax", label: `Max $${priceMax}` });
    if (sortBy !== "date-asc") {
      const sortLabels: Record<string, string> = {
        "date-desc": "Date (newest)",
        "price-asc": "Price (low-high)",
        "price-desc": "Price (high-low)",
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
      };
      filters.push({ key: "sort", label: `Sort: ${sortLabels[sortBy]}` });
    }
    return filters;
  }, [locationQuery, keywordQuery, dateFrom, dateTo, priceMin, priceMax, sortBy]);

  const clearFilter = useCallback((key: string) => {
    switch (key) {
      case "location": setLocationQuery(""); break;
      case "keyword": setKeywordQuery(""); break;
      case "dateFrom": setDateFrom(""); break;
      case "dateTo": setDateTo(""); break;
      case "priceMin": setPriceMin(""); break;
      case "priceMax": setPriceMax(""); break;
      case "sort": setSortBy("date-asc"); break;
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setLocationQuery("");
    setKeywordQuery("");
    setDateFrom("");
    setDateTo("");
    setPriceMin("");
    setPriceMax("");
    setSortBy("date-asc");
  }, []);

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
    if (!sessionAuthenticated) {
      setReservations([]);
      return;
    }
    setReservationsLoading(true);
    try {
      const data = await api<Reservation[]>("/api/reservations", {
        method: "GET",
      });
      setReservations(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast(e.message ?? "Could not load reservations.", "error");
    } finally {
      setReservationsLoading(false);
    }
  }, [sessionAuthenticated]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const handleReserveQuantityChange = useCallback(
    (eventId: string, value: number) => {
      const event = events.find((e) => e.id === eventId);
      const max = event?.capacity ?? value;
      const parsed = Number.isFinite(value) ? value : 1;
      const next = Math.max(1, Math.min(max, parsed));
      setReserveQuantities((prev) => ({ ...prev, [eventId]: next }));
    },
    [events],
  );

  const downloadReceipt = useCallback(
    (reservation: Reservation) => {
      const message = buildReceiptMessage(reservation, currentUser?.firstName);
      const blob = new Blob([message], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reservation-${reservation.id}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [currentUser?.firstName],
  );

  async function reserveEvent(eventId: string, quantity: number) {
    if (!sessionAuthenticated) {
      setAuthModal("login");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      addToast("Please select at least 1 ticket.", "error");
      return;
    }
    setReservationActionKey(`reserve-${eventId}`);
    try {
      await api<Reservation>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({ eventId, quantity }),
      });
      addToast("Reservation confirmed! Check your tickets.", "success");
      setReserveQuantities((prev) => ({ ...prev, [eventId]: 1 }));
      await loadReservations();
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e.message ?? "Could not reserve ticket.";
      addToast(message, "error");
      const lower = message.toLowerCase();
      if (lower.includes("payment method") || lower.includes("payment info")) {
        setPaymentModalOpen(true);
      }
    } finally {
      setReservationActionKey(null);
    }
  }

  async function cancelReservation(reservationId: string) {
    setReservationActionKey(`cancel-${reservationId}`);
    try {
      await api<Reservation>(`/api/reservations/${reservationId}/cancel`, {
        method: "PATCH",
      });
      addToast("Reservation cancelled.", "success");
      await loadReservations();
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast(e.message ?? "Could not cancel reservation.", "error");
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
            {sidebarItems.map((item) => (
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
            {isOrganizer ? (
              <li>
                <Link
                  href="/organizer/dashboard"
                  className="dash-nav-item dash-nav-link"
                >
                  <OrganizerDashboardIcon />
                  <span className="dash-nav-item-label">
                    Organizer Dashboard
                  </span>
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
        <div className="dash-sidebar-footer">
          {sessionAuthenticated ? <LogoutButton /> : null}
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          {sessionAuthenticated && greetingName ? (
            <div className="dash-welcome-strip">HI {greetingName}</div>
          ) : null}
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
              isAuthenticated={sessionAuthenticated}
              onOpenAuthModal={setAuthModal}
            />
          </div>
          <div className="dash-search-controls">
            <button
              type="button"
              className="dash-search-toggle"
              onClick={() => setShowSearch((prev) => !prev)}
            >
              {showSearch ? "Hide filters" : "Show filters"}
              {activeFilters.length > 0 && !showSearch ? (
                <span className="dash-filter-badge">{activeFilters.length}</span>
              ) : null}
            </button>
          </div>
          {showSearch ? (
            <section
              className="dash-filter-panel"
              aria-label="Event search filters"
            >
              <div className="dash-filter-row">
                <label className="dash-search-segment">
                  <span>Name</span>
                  <input
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                    placeholder="Name of the event"
                  />
                </label>
                <label className="dash-search-segment">
                  <span>Venue</span>
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Venue of the event"
                  />
                </label>
                <label className="dash-search-segment dash-sort-segment">
                  <span>Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="dash-sort-select"
                  >
                    <option value="date-asc">Date (soonest)</option>
                    <option value="date-desc">Date (latest)</option>
                    <option value="price-asc">Price (low to high)</option>
                    <option value="price-desc">Price (high to low)</option>
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                  </select>
                </label>
              </div>
              <div className="dash-filter-row">
                <label className="dash-search-segment">
                  <span>From date</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </label>
                <label className="dash-search-segment">
                  <span>To date</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </label>
                <label className="dash-search-segment">
                  <span>Min price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="$0"
                  />
                </label>
                <label className="dash-search-segment">
                  <span>Max price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="No limit"
                  />
                </label>
              </div>
              {activeFilters.length > 0 ? (
                <div className="dash-filter-chips">
                  {activeFilters.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className="dash-filter-chip"
                      onClick={() => clearFilter(f.key)}
                      aria-label={`Remove filter: ${f.label}`}
                    >
                      {f.label}
                      <span className="dash-filter-chip-x" aria-hidden="true">&times;</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="dash-filter-clear-all"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
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

        <div className="dash-content">
          {sidebarView === "tickets" && !isOrganizer ? (
            <TicketsPanel
              isAuthenticated={sessionAuthenticated}
              reservations={reservations}
              loading={reservationsLoading}
              actionKey={reservationActionKey}
              onCancelReservation={cancelReservation}
              onDownloadReceipt={downloadReceipt}
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
              {!isOrganizer ? (
                <ReservePanel
                  isAuthenticated={sessionAuthenticated}
                  events={searchedEvents}
                  activeReservationByEventId={activeReservationByEventId}
                  reserveQuantities={reserveQuantities}
                  loading={reservationsLoading}
                  actionKey={reservationActionKey}
                  onReserve={reserveEvent}
                  onReserveQuantityChange={handleReserveQuantityChange}
                  onCancelReservation={cancelReservation}
                  onShowDetails={setDetailsEvent}
                  onPromptLogin={() => setAuthModal("login")}
                />
              ) : null}
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
          setSessionAuthenticated(true);
          void loadReservations();
        }}
      />
      <PaymentInfoModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSaved={() => {
          addToast("Payment info saved. Please try reserving again.", "success");
        }}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <EventDetailsModal
        event={detailsEvent}
        onClose={() => setDetailsEvent(null)}
      />
      <StatusPopup
        open={Boolean(loginPopupName)}
        title="Successful sign up"
        detail={
          loginPopupName
            ? `Account created for ${loginPopupName}. You can sign in now.`
            : undefined
        }
        onClose={() => setLoginPopupName(null)}
      />
    </div>
  );
}

function ReservePanel({
  isAuthenticated,
  events,
  activeReservationByEventId,
  reserveQuantities,
  loading,
  actionKey,
  onReserve,
  onReserveQuantityChange,
  onCancelReservation,
  onShowDetails,
  onPromptLogin,
}: {
  isAuthenticated: boolean;
  events: Event[];
  activeReservationByEventId: Map<string, Reservation>;
  reserveQuantities: Record<string, number>;
  loading: boolean;
  actionKey: string | null;
  onReserve: (eventId: string, quantity: number) => void;
  onReserveQuantityChange: (eventId: string, quantity: number) => void;
  onCancelReservation: (reservationId: string) => void;
  onShowDetails: (event: Event) => void;
  onPromptLogin: () => void;
}) {
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEvents = events.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="dash-reserve-panel">
      <div className="dash-reserve-head">
        <h3 className="dash-reserve-title">Reserve Tickets</h3>
        <span className="dash-reserve-count">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
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
        {pageEvents.map((event) => {
          const activeReservation = activeReservationByEventId.get(event.id);
          const isReserving = actionKey === `reserve-${event.id}`;
          const isCancelling =
            activeReservation && actionKey === `cancel-${activeReservation.id}`;
          const organizerReady = event.organizerPayoutReady !== false;
          const quantity = reserveQuantities[event.id] ?? 1;
          const maxQuantity = event.capacity;
          const invalidQuantity = quantity < 1 || quantity > maxQuantity;
          const reserveDisabled =
            Boolean(isReserving || loading) ||
            !organizerReady ||
            invalidQuantity;
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
                <p className="dash-reserve-item-meta">
                  Organizer: {event.organizerName ?? "Unknown"}
                  {event.organizerEmail ? ` · ${event.organizerEmail}` : ""}
                </p>
                <p className="dash-reserve-item-meta">
                  {formatMoney(event.ticketPrice)} per ticket
                </p>
              </div>
              <div className="dash-reserve-actions">
                <label className="dash-reserve-qty">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    max={maxQuantity > 0 ? maxQuantity : undefined}
                    value={quantity}
                    onChange={(e) =>
                      onReserveQuantityChange(event.id, Number(e.target.value))
                    }
                    disabled={Boolean(activeReservation) || maxQuantity < 1}
                    aria-label={`Tickets for ${event.name}`}
                  />
                </label>
                <button
                  type="button"
                  className="dash-btn-outline"
                  onClick={() => onShowDetails(event)}
                >
                  Details
                </button>
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
                    onClick={() => onReserve(event.id, quantity)}
                    disabled={reserveDisabled}
                  >
                    {isReserving
                      ? "Reserving..."
                      : organizerReady
                        ? "Reserve"
                        : "Organizer payout not set"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 ? (
        <nav className="dash-pagination" aria-label="Reserve tickets pagination">
          <button
            type="button"
            className="dash-pagination-btn dash-pagination-arrow"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className="dash-pagination-btn"
              data-active={i === safePage}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={i === safePage ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            className="dash-pagination-btn dash-pagination-arrow"
            disabled={safePage === totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next page"
          >
            Next
          </button>
          <span className="dash-pagination-info">
            Page {safePage + 1} of {totalPages}
          </span>
        </nav>
      ) : null}
    </section>
  );
}

function TicketsPanel({
  isAuthenticated,
  reservations,
  loading,
  actionKey,
  onCancelReservation,
  onDownloadReceipt,
  onPromptLogin,
}: {
  isAuthenticated: boolean;
  reservations: Reservation[];
  loading: boolean;
  actionKey: string | null;
  onCancelReservation: (reservationId: string) => void;
  onDownloadReceipt: (reservation: Reservation) => void;
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
            const quantity = reservation.quantity ?? 1;
            const total = reservation.eventTicketPrice * quantity;
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
                  <p className="dash-tickets-item-meta">
                    Tickets: {quantity} · Total: {formatMoney(total)}
                  </p>
                </div>
                <div className="dash-tickets-actions">
                  <button
                    type="button"
                    className="dash-btn-outline dash-receipt-btn"
                    onClick={() => onDownloadReceipt(reservation)}
                  >
                    Download receipt
                  </button>
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
                </div>
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
        <FeaturedCarousel
          title="All Events"
          images={[cat.imageHints.hero, ...cat.imageHints.thumb]}
          events={featureSlides}
        />
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

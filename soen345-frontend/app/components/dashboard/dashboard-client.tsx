"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import type { Event } from "@/lib/types";
import { LogoutButton } from "../../dashboard/logout-button";
import { SidebarNavIcon } from "./sidebar-icons";
import { ProfileMenu } from "./profile-menu";
import { AuthModal, type AuthModalMode } from "./auth-modal";

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
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "archive", label: "Archive" },
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
  const [categoryId, setCategoryId] = useState<EventCategoryId>("movies");
  const [authModal, setAuthModal] = useState<AuthModalMode | null>(null);

  const category = useMemo(() => categoryById(categoryId), [categoryId]);

  const sidebarFiltered = useMemo(
    () => filterBySidebar(events, sidebarView),
    [events, sidebarView],
  );

  const categoryEvents = useMemo(
    () => eventsForCategory(sidebarFiltered, category),
    [sidebarFiltered, category],
  );

  const tickerTrack = useMemo(
    () => buildTickerItems(events, category),
    [events, category],
  );

  const featured = categoryEvents[0];
  const rest = categoryEvents.slice(1, 5);

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar" aria-label="Main navigation">
        <div className="dash-sidebar-header">
          <p className="dash-brand">{DASHBOARD_BRAND}</p>
          <p className="dash-sidebar-tagline">
            <span className="dash-sidebar-tagline-strong">DASHBOARD</span>
            <span aria-hidden> · </span>
            <span>EVENT CONTROL</span>
          </p>
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
          {sidebarView === "tickets" ? (
            <div className="dash-tickets-placeholder">
              <h2 className="dash-section-title">Tickets</h2>
              <p>
                Your reserved tickets and confirmations will appear here once
                booking is wired to the API.
              </p>
              {!isAuthenticated ? (
                <button
                  type="button"
                  className="dash-btn-solid"
                  onClick={() => setAuthModal("login")}
                >
                  Log in to view tickets
                </button>
              ) : null}
            </div>
          ) : (
            <CategoryPanels
              categoryId={categoryId}
              categoryEvents={categoryEvents}
              featured={featured}
              rest={rest}
            />
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

  switch (categoryId) {
    case "movies":
      return (
        <MoviesPanel featured={featured} rest={rest} hints={cat.imageHints} />
      );
    case "sports":
      return <SportsPanel events={categoryEvents} hints={cat.imageHints} />;
    case "concerts":
      return <ConcertsPanel events={categoryEvents} hints={cat.imageHints} />;
    case "travel":
      return <TravelPanel featured={featured} hints={cat.imageHints} />;
    default:
      return null;
  }
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

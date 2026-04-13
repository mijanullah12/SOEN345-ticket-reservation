import type { SidebarView } from "@/lib/dashboard-filters";

const iconClass = "dash-nav-icon";

const svgBase = {
  className: iconClass,
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Line-style icons to match THE_KINETIC mockup (stroke icons beside labels). */
export function SidebarNavIcon({
  id,
  label,
}: {
  id: SidebarView;
  label: string;
}) {
  switch (id) {
    case "live":
      return (
        <svg {...svgBase}>
          <title>{label}</title>
          <path d="M12 20v-3" />
          <path d="M8.5 14.5a3.5 3.5 0 0 1 7 0" />
          <path d="M5 11a8 8 0 0 1 14 0" />
          <path d="M2 7a12 12 0 0 1 20 0" />
        </svg>
      );
    case "upcoming":
      return (
        <svg {...svgBase}>
          <title>{label}</title>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "archive":
      return (
        <svg {...svgBase}>
          <title>{label}</title>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      );
    case "tickets":
      return (
        <svg {...svgBase}>
          <title>{label}</title>
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1l-2 1 2 1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1l2-1-2-1V9Z" />
          <path d="M14 8v8" />
        </svg>
      );
    default:
      return null;
  }
}

export function OrganizerDashboardIcon() {
  return (
    <svg {...svgBase}>
      <title>Organizer Dashboard</title>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

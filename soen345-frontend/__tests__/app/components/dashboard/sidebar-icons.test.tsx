import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OrganizerDashboardIcon,
  SidebarNavIcon,
} from "@/app/components/dashboard/sidebar-icons";

describe("SidebarNavIcon", () => {
  it.each([
    ["upcoming", /upcoming/i],
    ["archive", /archive/i],
    ["tickets", /tickets/i],
  ] as const)("renders %s icon", (id, titleRe) => {
    render(<SidebarNavIcon id={id} label={id} />);
    expect(document.querySelector("svg")).toBeTruthy();
    expect(screen.getByTitle(titleRe)).toBeInTheDocument();
  });

  it("returns null for unknown view id", () => {
    const { container } = render(
      <SidebarNavIcon id={"unknown" as never} label="x" />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("OrganizerDashboardIcon", () => {
  it("renders organizer dashboard title", () => {
    render(<OrganizerDashboardIcon />);
    expect(screen.getByTitle(/organizer dashboard/i)).toBeInTheDocument();
  });
});

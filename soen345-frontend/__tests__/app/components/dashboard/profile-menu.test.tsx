import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "@/app/components/dashboard/profile-menu";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/dashboard/logout-button", () => ({
  LogoutButton: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Log out
    </button>
  ),
}));

vi.mock("@/app/components/dashboard/use-user-profile", () => ({
  useUserProfile: vi.fn(),
}));

import type { ReactNode } from "react";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";

const useUserProfileMock = vi.mocked(useUserProfile);

describe("ProfileMenu organizer access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides organizer dashboard for non-organizer users", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u1",
        firstName: "Nora",
        lastName: "User",
        role: "CUSTOMER",
      },
      loading: false,
    });

    render(
      <ProfileMenu isAuthenticated={true} onOpenAuthModal={() => undefined} />,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));

    expect(screen.queryByText(/organizer dashboard/i)).not.toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  it("shows organizer dashboard for organizer users", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u2",
        firstName: "Omar",
        lastName: "Org",
        role: "ORGANIZER",
      },
      loading: false,
    });

    render(
      <ProfileMenu isAuthenticated={true} onOpenAuthModal={() => undefined} />,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));

    expect(screen.getByText(/organizer dashboard/i)).toBeInTheDocument();
  });

  it("shows organizer dashboard for admin users", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({
      user: {
        id: "a1",
        firstName: "Alex",
        lastName: "Admin",
        role: "ADMIN",
      },
      loading: false,
    });

    render(
      <ProfileMenu isAuthenticated={true} onOpenAuthModal={() => undefined} />,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));

    expect(screen.getByText(/organizer dashboard/i)).toBeInTheDocument();
  });

  it("shows You in the avatar when authenticated but name is incomplete", () => {
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u3",
        firstName: "Sam",
        lastName: "",
        role: "CUSTOMER",
      },
      loading: false,
    });

    render(
      <ProfileMenu isAuthenticated={true} onOpenAuthModal={() => undefined} />,
    );

    expect(screen.getByText("Y")).toBeInTheDocument();
  });

  it("opens auth modal modes from the guest menu", async () => {
    const user = userEvent.setup();
    const onOpenAuthModal = vi.fn();
    useUserProfileMock.mockReturnValue({ user: null, loading: false });

    render(
      <ProfileMenu isAuthenticated={false} onOpenAuthModal={onOpenAuthModal} />,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));

    const menu1 = screen.getByRole("menu");
    await user.click(within(menu1).getByRole("button", { name: /^log in$/i }));
    expect(onOpenAuthModal).toHaveBeenLastCalledWith("login");

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    const menu2 = screen.getByRole("menu");
    await user.click(within(menu2).getByRole("button", { name: /^sign up$/i }));
    expect(onOpenAuthModal).toHaveBeenLastCalledWith("signup");

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    const menu3 = screen.getByRole("menu");
    await user.click(
      within(menu3).getByRole("button", { name: /organization signup/i }),
    );
    expect(onOpenAuthModal).toHaveBeenLastCalledWith("orgSignup");
  });

  it("closes the menu when clicking outside", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({ user: null, loading: false });

    render(
      <>
        <ProfileMenu
          isAuthenticated={false}
          onOpenAuthModal={() => undefined}
        />
        <button type="button">outside</button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^outside$/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps the menu open when mousedown hits status popup backdrop", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({
      user: {
        id: "u4",
        firstName: "Ollie",
        lastName: "User",
        role: "CUSTOMER",
      },
      loading: false,
    });

    const backdrop = document.createElement("div");
    backdrop.className = "status-popup-backdrop";
    const inner = document.createElement("span");
    inner.textContent = "popup";
    backdrop.appendChild(inner);
    document.body.appendChild(backdrop);

    render(
      <ProfileMenu isAuthenticated={true} onOpenAuthModal={() => undefined} />,
    );

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(inner);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    document.body.removeChild(backdrop);
  });
});

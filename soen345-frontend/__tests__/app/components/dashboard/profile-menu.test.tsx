import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "@/app/components/dashboard/profile-menu";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: unknown;
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
});

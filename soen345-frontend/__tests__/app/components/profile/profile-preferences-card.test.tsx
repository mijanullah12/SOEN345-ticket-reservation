import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePreferencesCard } from "@/app/components/profile/profile-preferences-card";

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

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

vi.mock("@/app/components/dashboard/use-user-profile", () => ({
  useUserProfile: vi.fn(),
}));

import { useUserProfile } from "@/app/components/dashboard/use-user-profile";
import { api } from "@/lib/api";

const useUserProfileMock = vi.mocked(useUserProfile);
const apiMock = vi.mocked(api);

const BASE_USER = {
  id: "u1",
  firstName: "Talar",
  lastName: "Mustafa",
  email: "talar@example.com",
  phone: "+15145550000",
  role: "CUSTOMER",
  preferredNotificationChannel: "EMAIL" as const,
};

describe("ProfilePreferencesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile in display mode first", () => {
    useUserProfileMock.mockReturnValue({
      user: BASE_USER,
      loading: false,
    });

    render(<ProfilePreferencesCard />);

    expect(screen.getByText(/view your profile details/i)).toBeInTheDocument();
    expect(screen.getByText("talar@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit profile/i }),
    ).toBeInTheDocument();
  });

  it("allows editing and saves updated email", async () => {
    const user = userEvent.setup();
    useUserProfileMock.mockReturnValue({
      user: BASE_USER,
      loading: false,
    });
    apiMock.mockResolvedValue({
      ...BASE_USER,
      email: "updated@example.com",
    });

    render(<ProfilePreferencesCard />);

    await user.click(screen.getByRole("button", { name: /edit profile/i }));
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, "updated@example.com");

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(apiMock).toHaveBeenCalled();
    const latestCall = apiMock.mock.calls.at(-1);
    expect(latestCall?.[0]).toBe("/api/users/me");
    expect(latestCall?.[1]?.method).toBe("PATCH");
    const sentBody = JSON.parse((latestCall?.[1]?.body as string) ?? "{}") as {
      email?: string | null;
    };
    expect(sentBody.email).toBe("updated@example.com");

    await waitFor(() => {
      expect(screen.getByText("updated@example.com")).toBeInTheDocument();
    });
  });
});

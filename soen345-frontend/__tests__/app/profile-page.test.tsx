import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => mockGet(name),
  })),
}));

vi.mock("@/app/components/profile/profile-preferences-card", () => ({
  ProfilePreferencesCard: () => <div data-testid="prefs-card">prefs</div>,
}));

import ProfilePage from "@/app/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("shows preferences when authenticated", async () => {
    mockGet.mockImplementation((name: string) =>
      name === "auth_token" ? { value: "t" } : undefined,
    );
    const ui = await ProfilePage();
    render(ui);
    expect(screen.getByTestId("prefs-card")).toBeInTheDocument();
  });

  it("shows login hint without token", async () => {
    mockGet.mockImplementation(() => undefined);
    const ui = await ProfilePage();
    render(ui);
    expect(screen.getByText(/Please log in/i)).toBeInTheDocument();
  });
});

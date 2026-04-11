import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "@/app/dashboard/logout-button";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const assignMock = vi.fn();
const reloadMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    ) as typeof fetch,
  );
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      pathname: "/dashboard",
      assign: assignMock,
      reload: reloadMock,
    },
  });
});

describe("LogoutButton", () => {
  it("reloads the dashboard after OK when already on /dashboard", async () => {
    const user = userEvent.setup();

    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(screen.getByText(/successful log-out/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^ok$/i }));

    expect(reloadMock).toHaveBeenCalled();
    expect(assignMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

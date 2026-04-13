import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("redirects visitors to the dashboard", () => {
    HomePage();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});

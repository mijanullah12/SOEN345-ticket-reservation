import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/components/auth/login-form", () => ({
  LoginForm: ({ redirect }: { redirect: string }) => (
    <div data-testid="login-form" data-redirect={redirect} />
  ),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("passes redirect from search params to LoginForm", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ redirect: "/profile" }),
    });
    render(ui);
    const form = screen.getByTestId("login-form");
    expect(form.getAttribute("data-redirect")).toBe("/profile");
  });

  it("defaults redirect to /dashboard", async () => {
    const ui = await LoginPage({});
    render(ui);
    expect(screen.getByTestId("login-form").getAttribute("data-redirect")).toBe("/dashboard");
  });
});

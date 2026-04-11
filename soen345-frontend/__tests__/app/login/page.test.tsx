import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/components/auth/login-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const assignMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

import { api } from "@/lib/api";

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      assign: assignMock,
    },
  });
});

describe("LoginForm", () => {
  it("renders the sign-in heading and form fields", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("has a link to the register page", () => {
    render(<LoginForm />);

    const link = screen.getByRole("link", { name: /create one/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("redirects to /dashboard on successful login", async () => {
    apiMock.mockResolvedValueOnce({
      user: { id: "1", firstName: "Nora", lastName: "Stone" },
    });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email or phone/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "Pass1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/successful log in/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back, nora stone\./i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    expect(apiMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: "test@test.com",
        password: "Pass1234",
      }),
    });
    expect(sessionStorage.getItem("auth-feedback")).toContain("Nora");
    expect(sessionStorage.getItem("auth-feedback")).toContain('"kind":"login"');

    await user.click(screen.getByRole("button", { name: /^ok$/i }));

    expect(assignMock).toHaveBeenCalledWith("/dashboard");
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows a sign-up success popup when signup feedback exists", () => {
    sessionStorage.setItem(
      "auth-feedback",
      JSON.stringify({
        kind: "signup",
        firstName: "Nora",
        lastName: "Stone",
      }),
    );

    render(<LoginForm />);

    expect(screen.getByText(/successful sign up/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /account created for nora stone\. you can sign in now\./i,
      ),
    ).toBeInTheDocument();
  });

  it("redirects organizers to /organizer/dashboard on successful login", async () => {
    apiMock.mockResolvedValueOnce({ user: { id: "2", role: "ORGANIZER" } });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email or phone/i), "org@test.com");
    await user.type(screen.getByLabelText(/password/i), "Pass1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(pushMock).toHaveBeenCalledWith("/organizer/dashboard");
  });

  it("rewrites stale tickets redirects to the organizer dashboard", async () => {
    apiMock.mockResolvedValueOnce({ user: { id: "2", role: "ORGANIZER" } });
    const user = userEvent.setup();

    render(<LoginForm redirect="/available-tickets" />);

    await user.type(screen.getByLabelText(/email or phone/i), "org@test.com");
    await user.type(screen.getByLabelText(/password/i), "Pass1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(pushMock).toHaveBeenCalledWith("/organizer/dashboard");
  });

  it("displays an error message on failed login", async () => {
    apiMock.mockRejectedValueOnce({ message: "Invalid credentials" });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email or phone/i), "bad@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a fallback error when the API error has no message", async () => {
    apiMock.mockRejectedValueOnce({});
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email or phone/i), "x@x.com");
    await user.type(screen.getByLabelText(/password/i), "anything");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/login failed\. please try again\./i),
    ).toBeInTheDocument();
  });
});

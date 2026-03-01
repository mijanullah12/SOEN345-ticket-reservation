import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

import { api } from "@/lib/api";
const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders the sign-in heading and form fields", () => {
    render(<LoginPage />);

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
    render(<LoginPage />);

    const link = screen.getByRole("link", { name: /create one/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("redirects to /dashboard on successful login", async () => {
    apiMock.mockResolvedValueOnce({ user: { id: "1" } });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email or phone/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "Pass1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(apiMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: "test@test.com",
        password: "Pass1234",
      }),
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("displays an error message on failed login", async () => {
    apiMock.mockRejectedValueOnce({ message: "Invalid credentials" });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email or phone/i), "bad@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid credentials/i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a fallback error when the API error has no message", async () => {
    apiMock.mockRejectedValueOnce({});
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email or phone/i), "x@x.com");
    await user.type(screen.getByLabelText(/password/i), "anything");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/login failed\. please try again\./i),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/register/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

import { api } from "@/lib/api";
const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterPage", () => {
  it("renders the form with all required fields", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("has a link to the login page", () => {
    render(<RegisterPage />);

    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows validation error when neither email nor phone is provided", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/either email or phone number is required/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "Ab1");
    await user.type(screen.getByLabelText(/confirm password/i), "Ab1");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no number", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "Abcdefgh");
    await user.type(screen.getByLabelText(/confirm password/i), "Abcdefgh");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(
        /password must contain at least one letter and one number/i,
      ),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass5678");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("calls the API and redirects to /login on success", async () => {
    apiMock.mockResolvedValueOnce({ id: "1" });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "jane@test.com");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(apiMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        password: "Pass1234",
        email: "jane@test.com",
      }),
    });
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("sends only phone (not email) when email is empty", async () => {
    apiMock.mockResolvedValueOnce({ id: "2" });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/phone/i), "+14155552671");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(apiMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        password: "Pass1234",
        phone: "+14155552671",
      }),
    });
  });

  it("displays API error message on failure", async () => {
    apiMock.mockRejectedValueOnce({ message: "Email already registered" });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "jane@test.com");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/email already registered/i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("displays field-level errors from the API", async () => {
    apiMock.mockRejectedValueOnce({
      message: "Validation failed",
      fieldErrors: [{ field: "phone", message: "Phone must be in E.164 format" }],
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "jane@test.com");
    await user.type(screen.getByLabelText("Password"), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByText(/phone must be in e\.164 format/i),
    ).toBeInTheDocument();
  });
});

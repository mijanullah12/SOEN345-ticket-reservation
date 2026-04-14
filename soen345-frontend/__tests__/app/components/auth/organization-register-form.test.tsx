import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationRegisterForm } from "@/app/components/auth/organization-register-form";

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
  sessionStorage.clear();
});

describe("OrganizationRegisterForm", () => {
  it("renders organization registration fields", () => {
    render(<OrganizationRegisterForm />);

    expect(
      screen.getByRole("heading", { name: /organization registration/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("links to login when not using modal links", () => {
    render(<OrganizationRegisterForm />);
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("uses modal organizer login button when useModalLinks is set", async () => {
    const user = userEvent.setup();
    const onSwitchToOrgLogin = vi.fn();
    render(
      <OrganizationRegisterForm
        useModalLinks
        onSwitchToOrgLogin={onSwitchToOrgLogin}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /login as organizer/i }),
    );
    expect(onSwitchToOrgLogin).toHaveBeenCalled();
  });

  it("shows validation error when neither email nor phone is provided", async () => {
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(
      await screen.findByText(/either email or phone number is required/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "john@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Ab1");
    await user.type(screen.getByLabelText(/confirm password/i), "Ab1");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no number", async () => {
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "john@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Abcdefgh");
    await user.type(screen.getByLabelText(/confirm password/i), "Abcdefgh");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
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
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "john@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass5678");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("calls register-organizer API and redirects on success", async () => {
    apiMock.mockResolvedValueOnce({ id: "1" });
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Org");
    await user.type(screen.getByLabelText(/^email$/i), "jane@org.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(apiMock).toHaveBeenCalledWith("/api/auth/register-organizer", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Org",
        password: "Pass1234",
        email: "jane@org.com",
      }),
    });
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem("auth-feedback")).toContain(
      '"kind":"signup"',
    );
    expect(sessionStorage.getItem("auth-feedback")).toContain("Jane");
  });

  it("sends only phone when email is empty", async () => {
    apiMock.mockResolvedValueOnce({ id: "2" });
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Org");
    await user.type(screen.getByLabelText(/phone/i), "+14155552671");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(apiMock).toHaveBeenCalledWith("/api/auth/register-organizer", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Org",
        password: "Pass1234",
        phone: "+14155552671",
      }),
    });
  });

  it("invokes onSuccess instead of navigating when provided", async () => {
    apiMock.mockResolvedValueOnce({ id: "3" });
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<OrganizationRegisterForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/first name/i), "Pat");
    await user.type(screen.getByLabelText(/last name/i), "Lee");
    await user.type(screen.getByLabelText(/^email$/i), "pat@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(onSuccess).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("uses custom redirect path after success", async () => {
    apiMock.mockResolvedValueOnce({ id: "4" });
    const user = userEvent.setup();
    render(
      <OrganizationRegisterForm redirectToOrganizerLogin="/custom-login" />,
    );

    await user.type(screen.getByLabelText(/first name/i), "Sam");
    await user.type(screen.getByLabelText(/last name/i), "Kim");
    await user.type(screen.getByLabelText(/^email$/i), "sam@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(pushMock).toHaveBeenCalledWith("/custom-login");
  });

  it("displays API error message on failure", async () => {
    apiMock.mockRejectedValueOnce({ message: "Org email taken" });
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Org");
    await user.type(screen.getByLabelText(/^email$/i), "jane@org.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(await screen.findByText(/org email taken/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("displays generic message when error has no message", async () => {
    apiMock.mockRejectedValueOnce({});
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Org");
    await user.type(screen.getByLabelText(/^email$/i), "jane@org.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(
      await screen.findByText(
        /organization registration failed\. please try again\./i,
      ),
    ).toBeInTheDocument();
  });

  it("displays field-level errors from the API", async () => {
    apiMock.mockRejectedValueOnce({
      message: "Validation failed",
      fieldErrors: [{ field: "email", message: "Invalid email" }],
    });
    const user = userEvent.setup();
    render(<OrganizationRegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Org");
    await user.type(screen.getByLabelText(/^email$/i), "jane@org.com");
    await user.type(screen.getByLabelText(/^password$/i), "Pass1234");
    await user.type(screen.getByLabelText(/confirm password/i), "Pass1234");
    await user.click(
      screen.getByRole("button", { name: /register organization/i }),
    );

    expect(await screen.findByRole("listitem")).toHaveTextContent(/email/i);
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});

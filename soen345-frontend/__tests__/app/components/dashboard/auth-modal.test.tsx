import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthModal } from "@/app/components/dashboard/auth-modal";

vi.mock("@/app/components/auth/login-form", () => ({
  LoginForm: () => <div>Login Form</div>,
}));

vi.mock("@/app/components/auth/register-form", () => ({
  RegisterForm: ({ headerSlot }: { headerSlot?: React.ReactNode }) => (
    <div>
      {headerSlot}
      Customer Register Form
    </div>
  ),
}));

vi.mock("@/app/components/auth/organization-register-form", () => ({
  OrganizationRegisterForm: ({
    headerSlot,
  }: {
    headerSlot?: React.ReactNode;
  }) => (
    <div>
      {headerSlot}
      Organizer Register Form
    </div>
  ),
}));

describe("AuthModal signup tabs", () => {
  it("shows customer signup by default in signup mode", () => {
    render(
      <AuthModal
        mode="signup"
        onClose={() => undefined}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );

    expect(screen.getByRole("tab", { name: /customer/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(/customer register form/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/organizer register form/i),
    ).not.toBeInTheDocument();
  });

  it("shows organizer signup by default when opened from organization signup", () => {
    render(
      <AuthModal
        mode="orgSignup"
        onClose={() => undefined}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );

    expect(screen.getByRole("tab", { name: /organizer/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(/organizer register form/i)).toBeInTheDocument();
  });

  it("lets users switch between signup tabs", async () => {
    const user = userEvent.setup();

    render(
      <AuthModal
        mode="signup"
        onClose={() => undefined}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /organizer/i }));
    expect(screen.getByText(/organizer register form/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /customer/i }));
    expect(screen.getByText(/customer register form/i)).toBeInTheDocument();
  });
});

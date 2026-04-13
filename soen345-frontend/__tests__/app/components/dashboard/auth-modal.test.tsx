import { fireEvent, render, screen } from "@testing-library/react";
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

describe("AuthModal shell", () => {
  it("renders nothing when mode is null", () => {
    const { container } = render(
      <AuthModal
        mode={null}
        onClose={() => undefined}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows login form in login mode", () => {
    render(
      <AuthModal
        mode="login"
        onClose={() => undefined}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );
    expect(screen.getByText(/login form/i)).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <AuthModal
        mode="login"
        onClose={onClose}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop or close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AuthModal
        mode="login"
        onClose={onClose}
        onSwitch={() => undefined}
        onAuthSuccess={() => undefined}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /close authentication modal/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

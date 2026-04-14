import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/components/auth/organization-register-form", () => ({
  OrganizationRegisterForm: () => <div data-testid="org-reg">org</div>,
}));

import OrganizationRegisterPage from "@/app/organization/register/page";

describe("OrganizationRegisterPage", () => {
  it("renders the organization registration form", () => {
    render(<OrganizationRegisterPage />);
    expect(screen.getByTestId("org-reg")).toBeInTheDocument();
  });
});

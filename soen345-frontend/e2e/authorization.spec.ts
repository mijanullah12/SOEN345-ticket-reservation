import { expect, test } from "@playwright/test";
import { loginViaBrowser, registerCustomer } from "./fixtures/auth";

test.describe("Role-based access control", () => {
  test("TC12: unauthenticated user visiting /organizer/dashboard is redirected to login", async ({
    page,
  }) => {
    // No auth cookie — visit organizer dashboard directly
    await page.goto("/organizer/dashboard");

    // Server-side middleware redirects to /login with redirect param
    await expect(page).toHaveURL(
      /\/login\?redirect=%2Forganizer%2Fdashboard/,
    );
  });

  test("TC13: customer visiting /organizer/dashboard is redirected to /dashboard", async ({
    page,
    request,
  }) => {
    // Register and log in as a CUSTOMER (not organizer)
    const customer = await registerCustomer(request);
    await loginViaBrowser(page, customer.email, customer.password);

    // Attempt to access organizer-only route
    await page.goto("/organizer/dashboard");

    // Server-side role check redirects CUSTOMER to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    // Must NOT be the organizer dashboard
    await expect(page).not.toHaveURL(/\/organizer\/dashboard/);
  });
});

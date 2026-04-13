import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";
import { loginViaBrowser, registerCustomer } from "./fixtures/auth";

test.describe("Auth flows", () => {
  test("TC1: register a new customer via the UI form", async ({ page }) => {
    const email = `reg-ui-${randomUUID()}@example.com`;
    const password = "Password123";

    // Visit dashboard as unauthenticated user
    await page.goto("/dashboard");

    // Click "Log in to reserve" in the reserve panel — opens the auth modal in login mode
    await page.getByRole("button", { name: /log in to reserve/i }).first().click();

    // Inside the login form in the modal, click "Create one" (a button when useModalLinks=true)
    // to switch the modal to the signup (register) tab
    await page.getByRole("button", { name: "Create one" }).click();

    // The RegisterForm (Customer tab) is now visible — fill it out
    await page.locator("#firstName").fill("Jane");
    await page.locator("#lastName").fill("Doe");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();

    // After registration the modal closes and the user is back on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    // The auth modal should be gone
    await expect(page.locator("[role='dialog']")).not.toBeVisible();
    // User is now authenticated — logout button appears
    await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
  });

  test("TC2: login with valid credentials shows welcome popup then dashboard", async ({
    page,
    request,
  }) => {
    const user = await registerCustomer(request);
    await page.goto("/login");

    await page.locator("#identifier").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    // StatusPopup "Successful log in" appears
    await expect(page.locator(".status-popup")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();

    // Redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("TC3: login with wrong password shows error message", async ({
    page,
    request,
  }) => {
    const user = await registerCustomer(request);
    await page.goto("/login");

    await page.locator("#identifier").fill(user.email);
    await page.locator("#password").fill("WrongPassword999");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.locator(".auth-error")).toBeVisible();
    await expect(page.locator(".auth-error")).toContainText(/invalid credentials/i);
  });

  test("TC4: logout clears session and dashboard shows unauthenticated state", async ({
    page,
    request,
  }) => {
    const user = await registerCustomer(request);
    await loginViaBrowser(page, user.email, user.password);
    await page.goto("/dashboard");

    // Confirm authenticated (logout button is visible)
    await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();

    await page.getByRole("button", { name: "Log Out" }).click();

    // StatusPopup "Successful log-out" appears
    await expect(page.locator(".status-popup")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();

    // After logout the dashboard reloads in unauthenticated state
    await expect(page.getByRole("button", { name: "Log Out" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /log in to reserve/i }),
    ).toBeVisible();
  });
});

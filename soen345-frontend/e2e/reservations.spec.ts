import { expect, test } from "@playwright/test";
import {
  getBackendToken,
  loginViaBrowser,
  registerCustomer,
  registerOrganizer,
  seedEvent,
  seedReservation,
} from "./fixtures/auth";

test.describe("Reservation flows (customer)", () => {
  test("TC9: customer reserves a ticket via the dashboard UI", async ({
    page,
    request,
  }) => {
    // Seed: organizer + event
    const organizer = await registerOrganizer(request);
    const orgToken = await getBackendToken(
      request,
      organizer.email,
      organizer.password,
    );
    const event = await seedEvent(request, orgToken, {
      name: `Reservable Event ${Date.now()}`,
      capacity: 50,
    });

    // Login as customer via browser
    const customer = await registerCustomer(request);
    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");

    // Find the event in the reserve panel and click Reserve
    const eventItem = page.locator(".dash-reserve-item", {
      hasText: event.name,
    });
    await expect(eventItem).toBeVisible();
    await eventItem.getByRole("button", { name: "Reserve" }).click();

    // After reserving, the button changes to "Cancel reservation"
    await expect(
      eventItem.getByRole("button", { name: "Cancel reservation" }),
    ).toBeVisible();
  });

  test("TC10: customer can view their active reservations in the Tickets tab", async ({
    page,
    request,
  }) => {
    // Seed: organizer + event + customer + reservation
    const organizer = await registerOrganizer(request);
    const orgToken = await getBackendToken(
      request,
      organizer.email,
      organizer.password,
    );
    const event = await seedEvent(request, orgToken, {
      name: `Tickets Tab Event ${Date.now()}`,
      capacity: 50,
    });

    const customer = await registerCustomer(request);
    const custToken = await getBackendToken(
      request,
      customer.email,
      customer.password,
    );
    await seedReservation(request, custToken, event.id);

    // Login as customer via browser
    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");

    // Click the "Tickets" sidebar nav item
    await page
      .locator(".dash-nav-item", { hasText: "Tickets" })
      .click();

    // The event with the active reservation should appear
    await expect(
      page.locator(".dash-reserve-item", { hasText: event.name }),
    ).toBeVisible();

    // The "Cancel reservation" button confirms an active reservation exists
    await expect(
      page
        .locator(".dash-reserve-item", { hasText: event.name })
        .getByRole("button", { name: "Cancel reservation" }),
    ).toBeVisible();
  });

  test("TC11: customer cancels their reservation", async ({
    page,
    request,
  }) => {
    // Seed: organizer + event + customer + reservation
    const organizer = await registerOrganizer(request);
    const orgToken = await getBackendToken(
      request,
      organizer.email,
      organizer.password,
    );
    const event = await seedEvent(request, orgToken, {
      name: `Cancel Reservation Event ${Date.now()}`,
      capacity: 50,
    });

    const customer = await registerCustomer(request);
    const custToken = await getBackendToken(
      request,
      customer.email,
      customer.password,
    );
    await seedReservation(request, custToken, event.id);

    // Login as customer via browser
    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");

    const eventItem = page.locator(".dash-reserve-item", {
      hasText: event.name,
    });
    await expect(
      eventItem.getByRole("button", { name: "Cancel reservation" }),
    ).toBeVisible();

    await eventItem.getByRole("button", { name: "Cancel reservation" }).click();

    // After cancellation the button reverts to "Reserve"
    await expect(
      eventItem.getByRole("button", { name: "Reserve" }),
    ).toBeVisible();
  });
});

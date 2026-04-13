import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  filterDashboardEventsByName,
  getBackendToken,
  loginViaBrowser,
  patchUserPaymentProfile,
  registerCustomer,
  registerOrganizer,
  seedEvent,
  seedReservation,
  type TestEvent,
} from "./fixtures/auth";

/** Seed an organizer and a single event, returning the event. */
async function seedOrganizerEvent(
  request: Parameters<typeof registerOrganizer>[0],
  eventName: string,
): Promise<TestEvent> {
  const organizer = await registerOrganizer(request);
  const orgToken = await getBackendToken(
    request,
    organizer.email,
    organizer.password,
  );
  await patchUserPaymentProfile(request, orgToken, {
    payoutAccountId: "acct_e2e_test",
  });
  return seedEvent(request, orgToken, { name: eventName, capacity: 50 });
}

test.describe("Reservation flows (customer)", () => {
  test("TC9: customer reserves a ticket via the dashboard UI", async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const event = await seedOrganizerEvent(request, `Reservable Event ${id}`);

    const customer = await registerCustomer(request);
    const custToken = await getBackendToken(
      request,
      customer.email,
      customer.password,
    );
    await patchUserPaymentProfile(request, custToken, {
      customerId: "cus_e2e_test",
      defaultPaymentMethodId: "pm_e2e_test",
    });

    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");
    await filterDashboardEventsByName(page, id);

    // Find the event in the reserve panel and click Reserve
    const eventItem = page.locator(".dash-reserve-item", {
      hasText: event.name,
    });
    await expect(eventItem).toBeVisible();
    await eventItem.getByRole("button", { name: "Reserve" }).click();

    // After reserving: "Cancel reservation" appears and "Reserve" is gone
    await expect(
      eventItem.getByRole("button", { name: "Cancel reservation" }),
    ).toBeVisible();
    await expect(
      eventItem.getByRole("button", { name: "Reserve" }),
    ).not.toBeVisible();
  });

  test("TC10: customer can view their active reservations in the Tickets tab", async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const event = await seedOrganizerEvent(request, `Tickets Tab Event ${id}`);

    const customer = await registerCustomer(request);
    const custToken = await getBackendToken(
      request,
      customer.email,
      customer.password,
    );
    await patchUserPaymentProfile(request, custToken, {
      customerId: "cus_e2e_test",
      defaultPaymentMethodId: "pm_e2e_test",
    });
    await seedReservation(request, custToken, event.id);

    // Login as customer via browser
    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");

    // Click the "Tickets" sidebar nav item
    await page.locator(".dash-nav-item", { hasText: "Tickets" }).click();

    // Tickets tab uses dash-tickets-item (not the reserve panel list)
    const ticketRow = page.locator(".dash-tickets-item", {
      hasText: event.name,
    });
    await expect(ticketRow).toBeVisible();

    await expect(
      ticketRow.getByRole("button", { name: "Cancel" }),
    ).toBeVisible();
  });

  test("TC11: customer cancels their reservation", async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const event = await seedOrganizerEvent(
      request,
      `Cancel Reservation Event ${id}`,
    );

    const customer = await registerCustomer(request);
    const custToken = await getBackendToken(
      request,
      customer.email,
      customer.password,
    );
    await patchUserPaymentProfile(request, custToken, {
      customerId: "cus_e2e_test",
      defaultPaymentMethodId: "pm_e2e_test",
    });
    await seedReservation(request, custToken, event.id);

    // Login as customer via browser
    await loginViaBrowser(page, customer.email, customer.password);
    await page.goto("/dashboard");
    await filterDashboardEventsByName(page, id);

    const eventItem = page.locator(".dash-reserve-item", {
      hasText: event.name,
    });
    await expect(
      eventItem.getByRole("button", { name: "Cancel reservation" }),
    ).toBeVisible();

    await eventItem.getByRole("button", { name: "Cancel reservation" }).click();

    // After cancellation: "Reserve" appears and "Cancel reservation" is gone
    await expect(
      eventItem.getByRole("button", { name: "Reserve" }),
    ).toBeVisible();
    await expect(
      eventItem.getByRole("button", { name: "Cancel reservation" }),
    ).not.toBeVisible();
  });
});

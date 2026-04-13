import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  getBackendToken,
  loginViaBrowser,
  registerOrganizer,
  seedEvent,
  type TestUser,
} from "./fixtures/auth";

/** Returns a datetime-local string (YYYY-MM-DDTHH:mm) 6 months from now. */
function futureDateValue(): string {
  const d = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

async function setupOrganizer(
  request: Parameters<typeof registerOrganizer>[0],
  page: Parameters<typeof loginViaBrowser>[0],
): Promise<{ organizer: TestUser; token: string }> {
  const organizer = await registerOrganizer(request);
  const token = await getBackendToken(
    request,
    organizer.email,
    organizer.password,
  );
  await loginViaBrowser(page, organizer.email, organizer.password);
  return { organizer, token };
}

/** Fill the create/update event form fields. Does not submit. */
async function fillEventForm(
  page: Parameters<typeof loginViaBrowser>[0],
  values: {
    name: string;
    description?: string;
    category?: string;
    date?: string;
    location?: string;
    capacity?: string;
    price?: string;
  },
) {
  await page.locator("#org-name").fill(values.name);
  if (values.description !== undefined)
    await page.locator("#org-description").fill(values.description);
  if (values.category !== undefined)
    await page.locator("#org-category").selectOption(values.category);
  if (values.date !== undefined)
    await page.locator("#org-date").fill(values.date);
  if (values.location !== undefined)
    await page.locator("#org-location").fill(values.location);
  if (values.capacity !== undefined)
    await page.locator("#org-capacity").fill(values.capacity);
  if (values.price !== undefined)
    await page.locator("#org-price").fill(values.price);
}

test.describe("Event CRUD (organizer)", () => {
  test("TC5: organizer creates an event via the UI form", async ({
    page,
    request,
  }) => {
    await setupOrganizer(request, page);
    await page.goto("/organizer/dashboard");

    const eventName = `Concert ${randomUUID()}`;
    await fillEventForm(page, {
      name: eventName,
      description: "An E2E test concert",
      category: "concerts",
      date: futureDateValue(),
      location: "Bell Centre, Montreal",
      capacity: "200",
      price: "45",
    });

    await page.getByRole("button", { name: "Create Event" }).click();

    // Success message appears and event is in the list
    await expect(page.locator(".org-success")).toBeVisible();
    await expect(
      page.locator(".org-event-item", { hasText: eventName }),
    ).toBeVisible();
  });

  test("TC6: organizer updates an existing event name", async ({
    page,
    request,
  }) => {
    const { token } = await setupOrganizer(request, page);
    const event = await seedEvent(request, token, {
      name: `Original Event ${randomUUID()}`,
    });

    await page.goto("/organizer/dashboard");

    // Find the event in the list and click Edit
    const eventItem = page.locator(".org-event-item", { hasText: event.name });
    await eventItem.getByRole("button", { name: "Edit" }).click();

    // The form fills with the event's data; update the name
    const updatedName = `Updated Event ${randomUUID()}`;
    await page.locator("#org-name").fill(updatedName);
    await page.getByRole("button", { name: "Update Event" }).click();

    // Success message and updated name in list
    await expect(page.locator(".org-success")).toBeVisible();
    await expect(
      page.locator(".org-event-item", { hasText: updatedName }),
    ).toBeVisible();
  });

  test("TC7: organizer cancels an event", async ({ page, request }) => {
    const { token } = await setupOrganizer(request, page);
    const event = await seedEvent(request, token, {
      name: `Event To Cancel ${randomUUID()}`,
    });

    await page.goto("/organizer/dashboard");

    const eventItem = page.locator(".org-event-item", { hasText: event.name });
    // The cancel button triggers the cancellation directly — no confirmation dialog
    // exists in the current UI. If one is added, this step will need to be updated.
    await eventItem.getByRole("button", { name: "Cancel" }).click();

    // Status badge changes to CANCELLED
    await expect(
      page
        .locator(".org-event-item", { hasText: event.name })
        .locator(".org-event-status"),
    ).toHaveText("CANCELLED");
  });

  test("TC8: events are visible on the public dashboard without login", async ({
    page,
    request,
  }) => {
    // Register organizer and seed event directly via API — no browser login
    const organizer = await registerOrganizer(request);
    const token = await getBackendToken(
      request,
      organizer.email,
      organizer.password,
    );
    const event = await seedEvent(request, token, {
      name: `Public Event ${randomUUID()}`,
    });

    // Visit dashboard as an unauthenticated user (no cookie set)
    await page.goto("/dashboard");

    // Event card or reserve panel entry should be visible
    await expect(
      page.locator(".dash-reserve-item", { hasText: event.name }),
    ).toBeVisible();
  });
});

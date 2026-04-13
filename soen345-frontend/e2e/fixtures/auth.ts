import { randomUUID } from "node:crypto";
import type { APIRequestContext, Page } from "@playwright/test";

const API_BASE = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:8080";
const FRONTEND_BASE =
  process.env.PLAYWRIGHT_FRONTEND_URL ?? "http://localhost:3000";

/** 30 days in milliseconds — used to seed events with a future date. */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestEvent {
  id: string;
  name: string;
  status?: string;
}

export interface TestReservation {
  id: string;
  eventId: string;
}

/**
 * Generate a collision-proof unique email using crypto.randomUUID().
 * Prevents MongoDB duplicate key errors across parallel or repeated runs.
 */
function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

/** Register a CUSTOMER user directly against the Spring Boot backend. */
export async function registerCustomer(
  request: APIRequestContext,
): Promise<TestUser> {
  const user: TestUser = {
    email: uniqueEmail("customer"),
    password: "Password123",
    firstName: "Test",
    lastName: "Customer",
  };
  const res = await request.post(`${API_BASE}/api/v1/auth/register`, {
    data: user,
  });
  if (!res.ok()) {
    throw new Error(
      `registerCustomer failed: ${res.status()} ${await res.text()}`,
    );
  }
  return user;
}

/** Register an ORGANIZER user directly against the Spring Boot backend. */
export async function registerOrganizer(
  request: APIRequestContext,
): Promise<TestUser> {
  const user: TestUser = {
    email: uniqueEmail("organizer"),
    password: "Password123",
    firstName: "Test",
    lastName: "Organizer",
  };
  const res = await request.post(`${API_BASE}/api/v1/auth/register-organizer`, {
    data: user,
  });
  if (!res.ok()) {
    throw new Error(
      `registerOrganizer failed: ${res.status()} ${await res.text()}`,
    );
  }
  return user;
}

/** Login directly against the Spring Boot backend and return the JWT token. */
export async function getBackendToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { identifier: email, password },
  });
  if (!res.ok()) {
    throw new Error(
      `getBackendToken failed: ${res.status()} ${await res.text()}`,
    );
  }
  const body = await res.json();
  return body.accessToken as string;
}

/**
 * Login via the Next.js proxy route. This sets the `auth_token` httpOnly
 * cookie in the browser context so subsequent page navigations are authenticated.
 */
export async function loginViaBrowser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const res = await page.request.post(`${FRONTEND_BASE}/api/auth/login`, {
    data: { identifier: email, password },
  });
  if (!res.ok()) {
    throw new Error(
      `loginViaBrowser failed: ${res.status()} ${await res.text()}`,
    );
  }
}

/**
 * Create an event via the Spring Boot backend and return its id, name, and status.
 * Requires an organizer JWT token.
 */
export async function seedEvent(
  request: APIRequestContext,
  token: string,
  overrides: Partial<{
    name: string;
    description: string;
    location: string;
    capacity: number;
    ticketPrice: number;
    category: string;
  }> = {},
): Promise<TestEvent> {
  const name = overrides.name ?? `E2E Event ${randomUUID()}`;
  const payload = {
    name,
    description: overrides.description ?? "E2E test event",
    date: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
    location: overrides.location ?? "Montreal",
    capacity: overrides.capacity ?? 50,
    ticketPrice: overrides.ticketPrice ?? 10,
    category: overrides.category ?? "concerts",
  };
  const res = await request.post(`${API_BASE}/api/v1/events`, {
    data: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`seedEvent failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return { id: body.id as string, name, status: body.status as string };
}

/**
 * Create a reservation via the Spring Boot backend.
 * Requires a customer JWT token.
 */
export async function seedReservation(
  request: APIRequestContext,
  token: string,
  eventId: string,
): Promise<TestReservation> {
  const res = await request.post(`${API_BASE}/api/v1/reservations`, {
    data: { eventId, quantity: 1 },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(
      `seedReservation failed: ${res.status()} ${await res.text()}`,
    );
  }
  const body = await res.json();
  return { id: body.id as string, eventId };
}

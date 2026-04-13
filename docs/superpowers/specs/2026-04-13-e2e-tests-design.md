# E2E System Tests Design

**Date:** 2026-04-13
**Project:** SOEN345 Ticket Reservation
**Framework:** Playwright (TypeScript)
**Target:** Local dev servers (Next.js :3000 + Spring Boot :8080)

---

## Overview

This spec covers end-to-end system tests for the major CRUD operations and critical user flows of the ticket reservation platform. Tests are written with Playwright using an **API-seeded + UI-verified** strategy: test data is seeded via the REST API before each test, and the browser drives only the flows under test.

---

## Architecture

### Location

Playwright is installed in `soen345-frontend/` alongside the existing Vitest setup. Tests live in `soen345-frontend/e2e/`.

```
soen345-frontend/
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts           # reusable API helpers: registerUser, registerOrganizer, loginViaApi
│   ├── auth.spec.ts          # registration + login + logout flows
│   ├── events.spec.ts        # event CRUD (organizer role)
│   ├── reservations.spec.ts  # reservation flow (customer role)
│   └── authorization.spec.ts # role-based access enforcement
├── playwright.config.ts
└── package.json              # Playwright added as devDependency
```

### Configuration

`playwright.config.ts` targets:
- **Frontend base URL:** `http://localhost:3000`
- **API base URL:** `http://localhost:8080` (used in fixtures)
- **Browser:** Chromium only (sufficient for course project)
- **Retries:** 0 (fail fast, no flake tolerance in CI)

### Test Data Strategy

- All test users use timestamped emails: `test-<timestamp>-<random>@example.com`
- This prevents MongoDB duplicate conflicts across runs
- Each test seeds its own data via `request.post()` (Playwright's built-in API context)
- Authenticated sessions are stored as `storageState` (cookie JSON) and reused within a spec file to avoid re-login per test

---

## Test Cases

### `auth.spec.ts` — Authentication Flows

| # | Test | Setup (API) | Browser Action | Assert |
|---|------|-------------|----------------|--------|
| 1 | Register customer via UI | — | Fill registration form with valid data | Redirected to dashboard; user is authenticated |
| 2 | Login with valid credentials | Register user via API | Fill login form | JWT cookie set; dashboard loads with user's name |
| 3 | Login with wrong password | Register user via API | Submit wrong password | Error message visible on login page |
| 4 | Logout | Login via API + set storageState | Click logout button | Redirected to dashboard/login as unauthenticated guest |

### `events.spec.ts` — Event CRUD (Organizer Role)

| # | Test | Setup (API) | Browser Action | Assert |
|---|------|-------------|----------------|--------|
| 5 | Organizer creates event | Register organizer + login via API | Fill create-event form; submit | Event appears in organizer dashboard list |
| 6 | Organizer updates event | Create event via API | Open event; edit name/description; save | Updated details visible on dashboard |
| 7 | Organizer cancels event | Create event via API | Click cancel on event | Event status shows "Cancelled" |
| 8 | Events visible on public dashboard | Create event via API | Visit `/dashboard` unauthenticated | Event card visible without login |

### `reservations.spec.ts` — Reservation Flow (Customer Role)

| # | Test | Setup (API) | Browser Action | Assert |
|---|------|-------------|----------------|--------|
| 9 | Customer reserves a ticket | Create event + register customer via API | Click "Reserve" on event card | Success feedback; reservation count incremented |
| 10 | Customer views their reservations | Create reservation via API | Navigate to reservations page | Reservation listed with correct event name |
| 11 | Customer cancels reservation | Create reservation via API | Click "Cancel" on reservation | Reservation status shows "Cancelled" |

### `authorization.spec.ts` — Role-Based Access Control

| # | Test | Setup (API) | Browser Action | Assert |
|---|------|-------------|----------------|--------|
| 12 | Customer cannot access organizer dashboard | Register customer + login via API | Navigate to `/organizer/dashboard` | Redirected away (to dashboard or 403 page) |
| 13 | Unauthenticated user is redirected on protected routes | — | Navigate to a protected route directly | Redirected to login page |

---

## Fixtures (`e2e/fixtures/auth.ts`)

Shared helpers used across spec files:

```typescript
// Register a customer user via API, return { email, password, token }
registerCustomer(request, apiBase): Promise<TestUser>

// Register an organizer user via API, return { email, password, token }
registerOrganizer(request, apiBase): Promise<TestUser>

// Login via API and return auth token
loginViaApi(request, apiBase, email, password): Promise<string>

// Set auth cookie on the browser context (storageState shortcut)
setAuthCookie(context, token): Promise<void>
```

All helpers generate unique emails using `Date.now()` to prevent conflicts.

---

## Prerequisites

Both servers must be running before executing tests:
- `cd soen345-backend && ./mvnw spring-boot:run`
- `cd soen345-frontend && npm run dev`

Run tests with:
```bash
cd soen345-frontend
npx playwright test
```

View results:
```bash
npx playwright show-report
```

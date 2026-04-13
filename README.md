# SOEN345-ticket-reservation
A ticket booking application for events such as movies, concerts, travel, or sports. The Ticket Reservation Application allows users to browse events, reserve tickets, and receive confirmations digitally.

## Code coverage

### Backend — JaCoCo (Maven)

From `soen345-backend`, run unit tests. JaCoCo attaches during tests and writes an HTML report when the `test` phase finishes.

**Unix / macOS**

```bash
cd soen345-backend
./mvnw test
```

**Windows (PowerShell)**

```powershell
cd soen345-backend
.\mvnw.cmd test
```

- **HTML report:** open `soen345-backend/target/site/jacoco/index.html` in a browser.
- **Enforce the project rule (≥ 80% line coverage on the analyzed bundle):** run `./mvnw verify` or `.\mvnw.cmd verify`. That runs tests and the `jacoco:check` goal on the `verify` phase; the build fails if coverage is below the threshold.

Some classes are excluded from JaCoCo metrics in `pom.xml` (for example Mongo and Twilio adapter wiring).

### Frontend — Vitest (`@vitest/coverage-v8`)

From `soen345-frontend`:

```bash
cd soen345-frontend
npm run test:coverage
```

- **HTML report:** open `soen345-frontend/coverage/index.html` (output directory is set in `vitest.config.mts`).
- **Thresholds:** line coverage must meet the configured minimum (currently 80% for included `app/` and `lib/` sources); the command fails if not.

Coverage output is gitignored under `soen345-frontend/coverage/`.

## Running Playwright e2e tests

Start the backend (with MongoDB / Atlas) and configure `soen345-frontend/.env`, then follow **End-to-end tests (Playwright)** in [soen345-frontend/README.md](soen345-frontend/README.md).

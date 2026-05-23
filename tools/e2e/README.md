# @sekolahpro/e2e

Playwright end-to-end smoke tests for the SekolahPro web apps.

## Prerequisites

- The app dev stack must be running and reachable at `https://app.sekolahpro.localhost:8443`
  (or override via `E2E_BASE`).
- Workspace dependencies installed at the repo root (`pnpm install`).
- Playwright browsers installed once after deps land:

  ```bash
  pnpm exec playwright install --with-deps chromium
  ```

## Environment variables

| Variable   | Default                                         | Purpose                          |
| ---------- | ----------------------------------------------- | -------------------------------- |
| `E2E_BASE` | `https://app.sekolahpro.localhost:8443`         | Base URL the tests run against.  |
| `E2E_USER` | `Administrator`                                 | Login email/username.            |
| `E2E_PASS` | `admin`                                         | Login password.                  |

## Run

```bash
pnpm --filter @sekolahpro/e2e test
```

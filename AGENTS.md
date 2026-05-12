# AGENTS.md

## Cursor Cloud specific instructions

This is **React-PWA v3** — a client-side-only React PWA starter kit. No backend, database, or Docker services required.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite Dev Server | `npm run dev` | 5173 | Main dev server; also used by Playwright E2E tests |

### Available scripts

See `package.json` scripts section. Key commands:

- **Lint**: `npm run prettier:check`, `npm run lint:check`, `npm run ts:check`
- **Unit tests**: `npm run test:unit` (Vitest; add `-- --run` for single-run mode)
- **E2E tests**: `npm run test:e2e` (Playwright; auto-starts dev server if not running)
- **Build**: `npm run build`

### Gotchas

- Playwright config auto-starts the Vite dev server for E2E tests (via `webServer` config). If the dev server is already running on port 5173, it will reuse it.
- Only Chromium is installed for Playwright by default in the cloud environment. To run all three browsers, install Firefox/WebKit with `npx playwright install --with-deps firefox webkit`.
- The `prepare` script runs `husky install` and copies `env/.shared` to `.env`. This runs automatically on `npm install`.
- ESLint is configured with `--max-warnings=0`, so any warning will cause a non-zero exit code.

### Vercel plugin

The Vercel plugin is pre-installed via the update script (`npx plugins add vercel/vercel-plugin --target cursor`). It provides 26 skills, 3 specialist agents, and 5 slash commands for the Vercel/Next.js ecosystem. The plugin requires Bun (also installed by the update script). No manual setup is needed — it activates automatically for Vercel/Next.js projects.

### PR guidelines

- Always include a demo video (and/or screenshots) of major changes in every PR description. Use `RecordScreen` and/or the `computerUse` subagent to capture working demos before creating or updating the PR.

---
name: run-local-server
description: Start, restart, and verify local development servers safely for Node/PNPM projects and monorepos. Use when a user asks to run a server, restart a dev server, fix port conflicts, or confirm the app is reachable.
---

# Run Local Server

## Detect startup command
- Inspect `package.json` in the current workspace.
- Prefer the repo's documented command (`pnpm dev`, `npm run dev`, or package-filtered dev command).
- If the workspace is a monorepo, run only the required app target.

## Start server safely
- Check whether the target port is already in use with `lsof -nP -iTCP:<port> -sTCP:LISTEN`.
- If occupied, stop only the relevant process when restart is needed.
- Start the server in a TTY session so logs remain visible.

## Verify health
- Wait for a readiness signal in logs (`Ready`, `Listening`, `compiled`).
- Run a lightweight endpoint check with `curl -i`.
- Report URL, port, and response status.

## Handle common startup errors
- `EADDRINUSE`: identify listener and stop stale process.
- Missing env vars: report exact missing keys and expected file.
- External fetch failure: identify blocked host and report network constraint.
- Module resolution failure: report exact import path mismatch.

## Report back
- Command used.
- Startup result.
- Current blocker and next concrete fix step.

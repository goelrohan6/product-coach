---
name: debug-local-issues
description: Systematically debug local app, API, build, and runtime failures in development environments. Use when users report 4xx/5xx errors, failed builds, startup crashes, broken routes, or unclear local regressions.
---

# Debug Local Issues

## Reproduce first
- Re-run the failing action exactly as reported.
- Capture the first actionable error from logs or stack traces.
- Classify failure type: startup, build, runtime, API route, storage, test, or environment.

## Gather high-signal context
- Check current git status and changed files.
- Inspect only files on the error path first.
- Confirm runtime assumptions: port, env vars, DB path, and process collisions.

## Debug workflow
- Isolate the failing boundary (client, API handler, service, storage, external dependency).
- Validate one layer at a time with targeted commands.
- Prefer deterministic checks (`typecheck`, build, focused endpoint call).
- Avoid unrelated refactors while debugging.

## Fix and verify
- Apply the smallest change that resolves the root cause.
- Re-run the exact failing scenario.
- Re-run safety checks for impacted scope.
- Confirm adjacent critical flows still work.

## Common local patterns
- `500`: inspect API route + downstream service + schema parsing.
- `EADDRINUSE`: kill stale process or switch port.
- Build fails on external fetch: identify network dependency blocker.
- `Module not found`: check path/extension/build artifact mismatch.
- DB open failure: verify writable path and permissions.

## Response format
- Root cause.
- Fix implemented.
- Verification evidence.
- Residual risk or follow-up checks.

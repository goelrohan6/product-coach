# Debug Local Issues Workflow

Use this workflow for 4xx/5xx responses, startup crashes, build failures, or unclear local regressions.

## 1. Reproduce first
- Repeat the failing action exactly as reported.
- Capture the first actionable error line from logs/stack traces.

## 2. Classify the failure type
- Startup
- Build/compile
- Runtime
- API route
- Storage/database
- Environment/configuration

## 3. Isolate by boundary
- Narrow to failing layer: client, route handler, service, storage, or external dependency.
- Inspect the smallest relevant file set first.

## 4. Validate assumptions
- Port occupancy.
- Required env vars.
- Writable DB/data path.
- Module path and extension consistency.

## 5. Apply minimal fix
- Change only what is necessary to resolve the root cause.
- Avoid unrelated refactors during incident resolution.

## 6. Verify the fix
- Re-run exact failing scenario.
- Run targeted safety checks (`typecheck`, relevant build/test).
- Confirm adjacent critical flow is still healthy.

## 7. Report result
- Root cause.
- Fix implemented.
- Verification evidence.
- Residual risk and next checks.

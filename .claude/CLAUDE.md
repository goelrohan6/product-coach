# Executive Product Coach - Claude Context

Primary objective:
- Train advanced B2B product decision quality using real-company cases, rubric scoring, and executive-panel critique.

Engineering priorities:
- Keep the app local-first and single-user.
- Preserve schema parity between web APIs and MCP tools.
- Prefer env-based model config (`LITELLM_BASE_URL`, `LITELLM_API_KEY`, `LITELLM_MODEL`).
- Maintain high-rigor feedback quality over generic advice.

Reusable local workflows (Claude-compatible):
- Run local server workflow: `/Users/rohan/Documents/Learning/.claude/workflows/run-local-server.md`
- Debug local issues workflow: `/Users/rohan/Documents/Learning/.claude/workflows/debug-local-issues.md`

Workflow trigger guidance:
- Use `run-local-server` workflow when the request is to start/restart/verify local app servers.
- Use `debug-local-issues` workflow when requests mention 4xx/5xx errors, crashes, failed builds, or unclear regressions.

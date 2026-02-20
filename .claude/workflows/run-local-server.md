# Run Local Server Workflow

Use this workflow when asked to start, restart, or verify a local development server.

## 1. Identify the correct command
- Read `package.json` scripts at repo root and app level.
- Prefer the documented dev command (`pnpm dev`, `npm run dev`, or filtered monorepo command).

## 2. Check for port collisions
- Run `lsof -nP -iTCP:<port> -sTCP:LISTEN` on the expected port (usually 3000).
- If occupied, confirm whether to terminate the existing process when restart is required.

## 3. Start the server with logs visible
- Launch in interactive mode and keep logs attached.
- Wait for a ready signal before declaring success.

## 4. Verify reachability
- Run `curl -i http://localhost:<port>/` (or the app health endpoint).
- Report HTTP status and whether the app is reachable.

## 5. Handle common startup failures
- `EADDRINUSE`: identify and stop stale listener.
- Missing env: list exact variable names and expected env file.
- External fetch/network failure: identify blocked host and surface it as environment constraint.
- Module/path error: report exact unresolved import and expected path.

## 6. Return concise status
- Command executed.
- Current server state.
- Blocking issue (if any) and next concrete fix step.

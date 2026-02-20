# Executive Product Coach

Local-first coaching app for advanced B2B product leadership.

## Objective
Build a rigorous practice environment that improves real-world product judgment for a senior B2B product leader.  
The app trains decision quality across strategy, pricing, segmentation, analytics, customer work, and execution by using:
- named real-company cases with citations
- chat-based challenge flow
- rubric + executive panel feedback
- gamified progression and weakness tracking

## Product outcomes (v1)
- Improve critical thinking quality, not just "right answers"
- Make tradeoffs explicit and measurable
- Build repeatable decision habits under ambiguity and time pressure
- Run fully local-first with BYOK LiteLLM model access
- Support both web usage and MCP clients on the same machine

## Scope (v1)
- Single user only
- No cloud sync or team collaboration
- SQLite local persistence + passcode unlock
- 12-week curriculum with 60 cases and boss-gate progression

## Repo layout
- `apps/web`: Next.js web app (mission map, challenge chat, debrief, skill tree, settings)
- `apps/mcp-server`: MCP stdio server exposing coach tools
- `packages/core-types`: shared Zod schemas and TS types
- `packages/case-library`: curriculum and case content
- `packages/scoring-engine`: panel + deterministic evaluation logic
- `packages/storage`: SQLite schema, encryption, and service layer

## Quick start
1. `pnpm install`
2. `pnpm dev`
3. Open `http://localhost:3000`
4. Optional: copy `.env.example` values into your environment

## Environment variables
LiteLLM (recommended for secure model config via env):
- `LITELLM_BASE_URL`
- `LITELLM_API_KEY`
- `LITELLM_MODEL`

Other runtime vars:
- `MCP_PASSCODE`
- `DATA_DIR`
- `DB_PATH`

When `LITELLM_*` vars are all set, they override saved model settings in the UI.

Where to set:
- Web app: `/Users/rohan/Documents/Learning/apps/web/.env.local` (example in `/Users/rohan/Documents/Learning/apps/web/.env.local.example`)
- MCP server: MCP client env block or shell env (example in `/Users/rohan/Documents/Learning/apps/mcp-server/.env.example`)

## Local data paths
- SQLite DB default: `~/.coach-product-coach/coach.db`
- Encryption key default: `~/.coach-product-coach/master.key`

## MCP
Setup docs: `/Users/rohan/Documents/Learning/apps/mcp-server/docs/README.md`

## Expanded challenge briefs
- Cases now include a structured `expandedBrief` object (history, problem statement, options, 30/60/90 plan, metrics, risks, facts vs assumptions).
- Long-form program brief: `/Users/rohan/Documents/Learning/docs/challenge-briefs.md`

## AI folders
This repo now includes hidden folders for AI tooling and prompts:
- `/Users/rohan/Documents/Learning/.claude`
- `/Users/rohan/Documents/Learning/.cursor`
- `/Users/rohan/Documents/Learning/.gemini`
- `/Users/rohan/Documents/Learning/.copilot`
- `/Users/rohan/Documents/Learning/.ai`

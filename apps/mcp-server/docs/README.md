# MCP Setup: Executive Product Coach

This MCP server exposes your local coaching engine to MCP clients.

## Prerequisites
- `pnpm install`
- Passcode set once in web app (`http://localhost:3000`) or via first unlock
- Environment variable: `MCP_PASSCODE`

## Run MCP server
```bash
cd /Users/rohan/Documents/Learning
MCP_PASSCODE="your-passcode" pnpm --filter @coach/mcp-server dev
```

## Available tools
- `coach.list_program`
- `coach.start_case`
- `coach.submit_response`
- `coach.get_feedback`
- `coach.get_progress`
- `coach.recommend_next_case`

## Claude Desktop example
Add to Claude Desktop MCP config:

```json
{
  "mcpServers": {
    "executive-product-coach": {
      "command": "pnpm",
      "args": ["--filter", "@coach/mcp-server", "start"],
      "cwd": "/Users/rohan/Documents/Learning",
      "env": {
        "MCP_PASSCODE": "your-passcode",
        "DB_PATH": "/Users/rohan/.coach-product-coach/coach.db"
      }
    }
  }
}
```

## Gemini-compatible MCP client example
```json
{
  "name": "executive-product-coach",
  "transport": {
    "type": "stdio",
    "command": "pnpm",
    "args": ["--filter", "@coach/mcp-server", "start"],
    "cwd": "/Users/rohan/Documents/Learning",
    "env": {
      "MCP_PASSCODE": "your-passcode"
    }
  }
}
```

## Notes
- Data remains local by default in `~/.coach-product-coach/coach.db`.
- LiteLLM API keys are encrypted at rest.
- If tools return unlock/session errors, verify `MCP_PASSCODE` matches your local passcode.
- `coach.start_case` now returns `scenario.expandedBrief` for richer pre-read context (history, options, execution plan, risks, facts vs assumptions).

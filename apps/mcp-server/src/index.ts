import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { CoachService } from "@coach/storage";
import { runTool, TOOL_SPECS } from "./tools.js";

class TokenProvider {
  private token: string | null = null;

  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    this.token = "local-coach-token";
    return this.token;
  }
}

const service = CoachService.instance();
const tokenProvider = new TokenProvider();

const server = new Server(
  {
    name: "executive-product-coach-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_SPECS
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const input = request.params.arguments ?? {};

  try {
    const result = await runTool(name, input, {
      service,
      getToken: () => tokenProvider.getToken()
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool execution error";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: message }, null, 2)
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`MCP server failed to start: ${message}\n`);
  process.exit(1);
});

import { z } from "zod";
import {
  CaseMessageRequestSchema,
  EvaluateCaseRequestSchema,
  StartCaseRequestSchema
} from "@coach/core-types";
import { CoachService } from "@coach/storage";

export type ToolContext = {
  service: CoachService;
  getToken: () => Promise<string>;
};

type ToolSpec = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const emptySchema = z.object({}).optional();

const toolInputValidators = {
  "coach.list_program": emptySchema,
  "coach.start_case": StartCaseRequestSchema,
  "coach.submit_response": CaseMessageRequestSchema,
  "coach.get_feedback": EvaluateCaseRequestSchema,
  "coach.get_progress": emptySchema,
  "coach.recommend_next_case": emptySchema
};

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: "coach.list_program",
    description: "List the full 12-week advanced product leadership curriculum.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "coach.start_case",
    description: "Start a coaching case by caseId or get the recommended next case.",
    inputSchema: {
      type: "object",
      properties: {
        caseId: { type: "string", description: "Optional case id to start." }
      },
      additionalProperties: false
    }
  },
  {
    name: "coach.submit_response",
    description: "Submit a user response for an active case session and receive coach feedback.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        message: { type: "string" },
        timedMode: { type: "boolean" }
      },
      required: ["sessionId", "message"],
      additionalProperties: false
    }
  },
  {
    name: "coach.get_feedback",
    description: "Evaluate a finished memo for a session and return panel + rubric feedback.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        finalMemo: { type: "string" }
      },
      required: ["sessionId", "finalMemo"],
      additionalProperties: false
    }
  },
  {
    name: "coach.get_progress",
    description: "Fetch progression stats including XP, level, streaks, and skill mastery.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "coach.recommend_next_case",
    description: "Get the best next case recommendation based on weaknesses and completion history.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

function ensureKnownTool(name: string): asserts name is keyof typeof toolInputValidators {
  if (!(name in toolInputValidators)) {
    throw new Error(`Unsupported tool: ${name}`);
  }
}

function parseToolInput(name: string, input: unknown): unknown {
  ensureKnownTool(name);
  const validator = toolInputValidators[name];

  if (validator === emptySchema) {
    return emptySchema.parse(input ?? {});
  }

  return validator.parse(input ?? {});
}

export async function runTool(name: string, input: unknown, context: ToolContext): Promise<unknown> {
  const token = await context.getToken();
  const parsedInput = parseToolInput(name, input);

  switch (name) {
    case "coach.list_program":
      return context.service.getCurriculum(token);
    case "coach.start_case":
      return context.service.startCase(token, parsedInput as z.infer<typeof StartCaseRequestSchema>);
    case "coach.submit_response":
      return context.service.messageCase(token, parsedInput as z.infer<typeof CaseMessageRequestSchema>);
    case "coach.get_feedback":
      return context.service.evaluateCase(token, parsedInput as z.infer<typeof EvaluateCaseRequestSchema>);
    case "coach.get_progress":
      return context.service.getProgress(token);
    case "coach.recommend_next_case":
      return context.service.recommendNextCase(token);
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { StartCaseRequestSchema } from "@coach/core-types";
import {
  badRequestResponse,
  coachService,
  internalErrorResponse
} from "@/lib/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = StartCaseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid case start payload");
    }

    const result = await coachService().startCase("", parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    if (message.toLowerCase().includes("locked")) {
      return NextResponse.json({ error: message }, { status: 423 });
    }

    return internalErrorResponse(error);
  }
}

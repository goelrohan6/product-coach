import { NextRequest, NextResponse } from "next/server";
import { CaseMessageRequestSchema } from "@coach/core-types";
import {
  badRequestResponse,
  coachService,
  internalErrorResponse
} from "@/lib/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CaseMessageRequestSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid case message payload");
    }

    const result = await coachService().messageCase("", parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

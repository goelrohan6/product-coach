import { NextRequest, NextResponse } from "next/server";
import { EvaluateCaseRequestSchema } from "@coach/core-types";
import {
  badRequestResponse,
  coachService,
  internalErrorResponse
} from "@/lib/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EvaluateCaseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid evaluate payload");
    }

    const result = await coachService().evaluateCase("", parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

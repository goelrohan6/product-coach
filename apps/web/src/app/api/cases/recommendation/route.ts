import { NextResponse } from "next/server";
import { RecommendNextCaseResponseSchema } from "@coach/core-types";
import { coachService, internalErrorResponse } from "@/lib/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const recommendation = await coachService().recommendNextCase("");
    const result = RecommendNextCaseResponseSchema.parse({ recommendation });
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

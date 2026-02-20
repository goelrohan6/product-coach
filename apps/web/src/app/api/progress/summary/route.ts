import { NextResponse } from "next/server";
import { coachService, internalErrorResponse } from "@/lib/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await coachService().getProgress("");
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

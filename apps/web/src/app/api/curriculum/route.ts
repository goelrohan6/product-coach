import { NextResponse } from "next/server";
import { coachService, internalErrorResponse } from "@/lib/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await coachService().getCurriculum("");
    return NextResponse.json(data);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { coachService, internalErrorResponse } from "@/lib/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await coachService().getActiveSession("");
    if (result) {
      return NextResponse.json({ session: result.session, scenario: result.scenario });
    }
    return NextResponse.json({ session: null, scenario: null });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

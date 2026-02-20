import { NextResponse } from "next/server";
import { coachService, internalErrorResponse } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await coachService().getEvaluation("", id);
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

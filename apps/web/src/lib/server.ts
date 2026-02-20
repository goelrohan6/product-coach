import { NextResponse } from "next/server";
import { CoachService } from "@coach/storage";

export function coachService(): CoachService {
  return CoachService.instance();
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function internalErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  // Log full error server-side to debug API 500s in local development.
  // eslint-disable-next-line no-console
  console.error("[api-error]", error);
  return NextResponse.json({ error: message }, { status: 500 });
}

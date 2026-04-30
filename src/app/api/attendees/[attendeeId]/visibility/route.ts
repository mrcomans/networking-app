import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { setAttendeeVisibility } from "@/lib/store";
import type { AttendeeVisibility } from "@/lib/model";

export async function POST(req: NextRequest, ctx: { params: Promise<{ attendeeId: string }> }) {
  const { attendeeId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`attendees:visibility:${attendeeId}:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const visibility = (body as { visibility?: unknown }).visibility;
  if (visibility !== "public" && visibility !== "hidden" && visibility !== "connections_only") {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  const updated = await setAttendeeVisibility(attendeeId, visibility as AttendeeVisibility);
  if (!updated) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
  return NextResponse.json({ attendee: updated });
}


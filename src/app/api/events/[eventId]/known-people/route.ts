import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getEventById, getKnownPeopleForEvent } from "@/lib/store";

export async function GET(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const event = await getEventById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`known:read:${eventId}:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const attendeeId = req.nextUrl.searchParams.get("attendeeId") ?? "";
  if (!attendeeId) return NextResponse.json({ error: "attendeeId is required" }, { status: 400 });

  const matches = await getKnownPeopleForEvent({ eventId, viewerAttendeeId: attendeeId });
  if (!matches) return NextResponse.json({ error: "Viewer not found" }, { status: 404 });

  return NextResponse.json({ event: { id: event.id, name: event.name }, matches });
}


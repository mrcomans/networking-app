import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getEventById, listAttendeesForEvent, registerAttendee } from "@/lib/store";
import type { AttendeeVisibility } from "@/lib/model";

export async function GET(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const event = await getEventById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`attendees:list:${eventId}:${ip}`, { capacity: 60, refillPerSecond: 1 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const offsetParam = req.nextUrl.searchParams.get("offset");
  const limit = limitParam ? Number(limitParam) : undefined;
  const offset = offsetParam ? Number(offsetParam) : undefined;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }
  if (offset !== undefined && (!Number.isFinite(offset) || offset < 0)) {
    return NextResponse.json({ error: "offset must be a non-negative number" }, { status: 400 });
  }

  const result = await listAttendeesForEvent({ eventId, limit, offset });
  return NextResponse.json({ event: { id: event.id, name: event.name }, ...result });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const event = await getEventById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`attendees:register:${eventId}:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = (body as { displayName?: unknown }).displayName;
  if (typeof displayName !== "string" || displayName.trim().length < 2) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }

  const email = (body as { email?: unknown }).email;
  const visibility = (body as { visibility?: unknown }).visibility;
  const parsedVisibility: AttendeeVisibility =
    visibility === "public" || visibility === "hidden" || visibility === "connections_only"
      ? visibility
      : "hidden";

  const attendee = await registerAttendee({
    eventId,
    displayName: displayName.trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : undefined,
    visibility: parsedVisibility,
  });

  return NextResponse.json({ attendee }, { status: 201 });
}


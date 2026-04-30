import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { setAttendeeUploadConnections } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ attendeeId: string }> }) {
  const { attendeeId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`attendees:connections:${attendeeId}:${ip}`, {
    capacity: 10,
    refillPerSecond: 0.2,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const connectionsText = (body as { connectionsText?: unknown }).connectionsText;
  if (typeof connectionsText !== "string" || connectionsText.trim().length < 2) {
    return NextResponse.json({ error: "connectionsText is required" }, { status: 400 });
  }

  const result = await setAttendeeUploadConnections(attendeeId, connectionsText);
  if (!result) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });

  return NextResponse.json({ uploaded: result });
}


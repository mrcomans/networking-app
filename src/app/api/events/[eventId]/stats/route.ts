import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getEventById, getEventStats } from "@/lib/store";

export async function GET(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const event = await getEventById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`stats:read:${eventId}:${ip}`, { capacity: 60, refillPerSecond: 1 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const stats = await getEventStats(eventId);
  return NextResponse.json({ event: { id: event.id, name: event.name }, stats });
}


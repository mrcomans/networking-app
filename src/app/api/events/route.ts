import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { createEvent } from "@/lib/store";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`events:create:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body as { name?: unknown }).name;
  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Event name is required" }, { status: 400 });
  }

  const event = await createEvent({ name: name.trim() });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const joinPath = `/e/${event.slug}`;
  const joinUrl = baseUrl ? `${baseUrl}${joinPath}` : joinPath;

  return NextResponse.json({ event, joinUrl }, { status: 201 });
}


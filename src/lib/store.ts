import crypto from "node:crypto";
import {
  type AttendeeRecord,
  type AttendeeVisibility,
  type EventRecord,
} from "@/lib/model";
import { query, withClient } from "@/lib/db";
import { normalizePersonKey } from "@/lib/normalize";

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function randomSlug() {
  // ~10 chars base64url-ish, fine for a demo
  return crypto.randomBytes(8).toString("base64url");
}

export async function createEvent(input: { name: string }): Promise<EventRecord> {
  const id = randomId("evt");
  const slug = randomSlug();
  const record: EventRecord = {
    id,
    slug,
    name: input.name,
    createdAt: nowIso(),
  };

  await query(
    `INSERT INTO events (id, slug, name, created_at) VALUES ($1, $2, $3, $4)`,
    [record.id, record.slug, record.name, record.createdAt]
  );
  return record;
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const res = await query<{ id: string; slug: string; name: string; created_at: string }>(
    `SELECT id, slug, name, created_at FROM events WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  const row = res.rows[0];
  if (!row) return null;
  return { id: row.id, slug: row.slug, name: row.name, createdAt: row.created_at };
}

export async function getEventById(eventId: string): Promise<EventRecord | null> {
  const res = await query<{ id: string; slug: string; name: string; created_at: string }>(
    `SELECT id, slug, name, created_at FROM events WHERE id = $1 LIMIT 1`,
    [eventId]
  );
  const row = res.rows[0];
  if (!row) return null;
  return { id: row.id, slug: row.slug, name: row.name, createdAt: row.created_at };
}

export async function listEvents(input?: { limit?: number }): Promise<EventRecord[]> {
  const limit = Math.max(1, Math.min(100, input?.limit ?? 20));
  const res = await query<{ id: string; slug: string; name: string; created_at: string }>(
    `SELECT id, slug, name, created_at
     FROM events
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
  }));
}

export async function registerAttendee(input: {
  eventId: string;
  displayName: string;
  email?: string;
  visibility?: AttendeeVisibility;
}): Promise<AttendeeRecord> {
  const id = randomId("att");
  const record: AttendeeRecord = {
    id,
    eventId: input.eventId,
    displayName: input.displayName,
    email: input.email,
    visibility: input.visibility ?? "hidden",
    createdAt: nowIso(),
  };
  const displayNameKey = normalizePersonKey(record.displayName);

  await withClient(async (client) => {
    await client.query(
      `INSERT INTO attendees (id, event_id, display_name, display_name_key, email, visibility, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.id,
        record.eventId,
        record.displayName,
        displayNameKey,
        record.email ?? null,
        record.visibility,
        record.createdAt,
      ]
    );

    await client.query(
      `INSERT INTO identity_links (attendee_id, provider, provider_user_id, created_at)
       VALUES ($1, 'none', NULL, NOW())
       ON CONFLICT (attendee_id) DO NOTHING`,
      [record.id]
    );
  });

  return record;
}

export async function setAttendeeVisibility(attendeeId: string, visibility: AttendeeVisibility) {
  const res = await query<{ id: string; event_id: string; display_name: string; email: string | null; visibility: AttendeeVisibility; created_at: string }>(
    `UPDATE attendees
     SET visibility = $2
     WHERE id = $1
     RETURNING id, event_id, display_name, email, visibility, created_at`,
    [attendeeId, visibility]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    displayName: row.display_name,
    email: row.email ?? undefined,
    visibility: row.visibility,
    createdAt: row.created_at,
  } satisfies AttendeeRecord;
}

export async function setAttendeeUploadConnections(attendeeId: string, raw: string) {
  const keys = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const key = normalizePersonKey(line);
    if (key) keys.add(key);
  }

  return await withClient(async (client) => {
    const exists = await client.query(`SELECT 1 FROM attendees WHERE id = $1 LIMIT 1`, [attendeeId]);
    if (exists.rowCount === 0) return null;

    // Replace connections for simplicity (MVP)
    await client.query(`DELETE FROM attendee_connections WHERE attendee_id = $1`, [attendeeId]);

    const arr = Array.from(keys);
    if (arr.length > 0) {
      const values: string[] = [];
      const params: unknown[] = [attendeeId];
      let i = 2;
      for (const k of arr) {
        values.push(`($1, $${i})`);
        params.push(k);
        i += 1;
      }
      await client.query(
        `INSERT INTO attendee_connections (attendee_id, connection_key) VALUES ${values.join(",")}`,
        params
      );
    }

    await client.query(
      `INSERT INTO identity_links (attendee_id, provider, provider_user_id, created_at)
       VALUES ($1, 'upload', NULL, NOW())
       ON CONFLICT (attendee_id) DO UPDATE SET provider = EXCLUDED.provider`,
      [attendeeId]
    );

    return { count: keys.size };
  });
}

export async function getKnownPeopleForEvent(input: { eventId: string; viewerAttendeeId: string }) {
  return await withClient(async (client) => {
    const viewer = await client.query<{ id: string }>(
      `SELECT id FROM attendees WHERE id = $1 AND event_id = $2 LIMIT 1`,
      [input.viewerAttendeeId, input.eventId]
    );
    if (viewer.rowCount === 0) return null;

    const keysRes = await client.query<{ connection_key: string }>(
      `SELECT connection_key FROM attendee_connections WHERE attendee_id = $1`,
      [input.viewerAttendeeId]
    );
    const keys = keysRes.rows.map((r) => r.connection_key);
    if (keys.length === 0) return [];

    const matchesRes = await client.query<{
      id: string;
      display_name: string;
      visibility: AttendeeVisibility;
    }>(
      `SELECT id, display_name, visibility
       FROM attendees
       WHERE event_id = $1
         AND id <> $2
         AND visibility <> 'hidden'
         AND display_name_key = ANY($3::text[])
       ORDER BY display_name ASC`,
      [input.eventId, input.viewerAttendeeId, keys]
    );

    return matchesRes.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      visibility: r.visibility,
    }));
  });
}

export async function getEventStats(eventId: string) {
  const res = await query<{
    total: string;
    visible: string;
    hidden: string;
    connections_only: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       SUM(CASE WHEN visibility = 'hidden' THEN 1 ELSE 0 END)::text AS hidden,
       SUM(CASE WHEN visibility <> 'hidden' THEN 1 ELSE 0 END)::text AS visible,
       SUM(CASE WHEN visibility = 'connections_only' THEN 1 ELSE 0 END)::text AS connections_only
     FROM attendees
     WHERE event_id = $1`,
    [eventId]
  );

  const row = res.rows[0] ?? { total: "0", visible: "0", hidden: "0", connections_only: "0" };
  return {
    total: Number(row.total),
    visible: Number(row.visible),
    hidden: Number(row.hidden),
    connectionsOnly: Number(row.connections_only),
  };
}


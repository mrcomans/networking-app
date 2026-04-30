import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __networkingAppPgPool: Pool | undefined;
  var __networkingAppPgSchemaReady: Promise<void> | undefined;
}

function getPool() {
  if (!globalThis.__networkingAppPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    globalThis.__networkingAppPgPool = new Pool({
      connectionString,
      // Render Postgres typically requires SSL in production; node-postgres handles it when needed.
      // If you hit SSL issues, we can set ssl options explicitly.
    });
  }
  return globalThis.__networkingAppPgPool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await ensureSchema(client);
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await ensureSchema(client);
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

async function ensureSchema(client: PoolClient) {
  if (!globalThis.__networkingAppPgSchemaReady) {
    globalThis.__networkingAppPgSchemaReady = (async () => {
      // Keep it simple: create tables if they don't exist.
      // This avoids a migration tool for MVP while remaining portable.
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS attendees (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          display_name TEXT NOT NULL,
          display_name_key TEXT NOT NULL,
          email TEXT NULL,
          visibility TEXT NOT NULL CHECK (visibility IN ('hidden', 'public', 'connections_only')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS attendees_event_id_idx ON attendees(event_id);
        CREATE INDEX IF NOT EXISTS attendees_event_id_visibility_idx ON attendees(event_id, visibility);
        CREATE INDEX IF NOT EXISTS attendees_display_name_key_idx ON attendees(display_name_key);

        CREATE TABLE IF NOT EXISTS identity_links (
          attendee_id TEXT PRIMARY KEY REFERENCES attendees(id) ON DELETE CASCADE,
          provider TEXT NOT NULL CHECK (provider IN ('upload', 'linkedin', 'none')),
          provider_user_id TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS attendee_connections (
          attendee_id TEXT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
          connection_key TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (attendee_id, connection_key)
        );

        CREATE INDEX IF NOT EXISTS attendee_connections_key_idx ON attendee_connections(connection_key);
      `);
    })();
  }

  await globalThis.__networkingAppPgSchemaReady;
}


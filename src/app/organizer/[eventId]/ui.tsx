"use client";

import { useEffect, useState } from "react";

type Props = { eventId: string; slug: string };

type StatsResponse =
  | { event: { id: string; name: string }; stats: { total: number; visible: number; hidden: number; connectionsOnly: number } }
  | { error: string };

export function OrganizerClient({ eventId, slug }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; visible: number; hidden: number; connectionsOnly: number } | null>(
    null
  );

  const joinPath = `/e/${slug}`;
  const organizerPath = `/organizer/${eventId}`;

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/stats`);
      const json = (await res.json()) as StatsResponse;
      if (!res.ok) throw new Error("error" in json ? json.error : "Stats ophalen mislukt");
      if ("stats" in json) setStats(json.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
        <div className="font-medium">Deel link (deelnemers)</div>
        <a className="break-all underline underline-offset-4" href={joinPath}>
          {joinPath}
        </a>
        <div className="mt-3 font-medium">Organizer link</div>
        <a className="break-all underline underline-offset-4" href={organizerPath}>
          {organizerPath}
        </a>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stats</h2>
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
          onClick={refresh}
          disabled={busy}
        >
          {busy ? "Verversen…" : "Verversen"}
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Totaal" value={stats.total} />
          <Stat label="Zichtbaar" value={stats.visible} />
          <Stat label="Onzichtbaar" value={stats.hidden} />
          <Stat label="Connections only" value={stats.connectionsOnly} />
        </div>
      ) : (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Geen data.</div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}


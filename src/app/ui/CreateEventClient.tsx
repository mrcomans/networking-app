"use client";

import { useMemo, useState } from "react";

type CreateEventResponse =
  | { event: { id: string; slug: string; name: string }; joinUrl: string }
  | { error: string };

function isCreateEventSuccess(x: CreateEventResponse): x is Extract<CreateEventResponse, { joinUrl: string }> {
  return "joinUrl" in x;
}

export function CreateEventClient() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const canCreate = useMemo(() => name.trim().length >= 2, [name]);

  async function create() {
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    setJoinUrl(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = (await res.json()) as CreateEventResponse;
      if (!res.ok) {
        throw new Error("error" in json ? json.error : "Event aanmaken mislukt");
      }
      if (!isCreateEventSuccess(json)) throw new Error("Onverwacht response formaat");
      setJoinUrl(json.joinUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <label className="grid gap-1">
        <span className="text-sm font-medium">Eventnaam</span>
        <input
          className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
          placeholder="Bijv. Power Hour – Heroes"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          onClick={create}
          type="button"
          disabled={busy || !canCreate}
        >
          {busy ? "Aanmaken…" : "Event aanmaken"}
        </button>

        {joinUrl ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Deel deze link:</span>
            <a
              className="break-all text-sm font-medium text-black underline underline-offset-4 dark:text-white"
              href={joinUrl}
            >
              {joinUrl}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}


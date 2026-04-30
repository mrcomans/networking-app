"use client";

import { useMemo, useState } from "react";

type Props = { eventId: string };

type Attendee = {
  id: string;
  displayName: string;
  visibility: "hidden" | "public" | "connections_only";
};

export function EventClient({ eventId }: Props) {
  const [step, setStep] = useState<"register" | "connections" | "matches">("register");
  const [displayName, setDisplayName] = useState("");
  const [visibility, setVisibility] = useState<Attendee["visibility"]>("hidden");
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [connectionsText, setConnectionsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Attendee[]>([]);

  const canRegister = useMemo(() => displayName.trim().length >= 2, [displayName]);

  async function register() {
    if (!canRegister) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), visibility }),
      });
      const json = (await res.json()) as { attendee?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Registratie mislukt");
      if (!json.attendee?.id) throw new Error("Geen attendee id ontvangen");
      setAttendeeId(json.attendee.id);
      setStep("connections");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  async function uploadConnections() {
    if (!attendeeId) return;
    if (connectionsText.trim().length < 2) {
      setError("Plak minimaal 1 naam (1 per regel).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}/connections/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ connectionsText }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload mislukt");
      setStep("matches");
      await refreshMatches(attendeeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  async function refreshMatches(id = attendeeId ?? "") {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/known-people?attendeeId=${encodeURIComponent(id)}`);
      const json = (await res.json()) as { matches?: Attendee[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ophalen mislukt");
      setMatches(Array.isArray(json.matches) ? json.matches : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {step === "register" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Stap 1: aanmelden</h2>
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Naam</span>
              <input
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
                placeholder="Bijv. Mark Teeken"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Zichtbaarheid (opt-in)</span>
              <select
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Attendee["visibility"])}
              >
                <option value="hidden">Onzichtbaar (default)</option>
                <option value="public">Zichtbaar voor iedereen in de app</option>
                <option value="connections_only">Alleen zichtbaar voor matches</option>
              </select>
            </label>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            onClick={register}
            disabled={busy || !canRegister}
          >
            {busy ? "Bezig…" : "Aanmelden"}
          </button>
        </div>
      ) : null}

      {step === "connections" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Stap 2: connecties toevoegen</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            LinkedIn API is nog een spike. Voor nu: plak je connecties (1 naam per regel).
          </p>
          <textarea
            className="min-h-40 w-full rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            placeholder={"Voorbeeld:\nJane Doe\nJohn Smith\n…"}
            value={connectionsText}
            onChange={(e) => setConnectionsText(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              onClick={uploadConnections}
              disabled={busy}
            >
              {busy ? "Uploaden…" : "Connecties opslaan"}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
              onClick={() => setStep("matches")}
              disabled={busy}
              title="Je kunt ook verder zonder connecties; dan zijn er geen matches."
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      {step === "matches" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Bekenden op dit event</h2>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
              onClick={() => refreshMatches()}
              disabled={busy || !attendeeId}
            >
              {busy ? "Verversen…" : "Verversen"}
            </button>
          </div>

          {!attendeeId ? (
            <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              Je bent nog niet aangemeld. Ga terug en registreer eerst.
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              Nog geen matches gevonden (of niemand is zichtbaar). Probeer later nog eens.
            </div>
          ) : (
            <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10">
              {matches.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-zinc-950">
                  <div>
                    <div className="text-sm font-medium">{m.displayName}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{m.visibility}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}


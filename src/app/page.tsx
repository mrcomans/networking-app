import { CreateEventClient } from "@/app/ui/CreateEventClient";
import { listEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  let events: Awaited<ReturnType<typeof listEvents>> = [];
  let eventsError: string | null = null;
  try {
    events = await listEvents({ limit: 20 });
  } catch (e) {
    eventsError = e instanceof Error ? e.message : "Events ophalen mislukt";
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Event Netwerk App (MVP)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Maak een event aan en deel de link/QR. Deelnemers melden zich opt-in aan en zien matches op basis van hun
          connecties.
        </p>

        <div className="mt-6 rounded-xl border border-black/10 bg-zinc-50 px-4 py-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="font-medium text-black dark:text-white">Hoe werkt het?</div>
          <ol className="mt-2 space-y-1 pl-5">
            <li className="list-decimal">
              <span className="font-medium">Organizer</span> maakt een event aan en deelt de deelnemerslink/QR.
            </li>
            <li className="list-decimal">
              <span className="font-medium">Deelnemer</span> meldt zich opt-in aan (standaard <span className="font-medium">onzichtbaar</span>) en kiest
              zichtbaarheid.
            </li>
            <li className="list-decimal">
              <span className="font-medium">Deelnemer</span> plakt connecties en ziet daarna <span className="font-medium">bekenden op dit event</span>.
            </li>
          </ol>
          <div className="mt-3 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            Privacy: jij bepaalt of je zichtbaar bent. Default = hidden.
          </div>
        </div>

        <div className="mt-8">
          <CreateEventClient />
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Bestaande events</h2>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{events.length} total</div>
          </div>

          {eventsError ? (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-100">
              Kan events niet ophalen. <span className="font-mono">DATABASE_URL</span> geconfigureerd? ({eventsError})
            </div>
          ) : events.length === 0 ? (
            <div className="mt-3 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              Nog geen events. Maak er eentje aan om te starten.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10">
              {events.map((event) => (
                <li key={event.id} className="bg-white px-4 py-3 dark:bg-zinc-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{event.name}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono">{event.slug}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                        href={`/e/${event.slug}`}
                      >
                        Deelnemers
                      </a>
                      <a
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                        href={`/organizer/${event.id}`}
                      >
                        Organizer
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
          Storage: Postgres via <code className="font-mono">DATABASE_URL</code> (restart = data blijft). Handig voor demo’s / Power Hour.
        </div>
      </main>
    </div>
  );
}

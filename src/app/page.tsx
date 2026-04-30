import { CreateEventClient } from "@/app/ui/CreateEventClient";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Event Netwerk App (MVP)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Maak een event aan en deel de link/QR. Deelnemers melden zich opt-in aan en zien matches op basis van hun
          connecties.
        </p>

        <div className="mt-8">
          <CreateEventClient />
        </div>

        <div className="mt-10 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
          Let op: dit gebruikt een in-memory store (restart = data weg). Geschikt voor demo’s / Power Hour.
        </div>
      </main>
    </div>
  );
}

import { getEventBySlug } from "@/lib/store";
import { EventClient } from "./ui";

export default async function EventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-xl font-semibold">Event niet gevonden</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Controleer de link/QR en probeer opnieuw.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Opt-in: jij bepaalt of je zichtbaar bent.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
            MVP
          </div>
        </div>

        <div className="mt-8">
          <EventClient eventId={event.id} />
        </div>
      </div>
    </div>
  );
}


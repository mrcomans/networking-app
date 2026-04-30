import { getEventById } from "@/lib/store";
import { OrganizerClient } from "./ui";

export default async function OrganizerEventPage(props: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await props.params;
  const event = await getEventById(eventId);

  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-xl font-semibold">Event niet gevonden</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Organizer</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{event.name}</p>

        <div className="mt-8">
          <OrganizerClient eventId={event.id} slug={event.slug} />
        </div>
      </div>
    </div>
  );
}


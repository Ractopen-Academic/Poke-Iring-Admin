import { getEventsAction } from "@/features/events/services/events-actions";
import { EventsView } from "@/features/events/components/events-view";

export default async function EventsPage() {
  const result = await getEventsAction();

  return (
    <EventsView
      initialEvents={result.data}
      isConfigured={result.isConfigured}
      initialError={result.error}
    />
  );
}

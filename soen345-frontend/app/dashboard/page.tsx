import { cookies } from "next/headers";
import { DashboardClient } from "@/app/components/dashboard/dashboard-client";
import { fetchEventsPublic, fetchEventsWithAuth } from "@/lib/fetch-events";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const result = token
    ? await fetchEventsWithAuth(token)
    : await fetchEventsPublic();

  const unauthorized = !result.ok && result.reason === "unauthorized";
  const finalResult = unauthorized ? await fetchEventsPublic() : result;
  const isAuthenticated = Boolean(token) && !unauthorized;

  const events = finalResult.ok ? finalResult.events : [];
  const loadError =
    !finalResult.ok && finalResult.reason === "error"
      ? finalResult.message
      : null;

  return (
    <DashboardClient
      events={events}
      loadError={loadError}
      isAuthenticated={isAuthenticated}
    />
  );
}

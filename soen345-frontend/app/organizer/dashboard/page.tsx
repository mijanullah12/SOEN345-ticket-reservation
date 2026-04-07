import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrganizerDashboardClient } from "@/app/components/organizer/organizer-dashboard-client";
import { fetchEventsWithAuth } from "@/lib/fetch-events";

export default async function OrganizerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/organizer/login?redirect=/organizer/dashboard");
  }

  const result = await fetchEventsWithAuth(token);

  if (!result.ok && result.reason === "unauthorized") {
    redirect("/organizer/login?redirect=/organizer/dashboard");
  }

  const events = result.ok ? result.events : [];

  return (
    <div data-app-shell="dashboard" className="dash-root">
      <OrganizerDashboardClient initialEvents={events} />
    </div>
  );
}

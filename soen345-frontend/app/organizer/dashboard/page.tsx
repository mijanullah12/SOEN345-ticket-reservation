import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrganizerDashboardClient } from "@/app/components/organizer/organizer-dashboard-client";
import { BACKEND_URL } from "@/lib/backend";
import { fetchOrganizerEventsWithAuth } from "@/lib/fetch-events";

export default async function OrganizerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/organizer/login?redirect=/organizer/dashboard");
  }

  const profileRes = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!profileRes.ok) {
    redirect("/dashboard");
  }

  const profile = (await profileRes.json()) as { role?: string };
  const canAccessOrganizerDashboard =
    profile.role === "ORGANIZER" || profile.role === "ADMIN";

  if (!canAccessOrganizerDashboard) {
    redirect("/dashboard");
  }

  const result = await fetchOrganizerEventsWithAuth(token);

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

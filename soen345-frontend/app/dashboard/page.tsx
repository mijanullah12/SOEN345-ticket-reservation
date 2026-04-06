import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchEventsWithAuth } from "@/lib/fetch-events";
import { DashboardClient } from "./components/dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const result = await fetchEventsWithAuth(token);

  if (!result.ok && result.reason === "unauthorized") {
    redirect("/login");
  }

  const events = result.ok ? result.events : [];
  const loadError =
    !result.ok && result.reason === "error" ? result.message : null;

  return <DashboardClient events={events} loadError={loadError} />;
}

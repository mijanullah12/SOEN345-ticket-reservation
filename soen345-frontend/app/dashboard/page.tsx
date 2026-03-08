import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M17 18h1" />
            <path d="M12 18h1" />
            <path d="M7 18h1" />
          </svg>
        </div>
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          This section is currently under construction.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}

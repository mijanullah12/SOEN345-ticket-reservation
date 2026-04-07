import { cookies } from "next/headers";
import Link from "next/link";
import { ProfilePreferencesCard } from "@/app/components/profile/profile-preferences-card";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  return (
    <div data-app-shell="dashboard" className="dash-root">
      <main className="dash-main">
        <div className="dash-content">
          <h1 className="dash-section-title">Profile</h1>
          {token ? (
            <ProfilePreferencesCard />
          ) : (
            <div className="dash-empty">
              Please log in to view your profile.{" "}
              <Link href="/dashboard">Return to events</Link>.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

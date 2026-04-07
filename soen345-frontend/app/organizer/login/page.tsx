"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrganizerLoginForm } from "@/app/components/auth/organizer-login-form";

function OrganizerLoginFormWithRedirect() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/organizer/dashboard";
  return <OrganizerLoginForm redirect={redirect} />;
}

export default function OrganizerLoginPage() {
  return (
    <main className="auth-container">
      <Suspense>
        <OrganizerLoginFormWithRedirect />
      </Suspense>
    </main>
  );
}

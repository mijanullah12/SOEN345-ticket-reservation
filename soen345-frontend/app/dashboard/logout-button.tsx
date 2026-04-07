"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard");
  }

  const buttonClassName = className ? `logout-btn ${className}` : "logout-btn";

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={buttonClassName}
    >
      {loading ? "Logging out..." : "Log Out"}
    </button>
  );
}

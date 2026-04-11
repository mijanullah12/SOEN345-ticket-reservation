"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusPopup } from "@/app/components/shared/status-popup";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setShowSuccess(true);
    setLoading(false);
  }
  function acknowledgeLogout() {
    console.log("Acknowledging logout");
    setShowSuccess(false);
    setLoading(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/dashboard")) {
        window.location.reload();
        return;
      }
      // window.location.assign("/dashboard");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const buttonClassName = className ? `logout-btn ${className}` : "logout-btn";

  return (
    <>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? "Logging out..." : "Log Out"}
      </button>
      {showSuccess && console.log("POPUP RENDERED")}
      <StatusPopup
        open={showSuccess}
        title="Successful log-out"
        detail="Your session has been closed."
        onClose={acknowledgeLogout}
      />
    </>
  );
}

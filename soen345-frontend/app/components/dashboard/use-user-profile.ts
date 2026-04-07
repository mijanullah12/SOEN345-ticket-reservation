"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/types";

type ProfileState = {
  user: UserProfile | null;
  loading: boolean;
};

export function useUserProfile(enabled = true): ProfileState {
  const [state, setState] = useState<ProfileState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    if (!enabled || typeof fetch === "undefined") {
      setState({ user: null, loading: false });
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setState({ user: null, loading: false });
          }
          return;
        }
        const data = (await res.json()) as UserProfile;
        if (!cancelled) {
          setState({ user: data, loading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ user: null, loading: false });
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

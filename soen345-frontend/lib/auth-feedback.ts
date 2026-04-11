import type { UserInfo } from "@/lib/types";

const AUTH_FEEDBACK_KEY = "auth-feedback";

export type AuthFeedback = {
  kind: "login" | "signup";
  firstName?: string;
  lastName?: string;
};

export function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
}

function persistAuthFeedback(feedback: AuthFeedback) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    AUTH_FEEDBACK_KEY,
    JSON.stringify(feedback satisfies AuthFeedback),
  );
}

export function persistLoginFeedback(user?: Partial<UserInfo> | null) {
  persistAuthFeedback({
    kind: "login",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
}

export function persistSignupFeedback(user?: Partial<UserInfo> | null) {
  persistAuthFeedback({
    kind: "signup",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
}

export function consumeAuthFeedback(): AuthFeedback | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_FEEDBACK_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(AUTH_FEEDBACK_KEY);

  try {
    return JSON.parse(raw) as AuthFeedback;
  } catch {
    return null;
  }
}

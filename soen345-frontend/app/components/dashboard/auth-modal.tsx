"use client";

import { useEffect } from "react";
import { LoginForm } from "@/app/components/auth/login-form";
import { OrganizationRegisterForm } from "@/app/components/auth/organization-register-form";
import { OrganizerLoginForm } from "@/app/components/auth/organizer-login-form";
import { RegisterForm } from "@/app/components/auth/register-form";

export type AuthModalMode = "login" | "signup" | "orgLogin" | "orgSignup";

type AuthModalProps = {
  mode: AuthModalMode | null;
  onClose: () => void;
  onSwitch: (mode: AuthModalMode) => void;
  onAuthSuccess: () => void;
};

export function AuthModal({
  mode,
  onClose,
  onSwitch,
  onAuthSuccess,
}: AuthModalProps) {
  useEffect(() => {
    if (!mode) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mode, onClose]);

  if (!mode) return null;

  return (
    <div className="dash-auth-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="dash-auth-backdrop"
        aria-label="Close authentication modal"
        onClick={onClose}
      />
      <div className="dash-auth-modal-card dash-auth-container">
        <button
          type="button"
          className="dash-auth-modal-close dash-btn-solid"
          aria-label="Close"
          onClick={onClose}
        >
          Close
        </button>
        {mode === "login" ? (
          <LoginForm
            redirect="/dashboard"
            useModalLinks
            showOrganizerLinks={false}
            onSwitchToRegister={() => onSwitch("signup")}
            onSuccess={onAuthSuccess}
          />
        ) : null}
        {mode === "signup" ? (
          <RegisterForm
            useModalLinks
            onSwitchToLogin={() => onSwitch("login")}
            onSuccess={() => onSwitch("login")}
          />
        ) : null}
        {mode === "orgLogin" ? (
          <OrganizerLoginForm
            useModalLinks
            onSwitchToOrgRegister={() => onSwitch("orgSignup")}
            onSuccess={onAuthSuccess}
          />
        ) : null}
        {mode === "orgSignup" ? (
          <OrganizationRegisterForm
            useModalLinks
            onSwitchToOrgLogin={() => onSwitch("orgLogin")}
            onSuccess={() => onSwitch("orgLogin")}
          />
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/app/components/auth/login-form";
import { OrganizationRegisterForm } from "@/app/components/auth/organization-register-form";
import { RegisterForm } from "@/app/components/auth/register-form";

export type AuthModalMode = "login" | "signup" | "orgSignup";

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
  const [signupTab, setSignupTab] = useState<"customer" | "organizer">(
    "customer",
  );

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

  useEffect(() => {
    if (mode === "orgSignup") {
      setSignupTab("organizer");
      return;
    }
    if (mode === "signup") {
      setSignupTab("customer");
    }
  }, [mode]);

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
            onSwitchToRegister={() => onSwitch("signup")}
            onSuccess={onAuthSuccess}
          />
        ) : null}
        {mode === "signup" || mode === "orgSignup" ? (
          <>
            <div className="dash-auth-tabs" role="tablist" aria-label="Sign up options">
              <button
                type="button"
                role="tab"
                aria-selected={signupTab === "customer"}
                className="dash-auth-tab"
                data-active={signupTab === "customer"}
                onClick={() => setSignupTab("customer")}
              >
                Customer
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={signupTab === "organizer"}
                className="dash-auth-tab"
                data-active={signupTab === "organizer"}
                onClick={() => setSignupTab("organizer")}
              >
                Organizer
              </button>
            </div>
            {signupTab === "customer" ? (
              <RegisterForm
                useModalLinks
                onSwitchToLogin={() => onSwitch("login")}
                onSuccess={() => onSwitch("login")}
              />
            ) : (
              <OrganizationRegisterForm
                useModalLinks
                onSwitchToOrgLogin={() => onSwitch("login")}
                onSuccess={() => onSwitch("login")}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

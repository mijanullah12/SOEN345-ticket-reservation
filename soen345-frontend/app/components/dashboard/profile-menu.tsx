"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "../../dashboard/logout-button";
import { useUserProfile } from "./use-user-profile";

type MenuMode = "login" | "signup" | "orgLogin" | "orgSignup";

type ProfileMenuProps = {
  isAuthenticated: boolean;
  onOpenAuthModal: (mode: MenuMode) => void;
};

export function ProfileMenu({
  isAuthenticated,
  onOpenAuthModal,
}: ProfileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useUserProfile(isAuthenticated);
  const canAccessOrganizerDashboard =
    user?.role === "ORGANIZER" || user?.role === "ADMIN";

  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const hasName = Boolean(firstName) && Boolean(lastName) && isAuthenticated;

  const profileLabel = hasName
    ? `${firstName} ${lastName}`
    : isAuthenticated
      ? "You"
      : "Guest";

  const profileInitial = hasName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : profileLabel.charAt(0);
  const profileInitialUpper = profileInitial.toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="dash-profile-wrap" ref={menuRef}>
      <button
        type="button"
        className="dash-profile-btn"
        aria-label="Account menu"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span className="dash-profile-initial">{profileInitialUpper}</span>
      </button>
      {menuOpen ? (
        <div className="dash-profile-menu" role="menu">
          {isAuthenticated ? (
            <>
              {canAccessOrganizerDashboard ? (
                <Link href="/organizer/dashboard" className="dash-profile-item">
                  Organizer dashboard
                </Link>
              ) : null}
              <Link href="/profile" className="dash-profile-item">
                Profile
              </Link>
              <LogoutButton className="dash-profile-item" />
            </>
          ) : (
            <>
              <button
                type="button"
                className="dash-profile-item"
                onClick={() => {
                  onOpenAuthModal("login");
                  setMenuOpen(false);
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className="dash-profile-item"
                onClick={() => {
                  onOpenAuthModal("signup");
                  setMenuOpen(false);
                }}
              >
                Sign up
              </button>
              <button
                type="button"
                className="dash-profile-item"
                onClick={() => {
                  onOpenAuthModal("orgLogin");
                  setMenuOpen(false);
                }}
              >
                Organizer login
              </button>
              <button
                type="button"
                className="dash-profile-item"
                onClick={() => {
                  onOpenAuthModal("orgSignup");
                  setMenuOpen(false);
                }}
              >
                Organization signup
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

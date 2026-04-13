import { afterEach, describe, expect, it } from "vitest";
import {
  buildDisplayName,
  consumeAuthFeedback,
  persistLoginFeedback,
  persistSignupFeedback,
} from "@/lib/auth-feedback";

describe("buildDisplayName", () => {
  it("joins trimmed non-empty parts", () => {
    expect(buildDisplayName("  Ada ", " Lovelace ")).toBe("Ada Lovelace");
  });

  it("handles partial or empty names", () => {
    expect(buildDisplayName(null, "Solo")).toBe("Solo");
    expect(buildDisplayName("Solo", null)).toBe("Solo");
    expect(buildDisplayName("", "  ")).toBe("");
  });
});

describe("persistLoginFeedback and persistSignupFeedback", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("writes login feedback to session storage", () => {
    persistLoginFeedback({ firstName: "N", lastName: "L" });
    expect(sessionStorage.getItem("auth-feedback")).toContain('"kind":"login"');
  });

  it("writes signup feedback to session storage", () => {
    persistSignupFeedback({ firstName: "S", lastName: "U" });
    expect(sessionStorage.getItem("auth-feedback")).toContain(
      '"kind":"signup"',
    );
  });
});

describe("consumeAuthFeedback", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(consumeAuthFeedback()).toBeNull();
  });

  it("parses feedback and removes the key", () => {
    sessionStorage.setItem(
      "auth-feedback",
      JSON.stringify({ kind: "login", firstName: "x" }),
    );
    expect(consumeAuthFeedback()).toEqual({
      kind: "login",
      firstName: "x",
    });
    expect(sessionStorage.getItem("auth-feedback")).toBeNull();
  });

  it("returns null and clears key when JSON is invalid", () => {
    sessionStorage.setItem("auth-feedback", "not-json");
    expect(consumeAuthFeedback()).toBeNull();
    expect(sessionStorage.getItem("auth-feedback")).toBeNull();
  });
});

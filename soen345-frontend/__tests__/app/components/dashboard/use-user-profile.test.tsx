import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";

describe("useUserProfile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch and clears state when disabled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => useUserProfile(false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads profile when fetch succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "1",
          firstName: "A",
          lastName: "B",
          role: "CUSTOMER",
        }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useUserProfile(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.firstName).toBe("A");
  });

  it("sets user to null when response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const { result } = renderHook(() => useUserProfile(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("sets user to null when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useUserProfile(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("skips updating state after unmount", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    const deferred = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(deferred);

    const { result, unmount } = renderHook(() => useUserProfile(true));

    expect(result.current.loading).toBe(true);
    unmount();

    resolveFetch(
      new Response(
        JSON.stringify({
          id: "9",
          firstName: "Late",
          lastName: "User",
          role: "CUSTOMER",
        }),
        { status: 200 },
      ),
    );

    await new Promise((r) => setTimeout(r, 0));
  });
});

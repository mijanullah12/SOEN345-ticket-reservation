import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastContainer, useToast } from "@/app/components/shared/toast";

function ToastDemo({
  variant,
}: {
  variant: "success" | "error";
}) {
  const { toasts, addToast, dismissToast } = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() => addToast("Hello", variant)}
      >
        add
      </button>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

describe("ToastContainer", () => {
  it("renders nothing when there are no toasts", () => {
    const dismiss = vi.fn();
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={dismiss} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows a success toast and dismisses via button", async () => {
    const user = userEvent.setup();
    render(<ToastDemo variant="success" />);

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(
      await screen.findByRole("region", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    await waitFor(() =>
      expect(screen.queryByText("Hello")).not.toBeInTheDocument(),
    );
  });

  it("renders error variant icon branch", async () => {
    const user = userEvent.setup();
    render(<ToastDemo variant="error" />);

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });
});

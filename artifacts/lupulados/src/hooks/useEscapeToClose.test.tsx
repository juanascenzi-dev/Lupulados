import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEscapeToClose } from "./useEscapeToClose";

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEscapeToClose(
    open,
    () => {
      setOpen(false);
      onClose();
    },
    triggerRef,
  );

  return (
    <>
      <button ref={triggerRef} type="button">
        Abrir
      </button>
      {open && <div role="dialog">Modal</div>}
    </>
  );
}

function ClosedHarness({ onClose }: { onClose: () => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEscapeToClose(false, onClose, triggerRef);
  return (
    <button ref={triggerRef} type="button">
      Abrir
    </button>
  );
}

describe("useEscapeToClose", () => {
  it("closes and returns focus to the trigger when Escape is pressed while open", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir" })).toHaveFocus();
  });

  it("does nothing when a different key is pressed", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not attach a listener (and never calls onClose) when open is false", () => {
    const onClose = vi.fn();
    render(<ClosedHarness onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});

import { useEffect, type RefObject } from "react";

/**
 * Closes a modal/drawer when Escape is pressed while `open` is true, and
 * returns focus to the triggering element via `refocusRef`.
 */
export function useEscapeToClose(
  open: boolean,
  onClose: () => void,
  refocusRef: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      refocusRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, refocusRef]);
}

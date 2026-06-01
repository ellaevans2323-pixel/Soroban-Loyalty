"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type FocusTrapProps = {
  active: boolean;
  children: React.ReactNode;
};


/**
 * Traps keyboard focus within its children when `active` is true.
 * Also restores focus to the previously-focused element when closing.
 */
export function FocusTrap({ active, children }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const getFocusable = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => {
        // Only keep elements that can actually be focused.
        const style = window.getComputedStyle(node);
        return style.visibility !== "hidden" && style.display !== "none";
      });

    if (active) {
      previouslyFocusedEl.current = document.activeElement as HTMLElement | null;

      const items = getFocusable();
      (items[0] ?? el).focus();

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const itemsNow = getFocusable();
        if (itemsNow.length === 0) return;

        const first = itemsNow[0];
        const last = itemsNow[itemsNow.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      el.addEventListener("keydown", onKeyDown);
      return () => {
        el.removeEventListener("keydown", onKeyDown);
      };
    }

    // Restore focus when closing.
    return () => {
      const restoreTo = previouslyFocusedEl.current;
      previouslyFocusedEl.current = null;
      restoreTo?.focus?.();
    };
  }, [active]);

  return (
    <div ref={ref} tabIndex={-1}>
      {children}
    </div>
  );
}


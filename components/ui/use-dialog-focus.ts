"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * يحصر Tab داخل الحوار المفتوح ويعيد التركيز إلى العنصر الذي فتحه عند الإغلاق.
 * يستخدم مع كل حوار modal لضمان إتاحة كاملة للوحة المفاتيح.
 */
export function useDialogFocus(open: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    const focusables = () =>
      container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null) : [];

    const first = focusables()[0];
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !container) return;
      const items = focusables();
      if (!items.length) return;
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === firstEl || !container.contains(active))) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && (active === lastEl || !container.contains(active))) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, containerRef]);
}

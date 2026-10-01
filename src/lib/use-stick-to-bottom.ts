"use client";

import { type RefObject, useEffect, useRef } from "react";

const NEAR_BOTTOM_PX = 160;

/**
 * Keeps the window pinned to the bottom while `content` grows (streaming, cards revealing),
 * unless the reader scrolled up. Scrolling back near the end re-pins it.
 */
export function useStickToBottom(
  content: RefObject<HTMLElement | null>,
  active: boolean,
) {
  const pinned = useRef(true);

  useEffect(() => {
    if (!active) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const gap =
        document.documentElement.scrollHeight - (y + window.innerHeight);
      // Our own smooth scroll only moves down; only an upward scroll means the reader left the end.
      if (y < lastY - 2) pinned.current = gap < NEAR_BOTTOM_PX;
      else if (gap < NEAR_BOTTOM_PX) pinned.current = true;
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  useEffect(() => {
    const el = content.current;
    if (!active || !el) return;
    const ro = new ResizeObserver(() => {
      if (pinned.current)
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [content, active]);

  /** Call when the user sends a message: always follow their own question. */
  return () => {
    pinned.current = true;
  };
}

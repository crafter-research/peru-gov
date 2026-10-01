"use client";

import { type RefObject, useEffect } from "react";

/**
 * When the user sends a message, bring that question to the top of the viewport and let the
 * answer grow underneath it, instead of chasing the bottom and burying the answer under chips.
 */
export function useScrollToLatestQuestion(
  thread: RefObject<HTMLElement | null>,
  userCount: number,
) {
  useEffect(() => {
    if (!userCount) return;
    const questions =
      thread.current?.querySelectorAll<HTMLElement>("[data-question]");
    const last = questions?.[questions.length - 1];
    if (!last) return;
    const top = last.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
  }, [thread, userCount]);
}

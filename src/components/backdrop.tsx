"use client";

import Image from "next/image";
import { useState } from "react";
import photo from "../../public/machu-picchu.jpg";

/**
 * One persistent Machu Picchu layer. It resolves from blurred to sharp once loaded, and eases back
 * into blur when a conversation starts, so both moments animate instead of swapping.
 */
export function Backdrop({ focused }: { focused: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const state = !loaded
    ? "scale-110 blur-3xl brightness-100 dark:brightness-50"
    : focused
      ? "scale-105 blur-2xl opacity-0 dark:opacity-100 dark:brightness-[0.45]"
      : "scale-100 blur-0 brightness-105 saturate-[1.08] sepia-[0.12] dark:brightness-[0.8] dark:saturate-100 dark:sepia-0";
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <Image
        src={photo}
        alt=""
        fill
        priority
        sizes="100vw"
        onLoad={() => setLoaded(true)}
        className={`object-cover object-[50%_40%] transition-[filter,transform,opacity] duration-[1400ms] ease-smooth will-change-[filter,transform] ${state}`}
      />
      <div className="absolute inset-0 backdrop-overlay" />
    </div>
  );
}

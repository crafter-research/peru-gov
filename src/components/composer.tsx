"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { VoiceButton } from "@/components/voice-button";

/**
 * The textarea grows instantly with `field-sizing: content`; the shell follows its height
 * through a ResizeObserver with a 0.8s transition, so the glass panel eases into place.
 */
export function Composer({
  onSubmit,
  busy,
  placeholder,
  solid = false,
}: {
  onSubmit: (text: string) => void;
  busy: boolean;
  placeholder: string;
  /** Opaque glass for the sticky composer that floats over conversation text. */
  solid?: boolean;
}) {
  const [value, setValue] = useState("");
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setHeight(entry.borderBoxSize[0].blockSize),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || busy) return;
    onSubmit(value.trim());
    setValue("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
  };
  const empty = !value.trim();

  return (
    <form
      onSubmit={send}
      className={`glass glass-border w-full overflow-hidden rounded-[26px] transition-[height] duration-[800ms] ease-smooth ${solid ? "glass-solid" : ""}`}
      style={{ height }}
    >
      <div ref={inner} className="flex flex-col gap-2 p-3 pl-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Describe lo que necesitas"
          rows={1}
          enterKeyHint="send"
          className="max-h-60 min-h-7 w-full resize-none bg-transparent pt-1 text-base leading-7 text-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/80"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/70">
            gob.pe · 32,923 páginas
          </span>
          <div className="flex items-center gap-1">
            <VoiceButton
              onText={(t) => setValue((v) => (v ? `${v} ${t}` : t))}
            />
            <button
              type="submit"
              disabled={busy || empty}
              aria-label="Preguntar"
              className="grid size-9 place-items-center rounded-xl bg-foreground text-background transition duration-200 ease-smooth hover:scale-105 active:scale-95 disabled:bg-white/10 disabled:text-muted-foreground disabled:hover:scale-100"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

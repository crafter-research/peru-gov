import type { UIMessage } from "ai";
import type { Ficha } from "@/lib/ficha";
import type { Candidate } from "@/lib/router";

export type RouteStep = { label: string; value: string };

export type PeruMessage = UIMessage<
  never,
  {
    route: { steps: RouteStep[] };
    ficha: Ficha;
    alternatives: { items: Candidate[] };
    clarify: { options: string[] };
    none: { query: string };
    limited: { retryAfterSeconds: number };
  }
>;

export type ChatBody = { hint?: number };

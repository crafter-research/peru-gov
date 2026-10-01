import { neon } from "@neondatabase/serverless";

/** Neon over HTTP; analytics and shares are optional, so missing config disables them instead of failing a request. */
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

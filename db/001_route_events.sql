-- One row per answered question: what was asked (redacted), how it was routed, and how long it took.
create table if not exists route_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  turn int not null,
  question text not null,
  topic_id int,
  hint_id int,
  kind text not null check (kind in ('leaf', 'ask', 'none', 'limited', 'error')),
  ficha_id int,
  ficha_title text,
  entity text,
  rewrites jsonb not null default '[]',
  candidates jsonb not null default '[]',
  district text,
  latency_ms int,
  ip_hash text,
  error text
);
create index if not exists route_events_created_at on route_events (created_at desc);
create index if not exists route_events_ficha on route_events (ficha_id);
create index if not exists route_events_kind on route_events (kind);

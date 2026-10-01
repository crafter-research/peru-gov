-- Anonymous shared answers: a redacted snapshot, readable by anyone with the link.
create table if not exists shares (
  id text primary key,
  created_at timestamptz not null default now(),
  turns jsonb not null
);

-- Fixed-window request counters shared by every function instance. Keys hold a hashed IP, never the raw address.
create table if not exists rate_limits (
  key text not null,
  bucket bigint not null,
  count int not null default 1,
  primary key (key, bucket)
);
create index if not exists rate_limits_bucket on rate_limits (bucket);

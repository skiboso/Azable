# Moved

The SQL migrations that used to live in this directory now live at
[`services/backend/migrations/`](../services/backend/migrations/), renumbered
and preceded by a new `0001_create_campaigns.sql` that actually creates the
base `campaigns` table (none of the original 4 files did — they only ever
`ALTER`ed or referenced it). They're run via `sqlx migrate run` /
automatically on `azable-backend` startup — see
[`services/backend/README.md`](../services/backend/README.md).

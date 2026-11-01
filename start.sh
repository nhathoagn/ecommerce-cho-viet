#!/usr/bin/env bash
# Boot local dev: .env files, Postgres/Redis, deps, migrations, web + API.
set -euo pipefail
cd "$(dirname "$0")"

for bin in node pnpm docker; do
  command -v "$bin" >/dev/null || { echo "missing $bin"; exit 1; }
done

# Some PATHs ship an older pnpm than packageManager pins; corepack fetches the right one.
PNPM=(pnpm)
required=$(sed -n 's/.*"packageManager": *"pnpm@\([^"]*\)".*/\1/p' package.json)
if [ -n "$required" ] && [ "$(pnpm -v 2>/dev/null)" != "$required" ] && command -v corepack >/dev/null; then
  PNPM=(corepack pnpm)
fi

# .env is gitignored; create from example on first run.
for app in api web; do
  [ -f "apps/$app/.env" ] || cp "apps/$app/.env.example" "apps/$app/.env"
done

# Postgres: reuse whatever already answers on DATABASE_URL (a local install
# holding port 5432 is common); only start the compose one when nothing answers.
db_hp=$(sed -n 's/^DATABASE_URL=//p' apps/api/.env | sed -E 's#^[^:]+://([^@]*@)?##; s#/.*$##')
db_host=${db_hp%:*}
db_port=${db_hp##*:}
[ "$db_host" = "$db_hp" ] && db_port=5432
if command -v pg_isready >/dev/null && pg_isready -q -h "$db_host" -p "$db_port"; then
  echo "postgres: reusing $db_host:$db_port"
else
  docker compose up -d --wait postgres
fi
docker compose up -d --wait redis

[ -d node_modules/.pnpm ] || "${PNPM[@]}" install
"${PNPM[@]}" db:generate
# deploy = apply committed migrations, no interactive prompt (migrate dev can ask for a name)
"${PNPM[@]}" db:deploy

"${PNPM[@]}" dev

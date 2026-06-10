#!/bin/sh
set -e

echo "[entrypoint] applying database migrations (prisma migrate deploy)..."
pnpm prisma migrate deploy

echo "[entrypoint] starting application..."
exec "$@"

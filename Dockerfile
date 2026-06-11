# syntax=docker/dockerfile:1

# ---- base: node + pnpm via corepack ----
FROM node:24.15.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
# openssl is required by the Prisma schema engine (migrate deploy); without it
# Prisma can't detect libssl and falls back to a non-loadable engine flavour
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# pin pnpm to the version used locally / in CI (honours allowBuilds in pnpm-workspace.yaml)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ---- build: install all deps, generate prisma client, compile ----
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# prisma client emits to ./generated/prisma (gitignored, so it MUST be generated here)
RUN pnpm prisma generate
RUN pnpm build

# ---- runtime: ship compiled app + deps + prisma CLI (for migrate deploy) ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/prisma ./prisma
# tsconfig + source prisma client so `prisma db seed` (runs via tsx) can resolve
# the @generated/* path alias to ./generated/prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/generated ./generated
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
# entrypoint applies pending DB migrations, then runs CMD
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]

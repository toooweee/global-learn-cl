FROM node:24.15.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
ENV CI=true
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM deps AS builder
COPY . ./
RUN pnpm build

FROM prod-deps AS build
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/src/main.js"]

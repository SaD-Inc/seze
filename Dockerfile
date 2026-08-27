# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14 AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile

FROM dependencies AS builder

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN --mount=type=cache,target=/app/.next/cache \
  bun run build

FROM node:24.19.0-slim AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./

USER node
EXPOSE 3000

CMD ["node", "start.mjs"]

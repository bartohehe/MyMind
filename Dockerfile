# syntax=docker/dockerfile:1

# Multi-stage build pod Raspberry Pi 5 (ARM64).
# node:22-bookworm-slim jest obrazem multi-arch, więc ten sam Dockerfile
# zbuduje się natywnie na Pi i na amd64.

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --------------------------------- deps ------------------------------------
# better-sqlite3 to moduł natywny: gdy brakuje gotowego prebuildu dla ARM64,
# npm kompiluje go przez node-gyp — stąd python3/make/g++ w tym etapie.
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# -------------------------------- builder ----------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# --------------------------------- runner ----------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/app.db

# output: 'standalone' zbiera server.js + tylko potrzebne node_modules
# (razem ze skompilowanym better_sqlite3.node).
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Migracje aplikują się same przy starcie — muszą być w obrazie.
COPY --from=builder --chown=node:node /app/drizzle ./drizzle

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3000
CMD ["node", "server.js"]

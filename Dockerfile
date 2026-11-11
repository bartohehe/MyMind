# syntax=docker/dockerfile:1

# Multi-stage build pod Raspberry Pi 5 (ARM64).
# node:22-bookworm-slim jest obrazem multi-arch, więc ten sam Dockerfile
# zbuduje się natywnie na Pi i na amd64. Zależności są czystym JS-em
# (sterownik `pg`), więc nie potrzeba kompilatora ani pythona.

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --------------------------------- deps ------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# -------------------------------- builder ----------------------------------
# Build nie łączy się z bazą: pula `pg` otwiera połączenie dopiero przy
# pierwszym zapytaniu, a migracje robi src/instrumentation.ts przy starcie serwera.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# --------------------------------- runner ----------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# output: 'standalone' zbiera server.js + tylko potrzebne node_modules.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Migracje stosują się same przy starcie — muszą być w obrazie.
COPY --from=builder --chown=node:node /app/drizzle ./drizzle

USER node
EXPOSE 3000
CMD ["node", "server.js"]

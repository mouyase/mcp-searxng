# ---- base ----
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ---- build ----
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src/ src/
RUN bun build --compile --minify src/index.ts --outfile server

# ---- release ----
FROM alpine:3.23
RUN apk add --no-cache libgcc libstdc++ \
    && adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=build /app/server ./

ENV NODE_ENV=production
USER app
EXPOSE 3000

ENTRYPOINT ["./server"]

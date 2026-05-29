FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["bun", "src/server.tsx"]

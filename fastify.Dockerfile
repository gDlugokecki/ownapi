FROM oven/bun as deps

WORKDIR /app

COPY ./package.json ./
COPY ./bun.lockb ./

RUN bun install

FROM oven/bun as builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY ./package.json ./
COPY ./tsconfig.json ./
COPY ./src ./src

RUN bun run build

FROM oven/bun as serve

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

COPY ./package.json ./
COPY ./migrations ./migrations

CMD ["bun", "run", "start"]
# CMD ["sleep", "36000"]
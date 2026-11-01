FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
COPY packages packages
RUN pnpm --filter api prisma:generate && pnpm --filter api build

FROM node:24-alpine AS runtime
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
WORKDIR /app
ENV NODE_ENV=production
# From the build stage, not dependencies: `prisma generate` writes the typed client
# (enums such as UserRole) into node_modules during build, and the runtime needs it.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
USER nestjs
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

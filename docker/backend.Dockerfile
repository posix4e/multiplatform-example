# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build
RUN pnpm turbo run build --filter=@multiplatform/backend

# Production stage - copy everything needed from builder
FROM node:20-alpine

WORKDIR /app

# Copy node_modules and built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

WORKDIR /app/apps/backend

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]

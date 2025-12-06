# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build
RUN pnpm turbo run build --filter=@multiplatform/web

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

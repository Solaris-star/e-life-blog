# ===== Stage 1: Build =====
FROM node:22-alpine AS builder
WORKDIR /app

# 代理配置（构建时通过 build-arg 传入）
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs ./
COPY src/ ./src/
COPY public/ ./public/
COPY content/ ./content/
COPY scripts/ ./scripts/

# Next.js 16 生产构建默认用 webpack，无 turbopack 兼容问题
RUN npm run build

# ===== Stage 2: Runtime =====
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 从 builder 复制产物
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/content ./content

# DailyBrief 数据挂载点（后续用于共享 volume）
RUN mkdir -p /app/daily_reports && chown nextjs:nodejs /app/daily_reports

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]

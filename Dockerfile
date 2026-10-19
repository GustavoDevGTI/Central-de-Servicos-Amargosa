# syntax=docker/dockerfile:1

FROM node:22.23.1-bookworm-slim AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev --omit=peer --no-audit --no-fund

FROM dependencies AS builder

ARG NEXT_PUBLIC_SITE_URL=https://servicos.amargosa.ba.gov.br
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY . .
RUN npm run build

FROM node:22.23.1-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/dist/standalone ./
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/lib/auth-options.mjs ./lib/auth-options.mjs
COPY --from=builder --chown=node:node /app/lib/admin-password-policy.mjs ./lib/admin-password-policy.mjs
COPY --from=builder --chown=node:node /app/scripts/start-server.mjs ./scripts/start-server.mjs

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "scripts/start-server.mjs"]

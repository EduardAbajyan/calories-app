FROM node:20-alpine AS builder

WORKDIR /app

ARG NODE_OPTIONS=--max-old-space-size=1536

ENV NEXT_TELEMETRY_DISABLED=1
# Prevent host OOM kills during next build on smaller machines.
ENV NODE_OPTIONS=${NODE_OPTIONS}

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build


FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start"]
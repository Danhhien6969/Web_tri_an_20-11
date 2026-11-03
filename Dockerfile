FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV DOCKER_BUILD=1
RUN npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER node
ENV HOSTNAME=0.0.0.0 NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]

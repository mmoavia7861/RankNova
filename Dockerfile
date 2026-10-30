# Deploy RankNova as one Cloud Run container (Express backend + built React frontend).
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/src/lib/audit ./src/lib/audit
USER node
EXPOSE 8080
CMD ["npm", "start"]

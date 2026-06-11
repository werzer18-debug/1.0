# Small, production-ready image for the TempVoice bot.
FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first to leverage Docker layer caching. No native
# modules, so this is fast and needs no build toolchain.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Persist the data file outside the image. Mount a volume here so hub
# configuration survives restarts and redeploys.
ENV DATABASE_PATH=/data/tempvoice.json
VOLUME ["/data"]

CMD ["npm", "start"]

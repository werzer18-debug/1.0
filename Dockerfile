# Small, production-ready image for the TempVoice bot.
FROM node:20-bookworm-slim

# better-sqlite3 is a native module; these are present for the rare case a
# prebuilt binary isn't available for the platform and it must compile.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Persist the SQLite database outside the image. Mount a volume here so hub
# configuration survives restarts and redeploys.
ENV DATABASE_PATH=/data/tempvoice.sqlite
VOLUME ["/data"]

CMD ["npm", "start"]

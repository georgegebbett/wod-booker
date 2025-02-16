FROM node:20-slim

# Install pnpm and cron
RUN apt-get update && apt-get install -y cron \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

RUN pnpm config set store-dir /root/.local/share/pnpm/store/v3 --global

# Install dependencies without prebuilt binaries
RUN pnpm install --ignore-scripts

# Copy source code
COPY . .

# Rebuild SQLite to match the container architecture
RUN pnpm rebuild sqlite3

# Build the project
RUN pnpm build

# Add entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
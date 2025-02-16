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

# Setup cron jobs
RUN echo "0 17 * * 0 cd /app && pnpm request-confirmations >> /dev/stdout 2>&1" > /etc/cron.d/gym-cron \
    && echo "5 * * * * cd /app && pnpm start >> /dev/stdout 2>&1" >> /etc/cron.d/gym-cron \
    && chmod 0644 /etc/cron.d/gym-cron \
    && crontab /etc/cron.d/gym-cron

# Add entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
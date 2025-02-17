#!/bin/sh
set -e

if [ ! -f /app/classes.toml ]; then
    echo "Error: classes.toml not found. Please mount it using -v /path/to/classes.toml:/app/classes.toml"
    exit 1
fi

echo "Config file found, proceeding..."

# Create or overwrite crontab file
cat > /etc/cron.d/gym-cron <<EOF
SHELL=/bin/sh
PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/bin

0 17 * * 0 cd /app && pnpm request-confirmations >> /proc/1/fd/1 2>&1
5 * * * * cd /app && pnpm start >> /proc/1/fd/1 2>&1
EOF

# Ensure correct permissions
chmod 0644 /etc/cron.d/gym-cron

# Load crontab and restart cron
crontab /etc/cron.d/gym-cron

# Ensure env vars available to cron jobs
printenv | sed 's/^/export /' > /etc/environment

# Ensure cron is running
exec cron -f

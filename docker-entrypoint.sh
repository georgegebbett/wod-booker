#!/bin/sh
set -e

if [ ! -f /app/classes.toml ]; then
    echo "Error: classes.toml not found. Please mount it using -v /path/to/classes.toml:/app/classes.toml"
    exit 1
fi

echo "Config file found, proceeding..."

exec cron -f 
# `wod-booker` 🏋️‍♂️

Automated class booking system for WodBoard that handles scheduling and confirmations through Discord.

## Features

- 📅 Fetches upcoming classes for the next 7 days
- 💬 Creates Discord threads for class confirmations
- ✅ Tracks confirmation status via reactions
- 🎟️ Automatically books confirmed classes when they become available
- 📱 Uses the WodBoard mobile API for reliable booking

## Deployment

### Using Docker Compose (Recommended)

1. Create your configuration:
```bash
cp classes.example.toml classes.toml
# Edit classes.toml with your settings
```

2. Run the container with required volumes:
```bash
docker compose up -d
```

The container includes two cron jobs:
- Weekly confirmation requests (Sundays at 5pm)
- Booking service (5 minutes past every hour)

View logs:
```bash
docker logs wod-booker
# or
docker exec wod-booker cat /app/cron.log
```

### Manual Setup

If you prefer to run without Docker, you'll need to set up the cron jobs manually:

1. Open your crontab:
```bash
crontab -e
```

2. Add the cron jobs:
```bash
0 17 * * 0 cd /path/to/wod-booker && pnpm request-confirmations >> cron.log 2>&1
5 * * * * cd /path/to/wod-booker && pnpm start >> cron.log 2>&1
```

## Development

- `pnpm dev` - Run the booking service with hot reloading
- `pnpm dev:request-confirmations` - Run the confirmation requests with hot reloading
- `pnpm test:auth` - Test authentication
- `pnpm test:classes` - Test class fetching
- `pnpm test:confirmation-flow` - Test the confirmation system
- `pnpm test:config` - Test the config file
- `pnpm test:book` - Test the booking system
